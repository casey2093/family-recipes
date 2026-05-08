"use client";

import { useState } from "react";
import { Author } from "@/lib/types";

interface Props {
  value: string;
  onChange: (name: string) => void;
  authors: Author[];
  error?: string;
  className?: string;
}

export default function AuthorInput({ value, onChange, authors, error, className }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = value.trim().length > 0
    ? authors.filter((a) => a.name.toLowerCase().includes(value.toLowerCase()))
    : [];

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder="e.g. Aunt Carol"
        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-recipe-navy transition-colors ${
          error ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
        } ${className ?? ""}`}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
          {suggestions.map((author) => (
            <button
              key={author.id}
              type="button"
              onMouseDown={() => {
                onChange(author.name);
                setShowSuggestions(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-recipe-cream text-left"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {author.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.imageUrl} alt={author.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold">
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-recipe-navy">{author.name}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
