import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// This client works for both local SQLite files and Turso cloud databases
const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || "file:.db/sqlite.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
