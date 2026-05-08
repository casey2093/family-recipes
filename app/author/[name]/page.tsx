"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Recipe, Author } from "@/lib/types";
import { useModal } from "@/context/ModalContext";
import RecipeCardPreview from "@/components/RecipeCardPreview";
import RecipeViewModal from "@/components/RecipeViewModal";

export default function AuthorPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const { openAddModal } = useModal();

  const [author, setAuthor] = useState<Author | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/authors").then((r) => r.json()),
      fetch(`/api/recipes?uploadedBy=${encodeURIComponent(name)}`).then((r) => r.json()),
    ])
      .then(([authors, authorRecipes]) => {
        const found = (authors as Author[]).find(
          (a) => a.name.toLowerCase() === name.toLowerCase()
        );
        setAuthor(found ?? null);
        setRecipes(authorRecipes as Recipe[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [name]);

  if (loading) {
    return <div className="pt-32 text-center text-gray-400">Loading…</div>;
  }

  return (
    <>
      <div className="bg-gradient-to-br from-white via-sky-50 to-blue-50 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-recipe-navy font-medium">Home</Link>
            <span>›</span>
            <span className="font-semibold text-recipe-navy">{name}</span>
          </nav>

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-md">
              {author?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.imageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-3xl font-bold font-playfair">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-playfair font-bold text-recipe-navy text-3xl sm:text-4xl">{name}</h1>
              <p className="text-gray-500 mt-1">
                {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} shared
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-recipe-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-200 text-xl">{recipes.length}</span>
            <span className="text-white/80">Recipes shared</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-200 text-xl">
              {new Set(recipes.map((r) => r.category)).size}
            </span>
            <span className="text-white/80">Categories</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((recipe) => (
              <RecipeCardPreview key={recipe.id} recipe={recipe} onClick={setViewRecipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📖</p>
            <p className="font-semibold text-lg">{name} hasn&apos;t shared any recipes yet.</p>
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
