import { Controller, Post, Get, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { UnlockService } from './unlock.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';
import { AdMobProvider } from '../ad/ad.provider';

@Controller('prompts')
export class UnlockController {
  constructor(
    private readonly unlockService: UnlockService,
    private readonly adProvider: AdMobProvider,
  ) {}

  @UseGuards(RequiredAuthGuard)
  @Post(':id/unlock')
  async unlock(
    @Req() req: any,
    @Body() body: { adToken?: string },
  ) {
    const promptId = req.params.id;
    const userId = req.user.id;

    if (body.adToken) {
      const verification = await this.adProvider.verifyCompletion(body.adToken);
      if (!verification.valid) {
        throw new UnauthorizedException('Invalid ad token');
      }
    }

    const unlocked = await this.unlockService.unlockViaAd(userId, promptId);
    return { ...unlocked, unlockedVia: 'ad' };
  }

  @UseGuards(RequiredAuthGuard)
  @Post(':id/unlock-intent')
  async startUnlock(
    @Req() req: any,
  ) {
    const promptId = req.params.id;
    const userId = req.user.id;

    const adData = await this.adProvider.loadAd(userId, promptId);
    return { token: adData.token };
  }
}

@Controller('unlocks')
export class UnlocksController {
  constructor(private readonly unlockService: UnlockService) {}

  @UseGuards(RequiredAuthGuard)
  @Get()
  async getUserUnlocks(@Req() req: any) {
    return this.unlockService.getUnlocks(req.user.id);
  }
}