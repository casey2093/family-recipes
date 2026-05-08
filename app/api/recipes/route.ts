import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Recipe } from "@/lib/types";

// Storage backend: Vercel KV in production, local JSON file in development
async function readRecipes(): Promise<Recipe[]> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<Recipe[]>("recipes")) ?? [];
  }
  // Local dev fallback: read from file
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "recipes.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

async function writeRecipes(recipes: Recipe[]): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import("@vercel/kv");
    await kv.set("recipes", recipes);
    return;
  }
  // Local dev fallback: write to file
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "recipes.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(recipes, null, 2));
}

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
        { error: "Missing required fields: title, category, subcategory, uploadedBy" },
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
