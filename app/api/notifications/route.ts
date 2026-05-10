import { NextRequest, NextResponse } from "next/server";
import { Notification, Recipe } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/kv";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

async function getUser(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSession(token);
}

// GET — return unread count, notifications list, and new-recipe count since last seen
export async function GET(request: NextRequest) {
  const name = await getUser(request);
  if (!name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifs, lastSeen, recipes] = await Promise.all([
    kvGet<Notification[]>(`notifications:${name}`).then((n) => n ?? []),
    kvGet<string>(`last_notif_seen:${name}`),
    kvGet<Recipe[]>("recipes").then((r) => r ?? []),
  ]);

  // First visit — set last_seen to now so old recipes aren't flagged as "new"
  const seenAt = lastSeen ?? new Date().toISOString();
  if (!lastSeen) {
    await kvSet(`last_notif_seen:${name}`, seenAt);
  }

  const newRecipesCount = recipes.filter(
    (r) =>
      r.uploadedBy.toLowerCase() !== name.toLowerCase() &&
      new Date(r.uploadedAt) > new Date(seenAt)
  ).length;

  const unreadCount =
    notifs.filter((n) => !n.read).length + (newRecipesCount > 0 ? 1 : 0);

  return NextResponse.json({ notifications: notifs, newRecipesCount, unreadCount });
}

// POST — mark all as read and update last_notif_seen
export async function POST(request: NextRequest) {
  const name = await getUser(request);
  if (!name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.action !== "mark_read") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const notifs = (await kvGet<Notification[]>(`notifications:${name}`)) ?? [];
  const marked = notifs.map((n) => ({ ...n, read: true }));

  await Promise.all([
    kvSet(`notifications:${name}`, marked),
    kvSet(`last_notif_seen:${name}`, new Date().toISOString()),
  ]);

  return NextResponse.json({ ok: true });
}
