import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
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
  private readonly nationalize_api_url: string =
    process.env.NATIONALIZE_API_URL!;
  private readonly agify_api_url: string = process.env.AGIFY_API_URL!;
  private readonly genderize_api_url: string = process.env.GENDERIZE_API_URL!;
  private dummyDb: Map<string, Profile> = new Map();

  async getProfileInfo(
    name: string,
  ): Promise<CreateProfileSuccessResponse | ProfileExistsResponse> {
    const transformedName = this.transformName(name);
    console.log('transformned name \n', transformedName);
    const existingName = this.checkIfNameExists(transformedName);
    if (existingName)
      return {
        message: 'Profile already exists',
        data: existingName,
      };
    const nationalizeInfo = await this.getNationalizeInfo(name);
    const agifyInfo = await this.getAgifyInfo(name);
    const genderizeInfo = await this.getGenderizeInfo(name);

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

  validateQueryInput(input?: string) {
    const trimmed = input?.trim();
    if (!trimmed)
      throw new BadRequestException('Missing or empty name parameter');

    if (!/^[a-zA-Z]+$/.test(trimmed)) {
      throw new UnprocessableEntityException('name is not a string');
    }
  }

  private checkIfNameExists(name: string): Profile | undefined {
    const existingName = this.dummyDb.get(name);
    console.log('does name exist\n', existingName);
    return existingName;
  }

  private transformName(name: string): string {
    return name.trim().toLowerCase();
  }
}

export default ProfilesService;
