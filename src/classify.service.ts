import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ClassifyResponseError,
  ClassifyResponseSuccess,
  GenderizeResponse,
} from './types';

@Injectable()
export class ClassifyService {
  private readonly apiUrl: string = process.env.GENDERIZE_API_URL!;

  async queryGenderizeAPi(
    name: string,
  ): Promise<ClassifyResponseSuccess | ClassifyResponseError> {
    try {
      const request = await fetch(`${this.apiUrl}?name=${name}`, {
        method: 'GET',
      });
      if (!request.ok)
        throw new HttpException(
          'Server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      const response = (await request.json()) as GenderizeResponse;
      if (!response.gender || !response.count)
        throw new HttpException(
          'No prediction available for the provided name',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      return {
        status: 'success',
        data: {
          name,
          gender: response.gender,
          probability: response.probability,
          sample_size: response.count,
          is_confident: response.probability >= 0.7 && response.count >= 100,
          processed_at: new Date().toISOString(),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      return {
        status: 'error',
        message,
      };
    }
  }
}
