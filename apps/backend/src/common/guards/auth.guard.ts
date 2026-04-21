import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.substring(7);
    if (!token) {
      return true;
    }

    try {
      const user = await this.authService.getUser(token);
      request.user = user;
      return true;
    } catch {
      return true;
    }
  }
}