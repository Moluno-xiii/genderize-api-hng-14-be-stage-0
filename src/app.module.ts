import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ClassifyController } from './classify.controller';
import { ClassifyService } from './classify.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, ClassifyController],
  providers: [AppService, ClassifyService],
})
export class AppModule {}
