export type PromptLevel = 'starter' | 'builder' | 'pro' | 'super';
export type PromptStatus = 'pending' | 'approved' | 'rejected';
export type UnlockMethod = 'ad' | 'subscription';
export type GradingTrigger = 'system' | 'admin';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';
export type GradingJobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface PromptWithVersion {
  slug: string;
  title: string;
  category: string;
  status: PromptStatus;
  basePath: string;
  currentVersion: number;
  isMultiVersion: boolean;
  createdAt: Date;
  primaryTag?: string;
  secondaryTags?: string;
  views?: number;
  isViral?: boolean;
  isNano?: boolean;
}

export interface PromptDetail extends PromptWithVersion {
  versions: PromptVersionInfo[];
}

export interface PromptVersionInfo {
  versionNumber: number;
  files: { level: PromptLevel; fileName: string }[];
}

export interface entitlementCheck {
  hasActiveSubscription: boolean;
  hasUnlock: boolean;
  canAccess: boolean;
}

export interface CreatePromptInput {
  title: string;
  category: string;
  content: Record<PromptLevel, string>;
}

export interface UpdatePromptInput {
  id: string;
  content: Record<PromptLevel, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}