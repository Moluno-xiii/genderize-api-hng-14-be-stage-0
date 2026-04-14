import { Controller, Post, Query } from '@nestjs/common';
import ProfilesService from './profiles.service';
import { ProfileQueryDTO } from './profiles.dto';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post()
  getProfileInfo(@Query() query: ProfileQueryDTO) {
    return this.profilesService.getProfileInfo(query.name);
  }
}
