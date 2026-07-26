import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/[locale]/auth";
import { prisma } from "@/lib/prisma";
import { ensureOrgChartSeed, getOrgChartEntries, assertNoCycle } from "@/lib/orgChart";
import { OrgNodeType } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { ORG_CHART_TAG } from "@/lib/cacheTags";

const DEFAULT_NODE_PHOTO =
  "https://res.cloudinary.com/dymwgac6m/image/upload/v1765210908/296fe121-5dfa-43f4-98b5-db50019738a7_bxzq63.jpg";

const photoUrlSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return DEFAULT_NODE_PHOTO;
  return trimmed;
}, z.string().max(512));

const baseNodeSchema = z.object({
  name: z.string().min(2).max(120),
  roleTitle: z.string().min(2).max(160),
  department: z.string().max(160).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  photoUrl: photoUrlSchema.optional().or(z.literal("")),
  parentId: z.string().max(64).optional().or(z.literal("")),
  linkedUserId: z.string().max(64).optional().or(z.literal("")),
});

const createSchema = baseNodeSchema;

const updateSchema = baseNodeSchema.partial().extend({
  nodeId: z.string().min(1).max(64),
});

export async function GET() {
  const entries = await getOrgChartEntries();
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  await ensureOrgChartSeed();
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "";
  const localePrefix = locale ? `/${locale}` : "/";
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const parentId = parsed.data.parentId ? parsed.data.parentId : null;
  const photoUrl = parsed.data.photoUrl || DEFAULT_NODE_PHOTO;
  if (parentId) {
    const parent = await prisma.orgChart.findUnique({ where: { id: parentId }, select: { id: true } });
    if (!parent) {
      return NextResponse.json({ message: "Parent not found" }, { status: 404 });
    }
  }

  const created = await prisma.orgChart.create({
    data: {
      name: parsed.data.name,
      roleTitle: parsed.data.roleTitle,
      department: parsed.data.department || null,
      description: parsed.data.description || null,
      photoUrl,
      parentId,
      nodeType: OrgNodeType.PERSON,
      createdById: session.user.id,
      linkedUserId: parsed.data.linkedUserId || session.user.id,
      userId: parsed.data.linkedUserId || session.user.id,
    },
  });

  revalidatePath(`${localePrefix}/organigram`);
  revalidateTag(ORG_CHART_TAG);

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const nodeId = url.searchParams.get("id") ?? "";
  if (!nodeId) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const node = await prisma.orgChart.findUnique({ where: { id: nodeId } });
  if (!node) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isOwner = node.createdById === session.user.id || node.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (node.nodeType !== OrgNodeType.PERSON) {
    return NextResponse.json({ message: "Only person nodes can be deleted" }, { status: 400 });
  }

  await prisma.orgChart.delete({ where: { id: nodeId } });

  const locale = url.searchParams.get("locale") ?? "";
  const localePrefix = locale ? `/${locale}` : "/";
  revalidatePath(`${localePrefix}/organigram`);
  revalidateTag(ORG_CHART_TAG);
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "";
  const localePrefix = locale ? `/${locale}` : "/";
  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const node = await prisma.orgChart.findUnique({ where: { id: parsed.data.nodeId } });
  if (!node) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isOwner = node.createdById === session.user.id || node.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const nextParentId = parsed.data.parentId === "" ? null : parsed.data.parentId ?? node.parentId;
  if (nextParentId) {
    const parent = await prisma.orgChart.findUnique({ where: { id: nextParentId }, select: { id: true } });
    if (!parent) {
      return NextResponse.json({ message: "Parent not found" }, { status: 404 });
    }
    await assertNoCycle(nextParentId, node.id);
  }

  const updated = await prisma.orgChart.update({
    where: { id: node.id },
    data: {
      name: parsed.data.name ?? node.name,
      roleTitle: parsed.data.roleTitle ?? node.roleTitle,
      department: parsed.data.department !== undefined ? parsed.data.department || null : node.department,
      description: parsed.data.description !== undefined ? parsed.data.description || null : node.description,
      photoUrl: parsed.data.photoUrl !== undefined ? parsed.data.photoUrl || DEFAULT_NODE_PHOTO : node.photoUrl,
      parentId: nextParentId,
      linkedUserId: parsed.data.linkedUserId !== undefined ? parsed.data.linkedUserId || null : node.linkedUserId,
    },
  });

  revalidatePath(`${localePrefix}/organigram`);
  revalidateTag(ORG_CHART_TAG);
  return NextResponse.json(updated);
}
