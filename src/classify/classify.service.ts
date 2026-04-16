import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { customTryCatch } from 'src/utils';
import { ClassifyResponseSuccess, GenderizeResponse } from '../types';

@Injectable()
export class ClassifyService {
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.getOrThrow<string>('GENDERIZE_API_URL');
  }

  async queryGenderizeAPi(name: string): Promise<ClassifyResponseSuccess> {
    const url = `${this.apiUrl}?name=${encodeURIComponent(name)}`;
    const response = await customTryCatch<GenderizeResponse>(url, 'GET');
    if (!response.gender || !response.count)
      throw new HttpException(
        'No prediction available for the provided name',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    return {
      status: 'success',
      data: {
        name: response.name,
        gender: response.gender,
        probability: response.probability,
        sample_size: response.count,
        is_confident: response.probability >= 0.7 && response.count >= 100,
        processed_at: new Date().toISOString(),
      },
    };
  }
}
