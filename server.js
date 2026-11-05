// server.js - Custom entrypoint for cPanel Phusion Passenger / Node.js App Manager
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => originalLog(`[${new Date().toISOString()}]`, ...args);
console.error = (...args) => originalError(`[${new Date().toISOString()}]`, ...args);

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const next = require('next');

// Auto-heal directory permissions on Linux/cPanel so manual chmod is never required
function autoHealPermissions(dir) {
  try {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        try { fs.chmodSync(fullPath, 0o755); } catch (_) {}
        autoHealPermissions(fullPath);
      } else if (entry.isFile()) {
        try { fs.chmodSync(fullPath, 0o644); } catch (_) {}
      }
    }
  } catch (_) {}
}

if (process.platform !== 'win32') {
  try {
    const nextDir = path.join(__dirname, '.next');
    if (fs.existsSync(nextDir)) {
      try { fs.chmodSync(nextDir, 0o755); } catch (_) {}
      autoHealPermissions(nextDir);
    }
  } catch (permErr) {
    console.warn('Notice: Auto-heal permissions pass skipped:', permErr.message);
  }
}

const dev = false;
// On cPanel Passenger, process.env.PORT can be a string socket or a numeric port
const rawPort = process.env.PORT;
const isSocket = rawPort && isNaN(Number(rawPort));
const port = rawPort ? (isSocket ? rawPort : Number(rawPort)) : 3000;

const app = next({
  dev,
  // When running on a unix socket under Passenger, do not constrain hostname/port inside next()
  hostname: isSocket ? undefined : (process.env.HOSTNAME || '0.0.0.0'),
  port: isSocket ? undefined : (typeof port === 'number' ? port : undefined),
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js production server ready on ${port}`);
  });
}).catch((err) => {
  console.error('Next.js preparation failed:', err);
  process.exit(1);
});
