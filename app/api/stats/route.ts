import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";

export interface StatsRecord {
  saves: number;
  completions: number;
  comments: number;
}

type StatsMap = Record<string, StatsRecord>;

export async function POST(request: Request) {
  try {
    const { recipeId, action } = (await request.json()) as {
      recipeId: string;
      action: "save" | "unsave" | "complete" | "uncomplete";
    };

    if (!recipeId || !action) {
      return NextResponse.json({ error: "recipeId and action required" }, { status: 400 });
    }

    const stats: StatsMap = (await kvGet<StatsMap>("recipe_stats")) ?? {};
    const current: StatsRecord = stats[recipeId] ?? { saves: 0, completions: 0, comments: 0 };

    if (action === "save") current.saves = Math.max(0, current.saves + 1);
    else if (action === "unsave") current.saves = Math.max(0, current.saves - 1);
    else if (action === "complete") current.completions = Math.max(0, current.completions + 1);
    else if (action === "uncomplete") current.completions = Math.max(0, current.completions - 1);

    stats[recipeId] = current;
    await kvSet("recipe_stats", stats);
    return NextResponse.json(current);
  } catch (error) {
    console.error("Error updating stats:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
