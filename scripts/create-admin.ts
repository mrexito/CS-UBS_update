import dotenv from "dotenv";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../lib/password";

dotenv.config();

const prisma = new PrismaClient();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

async function main() {
  const email = requireEnv("ADMIN_EMAIL").trim().toLowerCase();
  const password = requireEnv("ADMIN_PASSWORD");
  const username = (process.env.ADMIN_USERNAME ?? email.split("@")[0] ?? "admin").trim();
  const permissions = process.env.ADMIN_PERMISSIONS
    ? process.env.ADMIN_PERMISSIONS.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  const passwordHash = await hashPassword(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        username: existing.username ?? username,
        password: passwordHash,
        permissions,
      },
      select: { id: true, email: true, role: true, username: true },
    });
    console.log("Admin updated", updated);
    return;
  }

  const created = await prisma.user.create({
    data: {
      email,
      username,
      password: passwordHash,
      role: "ADMIN" as Role,
      permissions,
    },
    select: { id: true, email: true, role: true, username: true },
  });
  console.log("Admin created", created);
}

main()
  .catch((err) => {
    console.error("create-admin failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
