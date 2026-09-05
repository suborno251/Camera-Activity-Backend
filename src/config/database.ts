import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

let connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRESQL_ADDON_URI;

// Enforce connection limit for free-tier databases like Clever Cloud
if (connectionString && !connectionString.includes('connection_limit')) {
  const separator = connectionString.includes('?') ? '&' : '?';
  connectionString = `${connectionString}${separator}connection_limit=3&pool_timeout=20`;
}

const prisma = new PrismaClient(
  connectionString
    ? {
        datasources: {
          db: {
            url: connectionString,
          },
        },
      }
    : undefined
);

export default prisma;