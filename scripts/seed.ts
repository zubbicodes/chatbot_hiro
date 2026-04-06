import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.replace("/", ""),
});
const db = new PrismaClient({ adapter });

async function seed() {
  const hash = await bcrypt.hash("admin123", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@hiro.dev" },
    update: {},
    create: { name: "Super Admin", email: "admin@hiro.dev", password: hash, role: "ADMIN" },
  });

  const client = await db.user.upsert({
    where: { email: "client@hiro.dev" },
    update: {},
    create: { name: "Test Client", email: "client@hiro.dev", password: hash, role: "CLIENT" },
  });

  console.log("✅ Admin :", admin.email, "| role:", admin.role);
  console.log("✅ Client:", client.email, "| role:", client.role);
  await db.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
