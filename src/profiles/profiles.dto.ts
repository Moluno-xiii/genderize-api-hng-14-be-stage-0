import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

class ProfileQueryDTO {
  @Matches(/^[a-zA-ZÀ-ÖØ-öø-ÿ' -]+$/, {
    message: 'name is not a string',
  })
  @IsNotEmpty({ message: 'Missing or empty name parameter' })
  @IsString({ message: 'name is not a string' })
  name!: string;
}

class DeleteSingleProfileDTO {
  // @IsUUID(undefined, { message: 'Invalid profile ID' })
  @IsNotEmpty({ message: 'Missing or empty id' })
  @IsString({ message: 'id must be a string' })
  id!: string;
}

class ProfileFilterDTO {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  country_id?: string;

  @IsOptional()
  @IsString()
  age_group?: string;
}

export { ProfileQueryDTO, DeleteSingleProfileDTO, ProfileFilterDTO };
