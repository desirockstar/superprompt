'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

declare global {
  interface Window {
    googletag: typeof googletag;
  }
}

export interface AdResult {
  didShowAd: boolean;
  errorReason: string | null;
}

export interface RewardAdProvider {
  initialize(): Promise<void>;
  showRewardedAd(): Promise<AdResult>;
  isAdAvailable(): boolean;
  destroy(): void;
}

interface GAMDummyConfig {
  adUnitId: string;
  networkCode?: string;
}

const DUMMY_MODE = process.env.NEXT_PUBLIC_AD_DUMMY_MODE === 'true';
const ADINPLAY_APP_ID = process.env.NEXT_PUBLIC_ADINPLAY_APP_ID || '';

function loadGPT(): Promise<typeof googletag> {
  return new Promise((resolve, reject) => {
    if (window.googletag) {
      resolve(window.googletag);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.googletagservices.com/tag/js/gpt.js';
    script.async = true;
    script.onload = () => resolve(window.googletag);
    script.onerror = () => reject(new Error('Failed to load GPT'));
    document.head.appendChild(script);
  });
}

class GAMPProvider {
  private adUnitId: string;
  private networkCode: string;
  private slot: any = null;
  private googletag: any = null;
  private rewardedSlot: any = null;
  private pendingResolve: ((result: AdResult) => void) | null = null;

  constructor(config: GAMDummyConfig) {
    this.adUnitId = config.adUnitId;
    this.networkCode = config.networkCode || '';
  }

  async initialize(): Promise<void> {
    this.googletag = await loadGPT();
    this.googletag.cmd.push(() => {
      this.googletag.defineSlot(
        `/${this.networkCode}/${this.adUnitId}`,
        [320, 480],
        ' rewarded-ad-container'
      )?.addService(this.googletag.pubads()) || null;

      this.googletag.pubads().enableRewardsByAge();
      this.googletag.pubads().addEventListener('rewardedSlotGranted', (evt: any) => {
        if (this.pendingResolve) {
          this.pendingResolve({ didShowAd: true, errorReason: null });
          this.pendingResolve = null;
        }
      });

      this.googletag.pubads().addEventListener('rewardedSlotClosed', () => {
        if (this.pendingResolve) {
          this.pendingResolve({ didShowAd: false, errorReason: 'Ad was closed' });
          this.pendingResolve = null;
        }
      });

      this.googletag.enableServices();
    });
  }

  async showRewardedAd(): Promise<AdResult> {
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.googletag.cmd.push(() => {
        const slot = this.googletag.defineOutOfPageSlot(
          `/${this.networkCode}/${this.adUnitId}`,
          this.googletag.enums.OutOfPageFormat.REWARDED
        );
        if (!slot) {
          resolve({ didShowAd: false, errorReason: 'No ad available' });
          return;
        }
        slot.addService(this.googletag.pubads());
        this.rewardedSlot = slot;
        this.googletag.display(slot);
      });
    });
  }

  destroy(): void {
    if (this.rewardedSlot) {
      this.googletag.cmd.push(() => {
        this.googletag.destroySlots([this.rewardedSlot]);
      });
    }
  }
}

class AdinPlayDummyProvider {
  private delay: number;

  constructor() {
    this.delay = 2000;
  }

  async initialize(): Promise<void> {}

  async showRewardedAd(): Promise<AdResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ didShowAd: true, errorReason: null });
      }, this.delay);
    });
  }
}

class AdinPlayProviderWrapper {
  private AdLad: any = null;
  private plugin: any = null;

  async initialize(): Promise<void> {
    if (DUMMY_MODE) return;

    const AdLadModule = await import('@adlad/adlad');
    this.AdLad = AdLadModule.AdLad;

    const adinplayPluginModule = await import('@adlad/plugin-adinplay');
    const adinplayPlugin = adinplayPluginModule.adinplayPlugin;

    this.plugin = adinplayPlugin({
      appId: ADINPLAY_APP_ID,
    });

    const adLad = new this.AdLad({
      plugins: [this.plugin],
    });

    await adLad.initialize();
    this.AdLad = adLad;
  }

  async showRewardedAd(): Promise<AdResult> {
    if (DUMMY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ didShowAd: true, errorReason: null });
        }, 2000);
      });
    }

    if (!this.AdLad) {
      return { didShowAd: false, errorReason: 'Ad provider not initialized' };
    }

    return this.AdLad.showRewardedAd() as Promise<AdResult>;
  }

  async isAdAvailable(): Promise<boolean> {
    if (DUMMY_MODE || !this.AdLad) return true;
    return this.AdLad.isAdAvailable();
  }
}

export function createRewardAdProvider(): RewardAdProvider {
  const gamConfig: GAMDummyConfig = {
    adUnitId: process.env.NEXT_PUBLIC_GAM_AD_UNIT_ID || '',
    networkCode: process.env.NEXT_PUBLIC_GAM_NETWORK_CODE || '',
  };

  const adinplay = new AdinPlayProviderWrapper();
  const gam = new GAMPProvider(gamConfig);

  return {
    async initialize(): Promise<void> {
      try {
        await adinplay.initialize();
      } catch (e) {
        console.warn('AdinPlay init failed, trying GAM:', e);
        try {
          await gam.initialize();
        } catch (e2) {
          console.warn('GAM init failed:', e2);
        }
      }
    },

    async showRewardedAd(): Promise<AdResult> {
      const adAvailable = await adinplay.isAdAvailable();
      if (adAvailable) {
        try {
          const result = await adinplay.showRewardedAd();
          if (result.didShowAd) return result;
        } catch (e) {
          console.warn('AdinPlay failed, trying GAM:', e);
        }
      }

      try {
        return await gam.showRewardedAd();
      } catch (e) {
        console.error('GAM failed:', e);
        return { didShowAd: false, errorReason: String(e) };
      }
    },

    isAdAvailable(): boolean {
      return true;
    },

    destroy(): void {
      gam.destroy();
    },
  };
}