import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { auth } from "@/app/[locale]/auth";

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 10;

const MAX_UPLOAD_BYTES = Number(process.env.CLOUDINARY_MAX_UPLOAD_BYTES ?? 8 * 1024 * 1024); // 8MB default
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateKey = getClientKey(req) || session.user.id;
  if (!checkRateLimit(rateKey)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary env vars fehlen");
    return NextResponse.json({ error: "Cloudinary Konfiguration fehlt" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "yc-directory/blogs",
          resource_type: "image",
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error("Upload fehlgeschlagen"));
          resolve({ secure_url: result.secure_url });
        }
      );

      stream.end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err: unknown) {
    console.error("Cloudinary upload error", err);
    const message = err instanceof Error ? err.message : "Upload fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
