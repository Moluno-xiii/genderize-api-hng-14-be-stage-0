import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APISuccessResponse, GenderizeResponse } from 'src/types';
import { customTryCatch } from 'src/utils';
import {
  AgeGroup,
  AgifyAPIResponse,
  CountryInfo,
  CreateProfileSuccessResponse,
  NationalizeAPIResponse,
  Profile,
} from './profiles.types';
import { ProfileFilterDTO } from './profiles.dto';

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

  async getProfileInfo(name: string): Promise<CreateProfileSuccessResponse> {
    const transformedName = this.transformName(name);
    const existinProfile = this.checkIfNameExists(transformedName);
    if (existinProfile)
      return {
        status: 'success',
        message: 'Profile already exists',
        data: existinProfile,
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
      id: crypto.randomUUID(),
      name,
      gender: genderizeInfo.gender!,
      gender_probability: genderizeInfo.probability,
      sample_size: genderizeInfo.count,
      age: agifyInfo.age,
      age_group,
      country_id: countryInfo.country_id,
      country_probability: countryInfo.probability,
      created_at: new Date().toISOString(),
    };
    this.dummyDb.set(transformedName, { ...data, name: transformedName });
    return {
      status: 'success',
      data,
    };
  }

  getProfileById(id: string): APISuccessResponse<Profile> {
    const data: Profile | undefined = this.dummyDb.get(id);
    if (!data) throw new NotFoundException('Profile not found');
    return {
      status: 'success',
      data,
    };
  }

  getAllProfiles(filters: ProfileFilterDTO): APISuccessResponse<Profile[]> {
    let data = Array.from(this.dummyDb.values());

    if (filters.gender) {
      const gender = filters.gender.toLowerCase();
      data = data.filter((p) => p.gender.toLowerCase() === gender);
    }
    if (filters.country_id) {
      const countryId = filters.country_id.toUpperCase();
      data = data.filter((p) => p.country_id.toUpperCase() === countryId);
    }
    if (filters.age_group) {
      const ageGroup = filters.age_group.toLowerCase();
      data = data.filter((p) => p.age_group === ageGroup);
    }

    return { status: 'success', count: data.length, data };
  }

  deleteSingleProfile(id: string) {
    const profile: Profile | undefined = this.dummyDb.get(id);
    if (!profile) throw new NotFoundException('Profile not found');
    this.dummyDb.delete(id);
  }

  private async getNationalizeInfo(
    name: string,
  ): Promise<NationalizeAPIResponse> {
    const response = await customTryCatch<NationalizeAPIResponse>(
      `${this.nationalize_api_url}?name=${name}`,
      'GET',
    );
    if (response.country.length < 1)
      throw new BadGatewayException('Nationalize returned an invalid response');
    return response;
  }

  private async getAgifyInfo(name: string): Promise<AgifyAPIResponse> {
    const response = await customTryCatch<AgifyAPIResponse>(
      `${this.agify_api_url}?name=${name}`,
      'GET',
    );
    if (!response.age)
      throw new BadGatewayException('Agify returned an invalid response');
    return response;
  }

  private async getGenderizeInfo(name: string): Promise<GenderizeResponse> {
    const response = await customTryCatch<GenderizeResponse>(
      `${this.genderize_api_url}?name=${name}`,
      'GET',
    );
    if (!response.gender || !response.count)
      throw new BadGatewayException('Genderize returned an invalid response');
    return response;
  }

  private checkIfNameExists(name: string): Profile | undefined {
    const existinProfile = this.dummyDb.get(name);
    return existinProfile;
  }

  private transformName(name: string): string {
    return name.trim().toLowerCase();
  }
}

export default ProfilesService;
