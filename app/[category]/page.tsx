"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { getCategoryById, getSubcategoryName } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import RecipeCardPreview from "@/components/RecipeCardPreview";
import RecipeViewModal from "@/components/RecipeViewModal";

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoString));
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const category = getCategoryById(categoryId);

  const { openAddModal } = useModal();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    if (!category) return;
    fetch(`/api/recipes?category=${categoryId}`)
      .then((r) => r.json())
      .then(setRecipes)
      .catch(console.error);
  }, [categoryId, category]);

  if (!category) {
    notFound();
    return null;
  }

  // ── Dashboard stats ──────────────────────────────────────────────────────────
  const mostRecentRecipe = recipes[0];
  const subcategoryCounts = category.subcategories.map((sub) => ({
    ...sub,
    count: recipes.filter((r) => r.subcategory === sub.id).length,
  }));
  const largestSub = subcategoryCounts.reduce(
    (best, cur) => (cur.count > best.count ? cur : best),
    subcategoryCounts[0] ?? { name: "—", count: 0 }
  );
  const contributors = new Set(recipes.map((r) => r.uploadedBy)).size;

  // ── Filtered recipes ─────────────────────────────────────────────────────────
  const authorList = [...new Set(recipes.map((r) => r.uploadedBy))].sort();

  const visibleRecipes = recipes.filter((r) => {
    const subMatch = activeTab === "all" || r.subcategory === activeTab;
    const authorMatch = !activeAuthor || r.uploadedBy === activeAuthor;
    return subMatch && authorMatch;
  });

  const tabs = [
    { id: "all", label: `All (${recipes.length})` },
    ...category.subcategories
      .map((s) => ({
        id: s.id,
        label: `${s.name} (${recipes.filter((r) => r.subcategory === s.id).length})`,
      }))
      .filter((t) => recipes.some((r) => r.subcategory === t.id)),
  ];

  return (
    <>
      {/* Hero header */}
      <div className="bg-gradient-to-br from-white via-sky-50 to-blue-50 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-recipe-navy font-medium">Home</Link>
            <span>›</span>
            <span className="font-semibold text-recipe-navy">{category.name}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="text-5xl sm:text-6xl">{category.emoji}</div>
            <div>
              <h1 className="font-playfair font-bold text-recipe-navy leading-tight"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                {category.name}
              </h1>
              <p className="text-gray-600 mt-1 text-base sm:text-lg">{category.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="bg-recipe-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total recipes */}
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                Recipes
              </p>
              <p
                className="font-playfair font-bold text-3xl"
                style={{ color: category.accentColor }}
              >
                {recipes.length}
              </p>
              <p className="text-white/60 text-xs mt-0.5">in {category.name}</p>
            </div>

            {/* Most popular subcategory */}
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                Most Recipes In
              </p>
              <p className="font-bold text-white text-base leading-tight">
                {largestSub.count > 0 ? largestSub.name : "—"}
              </p>
              {largestSub.count > 0 && (
                <p className="text-white/60 text-xs mt-0.5">{largestSub.count} recipes</p>
              )}
            </div>

            {/* Most recent */}
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                Latest Addition
              </p>
              {mostRecentRecipe ? (
                <>
                  <p className="font-bold text-white text-sm leading-tight line-clamp-1">
                    {mostRecentRecipe.title}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">
                    {formatDate(mostRecentRecipe.uploadedAt)}
                  </p>
                </>
              ) : (
                <p className="text-white/40 text-sm">None yet</p>
              )}
            </div>

            {/* Contributors */}
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                Contributors
              </p>
              <p
                className="font-playfair font-bold text-3xl"
                style={{ color: category.accentColor }}
              >
                {contributors}
              </p>
              <p className="text-white/60 text-xs mt-0.5">family member{contributors !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Subcategory tabs */}
        {recipes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
                style={activeTab === tab.id ? { backgroundColor: category.accentColor } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Author filter */}
        {authorList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
            <span className="text-xs font-semibold text-gray-400 flex-shrink-0">By:</span>
            <button
              onClick={() => setActiveAuthor(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !activeAuthor
                  ? "bg-recipe-navy text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              Everyone
            </button>
            {authorList.map((author) => (
              <button
                key={author}
                onClick={() => setActiveAuthor(activeAuthor === author ? null : author)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeAuthor === author
                    ? "bg-recipe-navy text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {author}
              </button>
            ))}
          </div>
        )}

        {/* Recipe grid */}
        {visibleRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleRecipes.map((recipe) => (
              <RecipeCardPreview
                key={recipe.id}
                recipe={recipe}
                onClick={setViewRecipe}
              />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          /* Empty category */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">{category.emoji}</div>
            <h3 className="font-playfair font-bold text-recipe-navy text-2xl mb-2">
              No {category.name.toLowerCase()} recipes yet!
            </h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">
              Be the first to share a {category.name.toLowerCase()} recipe with the family.
            </p>
            <button
              onClick={() => openAddModal(categoryId)}
              className="bg-recipe-pink text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 shadow-md"
              style={{ backgroundColor: category.accentColor }}
            >
              + Add First {category.name} Recipe
            </button>
          </div>
        ) : (
          /* Empty subcategory */
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">No recipes in this subcategory yet.</p>
          </div>
        )}
      </div>

      {/* Floating plus button */}
      <button
        onClick={() => openAddModal(categoryId)}
        title={`Add a ${category.name} recipe`}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center text-2xl font-light"
        style={{ backgroundColor: category.accentColor }}
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
