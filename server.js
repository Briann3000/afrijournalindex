// server.js - Custom entrypoint for cPanel Phusion Passenger / Node.js App Manager
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js production server ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Next.js preparation failed:', err);
  process.exit(1);
});
