"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { openAddModal } = useModal();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            <span className="text-2xl">🍳</span>
            <span className="font-playfair font-bold text-recipe-navy text-lg leading-tight">
              Our Family<br className="hidden sm:block" />
              <span className="text-recipe-pink"> Kitchen</span>
            </span>
          </Link>

          {/* Category nav — desktop */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 justify-center">
            {CATEGORIES.map((cat) => {
              const active = pathname === `/${cat.id}`;
              return (
                <Link
                  key={cat.id}
                  href={`/${cat.id}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-recipe-navy text-white"
                      : "text-gray-600 hover:bg-recipe-cream hover:text-recipe-navy"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.name}
                </Link>
              );
            })}
          </nav>

          {/* Add recipe button + hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => openAddModal()}
              className="hidden sm:flex items-center gap-1.5 bg-recipe-pink text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-opacity-90 shadow-sm hover:shadow-md"
            >
              <span className="text-lg leading-none">+</span> Add Recipe
            </button>
            <button
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-recipe-cream"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-playfair font-bold text-recipe-navy text-lg">Categories</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-recipe-navy font-semibold hover:bg-recipe-cream mb-1"
              >
                🏠 Home
              </Link>
              {CATEGORIES.map((cat) => {
                const active = pathname === `/${cat.id}`;
                return (
                  <Link
                    key={cat.id}
                    href={`/${cat.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold mb-1 ${
                      active
                        ? "bg-recipe-navy text-white"
                        : "text-gray-700 hover:bg-recipe-cream hover:text-recipe-navy"
                    }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    {cat.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  openAddModal();
                }}
                className="w-full bg-recipe-pink text-white py-3 rounded-xl font-bold text-sm hover:bg-opacity-90"
              >
                + Add New Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
