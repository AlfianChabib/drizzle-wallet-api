import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { relations } from "../db/schema/index.ts";
import { env } from "./env.ts";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle({ client: pool, relations });

export type Database = typeof db;
