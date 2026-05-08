import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Recipe } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/kv";

async function readRecipes(): Promise<Recipe[]> {
  const remote = await kvGet<Recipe[]>("recipes");
  if (remote !== null) return remote;
  return readLocalRecipes();
}

async function writeRecipes(recipes: Recipe[]): Promise<void> {
  const KV_URL = process.env.KV_REST_API_URL;
  if (KV_URL) {
    await kvSet("recipes", recipes);
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const uploadedBy = searchParams.get("uploadedBy");

  const recipes = await readRecipes();
  let filtered = category ? recipes.filter((r) => r.category === category) : recipes;
  if (uploadedBy) filtered = filtered.filter((r) => r.uploadedBy === uploadedBy);

  filtered.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.category || !body.subcategory || !body.uploadedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      imageUrl: body.imageUrl?.trim() || undefined,
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Recipe ID required" }, { status: 400 });

    const recipes = await readRecipes();
    const index = recipes.findIndex((r) => r.id === body.id);
    if (index === -1) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    const existing = recipes[index];
    const updated: Recipe = {
      ...existing,
      title: body.title?.trim() || existing.title,
      category: body.category || existing.category,
      subcategory: body.subcategory || existing.subcategory,
      ingredients: body.ingredients
        ? (body.ingredients as string[]).filter((s) => s.trim())
        : existing.ingredients,
      instructions: body.instructions
        ? (body.instructions as string[]).filter((s) => s.trim())
        : existing.instructions,
      prepTime: body.prepTime !== undefined ? Number(body.prepTime) || 0 : existing.prepTime,
      cookTime: body.cookTime !== undefined ? Number(body.cookTime) || 0 : existing.cookTime,
      servings: body.servings !== undefined ? Number(body.servings) || 1 : existing.servings,
      source: body.source !== undefined ? body.source?.trim() || undefined : existing.source,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl?.trim() || undefined : existing.imageUrl,
    };

    recipes[index] = updated;
    await writeRecipes(recipes);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}
