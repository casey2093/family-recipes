import { upload } from "@vercel/blob/client";
import { compressImage, checkUploadSize } from "./compressImage";

export async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  try {
    const compressed = await compressImage(file);
    const sizeError = checkUploadSize(compressed);
    if (sizeError) return { error: sizeError };

    const ext =
      (compressed.name.split(".").pop() ?? "jpg")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase() || "jpg";

    const blob = await upload(`uploads/${crypto.randomUUID()}.${ext}`, compressed, {
      access: "public",
      handleUploadUrl: "/api/upload",
    });

    return { url: blob.url };
  } catch (error) {
    const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
    if (msg.includes("too large") || msg.includes("size") || msg.includes("limit"))
      return { error: "This photo is too large. Please take a screenshot and upload that instead." };
    if (msg.includes("content type") || msg.includes("not allowed"))
      return { error: "This file type isn't supported. Please use a JPEG or PNG photo." };
    return { error: "Upload failed. Please try a different photo or take a screenshot." };
  }
}
