// Port: Ad Verifier — Access BC
// Abstracts the ad provider verification for unlock flows

export interface AdVerificationResult {
  valid: boolean;
  rewardAmount?: number;
  adId?: string;
}

export interface AdLoadResult {
  adId: string;
  token: string;
}

export interface AdVerifier {
  loadAd(userId: string, promptId: string): Promise<AdLoadResult>;
  verifyCompletion(token: string): Promise<AdVerificationResult>;
}

export const AD_VERIFIER = 'AD_VERIFIER';
