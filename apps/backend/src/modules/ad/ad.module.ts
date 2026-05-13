import { Module } from '@nestjs/common';
import { AdMobProvider } from './ad.provider';
import { AdsController } from './ads.controller';

@Module({
  controllers: [AdsController],
  providers: [AdMobProvider],
  exports: [AdMobProvider],
})
export class AdModule {}