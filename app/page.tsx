"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import RecipeCardPreview from "@/components/RecipeCardPreview";
import RecipeViewModal from "@/components/RecipeViewModal";

export default function HomePage() {
  const { openAddModal } = useModal();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then(setRecipes)
      .catch(console.error);
  }, []);

  const countByCategory = (catId: string) =>
    recipes.filter((r) => r.category === catId).length;

  const recent = recipes.slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-50 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h1 className="font-playfair font-bold text-recipe-navy leading-tight mb-4"
            style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)" }}
          >
            Ware Family<br />
            <span className="text-recipe-pink">Kitchen</span>
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl max-w-xl mx-auto mb-8 leading-relaxed">
            The best recipes from every corner of the family — lovingly collected right here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-2 bg-recipe-pink text-white px-7 py-3.5 rounded-full font-bold text-base hover:bg-opacity-90 shadow-md hover:shadow-lg transition-all"
            >
              + Share Your Recipe
            </button>
            <a
              href="#categories"
              className="inline-flex items-center gap-2 bg-white text-recipe-navy px-7 py-3.5 rounded-full font-bold text-base hover:bg-recipe-cream border border-recipe-navy/10 shadow-sm"
            >
              Browse Recipes ↓
            </a>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-4 right-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-200/40 rounded-full blur-2xl -z-0" />
      </section>

      {/* Stats banner */}
      <div className="bg-recipe-navy text-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-200 text-xl">{recipes.length}</span>
            <span className="text-white/80">Recipes shared</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-200 text-xl">
              {new Set(recipes.map((r) => r.uploadedBy)).size}
            </span>
            <span className="text-white/80">Family contributors</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-200 text-xl">{CATEGORIES.length}</span>
            <span className="text-white/80">Categories to explore</span>
          </div>
        </div>
      </div>

      {/* Categories grid */}
      <section id="categories" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="font-playfair font-bold text-recipe-navy text-3xl sm:text-4xl mb-2">
            Browse by Category
          </h2>
          <p className="text-gray-500">What are you in the mood for?</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const count = countByCategory(cat.id);
            return (
              <Link
                key={cat.id}
                href={`/${cat.id}`}
                className={`group relative bg-gradient-to-br ${cat.gradient} rounded-2xl p-5 text-center shadow-sm border border-gray-200 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden`}
              >
                <h3 className="font-playfair font-bold text-recipe-navy text-base sm:text-lg mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{cat.description}</p>
                <span
                  className="inline-block text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${cat.accentColor}20`,
                    color: cat.accentColor,
                  }}
                >
                  {count === 0 ? "Be the first!" : `${count} ${count === 1 ? "recipe" : "recipes"}`}
                </span>
                {/* Hover arrow */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span style={{ color: cat.accentColor }} className="text-sm font-bold">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recently added */}
      {recent.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-playfair font-bold text-recipe-navy text-3xl sm:text-4xl">
                Recently Added
              </h2>
              <p className="text-gray-500 mt-1">Fresh from the family kitchen</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent.map((recipe) => (
              <RecipeCardPreview
                key={recipe.id}
                recipe={recipe}
                onClick={setViewRecipe}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {recipes.length === 0 && (
        <div className="max-w-md mx-auto px-6 pb-24 text-center">
          <div className="text-6xl mb-4">🥘</div>
          <h3 className="font-playfair font-bold text-recipe-navy text-2xl mb-2">
            No recipes yet!
          </h3>
          <p className="text-gray-500 mb-6">
            Be the first to share a family recipe. It only takes a minute!
          </p>
          <button
            onClick={() => openAddModal()}
            className="bg-recipe-pink text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 shadow-md"
          >
            + Add the First Recipe
          </button>
        </div>
      )}

      {/* Floating plus button */}
      <button
        onClick={() => openAddModal()}
        title="Add a recipe"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-recipe-pink text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center text-2xl font-light lg:hidden"
      >
        +
      </button>

      {/* Recipe view modal */}
      {viewRecipe && (
        <RecipeViewModal recipe={viewRecipe} onClose={() => setViewRecipe(null)} />
      )}
    </>
  );
}
