import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const image = typeof body.image === "string" ? body.image : "";
  if (!image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  const base64 = image.split(",")[1];
  if (!base64) return NextResponse.json({ error: "Invalid image data" }, { status: 400 });

  const buffer = Buffer.from(base64, "base64");
  const dir = path.join(process.cwd(), "storage", "proofs");
  await mkdir(dir, { recursive: true });
  const filename = `${auth.user!.id}-${Date.now()}.jpg`;
  await writeFile(path.join(dir, filename), buffer);

  const url = `/storage/proofs/${filename}`;
  return NextResponse.json({ url });
}
