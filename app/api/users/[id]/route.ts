import { NextResponse } from "next/server";
import { auth } from "@/app/[locale]/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht autorisiert" }, { status: 401 });
    }

    if (!/^[a-f\d]{24}$/i.test(userId)) {
      return NextResponse.json({ message: "Ungültige ID" }, { status: 400 });
    }

    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Keine Berechtigung" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const bio = typeof body?.bio === "string" ? body.bio.trim() : "";

    if (!username) {
      return NextResponse.json({ message: "Benutzername darf nicht leer sein" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { username, bio },
      select: { id: true, username: true, bio: true, email: true, image: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Update user error", error);
    return NextResponse.json({ message: "Serverfehler" }, { status: 500 });
  }
}
