"use client";

import { useState, useEffect } from "react";

interface AuthorData {
  name: string;
  imageUrl?: string;
}

// Module-level singleton — one fetch per page load, shared across all avatar instances
let authorsCache: Record<string, AuthorData> | null = null;
let fetchPromise: Promise<void> | null = null;

function ensureAuthors(): Promise<void> {
  if (authorsCache !== null) return Promise.resolve();
  if (!fetchPromise) {
    fetchPromise = fetch("/api/authors", { cache: "no-store" })
      .then((r) => r.json())
      .then((authors: AuthorData[]) => {
        authorsCache = {};
        authors.forEach((a) => {
          authorsCache![a.name.toLowerCase()] = a;
        });
      })
      .catch(() => {
        authorsCache = {};
      });
  }
  return fetchPromise;
}

// Call this after a profile save to force a fresh fetch on next render
export function invalidateAuthorsCache() {
  authorsCache = null;
  fetchPromise = null;
}

interface Props {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  hoverOpacity?: boolean;
}

const sizes: Record<string, { img: string; div: string; text: string }> = {
  xs: { img: "w-5 h-5", div: "w-5 h-5", text: "text-[10px]" },
  sm: { img: "w-6 h-6", div: "w-6 h-6", text: "text-xs" },
  md: { img: "w-7 h-7", div: "w-7 h-7", text: "text-xs" },
  lg: { img: "w-8 h-8", div: "w-8 h-8", text: "text-sm" },
  xl: { img: "w-9 h-9", div: "w-9 h-9", text: "text-sm" },
};

export default function AuthorAvatar({ name, size = "md", className = "", hoverOpacity = false }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    authorsCache?.[name.toLowerCase()]?.imageUrl ?? null
  );

  useEffect(() => {
    let cancelled = false;
    ensureAuthors().then(() => {
      if (!cancelled) setImageUrl(authorsCache?.[name.toLowerCase()]?.imageUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [name]);

  const s = sizes[size] ?? sizes.md;
  const hover = hoverOpacity ? "hover:opacity-80" : "";

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${s.img} rounded-full object-cover flex-shrink-0 ${hover} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${s.div} rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink font-bold flex-shrink-0 ${hover} ${className}`}
    >
      <span className={s.text}>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}
