import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

function friendlyError(error: unknown): string {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (msg.includes("private store"))
    return "Image storage isn't set up correctly. Please contact the site owner.";
  if (msg.includes("pattern") || msg.includes("token") || msg.includes("invalid"))
    return "There's a configuration problem with image storage. Please contact the site owner.";
  if (msg.includes("too large") || msg.includes("size") || msg.includes("limit"))
    return "This photo is too large. Please try a smaller image.";
  if (msg.includes("network") || msg.includes("connect") || msg.includes("fetch"))
    return "Couldn't connect to image storage. Check your internet and try again.";
  return "Upload failed. Please try a different photo, or take a screenshot of it instead.";
}

export async function POST(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Image uploads aren't set up yet. Contact the site owner to enable this." },
      { status: 503 }
    );
  }
  try {
    const form = await request.formData();
    const file = form.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const ext = (file.name.split(".").pop() ?? "jpg").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    const blob = await put(`uploads/${crypto.randomUUID()}.${ext}`, file, {
      access: "public",
      token,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  }
}
