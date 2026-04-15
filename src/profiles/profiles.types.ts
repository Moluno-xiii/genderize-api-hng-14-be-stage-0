import { APISuccessResponse } from 'src/types';

type AgeGroup = 'child' | 'teenager' | 'adult' | 'senior';

type Profile = {
  id: string;
  name: string;
  gender: string;
  gender_probability: number;
  sample_size: number;
  age: number;
  age_group: AgeGroup;
  country_id: string;
  country_probability: number;
  created_at: string;
};

type CountryInfo = { country_id: string; probability: number };

type CreateProfileSuccessResponse = APISuccessResponse<Profile>;

type AgifyAPIResponse = {
  count: number;
  name: string;
  age: number;
};

type NationalizeAPIResponse = {
  count: number;
  name: string;
  country: Array<CountryInfo>;
};

export type {
  AgeGroup,
  Profile,
  CountryInfo,
  CreateProfileSuccessResponse,
  AgifyAPIResponse,
  NationalizeAPIResponse,
};
