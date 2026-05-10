const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(KV_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(["GET", key]),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.result) return null;
    return (typeof json.result === "string" ? JSON.parse(json.result) : json.result) as T;
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", key, JSON.stringify(value)]),
  });
  if (!res.ok) throw new Error(`KV write failed: ${res.status}`);
}

export async function kvDel(key: string): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["DEL", key]),
  });
}
