import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { categories, tags, users, sessions, prompts, ratings, unlocks, subscriptions } from '@superprompt/db';

const DEFAULT_CONNECTION_STRING = 'postgres://postgres:postgres@localhost:5432/superprompt';

export const DB_KEY = 'DB_CONNECTION';

const schema = { categories, tags, users, sessions, prompts, ratings, unlocks, subscriptions };
export type Database = PostgresJsDatabase<typeof schema>;

export const databaseproviders = {
  provide: DB_KEY,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Database => {
    const connectionString = config.get('DATABASE_URL') || DEFAULT_CONNECTION_STRING;
    console.log('DB: using connection string:', connectionString.replace(/:(?:[^:@\n]+)@/, ':*****@'));
    
    const client = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    return drizzle(client, { schema });
  },
};

@Global()
@Module({
  providers: [databaseproviders],
  exports: [DB_KEY],
})
export class DatabaseModule {}