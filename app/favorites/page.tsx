"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { CATEGORIES, getCategoryById } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import RecipeCardPreview from "@/components/RecipeCardPreview";
import RecipeViewModal from "@/components/RecipeViewModal";

function FavoriteDashboard({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) return null;

  const authorCounts: Record<string, number> = {};
  recipes.forEach((r) => { authorCounts[r.uploadedBy] = (authorCounts[r.uploadedBy] ?? 0) + 1; });
  const topAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0];

  const categoryCounts: Record<string, number> = {};
  recipes.forEach((r) => { categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1; });
  const topCategoryEntry = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  const topCategoryInfo = getCategoryById(topCategoryEntry?.[0]);

  return (
    <div className="bg-recipe-navy text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-recipe-gold text-xl">{recipes.length}</span>
          <span className="text-white/80">{recipes.length === 1 ? "Favorite" : "Favorites"}</span>
        </div>
        <div className="w-px h-4 bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="font-bold text-recipe-gold text-xl">{Object.keys(categoryCounts).length}</span>
          <span className="text-white/80">{Object.keys(categoryCounts).length === 1 ? "Category" : "Categories"}</span>
        </div>
        {topAuthor && (
          <>
            <div className="w-px h-4 bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-white/80">Favorite chef:</span>
              <span className="font-bold text-blue-200">{topAuthor[0]}</span>
            </div>
          </>
        )}
        {topCategoryInfo && (
          <>
            <div className="w-px h-4 bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-white/80">Top category:</span>
              <span className="font-bold text-blue-200">{topCategoryInfo.emoji} {topCategoryInfo.name}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const { openAddModal } = useModal();
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    if (ids.length === 0) { setLoading(false); return; }
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((all: Recipe[]) => {
        setFavoriteRecipes(all.filter((r) => ids.includes(r.id)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { setSelectedSubcategory(""); }, [selectedCategory]);

  const selectedCategoryData = CATEGORIES.find((c) => c.id === selectedCategory);

  const filtered = favoriteRecipes.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (selectedSubcategory && r.subcategory !== selectedSubcategory) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    setFavoriteRecipes((prev) => prev.filter((r) => r.id !== id));
    const ids: string[] = JSON.parse(localStorage.getItem("wfk_favorites") ?? "[]");
    localStorage.setItem("wfk_favorites", JSON.stringify(ids.filter((i) => i !== id)));
  };

  if (loading) return <div className="pt-32 text-center text-gray-400">Loading…</div>;

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

      <FavoriteDashboard recipes={favoriteRecipes} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {favoriteRecipes.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search favorites…"
              className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-recipe-navy"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy bg-white cursor-pointer"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedCategoryData && (
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy bg-white cursor-pointer"
              >
                <option value="">All subcategories</option>
                {selectedCategoryData.subcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((recipe) => (
              <RecipeCardPreview key={recipe.id} recipe={recipe} onClick={setViewRecipe} />
            ))}
          </div>
        ) : favoriteRecipes.length > 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-semibold">No matches for your filters</p>
            <button onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedSubcategory(""); }} className="mt-3 text-sm text-recipe-pink hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 text-gray-300">★</div>
            <h3 className="font-playfair font-bold text-recipe-navy text-2xl mb-2">No favorites yet</h3>
            <p className="text-gray-500 mb-6">Tap the star on any recipe to save it here.</p>
            <Link href="/#categories" className="inline-block bg-recipe-pink text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 shadow-md">
              Browse Recipes
            </Link>
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
        <RecipeViewModal recipe={viewRecipe} onClose={() => setViewRecipe(null)} onDelete={handleDelete} />
      )}
    </>
  );
}
