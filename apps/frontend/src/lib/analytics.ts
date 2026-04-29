import posthog from 'posthog-js';

const enabled = () => typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

export const analytics = {
  // User identity
  identify: (userId: string, email: string) => {
    if (!enabled()) return;
    posthog.identify(userId, { email });
  },
  reset: () => {
    if (!enabled()) return;
    posthog.reset();
  },

  // Prompt engagement
  promptViewed: (promptId: string, tier: string | null, category: string) => {
    if (!enabled()) return;
    posthog.capture('prompt_viewed', { promptId, tier, category });
  },
  promptCopied: (promptId: string, tier: string | null) => {
    if (!enabled()) return;
    posthog.capture('prompt_copied', { promptId, tier });
  },

  // Unlock funnel
  unlockInitiated: (promptId: string) => {
    if (!enabled()) return;
    posthog.capture('unlock_initiated', { promptId, method: 'ad' });
  },
  unlockCompleted: (promptId: string) => {
    if (!enabled()) return;
    posthog.capture('unlock_completed', { promptId, method: 'ad' });
  },

  // Subscription funnel
  checkoutStarted: (plan: 'monthly' | 'yearly') => {
    if (!enabled()) return;
    posthog.capture('checkout_started', { plan });
  },
  subscriptionActivated: (plan: 'monthly' | 'yearly') => {
    if (!enabled()) return;
    posthog.capture('subscription_activated', { plan });
  },

  // Search
  searched: (query: string, resultCount: number) => {
    if (!enabled()) return;
    posthog.capture('search_performed', { query, resultCount });
  },
};
