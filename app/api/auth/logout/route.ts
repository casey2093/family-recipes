import { NextResponse } from "next/server";
import { deleteSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
