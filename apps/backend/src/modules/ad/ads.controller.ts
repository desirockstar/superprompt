import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AdMobProvider, AdVerificationResult } from './ad.provider';

@Controller('ads')
export class AdsController {
  constructor(private readonly adProvider: AdMobProvider) {}

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async adCallback(
    @Body() body: { token: string; userId: string; promptId: string },
  ): Promise<AdVerificationResult & { token: string; userId: string; promptId: string }> {
    const { token, userId, promptId } = body;

    if (!token || !userId || !promptId) {
      return { valid: false, token, userId, promptId };
    }

    const result = await this.adProvider.verifyCompletion(token);

    return {
      ...result,
      token,
      userId,
      promptId,
    };
  }
}