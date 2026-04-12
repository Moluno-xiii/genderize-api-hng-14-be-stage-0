import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
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
      this.validateQueryInput(name);
      const request = await fetch(`${this.apiUrl}?name=${name}`, {
        method: 'GET',
      });
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

  private validateQueryInput(input?: string) {
    const trimmed = input?.trim();
    if (!trimmed)
      throw new BadRequestException('Missing or empty name parameter');

    if (!/^[a-zA-Z]+$/.test(trimmed)) {
      throw new UnprocessableEntityException('name is not a string');
    }
  }
}
