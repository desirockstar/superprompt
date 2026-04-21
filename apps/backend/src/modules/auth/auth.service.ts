import { Injectable, NotFoundException, UnauthorizedException, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { users as usersTable } from '@superprompt/db';
import { eq } from 'drizzle-orm';
import * as schema from '@superprompt/db';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: ReturnType<typeof drizzle<typeof schema>>,
  ) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
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
    const { subscriptions } = schema;
    const result = await this.db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    if (result.length === 0) return false;
    const sub = result[0];
    return sub.status === 'active' && !!sub.expiresAt && new Date(sub.expiresAt) > new Date();
  }

  async hasUnlock(userId: string, promptId: string): Promise<boolean> {
    const { unlocks } = schema;
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
}