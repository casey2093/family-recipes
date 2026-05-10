"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Author, Recipe } from "@/lib/types";
import AuthorAvatar from "@/components/AuthorAvatar";

interface DisplayAuthor {
  name: string;
  imageUrl?: string;
  recipeCount: number;
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<DisplayAuthor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/authors").then((r) => r.json()),
      fetch("/api/recipes").then((r) => r.json()),
    ])
      .then(([authorData, recipeData]: [Author[], Recipe[]]) => {
        const recipeCounts: Record<string, number> = {};
        recipeData.forEach((r) => {
          recipeCounts[r.uploadedBy] = (recipeCounts[r.uploadedBy] ?? 0) + 1;
        });

        const authorMap: Record<string, Author> = {};
        authorData.forEach((a) => { authorMap[a.name.toLowerCase()] = a; });

        // Build display list from all contributors, merge with author profile data
        const names = Array.from(new Set(recipeData.map((r) => r.uploadedBy)));
        const display: DisplayAuthor[] = names.map((name) => {
          const profile = authorMap[name.toLowerCase()];
          return {
            name: profile?.name ?? name,
            imageUrl: profile?.imageUrl,
            recipeCount: recipeCounts[name] ?? 0,
          };
        });

        // Also include authors with profiles who haven't posted yet
        authorData.forEach((a) => {
          const exists = display.some((d) => d.name.toLowerCase() === a.name.toLowerCase());
          if (!exists) {
            display.push({ name: a.name, imageUrl: a.imageUrl, recipeCount: 0 });
          }
        });

        display.sort((a, b) => b.recipeCount - a.recipeCount || a.name.localeCompare(b.name));
        setAuthors(display);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = authors.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="pt-32 text-center text-gray-400">Loading…</div>;

  return (
    <>
      <div className="bg-gradient-to-br from-white via-sky-50 to-blue-50 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="font-playfair font-bold text-recipe-navy text-3xl sm:text-4xl">
            Authors
          </h1>
          <p className="text-gray-500 mt-2">Everyone who&apos;s shared a recipe</p>
        </div>
      </div>

      {authors.length > 0 && (
        <div className="bg-recipe-navy text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center gap-2 text-sm">
            <span className="font-bold text-blue-200 text-xl">{authors.length}</span>
            <span className="text-white/80">{authors.length === 1 ? "contributor" : "contributors"}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search authors…"
            className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-recipe-navy"
          />
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((author) => (
              <Link
                key={author.name}
                href={`/author/${encodeURIComponent(author.name)}`}
                className="group flex flex-col items-center text-center p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="border-2 border-white shadow-md rounded-full mb-3">
                  <AuthorAvatar name={author.name} size="2xl" />
                </div>
                <p className="font-bold text-recipe-navy text-sm group-hover:text-recipe-pink transition-colors leading-tight mb-1">
                  {author.name}
                </p>
                <p className="text-xs text-gray-400">
                  {author.recipeCount} {author.recipeCount === 1 ? "recipe" : "recipes"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-semibold">No authors found</p>
            {search && (
              <button onClick={() => setSearch("")} className="mt-2 text-sm text-recipe-pink hover:underline">
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
