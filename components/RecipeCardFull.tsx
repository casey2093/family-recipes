"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { getCategoryById, getSubcategoryName } from "@/lib/categories";

interface Props {
  recipe: Recipe;
  showMeta?: boolean;
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoString));
}

function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

// ── Serving-size scaler ─────────────────────────────────────────────────────

function parseLeadingQuantity(str: string): { quantity: number; matchLen: number } | null {
  // Matches: "1 1/2", "1/2", "2.5", "2"
  const pattern = /^(\d+)\s+(\d+)\/(\d+)|^(\d+)\/(\d+)|^(\d+(?:\.\d+)?)/;
  const match = str.match(pattern);
  if (!match) return null;
  let quantity = 0;
  if (match[1] !== undefined) {
    quantity = parseInt(match[1]) + parseInt(match[2]) / parseInt(match[3]);
  } else if (match[4] !== undefined) {
    quantity = parseInt(match[4]) / parseInt(match[5]);
  } else {
    quantity = parseFloat(match[6]);
  }
  return { quantity, matchLen: match[0].length };
}

function formatQuantity(n: number): string {
  if (n <= 0) return "0";
  const whole = Math.floor(n);
  const frac = n - whole;
  const fracs: [number, string][] = [
    [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"],
    [1 / 2, "½"], [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"],
  ];
  for (const [val, sym] of fracs) {
    if (Math.abs(frac - val) < 0.04) return whole > 0 ? `${whole} ${sym}` : sym;
  }
  if (Math.abs(frac) < 0.04) return String(whole);
  return String(Math.round(n * 10) / 10);
}

function scaleIngredient(ingredient: string, factor: number): string {
  if (Math.abs(factor - 1) < 0.001) return ingredient;
  const parsed = parseLeadingQuantity(ingredient.trim());
  if (!parsed) return ingredient;
  const scaled = parsed.quantity * factor;
  return formatQuantity(scaled) + ingredient.trim().slice(parsed.matchLen);
}

// ───────────────────────────────────────────────────────────────────────────

export default function RecipeCardFull({ recipe, showMeta = true }: Props) {
  const category = getCategoryById(recipe.category);
  const subcategoryName = getSubcategoryName(recipe.category, recipe.subcategory);
  const totalTime = recipe.prepTime + recipe.cookTime;

  const [adjServings, setAdjServings] = useState(recipe.servings || 1);
  useEffect(() => { setAdjServings(recipe.servings || 1); }, [recipe.id, recipe.servings]);

  const scaleFactor = recipe.servings > 0 ? adjServings / recipe.servings : 1;
  const isScaled = Math.abs(scaleFactor - 1) > 0.001;

  return (
    <div className="bg-white rounded-2xl overflow-hidden w-full">
      {/* Header section */}
      <div className="px-6 pt-6 pb-3">
        <h1 className="font-playfair font-bold text-recipe-pink leading-tight mb-1"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}
        >
          {recipe.title}
        </h1>

        {recipe.source && (
          <div className="text-sm text-teal-600 mt-1">
            {isUrl(recipe.source) ? (
              <a
                href={recipe.source}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-teal-800 inline-flex items-center gap-1"
              >
                Relevant Links
              </a>
            ) : (
              <span>{recipe.source}</span>
            )}
          </div>
        )}
      </div>

      {/* Dish image */}
      {recipe.imageUrl && (
        <div className="mx-6 mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full rounded-xl object-cover max-h-72"
          />
        </div>
      )}

      {/* Timing bar */}
      <div className="mx-6 mb-5">
        <div className="border-2 border-recipe-navy rounded-xl px-4 py-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-recipe-navy">Prep:</span>
              <span className="font-bold text-gray-800">{recipe.prepTime}</span>
              <span className="text-gray-500">mins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-recipe-navy">Cook:</span>
              <span className="font-bold text-gray-800">{recipe.cookTime}</span>
              <span className="text-gray-500">mins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-recipe-navy">Total:</span>
              <span className="font-bold text-gray-800">{totalTime}</span>
              <span className="text-gray-500">mins</span>
            </div>
            {/* Serving adjuster */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-recipe-navy">Servings:</span>
              <button
                onClick={() => setAdjServings((s) => Math.max(1, s - 1))}
                className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-recipe-navy hover:text-recipe-navy text-xs font-bold leading-none transition-colors"
                aria-label="Decrease servings"
              >
                −
              </button>
              <span className={`font-bold min-w-[1.5ch] text-center transition-colors ${isScaled ? "text-recipe-pink" : "text-gray-800"}`}>
                {adjServings}
              </span>
              <button
                onClick={() => setAdjServings((s) => s + 1)}
                className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-recipe-navy hover:text-recipe-navy text-xs font-bold leading-none transition-colors"
                aria-label="Increase servings"
              >
                +
              </button>
              {isScaled && (
                <button
                  onClick={() => setAdjServings(recipe.servings)}
                  className="text-xs text-gray-400 hover:text-recipe-navy ml-1 underline"
                  title="Reset to original"
                >
                  reset
                </button>
              )}
            </div>
          </div>
          {isScaled && (
            <p className="text-xs text-recipe-pink mt-2 font-medium">
              Ingredients adjusted for {adjServings} serving{adjServings !== 1 ? "s" : ""} (originally {recipe.servings})
            </p>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="mx-6 mb-5 flex flex-col sm:flex-row gap-4">
        {/* Ingredients */}
        <div className="sm:w-2/5 border-2 border-recipe-navy rounded-xl overflow-hidden flex flex-col">
          <div className="bg-white py-2 px-4 border-b-2 border-recipe-navy text-center">
            <h3 className="font-bold text-recipe-navy tracking-widest text-xs uppercase">
              Ingredients
            </h3>
          </div>
          <div className="p-4 flex-1">
            <ul className="space-y-2.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category?.accentColor ?? "#1B3A5C" }}
                  />
                  {scaleIngredient(ing, scaleFactor)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex-1 border-2 border-recipe-navy rounded-xl overflow-hidden flex flex-col">
          <div className="bg-white py-2 px-4 border-b-2 border-recipe-navy text-center">
            <h3 className="font-bold text-recipe-navy tracking-widest text-xs uppercase">
              Instructions
            </h3>
          </div>
          <div className="p-4 flex-1">
            <ol className="space-y-4">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                    style={{ backgroundColor: category?.accentColor ?? "#1B3A5C" }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Meta footer */}
      {showMeta && (
        <div className="mx-6 mb-6 rounded-xl bg-recipe-cream px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Link href={`/author/${encodeURIComponent(recipe.uploadedBy)}`}>
              <div className="w-6 h-6 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold hover:opacity-80">
                {recipe.uploadedBy.charAt(0).toUpperCase()}
              </div>
            </Link>
            <span>
              Added by{" "}
              <Link href={`/author/${encodeURIComponent(recipe.uploadedBy)}`} className="font-bold text-recipe-navy hover:text-recipe-pink">
                {recipe.uploadedBy}
              </Link>
              {" · "}
              {formatDate(recipe.uploadedAt)}
            </span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <span className="text-gray-400">{category?.emoji}</span>
            <Link
              href={`/${recipe.category}`}
              className="text-recipe-navy capitalize hover:text-recipe-pink transition-colors"
            >
              {category?.name ?? recipe.category}
            </Link>
            <span className="text-gray-400 mx-0.5">›</span>
            <Link
              href={`/${recipe.category}?sub=${recipe.subcategory}`}
              className="capitalize hover:text-recipe-pink transition-colors"
            >
              {subcategoryName}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
