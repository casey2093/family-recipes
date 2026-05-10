import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Comment, Reply } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/kv";
import type { StatsRecord } from "@/app/api/stats/route";

type StatsMap = Record<string, StatsRecord>;

async function syncCommentCount(recipeId: string, count: number) {
  const stats: StatsMap = (await kvGet<StatsMap>("recipe_stats")) ?? {};
  const current = stats[recipeId] ?? { saves: 0, completions: 0, comments: 0 };
  current.comments = Math.max(0, count);
  stats[recipeId] = current;
  await kvSet("recipe_stats", stats);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipeId = searchParams.get("recipeId");
  if (!recipeId) return NextResponse.json({ error: "recipeId required" }, { status: 400 });
  const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;

    if (body.action === "like") {
      const { recipeId, commentId } = body as { recipeId: string; commentId: string };
      const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
      const updated = comments.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      );
      await kvSet(`comments:${recipeId}`, updated);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "unlike") {
      const { recipeId, commentId } = body as { recipeId: string; commentId: string };
      const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
      const updated = comments.map((c) =>
        c.id === commentId ? { ...c, likes: Math.max(0, c.likes - 1) } : c
      );
      await kvSet(`comments:${recipeId}`, updated);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "reply") {
      const { recipeId, commentId, author, text, imageUrls } = body as {
        recipeId: string; commentId: string; author: string; text: string; imageUrls?: string[];
      };
      if (!author?.trim() || !text?.trim()) {
        return NextResponse.json({ error: "Author and text required" }, { status: 400 });
      }
      const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
      const reply: Reply = {
        id: uuidv4(),
        author: author.trim(),
        text: text.trim(),
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        createdAt: new Date().toISOString(),
      };
      const updated = comments.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      );
      await kvSet(`comments:${recipeId}`, updated);
      return NextResponse.json(reply, { status: 201 });
    }

    const { recipeId, author, text, imageUrls } = body as {
      recipeId: string; author: string; text: string; imageUrls?: string[];
    };
    if (!recipeId || !author?.trim() || !text?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment: Comment = {
      id: uuidv4(),
      recipeId: recipeId as string,
      author: (author as string).trim(),
      text: (text as string).trim(),
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      likes: 0,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
    const updated = [...comments, comment];
    await kvSet(`comments:${recipeId}`, updated);
    await syncCommentCount(recipeId, updated.length);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error with comment:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");
    const commentId = searchParams.get("commentId");
    if (!recipeId || !commentId) {
      return NextResponse.json({ error: "recipeId and commentId required" }, { status: 400 });
    }
    const comments = (await kvGet<Comment[]>(`comments:${recipeId}`)) ?? [];
    const remaining = comments.filter((c) => c.id !== commentId);
    await kvSet(`comments:${recipeId}`, remaining);
    await syncCommentCount(recipeId, remaining.length);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
