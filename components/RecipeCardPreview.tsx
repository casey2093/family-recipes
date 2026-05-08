"use client";

import { Recipe } from "@/lib/types";
import { getCategoryById, getSubcategoryName } from "@/lib/categories";

interface Props {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoString));
}

export default function RecipeCardPreview({ recipe, onClick }: Props) {
  const category = getCategoryById(recipe.category);
  const subcategoryName = getSubcategoryName(recipe.category, recipe.subcategory);
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <button
      onClick={() => onClick(recipe)}
      className="group w-full text-left bg-white rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden border border-gray-100"
    >
      {/* Category color bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: category?.accentColor ?? "#E8608A" }}
      />

      <div className="p-4 sm:p-5">
        {/* Subcategory pill */}
        <span
          className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2"
          style={{
            backgroundColor: `${category?.accentColor ?? "#E8608A"}18`,
            color: category?.accentColor ?? "#E8608A",
          }}
        >
          {subcategoryName}
        </span>

        {/* Title */}
        <h3 className="font-playfair font-bold text-recipe-navy text-lg leading-snug mb-3 group-hover:text-recipe-pink transition-colors line-clamp-2">
          {recipe.title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {totalTime > 0 ? `${totalTime} min` : "—"}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {recipe.servings > 0 ? `Serves ${recipe.servings}` : "—"}
          </span>
        </div>

        {/* Footer: uploader + date */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold flex-shrink-0">
              {recipe.uploadedBy.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-600">{recipe.uploadedBy}</span>
          </div>
          <span className="text-xs text-gray-400">{formatDate(recipe.uploadedAt)}</span>
        </div>
      </div>

      {/* Hover view indicator */}
      <div className="px-5 pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <span
          className="text-xs font-bold"
          style={{ color: category?.accentColor ?? "#E8608A" }}
        >
          View recipe →
        </span>
      </div>
    </button>
  );
}
