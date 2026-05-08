"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/lib/types";
import { useModal } from "@/context/ModalContext";
import RecipeCardPreview from "@/components/RecipeCardPreview";
import RecipeViewModal from "@/components/RecipeViewModal";

export default function FavoritesPage() {
  const { openAddModal } = useModal();
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((all: Recipe[]) => {
        setFavoriteRecipes(all.filter((r) => ids.includes(r.id)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="pt-32 text-center text-gray-400">Loading…</div>;
  }

  return (
    <>
      <div className="bg-gradient-to-br from-white via-sky-50 to-blue-50 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="font-playfair font-bold text-recipe-navy text-3xl sm:text-4xl">
            My Favorites
          </h1>
          <p className="text-gray-500 mt-2">Recipes you&apos;ve starred</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {favoriteRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoriteRecipes.map((recipe) => (
              <RecipeCardPreview key={recipe.id} recipe={recipe} onClick={setViewRecipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 text-gray-300">★</div>
            <h3 className="font-playfair font-bold text-recipe-navy text-2xl mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-500 mb-6">
              Tap the star on any recipe to save it here for easy access.
            </p>
            <button
              onClick={() => openAddModal()}
              className="bg-recipe-pink text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 shadow-md"
            >
              Browse Recipes
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => openAddModal()}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-recipe-pink text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center text-2xl font-light lg:hidden"
      >
        +
      </button>

      {viewRecipe && (
        <RecipeViewModal recipe={viewRecipe} onClose={() => setViewRecipe(null)} />
      )}
    </>
  );
}
