"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Recipe, Author } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import { uploadImage } from "@/lib/clientUpload";
import RecipeCardPreview from "@/components/RecipeCardPreview";
import RecipeViewModal from "@/components/RecipeViewModal";

export default function AuthorPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const { openAddModal } = useModal();
  const { user } = useAuth();
  const isOwnProfile = user?.name.toLowerCase() === name.toLowerCase();

  const [author, setAuthor] = useState<Author | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

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

  useEffect(() => { setSelectedSubcategory(""); }, [selectedCategory]);

  const selectedCategoryData = CATEGORIES.find((c) => c.id === selectedCategory);

  const filtered = recipes.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (selectedSubcategory && r.subcategory !== selectedSubcategory) return false;
    return true;
  });

  const startEditing = () => {
    setEditName(author?.name ?? name);
    setEditImageUrl(author?.imageUrl ?? "");
    setIsEditing(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await uploadImage(file);
      if (result.error) { alert(result.error); return; }
      if (result.url) setEditImageUrl(result.url);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          imageUrl: editImageUrl || undefined,
          originalName: author?.name ?? name,
        }),
      });
      if (!res.ok) { alert("Failed to save profile. Please try again."); return; }
      setAuthor((prev) => ({
        ...(prev ?? { id: "", createdAt: new Date().toISOString() }),
        name: editName.trim(),
        imageUrl: editImageUrl || undefined,
      }));
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="pt-32 text-center text-gray-400">Loading…</div>;

  return (
    <>
      <div className="bg-gradient-to-br from-white via-sky-50 to-blue-50 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-recipe-navy font-medium">Home</Link>
            <span>›</span>
            <Link href="/authors" className="hover:text-recipe-navy font-medium">Authors</Link>
            <span>›</span>
            <span className="font-semibold text-recipe-navy">{name}</span>
          </nav>

          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                {(isEditing ? editImageUrl : author?.imageUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={isEditing ? editImageUrl : author?.imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-3xl font-bold font-playfair">
                    {(isEditing ? editName : name).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-recipe-pink text-white rounded-full flex items-center justify-center shadow-md hover:opacity-90 text-xs"
                    title="Change photo"
                  >
                    {uploadingPhoto ? "…" : "📷"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="font-playfair font-bold text-recipe-navy text-2xl border-b-2 border-recipe-pink bg-transparent focus:outline-none w-full"
                    placeholder="Your name"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={saveProfile}
                      disabled={saving || !editName.trim()}
                      className="bg-recipe-pink text-white px-4 py-1.5 rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-gray-500 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="font-playfair font-bold text-recipe-navy text-3xl sm:text-4xl">{author?.name ?? name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-gray-500">
                      {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} shared
                    </p>
                    {isOwnProfile && (
                      <button
                        onClick={startEditing}
                        className="text-xs text-recipe-pink font-semibold hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                    )}
                  </div>
                </>
              )}
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {recipes.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes…"
              className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-recipe-navy"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy bg-white"
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
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy bg-white"
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
        ) : recipes.length > 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-semibold">No matches for your filters</p>
            <button
              onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedSubcategory(""); }}
              className="mt-3 text-sm text-recipe-pink hover:underline"
            >
              Clear filters
            </button>
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
        <RecipeViewModal
          recipe={viewRecipe}
          onClose={() => setViewRecipe(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
