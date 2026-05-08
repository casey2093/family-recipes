import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Comment } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/kv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipeId = searchParams.get("recipeId");
  if (!recipeId) return NextResponse.json({ error: "recipeId required" }, { status: 400 });
  const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "like") {
      const { recipeId, commentId } = body;
      const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
      const updated = comments.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      );
      await kvSet(`comments:${recipeId}`, updated);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "reply") {
      const { recipeId, commentId, author, text } = body;
      if (!author?.trim() || !text?.trim()) {
        return NextResponse.json({ error: "Author and text required" }, { status: 400 });
      }
      const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
      const reply = {
        id: uuidv4(),
        author: author.trim(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = comments.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      );
      await kvSet(`comments:${recipeId}`, updated);
      return NextResponse.json(reply, { status: 201 });
    }

    const { recipeId, author, text, imageUrl } = body;
    if (!recipeId || !author?.trim() || !text?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment: Comment = {
      id: uuidv4(),
      recipeId,
      author: author.trim(),
      text: text.trim(),
      imageUrl,
      likes: 0,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
    await kvSet(`comments:${recipeId}`, [...comments, comment]);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error with comment:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
