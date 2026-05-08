import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Author } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/kv";

async function readAuthors(): Promise<Author[]> {
  return (await kvGet<Author[]>("authors")) ?? [];
}

export async function GET() {
  const authors = await readAuthors();
  return NextResponse.json(authors);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const authors = await readAuthors();
    const existing = authors.find(
      (a) => a.name.toLowerCase() === body.name.trim().toLowerCase()
    );

    if (existing) {
      const updated = { ...existing, imageUrl: body.imageUrl ?? existing.imageUrl };
      await kvSet("authors", authors.map((a) => (a.id === existing.id ? updated : a)));
      return NextResponse.json(updated);
    }

    const author: Author = {
      id: uuidv4(),
      name: body.name.trim(),
      imageUrl: body.imageUrl,
      createdAt: new Date().toISOString(),
    };
    await kvSet("authors", [...authors, author]);
    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    console.error("Error saving author:", error);
    return NextResponse.json({ error: "Failed to save author" }, { status: 500 });
  }
}
