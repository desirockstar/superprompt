import { Injectable, NotFoundException, UnauthorizedException, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { users as usersTable, sessions as sessionsTable, subscriptions, unlocks } from '@superprompt/db';
import { eq, and, gt } from 'drizzle-orm';
import * as crypto from 'crypto';

const SESSION_EXPIRY_DAYS = 30;

function generateSessionId(): string {
  return crypto.randomUUID();
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
  ) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async createSession(userId: string): Promise<string> {
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    await this.db.insert(sessionsTable).values({
      id: sessionId,
      userId,
      expiresAt,
    });
    
    return sessionId;
  }

  async getSession(sessionId: string): Promise<string | null> {
    const [session] = await this.db.select().from(sessionsTable)
      .where(and(
        eq(sessionsTable.id, sessionId),
        gt(sessionsTable.expiresAt, new Date())
      ))
      .limit(1);
    
    return session?.userId || null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }

  async register(email: string, password: string) {
    const existing = await this.db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      throw new UnauthorizedException('Email already registered');
    }

    const [created] = await this.db.insert(usersTable).values({
      email,
      passwordHash: this.hashPassword(password),
      isAdmin: false,
    }).returning();

    return { id: created.id, email: created.email };
  }

  async login(email: string, password: string) {
    const result = await this.db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (result.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result[0];
    if (user.passwordHash !== this.hashPassword(password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { id: user.id, email: user.email, isAdmin: user.isAdmin };
  }

  async getUser(id: string) {
    const result = await this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (result.length === 0) {
      throw new NotFoundException('User not found');
    }
    const user = result[0];
    return { id: user.id, email: user.email, isAdmin: user.isAdmin };
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const result = await this.db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    if (result.length === 0) return false;
    const sub = result[0];
    return sub.status === 'active' && !!sub.expiresAt && new Date(sub.expiresAt) > new Date();
  }

  async hasUnlock(userId: string, promptId: string): Promise<boolean> {
    const result = await this.db.select().from(unlocks)
      .where(eq(unlocks.userId, userId))
      .limit(1);
    return result.some(u => u.promptId === promptId);
  }

  async canAccess(userId: string | null, promptId: string): Promise<boolean> {
    if (!userId) return false;
    const hasSub = await this.hasActiveSubscription(userId);
    if (hasSub) return true;
    return this.hasUnlock(userId, promptId);
  }

  async handleGoogleOAuth(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange Google code');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      throw new UnauthorizedException('Failed to get Google user info');
    }

    const googleUser = await userResponse.json();
    return this.findOrCreateOAuthUser(googleUser.email, googleUser.id, 'google');
  }

  async handleGithubOAuth(code: string) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange GitHub code');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new UnauthorizedException('Failed to get GitHub user info');
    }

    const githubUser = await userResponse.json();
    return this.findOrCreateOAuthUser(githubUser.email, githubUser.id.toString(), 'github');
  }

  private async findOrCreateOAuthUser(email: string, providerId: string, provider: 'google' | 'github' | 'facebook' | 'linkedin' | 'twitter' | 'microsoft') {
    const existing = await this.db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    
    if (existing.length > 0) {
      return { id: existing[0].id, email: existing[0].email };
    }

    const [created] = await this.db.insert(usersTable).values({
      email,
      passwordHash: null,
      isAdmin: false,
    }).returning();

    return { id: created.id, email: created.email };
  }

  async handleFacebookOAuth(code: string) {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/facebook/callback`;

    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${code}`);
    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange Facebook code');
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch(`https://graph.facebook.com/me?fields=email&access_token=${accessToken}`);
    if (!userResponse.ok) {
      throw new UnauthorizedException('Failed to get Facebook user info');
    }
    const fbUser = await userResponse.json();
    return this.findOrCreateOAuthUser(fbUser.email, fbUser.id, 'facebook');
  }

  async handleLinkedinOAuth(code: string) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/linkedin/callback`;

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });
    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange LinkedIn code');
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userResponse.ok) {
      throw new UnauthorizedException('Failed to get LinkedIn user info');
    }
    const liUser = await userResponse.json();
    return this.findOrCreateOAuthUser(liUser.email, liUser.sub, 'linkedin');
  }

  async handleTwitterOAuth(code: string) {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/twitter/callback`;

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId!,
      }),
    });
    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange Twitter code');
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=email', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userResponse.ok) {
      throw new UnauthorizedException('Failed to get Twitter user info');
    }
    const twUser = await userResponse.json();
    return this.findOrCreateOAuthUser(twUser.data.email, twUser.data.id, 'twitter');
  }

  async handleMicrosoftOAuth(code: string) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/microsoft/callback`;

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });
    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange Microsoft code');
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://graph.microsoft.com/oidc/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userResponse.ok) {
      throw new UnauthorizedException('Failed to get Microsoft user info');
    }
    const msUser = await userResponse.json();
    return this.findOrCreateOAuthUser(msUser.email, msUser.sub, 'microsoft');
  }
}