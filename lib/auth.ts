import { v4 as uuidv4 } from "uuid";
import { kvGet, kvSet, kvDel } from "./kv";

interface Session {
  name: string;
  expiresAt: string;
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE = "wfk_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export async function createSession(name: string): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await kvSet(`session:${token}`, { name, expiresAt });
  return token;
}

export async function getSession(token: string): Promise<string | null> {
  const session = await kvGet<Session>(`session:${token}`);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    await kvDel(`session:${token}`);
    return null;
  }
  return session.name;
}

export async function deleteSession(token: string): Promise<void> {
  await kvDel(`session:${token}`);
}
