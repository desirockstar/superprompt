import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    if (!request.user) {
      throw new ForbiddenException('Not authenticated');
    }

    if (!request.user.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}