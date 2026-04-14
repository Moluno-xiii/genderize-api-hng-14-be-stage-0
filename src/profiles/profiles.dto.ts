import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ProfileQueryDTO {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'Missing or empty name parameter' })
  @Matches(/^[a-zA-ZÀ-ÖØ-öø-ÿ' -]+$/, {
    message: 'name must contain only letters, hyphens, apostrophes, or spaces',
  })
  name!: string;
}
