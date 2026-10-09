const { exec } = require('child_process');
require('dotenv').config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not defined in .env");
  process.exit(1);
}

console.log("Starting Prisma Studio with configured database...");
const studio = exec(`npx prisma studio --url "${url}"`, { shell: true });

studio.stdout.pipe(process.stdout);
studio.stderr.pipe(process.stderr);
