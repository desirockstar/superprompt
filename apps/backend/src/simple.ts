import 'reflect-metadata';
import express from 'express';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import Postgres from 'postgres';
import * as schema from '@superprompt/db';
import { eq } from 'drizzle-orm';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const connectionString = 'postgres://postgres:postgres@superprompt_devcontainer-db-1:5432/superprompt';
const client = Postgres(connectionString);
const db: PostgresJsDatabase<typeof schema> = drizzle(client, { schema });

const { prompts, users, subscriptions, unlocks } = schema;

app.get('/api/prompts', async (req, res) => {
  try {
    const allPrompts = await db.select().from(prompts).where(eq(prompts.status, 'approved'));
    res.json({ prompts: allPrompts.map(p => ({ ...p, preview: 'Preview for ' + p.title })), total: allPrompts.length, page: 1, limit: 10 });
  } catch(e) {
    console.error('Prompts error:', e.message);
    res.json({ prompts: [], total: 0 });
  }
});

app.get('/api/prompts/:id', async (req, res) => {
  try {
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, req.params.id));
    if (!prompt) return res.status(404).json({ error: 'Not found' });
    res.json({ ...prompt, preview: 'Preview for ' + prompt.title });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || user.passwordHash !== require('crypto').createHash('sha256').update(password).digest('hex')) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ token: user.id, id: user.id, email: user.email, isAdmin: user.isAdmin });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  
  const hash = require('crypto').createHash('sha256').update(password).digest('hex');
  const [created] = await db.insert(users).values({ email, passwordHash: hash, isAdmin: false }).returning();
  res.json({ token: created.id, id: created.id, email: created.email, isAdmin: created.isAdmin });
});

app.get('/api/auth/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.substring(7);
  try {
    const [user] = await db.select().from(users).where(eq(users.id, token));
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, isAdmin: user.isAdmin });
  } catch(e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(4000, '0.0.0.0', async () => {
  console.log('Backend running on port 4000');
});