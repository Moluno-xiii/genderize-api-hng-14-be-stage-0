import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClassifyResponseError,
  ClassifyResponseSuccess,
  GenderizeResponse,
} from '../types';

@Injectable()
export class ClassifyService {
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.getOrThrow<string>('GENDERIZE_API_URL');
  }

  async queryGenderizeAPi(
    name: string,
  ): Promise<ClassifyResponseSuccess | ClassifyResponseError> {
    try {
      const request = await fetch(
        `${this.apiUrl}?name=${encodeURIComponent(name)}`,
        { method: 'GET' },
      );
      if (!request.ok)
        throw new BadGatewayException('Upstream or server failure');

      const response = (await request.json()) as GenderizeResponse;
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
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Upstream or server failure');
    }
  }
}
