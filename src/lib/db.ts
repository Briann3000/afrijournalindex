import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (!globalForPrisma.prisma) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment variables");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

prismaInstance = globalForPrisma.prisma;

export const prisma = prismaInstance;
