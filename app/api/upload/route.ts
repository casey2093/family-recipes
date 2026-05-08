import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Image storage not configured" }, { status: 503 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`uploads/${Date.now()}-${safeName}`, file, {
      access: "public",
      token,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
