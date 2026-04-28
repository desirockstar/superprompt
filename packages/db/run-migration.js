require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const migration = fs.readFileSync(path.join(__dirname, 'migrations/003_new_eval.sql'), 'utf-8');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const client = postgres(connectionString);

async function runMigration() {
  console.log('Running migration...');
  console.log('Database:', connectionString.replace(/:[^@]+@/, ':***@'));
  
  try {
    await client.unsafe(migration);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();