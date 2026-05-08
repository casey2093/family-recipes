import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Recipe } from "@/lib/types";

// ── Storage helpers ────────────────────────────────────────────────────────────
// Uses Vercel KV REST API in production, local JSON file in development.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function readRecipes(): Promise<Recipe[]> {
  if (KV_URL && KV_TOKEN) {
    const res = await fetch(KV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", "recipes"]),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`KV read failed: ${res.status}`);
    const json = await res.json();
    if (!json.result) return [];
    return typeof json.result === "string"
      ? JSON.parse(json.result)
      : json.result;
  }
  return readLocalRecipes();
}

async function writeRecipes(recipes: Recipe[]): Promise<void> {
  if (KV_URL && KV_TOKEN) {
    const res = await fetch(KV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["SET", "recipes", JSON.stringify(recipes)]),
    });
    if (!res.ok) throw new Error(`KV write failed: ${res.status}`);
    return;
  }
  writeLocalRecipes(recipes);
}

function readLocalRecipes(): Recipe[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    const file = path.join(process.cwd(), "data", "recipes.json");
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function writeLocalRecipes(recipes: Recipe[]): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  const file = path.join(process.cwd(), "data", "recipes.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(recipes, null, 2));
}

// ── Route handlers ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const recipes = await readRecipes();
  const filtered = category
    ? recipes.filter((r) => r.category === category)
    : recipes;

  filtered.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.category || !body.subcategory || !body.uploadedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const recipe: Recipe = {
      id: uuidv4(),
      title: body.title.trim(),
      category: body.category,
      subcategory: body.subcategory,
      ingredients: (body.ingredients as string[]).filter((s) => s.trim()),
      instructions: (body.instructions as string[]).filter((s) => s.trim()),
      prepTime: Number(body.prepTime) || 0,
      cookTime: Number(body.cookTime) || 0,
      servings: Number(body.servings) || 1,
      source: body.source?.trim() || undefined,
      uploadedBy: body.uploadedBy.trim(),
      uploadedAt: new Date().toISOString(),
    };

    const recipes = await readRecipes();
    recipes.push(recipe);
    await writeRecipes(recipes);

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Error saving recipe:", error);
    return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
  }
}
