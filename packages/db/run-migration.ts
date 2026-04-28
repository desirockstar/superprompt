import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';

const migration = readFileSync('./migrations/003_new_eval.sql', 'utf-8');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/superprompt';

const client = postgres(connectionString);

async function runMigration() {
  console.log('Running migration...');
  
  try {
    await client.unsafe(migration);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();