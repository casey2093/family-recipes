"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import RecipeCardFull from "@/components/RecipeCardFull";
import CommentsSection from "@/components/CommentsSection";

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const highlightComment = searchParams.get("comment") ?? undefined;
  const { openEditModal } = useModal();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/recipes?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((recipes: Recipe[]) => {
        if (recipes.length === 0) { setNotFound(true); }
        else { setRecipe(recipes[0]); }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  // Auto-scroll to comments after recipe loads
  useEffect(() => {
    if (!recipe) return;
    const timeout = setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => clearTimeout(timeout);
  }, [recipe]);

  if (loading) {
    return (
      <div className="pt-32 text-center text-gray-400">
        <div className="text-4xl mb-3 animate-pulse">🍴</div>
        <p>Loading recipe…</p>
      </div>
    );
  }

  if (notFound || !recipe) {
    return (
      <div className="pt-32 text-center text-gray-400 px-6">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="font-playfair font-bold text-recipe-navy text-2xl mb-2">Recipe not found</h2>
        <p className="text-gray-500 mb-6">It may have been deleted.</p>
        <Link href="/" className="bg-recipe-pink text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 shadow-md">
          Back to Home
        </Link>
      </div>
    );
  }

  const category = getCategoryById(recipe.category);
  const isOwner = user?.name.toLowerCase() === recipe.uploadedBy.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb / back nav */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <button
          onClick={() => router.back()}
          className="hover:text-recipe-navy font-medium flex items-center gap-1"
        >
          ← Back
        </button>
        <span>›</span>
        {category && (
          <>
            <Link href={`/${recipe.category}`} className="hover:text-recipe-navy font-medium">
              {category.emoji} {category.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="font-semibold text-recipe-navy truncate max-w-[200px]">{recipe.title}</span>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => openEditModal(recipe)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-recipe-navy px-3 py-1.5 rounded-full border border-gray-200 hover:border-recipe-navy transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Recipe
          </button>
        </div>
      )}

      {/* Recipe card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <RecipeCardFull recipe={recipe} showMeta={true} />
      </div>

      {/* Comments — scrolled to automatically */}
      <div ref={commentsRef}>
        <CommentsSection recipeId={recipe.id} highlightId={highlightComment} />
      </div>
    </div>
  );
}
