const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  console.log(req.method, req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ method: req.method, url: req.url }));
});

server.on('error', e => console.error('Error:', e.message));

server.listen(4000, () => {
  console.log('Listening on 4000');
  exec('netstat -tlnp', (err, out) => console.log('netstat:', out || err));
});