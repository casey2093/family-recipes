"use client";

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

export default function RecipeCardFull({ recipe, showMeta = true }: Props) {
  const category = getCategoryById(recipe.category);
  const subcategoryName = getSubcategoryName(recipe.category, recipe.subcategory);
  const totalTime = recipe.prepTime + recipe.cookTime;

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
              <span className="italic">{recipe.source}</span>
            )}
          </div>
        )}
      </div>

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
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-recipe-navy">Servings:</span>
              <span className="font-bold text-gray-800">{recipe.servings}</span>
            </div>
          </div>
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
                  {ing}
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
            <div className="w-6 h-6 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold">
              {recipe.uploadedBy.charAt(0).toUpperCase()}
            </div>
            <span>
              Added by{" "}
              <strong className="text-recipe-navy">{recipe.uploadedBy}</strong>
              {" · "}
              {formatDate(recipe.uploadedAt)}
            </span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <span className="text-gray-400">{category?.emoji}</span>
            <span className="text-recipe-navy capitalize">{category?.name ?? recipe.category}</span>
            <span className="text-gray-400 mx-0.5">›</span>
            <span className="capitalize">{subcategoryName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
