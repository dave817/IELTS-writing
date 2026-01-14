import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  // Common foot-gun in this repo: DATABASE_URL points to a root `./dev.db` which is often empty,
  // while the intended db lives in `./prisma/dev.db` (per README + migrations layout).
  if (raw === "file:./dev.db" || raw === "file:dev.db") return undefined;

  return raw;
}

function defaultSqliteUrl(): string {
  // Absolute path avoids cwd surprises in Next dev/server runtimes.
  const abs = path.join(process.cwd(), "prisma", "dev.db");
  return `file:${abs}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl() ?? defaultSqliteUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


