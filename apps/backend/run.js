const fs = require('fs');
const log = fs.createWriteStream('/tmp/backend.log');

process.stdout.write = process.stderr.write = (msg) => {
  log.write(msg + '\n');
};

console.log('Starting...');
require('/workspace/apps/backend/dist/main.js');