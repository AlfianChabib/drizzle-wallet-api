import { app } from "./app.ts";
import { closeAllDatabasePools } from "./config/database.ts";
import { env } from "./config/env.ts";

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
    await closeAllDatabasePools();
    console.log("🔒 All database connection pools (primary & replicas) closed.");
  } catch (err) {
    console.error("Error closing database connection pools:", err);
  }

  console.log("👋 Process terminated cleanly.");
  process.exit(0);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
