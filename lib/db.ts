import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");

  // Parse mysql://user:pass@host:port/dbname
  const parsed = new URL(url);
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace(/^\//, ""),
    // Keep pool small to avoid exhausting MariaDB's max_connections
    connectionLimit: 5,
    // Fail fast instead of waiting 10s — surfaces real errors sooner
    acquireTimeout: 5000,
    // How long to wait for the TCP handshake
    connectTimeout: 5000,
    // Release idle connections after 30s (prevents stale sockets)
    idleTimeout: 30000,
  });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getOrCreateClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = createPrismaClient();
  // Pre-connect so the pool is warm before the first request
  client.$connect().catch(() => {});
  globalForPrisma.prisma = client;
  return client;
}

// Lazy proxy: module import is safe at build time (no DATABASE_URL needed).
// The real client is only created on the first property access at request time.
export const db = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return getOrCreateClient()[prop as keyof PrismaClient];
  },
});
