import { Controller, Post, Get, Body, UseGuards, Req, UnauthorizedException, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UnlockService } from './unlock.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';
import { AdMobProvider } from '../ad/ad.provider';

@ApiTags('Unlocks')
@Controller('prompts')
export class UnlockController {
  constructor(
    private readonly unlockService: UnlockService,
    private readonly adProvider: AdMobProvider,
  ) {}

  @UseGuards(RequiredAuthGuard)
  @Post(':slug/unlock')
  async unlock(
    @Req() req: any,
    @Body() body: { adToken: string },
  ) {
    if (!body.adToken) {
      throw new BadRequestException('Ad token required');
    }

    const promptSlug = req.params.slug;
    const userId = req.user.id;

    const verification = await this.adProvider.verifyCompletion(body.adToken);
    if (!verification.valid) {
      throw new UnauthorizedException('Invalid ad token');
    }

    const unlocked = await this.unlockService.unlockViaAd(userId, promptSlug);
    return { ...unlocked, unlockedVia: 'ad' };
  }

  @UseGuards(RequiredAuthGuard)
  @Post(':slug/unlock-intent')
  async startUnlock(
    @Req() req: any,
  ) {
    const promptSlug = req.params.slug;
    const userId = req.user.id;

    const adData = await this.adProvider.loadAd(userId, promptSlug);
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