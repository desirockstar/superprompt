import type { Config } from "drizzle-kit";

export default {
  schema: "./src/index.ts",
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgres://app:app@localhost:5432/superprompt",
  },
} satisfies Config;