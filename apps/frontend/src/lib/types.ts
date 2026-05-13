export type PromptLevel = 'starter' | 'builder' | 'pro' | 'super';
export type PromptStatus = 'pending' | 'approved' | 'rejected';

export interface Prompt {
  id: string;
  slug: string;
  title: string;
  categoryNames: string[];
  tagNames: string[];
  status: PromptStatus;
  basePath: string;
  currentVersion: number;
  isMultiVersion: boolean;
  createdAt: string;
  preview?: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  needsGrading: boolean;
  createdAt: string;
}

export interface PromptVersionFile {
  id: string;
  promptVersionId: string;
  level: PromptLevel;
  fileName: string;
}

export interface PromptDetail extends Prompt {
  versions: {
    versionNumber: number;
    files: PromptVersionFile[];
  }[];
}

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due';
  expiresAt: string | null;
}

export interface Unlock {
  id: string;
  userId: string;
  promptId: string;
  unlockedVia: 'ad' | 'subscription';
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  promptId: string;
  rating: number;
  createdAt: string;
}

export interface Entitlements {
  hasActiveSubscription: boolean;
  hasUnlock: boolean;
  canAccess: boolean;
}

export interface PaginatedResponse<T> {
  prompts: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthResponse {
  id: string;
  email: string;
}

export interface UnlockResponse {
  success: boolean;
  adToken?: string;
}