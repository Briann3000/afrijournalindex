/**
 * Production Entry Server for cPanel (Phusion Passenger / CloudLinux Node.js Manager)
 * 
 * Supports both:
 * 1. Next.js standalone build (.next/standalone/server.js)
 * 2. Direct next start runtime fallback
 */

const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const fs = require("fs");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

// Check if standalone server.js exists
const standaloneServerPath = path.join(__dirname, ".next", "standalone", "server.js");

if (fs.existsSync(standaloneServerPath)) {
  console.log("> Starting AfriJournal Index using Next.js Standalone Engine on port:", port);
  // Delegate to standalone runner
  process.env.PORT = port.toString();
  process.env.HOSTNAME = hostname;
  require(standaloneServerPath);
} else {
  // Standard Next.js server startup
  console.log("> Starting AfriJournal Index using standard Next.js Engine on port:", port);
  const next = require("next");
  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Server request handling error:", req.url, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }).listen(port, () => {
      console.log(`> AfriJournal Index ready on http://${hostname}:${port}`);
    });
  }).catch((err) => {
    console.error("Fatal Next.js startup error:", err);
    process.exit(1);
  });
}
