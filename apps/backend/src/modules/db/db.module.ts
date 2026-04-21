import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as PostgresPkg from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@superprompt/db';

const DEFAULT_CONNECTION_STRING = 'postgres://postgres:postgres@db:5432/superprompt';

export const DB_KEY = 'DB_CONNECTION';

export const databaseproviders = {
  provide: DB_KEY,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const connectionString = config.get('DATABASE_URL') || DEFAULT_CONNECTION_STRING;
    console.log('DB: using connection string:', connectionString.replace(/:(?:[^:@\n]+)@/, ':*****@'));
    const Postgres = (PostgresPkg as any)?.default ? (PostgresPkg as any).default : PostgresPkg;
    try {
      const client = Postgres(connectionString);
      return drizzle(client, { schema });
    } catch (e) {
      console.error('DB: connection error:', e);
      throw e;
    }
  },
};

@Global()
@Module({
  providers: [databaseproviders],
  exports: [DB_KEY],
})
export class DatabaseModule {}