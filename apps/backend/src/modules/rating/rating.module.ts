import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';

@Module({
  controllers: [],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}