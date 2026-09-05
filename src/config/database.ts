import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRESQL_ADDON_URI;

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