import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';

/**
 * EntitlementGuard — Protects routes that require prompt access.
 * Expects req.user to be set (use after AuthGuard) and req.params.id to be the promptId.
 */
@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(private readonly entitlementService: EntitlementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const promptId = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!promptId) {
      throw new ForbiddenException('Prompt ID required');
    }

    const hasAccess = await this.entitlementService.canAccess(user.id, promptId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this prompt');
    }

    return true;
  }
}
