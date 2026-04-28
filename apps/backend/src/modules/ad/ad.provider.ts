import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AdLoadResult {
  adId: string;
  token: string;
}

export interface AdVerificationResult {
  valid: boolean;
  rewardAmount?: number;
  adId?: string;
}

export interface AdProvider {
  loadAd(userId: string, promptId: string): Promise<AdLoadResult>;
  verifyCompletion(token: string): Promise<AdVerificationResult>;
}

@Injectable()
export class AdMobProvider implements AdProvider {
  private readonly appId: string;
  private readonly adUnitId: string;
  private readonly rewardedAdIds = new Map<string, { userId: string; promptId: string; timestamp: number }>();

  constructor(private readonly config: ConfigService) {
    this.appId = this.config.get('ADMOB_APP_ID') || '';
    this.adUnitId = this.config.get('ADMOB_AD_UNIT_ID') || '';
  }

  async loadAd(userId: string, promptId: string): Promise<AdLoadResult> {
    const token = `admob_${Date.now()}_${userId}_${promptId}`;
    const adId = `ad_${userId}_${promptId}_${Date.now()}`;

    this.rewardedAdIds.set(token, {
      userId,
      promptId,
      timestamp: Date.now(),
    });

    return {
      adId,
      token,
    };
  }

  async verifyCompletion(token: string): Promise<AdVerificationResult> {
    const adData = this.rewardedAdIds.get(token);

    if (!adData) {
      return { valid: false };
    }

    const tokenAge = Date.now() - adData.timestamp;
    if (tokenAge > 5 * 60 * 1000) {
      this.rewardedAdIds.delete(token);
      return { valid: false };
    }

    this.rewardedAdIds.delete(token);

    return {
      valid: true,
      rewardAmount: 1,
      adId: adData.userId,
    };
  }
}