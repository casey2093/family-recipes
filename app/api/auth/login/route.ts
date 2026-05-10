import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Author } from "@/lib/types";
import { kvGet } from "@/lib/kv";
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

    const authors = await readAuthors();
    const author = authors.find((a) => a.name.toLowerCase() === name.trim().toLowerCase());

    if (!author || !author.passwordHash) {
      return NextResponse.json(
        { error: "No account found for that name. Create one by registering!" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, author.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const token = await createSession(author.name);

    const response = NextResponse.json({ name: author.name });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
