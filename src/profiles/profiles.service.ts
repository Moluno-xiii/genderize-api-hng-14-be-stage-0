import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenderizeResponse } from 'src/types';
import { customTryCatch } from 'src/utils';
import {
  Profile,
  CreateProfileSuccessResponse,
  ProfileExistsResponse,
  CountryInfo,
  NationalizeAPIResponse,
  AgifyAPIResponse,
  AgeGroup,
} from './profiles.types';

@Injectable()
class ProfilesService {
  private readonly nationalize_api_url: string;
  private readonly agify_api_url: string;
  private readonly genderize_api_url: string;
  private dummyDb: Map<string, Profile> = new Map();

  constructor(private configService: ConfigService) {
    this.nationalize_api_url = this.configService.getOrThrow<string>(
      'NATIONALIZE_API_URL',
    );
    this.agify_api_url = this.configService.getOrThrow<string>('AGIFY_API_URL');
    this.genderize_api_url =
      this.configService.getOrThrow<string>('GENDERIZE_API_URL');
  }

  async getProfileInfo(
    name: string,
  ): Promise<CreateProfileSuccessResponse | ProfileExistsResponse> {
    const transformedName = this.transformName(name);
    const existingName = this.checkIfNameExists(transformedName);
    if (existingName)
      return {
        message: 'Profile already exists',
        data: existingName,
      };

    const encodedName = encodeURIComponent(name);
    const [nationalizeInfo, agifyInfo, genderizeInfo] = await Promise.all([
      this.getNationalizeInfo(encodedName),
      this.getAgifyInfo(encodedName),
      this.getGenderizeInfo(encodedName),
    ]);

    const age_group: AgeGroup =
      agifyInfo.age < 13
        ? 'child'
        : agifyInfo.age < 19
          ? 'teenager'
          : agifyInfo.age < 60
            ? 'adult'
            : 'senior';
    const countryInfo: CountryInfo = nationalizeInfo.country[0];
    const data: Profile = {
      age: agifyInfo.age,
      age_group,
      country_id: countryInfo.country_id,
      country_probability: countryInfo.probability,
      created_at: new Date().toISOString(),
      gender: genderizeInfo.gender!,
      gender_probability: genderizeInfo.probability,
      id: crypto.randomUUID(),
      name,
      sample_size: genderizeInfo.count,
    };
    this.dummyDb.set(transformedName, { ...data, name: transformedName });
    return {
      status: 'success',
      data,
    };
  }

  async getNationalizeInfo(name: string): Promise<NationalizeAPIResponse> {
    const response = await customTryCatch<NationalizeAPIResponse>(
      `${this.nationalize_api_url}?name=${name}`,
      'GET',
    );
    if (response.country.length < 1)
      throw new UnprocessableEntityException(
        'No prediction available for the provided name',
      );
    return response;
  }

  async getAgifyInfo(name: string): Promise<AgifyAPIResponse> {
    const response = await customTryCatch<AgifyAPIResponse>(
      `${this.agify_api_url}?name=${name}`,
      'GET',
    );
    if (!response.age)
      throw new UnprocessableEntityException(
        'No prediction available for the provided name',
      );
    return response;
  }

  async getGenderizeInfo(name: string): Promise<GenderizeResponse> {
    const response = await customTryCatch<GenderizeResponse>(
      `${this.genderize_api_url}?name=${name}`,
      'GET',
    );
    if (!response.gender || !response.count)
      throw new UnprocessableEntityException(
        'No prediction available for the provided name',
      );
    return response;
  }

  private checkIfNameExists(name: string): Profile | undefined {
    const existingName = this.dummyDb.get(name);
    return existingName;
  }

  private transformName(name: string): string {
    return name.trim().toLowerCase();
  }
}

export default ProfilesService;
