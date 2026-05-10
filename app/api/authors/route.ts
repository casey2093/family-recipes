import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Author } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/kv";

async function readAuthors(): Promise<Author[]> {
  return (await kvGet<Author[]>("authors")) ?? [];
}

export async function GET() {
  const authors = await readAuthors();
  // Never expose password hashes to the client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return NextResponse.json(authors.map(({ passwordHash: _ph, ...safe }) => safe));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const authors = await readAuthors();
    const lookupName = (body.originalName ?? body.name).trim().toLowerCase();
    const existing = authors.find((a) => a.name.toLowerCase() === lookupName);

    if (existing) {
      const updated = {
        ...existing,
        name: body.name.trim(),
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
      };
      await kvSet("authors", authors.map((a) => (a.id === existing.id ? updated : a)));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _ph1, ...safeUpdated } = updated;
      return NextResponse.json(safeUpdated);
    }

    const author: Author = {
      id: uuidv4(),
      name: body.name.trim(),
      imageUrl: body.imageUrl,
      createdAt: new Date().toISOString(),
    };
    await kvSet("authors", [...authors, author]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph2, ...safeAuthor } = author;
    return NextResponse.json(safeAuthor, { status: 201 });
  } catch (error) {
    console.error("Error saving author:", error);
    return NextResponse.json({ error: "Failed to save author" }, { status: 500 });
  }
}
