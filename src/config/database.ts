import { drizzle } from "drizzle-orm/node-postgres";
import { withReplicas } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { relations } from "@/db";
import { env } from "./env";

function createPool(connectionString?: string, max = 20) {
  return new Pool({
    connectionString,
    max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

const primaryPool = createPool(env.DATABASE_URL);
const replicaPool1 = createPool(env.DATABASE_READ_URL_1);
const replicaPool2 = createPool(env.DATABASE_READ_URL_2);

const primaryDB = drizzle({
  client: primaryPool,
  relations: relations,
  paramsInErrors: true,
  logger: true,
});

const replicaDB1 = drizzle({
  client: replicaPool1,
  relations: relations,
  paramsInErrors: true,
  logger: true,
});

const replicaDB2 = drizzle({
  client: replicaPool2,
  relations: relations,
  paramsInErrors: true,
  logger: true,
});

export async function closeAllDatabasePools() {
  await primaryPool.end();
  await replicaPool1.end();
  await replicaPool2.end();
}

export const db = withReplicas(primaryDB, [replicaDB1, replicaDB2]);
