"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import RecipeCardFull from "./RecipeCardFull";
import CommentsSection from "./CommentsSection";

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function RecipeViewModal({ recipe, onClose, onDelete }: Props) {
  const category = getCategoryById(recipe.category);
  const { openEditModal } = useModal();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [myName, setMyName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    setIsFavorite(ids.includes(recipe.id));
    const completed: string[] = JSON.parse(localStorage.getItem("wfk_completed") ?? "[]");
    setIsCompleted(completed.includes(recipe.id));
  }, [recipe.id]);

  // Prefer auth user name; fall back to localStorage
  useEffect(() => {
    setMyName(user?.name ?? localStorage.getItem("wfk_author_name") ?? "");
  }, [user]);

  const toggleFavorite = () => {
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    const newIds = isFavorite ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id];
    localStorage.setItem("wfk_favorites", JSON.stringify(newIds));
    setIsFavorite(!isFavorite);
  };

  const toggleCompleted = () => {
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_completed") ?? "[]");
    const newIds = isCompleted ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id];
    localStorage.setItem("wfk_completed", JSON.stringify(newIds));
    setIsCompleted(!isCompleted);
  };

  const handleDelete = async () => {
    if (deleteConfirmName.trim().toLowerCase() !== recipe.uploadedBy.toLowerCase()) {
      setDeleteError("Name doesn't match. Please type your exact name.");
      return;
    }
    setDeleting(true);
    try {
      await fetch(`/api/recipes?id=${recipe.id}`, { method: "DELETE" });
      onDelete?.(recipe.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const isOwner = myName && recipe.uploadedBy.toLowerCase() === myName.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-recipe-cream w-full sm:max-w-3xl max-h-[96vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div
          className="flex items-center gap-3 px-5 py-3 border-b border-gray-200/60 flex-shrink-0"
          style={{ backgroundColor: `${category?.accentColor ?? "#E8608A"}12` }}
        >
          <span className="text-xl flex-shrink-0">{category?.emoji ?? "🍴"}</span>
          <h2 className="font-playfair font-bold text-recipe-navy text-base sm:text-lg leading-tight flex-1 min-w-0 truncate">
            {recipe.title}
          </h2>

          {/* Mark as completed */}
          <button
            onClick={toggleCompleted}
            aria-label={isCompleted ? "Remove from completed" : "Mark as made"}
            title={isCompleted ? "Remove from Completed Dishes" : "Mark as Made"}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors text-base"
            style={{ color: isCompleted ? "#10B981" : "#9ca3af" }}
          >
            {isCompleted ? "✓" : "✓"}
          </button>

          {/* Favorite */}
          <button
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors text-lg"
            style={{ color: isFavorite ? "#E8608A" : "#9ca3af" }}
          >
            {isFavorite ? "★" : "☆"}
          </button>

          {/* Edit */}
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

          {/* Delete — only shown to owner */}
          {isOwner && (
            <button
              onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmName(""); setDeleteError(""); }}
              aria-label="Delete recipe"
              title="Delete recipe"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Close */}
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

        {/* Delete confirmation banner */}
        {showDeleteConfirm && (
          <div className="flex-shrink-0 px-5 py-4 bg-red-50 border-b border-red-200">
            <p className="text-sm font-semibold text-red-700 mb-2">
              To delete &ldquo;{recipe.title}&rdquo;, type your name to confirm
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => { setDeleteConfirmName(e.target.value); setDeleteError(""); }}
              placeholder={recipe.uploadedBy}
              className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-red-500 bg-white"
            />
            {deleteError && <p className="text-red-600 text-xs mb-2">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <RecipeCardFull recipe={recipe} showMeta={true} />
          <CommentsSection recipeId={recipe.id} />
        </div>
      </div>
    </div>
  );
}
