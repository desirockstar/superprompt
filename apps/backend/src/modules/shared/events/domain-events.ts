// Domain Events — Shared Kernel
// All bounded contexts emit and consume these event types

export class PromptApprovedEvent {
  constructor(
    public readonly promptId: string,
    public readonly category: string,
    public readonly version: number,
  ) {}
}

export class PromptCreatedEvent {
  constructor(
    public readonly promptId: string,
    public readonly category: string,
    public readonly userId: string,
  ) {}
}

export class EvaluationCompletedEvent {
  constructor(
    public readonly promptId: string,
    public readonly tier: string,
    public readonly overallScore: number,
  ) {}
}

export class EvaluationFailedEvent {
  constructor(
    public readonly promptId: string,
    public readonly reason: string,
  ) {}
}

export class SubscriptionActivatedEvent {
  constructor(
    public readonly userId: string,
    public readonly expiresAt: Date,
  ) {}
}

export class SubscriptionCanceledEvent {
  constructor(
    public readonly userId: string,
  ) {}
}

export class UnlockGrantedEvent {
  constructor(
    public readonly userId: string,
    public readonly promptId: string,
  ) {}
}

// Event name constants for use with @OnEvent()
export const DOMAIN_EVENTS = {
  PROMPT_APPROVED: 'prompt.approved',
  PROMPT_CREATED: 'prompt.created',
  EVALUATION_COMPLETED: 'evaluation.completed',
  EVALUATION_FAILED: 'evaluation.failed',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  UNLOCK_GRANTED: 'unlock.granted',
} as const;
