import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    console.log('hello darkeness my old ffiend');
    return 'Hello World!';
  }
}
