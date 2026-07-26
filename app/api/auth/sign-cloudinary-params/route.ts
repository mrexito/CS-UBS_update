import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { auth } from "@/app/[locale]/auth";

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 20;

const BASE_FOLDER = process.env.CLOUDINARY_BASE_FOLDER || "yc-directory";
const ALLOWED_SIGNATURE_KEYS = new Set([
  "timestamp",
  "folder",
  "public_id",
  "upload_preset",
  "tags",
  "context",
  "resource_type",
  "type",
  "use_filename",
  "unique_filename",
  "overwrite",
  "invalidate",
  "return_delete_token",
  "source",
  "callback",
  "transformation",
  "eager",
  "format",
  "quality",
  "cloud_name",
  "api_key",
  "signature",
  "timestamp",
  "folder",
  "client_allowed_formats",
  "allowed_formats",
]);

function getClientKey(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip || "unknown";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateKey = getClientKey(request) || session.user.id;
  if (!checkRateLimit(rateKey)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const paramsToSign = body?.paramsToSign;
  if (!paramsToSign || typeof paramsToSign !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const folder = typeof paramsToSign.folder === "string" ? paramsToSign.folder.trim() : "";
  if (folder && !folder.startsWith(BASE_FOLDER)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  const forbiddenKeys = Object.keys(paramsToSign).filter((key) => !ALLOWED_SIGNATURE_KEYS.has(key));
  if (forbiddenKeys.length > 0) {
    return NextResponse.json({ error: "Forbidden signature parameters", keys: forbiddenKeys }, { status: 400 });
  }

  if (paramsToSign.overwrite === true) {
    return NextResponse.json({ error: "Overwrite not allowed" }, { status: 400 });
  }

  const resourceType = paramsToSign.resource_type;
  if (resourceType && resourceType !== "image") {
    return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET || ""
  );

  return NextResponse.json({ signature });
}
