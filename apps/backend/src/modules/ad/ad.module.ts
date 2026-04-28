import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdMobProvider } from './ad.provider';
import { AdsController } from './ads.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AdsController],
  providers: [AdMobProvider],
  exports: [AdMobProvider],
})
export class AdModule {}