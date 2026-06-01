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

  const categoryButtons = (
    <>
      <button
        onClick={() => openAddModal()}
        className="inline-flex items-center justify-center gap-2 bg-recipe-pink text-white px-7 py-3 rounded-full font-bold text-sm sm:text-base hover:bg-opacity-90 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
      >
        + Share Your Recipe
      </button>
      <a
        href="#categories"
        className="inline-flex items-center justify-center gap-2 bg-white/70 backdrop-blur-sm text-recipe-navy px-7 py-3 rounded-full font-bold text-sm sm:text-base hover:bg-white/90 border border-recipe-navy/15 shadow-sm transition-all w-full sm:w-auto"
      >
        Browse Recipes ↓
      </a>
    </>
  );

  return (
    <>
      {/* ── Mobile hero (normal flow, full image, no cropping) ── */}
      <div className="sm:hidden">
        {/* Sky-blue text area */}
        <div
          className="relative z-10 px-6 pt-8 pb-5 text-center"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #f0f9ff 45%, #eff6ff 100%)",
          }}
        >
          <h1
            className="font-playfair font-bold text-recipe-navy leading-tight mb-3"
            style={{ fontSize: "clamp(2.2rem, 10vw, 3rem)" }}
          >
            Ware Family<br />
            <span className="text-recipe-pink">Kitchen</span>
          </h1>
          <p className="text-gray-600 text-base max-w-xs mx-auto mb-6 leading-relaxed">
            The best recipes from every corner of the family&nbsp;—&nbsp;lovingly collected right here.
          </p>
          <div className="flex flex-col gap-3 items-center">
            {categoryButtons}
          </div>

        </div>

        {/* Photo */}
        <div className="relative" style={{ marginTop: "-2rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/family-hero.jpg"
            alt="The Ware Family"
            className="w-full block"
          />
          {/* Gradient: top:-2.5rem starts it above the photo (hidden behind text section).
              The solid #eff6ff block covers past the hidden portion so the junction
              pixel is fully opaque — no harsh line. Then a smooth fade into the photo. */}
          <div
            className="absolute inset-x-0 pointer-events-none"
            style={{
              top: "-6rem",
              height: "150px",
              background: "linear-gradient(to bottom, #eff6ff 0%, #eff6ff 88%, rgba(239,246,255,0.5) 96%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* ── Desktop hero (sticky, scroll-over effect) ── */}
      <div className="hidden sm:block sm:sticky sm:top-16 sm:overflow-hidden" style={{ height: "calc(100vh - 64px)", zIndex: 0, backgroundColor: "#f0f9ff" }}>
        {/* Photo */}
        <div className="absolute inset-x-0 bottom-0" style={{ top: "26%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/family-hero.jpg"
            alt="The Ware Family"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 8%" }}
          />

          {/* Top fade — sky-blue over tree tops */}
          <div
            className="absolute top-0 inset-x-0 pointer-events-none"
            style={{
              height: "40%",
              background:
                "linear-gradient(to bottom, #f0f9ff 0%, rgba(240,249,255,0.88) 25%, rgba(240,249,255,0.4) 60%, transparent 100%)",
            }}
          />

        </div>

        {/* Sky-blue text panel */}
        <div
          className="absolute inset-x-0 top-0 z-10 flex flex-col items-center justify-start px-6 text-center pt-3"
          style={{
            height: "37%",
            background:
              "linear-gradient(to bottom, #f0f9ff 0%, rgba(240,249,255,0.97) 55%, rgba(240,249,255,0.75) 75%, transparent 100%)",
          }}
        >
          <h1
            className="font-playfair font-bold text-recipe-navy leading-tight mb-2"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)" }}
          >
            Ware Family<br />
            <span className="text-recipe-pink">Kitchen</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto mb-5 leading-relaxed">
            The best recipes from every corner of the family&nbsp;—&nbsp;lovingly collected right here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {categoryButtons}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div id="categories" className="relative scroll-mt-16 bg-recipe-cream" style={{ zIndex: 10 }}>

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
        <section className="px-4 sm:px-6 py-14">
          <div className="max-w-6xl mx-auto">
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
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span style={{ color: cat.accentColor }} className="text-sm font-bold">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
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

      </div>

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
