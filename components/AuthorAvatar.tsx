"use client";

import { useState, useEffect } from "react";

interface AuthorData {
  name: string;
  imageUrl?: string;
}

// Call this after a profile save (kept for compatibility, no-op now)
export function invalidateAuthorsCache() {}

interface Props {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  hoverOpacity?: boolean;
}

const sizes: Record<string, { img: string; div: string; text: string }> = {
  xs:  { img: "w-5 h-5",  div: "w-5 h-5",  text: "text-[10px]" },
  sm:  { img: "w-6 h-6",  div: "w-6 h-6",  text: "text-xs" },
  md:  { img: "w-7 h-7",  div: "w-7 h-7",  text: "text-xs" },
  lg:  { img: "w-8 h-8",  div: "w-8 h-8",  text: "text-sm" },
  xl:  { img: "w-9 h-9",  div: "w-9 h-9",  text: "text-sm" },
  "2xl": { img: "w-16 h-16", div: "w-16 h-16", text: "text-2xl" },
};

export default function AuthorAvatar({ name, size = "md", className = "", hoverOpacity = false }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/authors")
      .then((r) => r.json())
      .then((authors: AuthorData[]) => {
        if (cancelled) return;
        const found = authors.find((a) => a.name.toLowerCase() === name.toLowerCase());
        setImageUrl(found?.imageUrl ?? null);
      })
      .catch(() => {});
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
