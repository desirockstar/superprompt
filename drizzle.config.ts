import type { Config } from "drizzle-kit";

export default {
  schema: "./packages/db/src/index.ts",
  out: "./packages/db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/superprompt",
  },
} satisfies Config;