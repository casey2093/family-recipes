import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Image storage not configured" }, { status: 503 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const blob = await put(`uploads/${Date.now()}-${file.name}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
