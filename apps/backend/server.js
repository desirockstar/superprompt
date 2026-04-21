const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@superprompt_devcontainer-db-1:5432/superprompt'
});

const server = http.createServer(async (req, res) => {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json'
  });
  
  if (req.method === 'OPTIONS') return res.end();
  
  console.log(req.method, req.url);
  
  if (req.url === '/api/prompts') {
    try {
      const result = await pool.query("SELECT * FROM prompts WHERE status = 'approved'");
      res.end(JSON.stringify({ prompts: result.rows, total: result.rowCount }));
    } catch(e) {
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(4000, '0.0.0.0', () => {
  console.log('Server running on port 4000');
});