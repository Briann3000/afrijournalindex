// server.js - Custom entrypoint for cPanel Phusion Passenger / Node.js App Manager
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => originalLog(`[${new Date().toISOString()}]`, ...args);
console.error = (...args) => originalError(`[${new Date().toISOString()}]`, ...args);

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

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
