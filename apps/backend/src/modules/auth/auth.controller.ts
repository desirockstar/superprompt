import { Controller, Post, Get, Body, UseGuards, Req, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';
import { Response } from 'express';

const SESSION_COOKIE_NAME = 'sp_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(body.email, body.password);
    const sessionToken = await this.authService.createSession(user.id);
    
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    
    return { id: user.id, email: user.email };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.login(body.email, body.password);
    const sessionToken = await this.authService.createSession(user.id);
    
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    
    return { id: user.id, email: user.email, isAdmin: user.isAdmin };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.sessionId) {
      await this.authService.deleteSession(req.sessionId);
    }
    
    res.clearCookie(SESSION_COOKIE_NAME, {
      path: '/',
    });
    
    return { success: true };
  }

  @UseGuards(RequiredAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.authService.getUser(req.user.id);
  }
}