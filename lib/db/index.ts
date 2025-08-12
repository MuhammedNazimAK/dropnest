import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("Database url is not set up in .env.local index file")
}

console.log('database url', process.env.DATABASE_URL);

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, ({
  schema,
  logger: true
}));

