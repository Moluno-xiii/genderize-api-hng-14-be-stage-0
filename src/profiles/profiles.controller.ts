import { Controller, Post, Query } from '@nestjs/common';
import ProfilesService from './profiles.service';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post()
  getProfileInfo(@Query('name') name: string) {
    this.profilesService.validateQueryInput(name);

    return this.profilesService.getProfileInfo(name);
  }
}
