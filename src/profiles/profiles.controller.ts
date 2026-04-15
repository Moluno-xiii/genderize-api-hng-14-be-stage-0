import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import ProfilesService from './profiles.service';
import {
  DeleteSingleProfileDTO,
  ProfileFilterDTO,
  ProfileQueryDTO,
} from './profiles.dto';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post()
  createProfile(@Query() query: ProfileQueryDTO) {
    return this.profilesService.getProfileInfo(query.name);
  }

  @Get()
  getAllProfiles(@Query() query: ProfileFilterDTO) {
    return this.profilesService.getAllProfiles(query);
  }

  @Get(':id')
  getSingleProfile(@Param('id') id: string) {
    return this.profilesService.getProfileById(id);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteSingleProfile(@Param() param: DeleteSingleProfileDTO) {
    return this.profilesService.deleteSingleProfile(param.id);
  }
}
