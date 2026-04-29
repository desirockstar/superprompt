import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS, PromptApprovedEvent } from '../shared/events/domain-events';
import { GradingOrchestrator } from '../evaluation/grading.orchestrator';

/**
 * Listens for domain events and triggers evaluation when prompts are approved.
 */
@Injectable()
export class EvaluationEventListener {
  constructor(private readonly orchestrator: GradingOrchestrator) {}

  @OnEvent(DOMAIN_EVENTS.PROMPT_APPROVED)
  async handlePromptApproved(event: PromptApprovedEvent) {
    // When a prompt is approved, the grading orchestrator will pick it up
    // on the next scheduled run (via needsGrading flag).
    // For immediate feedback, we could trigger grading here:
    // await this.orchestrator.runGrading('system');
    console.log(`[Event] Prompt approved: ${event.promptId}, category: ${event.category}`);
  }
}
