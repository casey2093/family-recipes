import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

function friendlyError(error: unknown): string {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (msg.includes("private store") || msg.includes("not configured"))
    return "Image storage isn't set up correctly. Please contact the site owner.";
  if (msg.includes("content type") || msg.includes("not allowed"))
    return "This file type isn't supported. Please use a JPEG or PNG photo.";
  if (msg.includes("too large") || msg.includes("size") || msg.includes("limit"))
    return "This photo is too large. Please take a screenshot and upload that instead.";
  return "Upload failed. Please try a different photo or take a screenshot.";
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image uploads aren't set up yet. Contact the site owner to enable this." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/heic",
          "image/heif",
        ],
      }),
      onUploadCompleted: async () => {
        // no-op
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Upload error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: friendlyError(error) }, { status: 400 });
  }
}
