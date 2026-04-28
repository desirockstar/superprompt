import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

const SESSION_COOKIE_NAME = 'sp_session';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    let userId: string | null = null;
    let sessionId: string | null = null;

    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(c => c.split('='))
      );
      sessionId = cookies[SESSION_COOKIE_NAME] || null;
    }

    if (!sessionId) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionId = authHeader.substring(7);
      }
    }

    if (sessionId) {
      try {
        userId = await this.authService.getSession(sessionId);
        if (userId) {
          const user = await this.authService.getUser(userId);
          request.user = user;
          request.sessionId = sessionId;
        }
      } catch {
        request.user = null;
      }
    } else {
      request.user = null;
    }

    return true;
  }
}

@Injectable()
export class RequiredAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    let userId: string | null = null;
    let sessionId: string | null = null;

    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(c => c.split('='))
      );
      sessionId = cookies[SESSION_COOKIE_NAME] || null;
    }

    if (!sessionId) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionId = authHeader.substring(7);
      }
    }

    if (!sessionId) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      userId = await this.authService.getSession(sessionId);
      if (!userId) {
        throw new UnauthorizedException('Invalid or expired session');
      }
      
      const user = await this.authService.getUser(userId);
      request.user = user;
      request.sessionId = sessionId;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}