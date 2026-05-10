import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Author } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/kv";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

async function readAuthors(): Promise<Author[]> {
  return (await kvGet<Author[]>("authors")) ?? [];
}

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();

    if (!name?.trim() || !password) {
      return NextResponse.json({ error: "Name and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const authors = await readAuthors();
    const existing = authors.find((a) => a.name.toLowerCase() === name.trim().toLowerCase());

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "That name is already taken. Try signing in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let updatedAuthors: Author[];
    let authorName: string;

    if (existing) {
      // Claim an existing contributor name
      authorName = existing.name;
      updatedAuthors = authors.map((a) =>
        a.id === existing.id ? { ...a, passwordHash } : a
      );
    } else {
      // Brand-new author
      authorName = name.trim();
      const newAuthor: Author = {
        id: uuidv4(),
        name: authorName,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      updatedAuthors = [...authors, newAuthor];
    }

    await kvSet("authors", updatedAuthors);
    const token = await createSession(authorName);

    const response = NextResponse.json({ name: authorName }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
