import { app } from "./app.ts";
import { env } from "./config/env.ts";
import { pool } from "./config/database.ts";

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`🚀 Server running on http://localhost:${server.port}`);
console.log(`📡 Environment: ${env.NODE_ENV}`);
console.log(`🩺 Health check: http://localhost:${server.port}/health`);

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, initiating graceful shutdown...`);
  server.stop();

  try {
    await pool.end();
    console.log("🔒 Database connection pool closed.");
  } catch (err) {
    console.error("Error closing database connection pool:", err);
  }

  console.log("👋 Process terminated cleanly.");
  process.exit(0);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
