import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unexpected error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const res: unknown = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (this.hasMessage(res)) {
        message = res.message;
      }
    }

    response.status(status).json({
      status: 'error',
      message,
    });
  }

  private hasMessage(value: unknown): value is { message: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof (value as { message: unknown }).message === 'string'
    );
  }
}
