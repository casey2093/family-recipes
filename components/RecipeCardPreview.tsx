"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { getCategoryById, getSubcategoryName } from "@/lib/categories";
import { useAuthors } from "@/context/AuthorsContext";
import { useAuth } from "@/context/AuthContext";

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
  const authorsMap = useAuthors();
  const authorData = authorsMap[recipe.uploadedBy.toLowerCase()];
  const { user, openAuthModal } = useAuth();
  const subcategoryName = getSubcategoryName(recipe.category, recipe.subcategory);
  const totalTime = recipe.prepTime + recipe.cookTime;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [displaySaves, setDisplaySaves] = useState(recipe.saves ?? 0);
  const [displayCompletions, setDisplayCompletions] = useState(recipe.completions ?? 0);

  useEffect(() => {
    const favIds: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    setIsFavorite(favIds.includes(recipe.id));
    const doneIds: string[] = JSON.parse(localStorage.getItem("wfk_completed") ?? "[]");
    setIsCompleted(doneIds.includes(recipe.id));
  }, [recipe.id]);

  // Keep display counts in sync if parent re-fetches recipes with updated stats
  useEffect(() => { setDisplaySaves(recipe.saves ?? 0); }, [recipe.saves]);
  useEffect(() => { setDisplayCompletions(recipe.completions ?? 0); }, [recipe.completions]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { openAuthModal(); return; }
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    const wasFav = ids.includes(recipe.id);
    const newIds = wasFav ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id];
    localStorage.setItem("wfk_favorites", JSON.stringify(newIds));
    setIsFavorite(!wasFav);
    setDisplaySaves((prev) => (wasFav ? Math.max(0, prev - 1) : prev + 1));
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: recipe.id, action: wasFav ? "unsave" : "save" }),
    }).catch(console.error);
  };

  const toggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { openAuthModal(); return; }
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_completed") ?? "[]");
    const wasDone = ids.includes(recipe.id);
    const newIds = wasDone ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id];
    localStorage.setItem("wfk_completed", JSON.stringify(newIds));
    setIsCompleted(!wasDone);
    setDisplayCompletions((prev) => (wasDone ? Math.max(0, prev - 1) : prev + 1));
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: recipe.id, action: wasDone ? "uncomplete" : "complete" }),
    }).catch(console.error);
  };

  const commentCount = recipe.comments ?? 0;

  return (
    <div className="relative group hover:-translate-y-1 transition-all duration-200">
      <button
        onClick={() => onClick(recipe)}
        className="w-full text-left bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden border border-gray-100"
      >
        {/* Dish image */}
        {recipe.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-40 object-cover"
          />
        )}

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

          {/* Time + servings row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
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

          {/* Popularity row */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1" title="Saves">
              <span style={{ color: displaySaves > 0 ? "#E8608A" : undefined }}>★</span>
              {displaySaves}
            </span>
            <span className="flex items-center gap-1" title="Comments">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount}
            </span>
            <span className="flex items-center gap-1" title="Made it">
              <span style={{ color: displayCompletions > 0 ? "#1B3A5C" : undefined }}>✓</span>
              {displayCompletions}
            </span>
          </div>

          {/* Footer: uploader + date */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <Link
              href={`/author/${encodeURIComponent(recipe.uploadedBy)}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 hover:opacity-80"
            >
              {authorData?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={authorData.imageUrl}
                  alt={recipe.uploadedBy}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold flex-shrink-0">
                  {recipe.uploadedBy.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-600">{recipe.uploadedBy}</span>
            </Link>
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

      {/* Completed + Star buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          onClick={toggleCompleted}
          aria-label={isCompleted ? "Remove from completed" : "Mark as made"}
          title={isCompleted ? "Remove from Completed Dishes" : "Mark as made"}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm text-sm font-bold transition-all hover:scale-110"
          style={{ color: isCompleted ? "#1B3A5C" : "#d1d5db" }}
        >
          ✓
        </button>
        <button
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm text-lg transition-all hover:scale-110"
          style={{ color: isFavorite ? "#E8608A" : "#d1d5db" }}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}
