import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

export const isDbConfigured = () => {
  return !!(process.env.SQL_HOST || process.env.DATABASE_URL);
};

// Function to create a new connection pool.
export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST || "localhost",
    user: process.env.SQL_USER || "postgres",
    password: process.env.SQL_PASSWORD || "",
    database: process.env.SQL_DB_NAME || "postgres",
    connectionTimeoutMillis: 5000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
