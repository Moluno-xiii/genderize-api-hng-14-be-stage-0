import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ClassifyService } from 'src/classify/classify.service';
import { ClassifyController } from 'src/classify/classify.controller';
import ProfilesService from 'src/profiles/profiles.service';
import { ProfilesController } from 'src/profiles/profiles.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, ClassifyController, ProfilesController],
  providers: [AppService, ClassifyService, ProfilesService],
})
export class AppModule {}
