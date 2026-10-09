import mariadb from "mariadb";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Helper function to extract connection params from discrete env vars or DATABASE_URL
function getDbConfig() {
  let host = process.env.DB_HOST || "localhost";
  let port = parseInt(process.env.DB_PORT || "3306", 10);
  let user = process.env.DB_USERNAME || "root";
  let password = process.env.DB_PASSWORD || "";
  let database = process.env.DB_DATABASE || "afrijournalindex";

  // If DATABASE_URL is defined (e.g. mysql://user:password@host:port/database) and individual vars are not set
  if (process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_DATABASE)) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      host = parsed.hostname || host;
      port = parsed.port ? parseInt(parsed.port, 10) : port;
      user = decodeURIComponent(parsed.username || user);
      password = decodeURIComponent(parsed.password || password);
      database = parsed.pathname ? parsed.pathname.replace(/^\//, "") : database;
    } catch {
      // Keep defaults / discrete fallback if URL parsing fails
    }
  }

  return {
    host,
    port,
    user,
    password,
    database,
    connectionLimit: parseInt(process.env.DB_POOL_LIMIT || "10", 10),
    connectTimeout: 15000,
    acquireTimeout: 15000,
    idleTimeout: 30000,
    trace: process.env.NODE_ENV === "development"
  };
}

const pool = mariadb.createPool(getDbConfig());
const adapter = new PrismaMariaDb(pool as any);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
