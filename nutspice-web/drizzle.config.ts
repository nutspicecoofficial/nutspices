import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: process.env.TURSO_CONNECTION_URL ? "turso" : "sqlite",
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL || ".db/sqlite.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});

