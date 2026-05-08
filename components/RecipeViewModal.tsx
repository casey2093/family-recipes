"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import RecipeCardFull from "./RecipeCardFull";
import CommentsSection from "./CommentsSection";

interface Props {
  recipe: Recipe;
  onClose: () => void;
}

export default function RecipeViewModal({ recipe, onClose }: Props) {
  const category = getCategoryById(recipe.category);
  const { openEditModal } = useModal();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    setIsFavorite(ids.includes(recipe.id));
  }, [recipe.id]);

  const toggleFavorite = () => {
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    const newIds = isFavorite ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id];
    localStorage.setItem("wfk_favorites", JSON.stringify(newIds));
    setIsFavorite(!isFavorite);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-recipe-cream w-full sm:max-w-3xl max-h-[96vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header bar */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b border-gray-200/60 flex-shrink-0"
          style={{ backgroundColor: `${category?.accentColor ?? "#E8608A"}12` }}
        >
          <span className="text-xl flex-shrink-0">{category?.emoji ?? "🍴"}</span>
          <h2 className="font-playfair font-bold text-recipe-navy text-base sm:text-lg leading-tight flex-1 min-w-0 truncate">
            {recipe.title}
          </h2>
          <button
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors text-lg"
            style={{ color: isFavorite ? "#E8608A" : "#9ca3af" }}
          >
            {isFavorite ? "★" : "☆"}
          </button>
          <button
            onClick={() => { openEditModal(recipe); onClose(); }}
            aria-label="Edit recipe"
            title="Edit recipe"
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-black/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-black/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable recipe content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <RecipeCardFull recipe={recipe} showMeta={true} />
          <CommentsSection recipeId={recipe.id} />
        </div>
      </div>
    </div>
  );
}
