require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const client = postgres(connectionString);

const migrations = [
  '001_initial.sql',
  '002_add_level.sql', 
  '003_new_eval.sql',
  '004_add_user_id_to_prompts.sql',
  '005_add_tags_views.sql',
  '006_seed_50_prompts.sql',
  '007_add_preview_column.sql',
];

async function runMigrations() {
  console.log('Running all migrations...');
  console.log('Database:', connectionString.replace(/:[^@]+@/, ':***@'));
  
  for (const file of migrations) {
    try {
      const filePath = path.join(__dirname, 'migrations', file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.unsafe(sql);
      console.log('✓', file);
    } catch (error) {
      console.error('Error in', file, ':', error.message);
    }
  }
  
  await client.end();
  console.log('\nAll migrations complete!');
}

runMigrations();