const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

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

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@superprompt_devcontainer-db-1:5432/superprompt'
});

app.get('/api/prompts', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, title, category, status, base_path as \"basePath\", current_version as \"currentVersion\", is_multi_version as \"isMultiVersion\" FROM prompts WHERE status = 'approved' ORDER BY created_at DESC");
    const prompts = result.rows.map(p => ({ ...p, preview: p.title.substring(0, 50) + '...' }));
    res.json({ prompts, total: prompts.length, page: 1, limit: 10 });
  } catch(e) {
    console.error('Prompts error:', e.message);
    res.json({ prompts: [], total: 0 });
  }
});

app.get('/api/prompts/:id', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM prompts WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const p = result.rows[0];
    res.json({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.status,
      basePath: p.base_path,
      currentVersion: p.current_version,
      isMultiVersion: p.is_multi_version,
      preview: p.title.substring(0, 50) + '...'
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  try {
    const result = await pool.query("SELECT id, email, is_admin as \"isAdmin\" FROM users WHERE email = $1 AND password_hash = $2", [email, hash]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    res.json({ token: user.id, id: user.id, email: user.email, isAdmin: user.isAdmin });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });
    
    const result = await pool.query("INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, false) RETURNING id, email, is_admin", [email, hash]);
    const user = result.rows[0];
    res.json({ token: user.id, id: user.id, email: user.email, isAdmin: user.isAdmin });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.substring(7);
  try {
    const result = await pool.query("SELECT id, email, is_admin as \"isAdmin\" FROM users WHERE id = $1", [token]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch(e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/billing/status', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.substring(7);
  try {
    const result = await pool.query("SELECT status, expires_at as \"expiresAt\" FROM subscriptions WHERE user_id = $1", [token]);
    if (result.rows.length === 0) return res.json({ status: 'none' });
    res.json(result.rows[0]);
  } catch(e) {
    res.json({ status: 'none' });
  }
});

app.listen(4000, '0.0.0.0', () => {
  console.log('Backend running on http://0.0.0.0:4000');
});