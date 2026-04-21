import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UnlockService } from './unlock.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('prompts')
export class UnlockController {
  constructor(private readonly unlockService: UnlockService) {}

  @UseGuards(AuthGuard)
  @Post(':id/unlock')
  async unlock(
    @Req() req: any,
    @Body() body: { adToken?: string },
  ) {
    const promptId = req.params.id;
    const userId = req.user.id;

    if (body.adToken) {
      const unlocked = await this.unlockService.unlockViaAd(userId, promptId);
      return unlocked;
    }

    const unlocked = await this.unlockService.unlockViaSubscription(userId, promptId);
    return unlocked;
  }

  @UseGuards(AuthGuard)
  @Post('ads/callback')
  async adCallback(@Body() body: { token: string; userId: string; promptId: string }) {
    const { token, userId, promptId } = body;
    if (!token || token !== 'valid-ad-token') {
      return { success: false, message: 'Invalid token' };
    }

    const unlocked = await this.unlockService.unlockViaAd(userId, promptId);
    return { success: true, unlock: unlocked };
  }
}