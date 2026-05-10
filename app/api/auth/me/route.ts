import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: Request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const name = await getSession(token);
  if (!name) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }
  return NextResponse.json({ name });
}
