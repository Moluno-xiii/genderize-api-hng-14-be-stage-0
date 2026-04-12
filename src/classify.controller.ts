import { Controller, Get, Query } from '@nestjs/common';
import { ClassifyService } from './classify.service';

type ClassifyQueryDTO = {
  name: string;
};

@Controller('/api/classify')
export class ClassifyController {
  constructor(private classifyService: ClassifyService) {}
  @Get()
  classify(@Query() query: ClassifyQueryDTO) {
    return this.classifyService.queryGenderizeAPi(query.name);
  }
}
