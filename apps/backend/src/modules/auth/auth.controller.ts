import { Controller, Post, Get, Body, UseGuards, Req, Res, HttpCode, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';
import { Response } from 'express';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { unlocks, subscriptions, ratings } from '@superprompt/db';
import { eq, and, gt } from 'drizzle-orm';
import { CacheService } from '../cache/cache.service';

const SESSION_COOKIE_NAME = 'sp_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(DB_KEY) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

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

  @UseGuards(RequiredAuthGuard)
  @Get('me/state')
  async myState(@Req() req: any) {
    const userId = req.user.id;
    const cacheKey = `user:state:${userId}`;
    const cached = this.cache.get<object>(cacheKey);
    if (cached) return cached;

    const [userUnlocks, userSubscription, userRatings] = await Promise.all([
      this.db.select({ promptSlug: unlocks.promptSlug }).from(unlocks).where(eq(unlocks.userId, userId)),
      this.db.select().from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active'), gt(subscriptions.expiresAt, new Date())))
        .limit(1),
      this.db.select({ promptSlug: ratings.promptSlug, rating: ratings.rating }).from(ratings).where(eq(ratings.userId, userId)),
    ]);

    const state = {
      subscription: userSubscription[0] ?? null,
      unlocks: userUnlocks.map((u) => u.promptSlug),
      ratings: Object.fromEntries(userRatings.map((r) => [r.promptSlug, r.rating])),
    };

    this.cache.set(cacheKey, state, 5 * 60_000);
    return state;
  }
}