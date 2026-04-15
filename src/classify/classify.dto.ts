import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ClassifyQueryDTO {
  @Matches(/^[a-zA-ZÀ-ÖØ-öø-ÿ' -]+$/, {
    message: 'name is not a string',
  })
  @IsNotEmpty({ message: 'Missing or empty name parameter' })
  @IsString({ message: 'name is not a string' })
  name!: string;
}
