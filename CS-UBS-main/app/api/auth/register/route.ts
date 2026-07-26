import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    const cleanUsername = String(username ?? "").trim();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const rawPassword = String(password ?? "").trim();

    if (!cleanUsername || !cleanEmail || !rawPassword) {
      return NextResponse.json(
        { message: "Bitte fülle alle Felder aus." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Benutzername oder E-Mail existiert bereits." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(rawPassword);

    await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: passwordHash,
        role: "USER",
      },
    });

    return NextResponse.json({ ok: true, role: "USER" as Role }, { status: 201 });
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
