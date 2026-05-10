"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const pathname = usePathname();
  const { openAddModal } = useModal();
  const { user, loading: authLoading, openAuthModal, logout } = useAuth();
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setCategoriesOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const navLinkClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
      active
        ? "bg-recipe-navy text-white"
        : "text-gray-600 hover:bg-recipe-cream hover:text-recipe-navy"
    }`;

  return (
    <>
      {/* SVG filter: converts black lines → navy, white → transparent */}
      <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="wfk-navy-filter" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.106
                      0 0 0 0 0.227
                      0 0 0 0 0.361
                      -0.333 -0.333 -0.333 0 1"
            />
          </filter>
        </defs>
      </svg>

      <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-end gap-2.5 flex-shrink-0 group h-16 outline-none focus:outline-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/family-portrait.png"
              alt=""
              className="block w-auto select-none"
              style={{ filter: "url(#wfk-navy-filter)", height: "58px", clipPath: "inset(0 10% 0 0)" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <span className="font-playfair font-bold text-recipe-navy text-lg leading-tight mb-2">
              Ware Family<br />
              <span className="text-recipe-pink"> Kitchen</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            <Link href="/" className={navLinkClass(pathname === "/")}>
              Home
            </Link>

            {user && (
              <Link
                href={`/author/${encodeURIComponent(user.name)}`}
                className={navLinkClass(pathname === `/author/${encodeURIComponent(user.name)}`)}
              >
                My Recipes
              </Link>
            )}

            <Link href="/favorites" className={navLinkClass(pathname === "/favorites")}>
              My Favorites
            </Link>

            <Link href="/completed" className={navLinkClass(pathname === "/completed")}>
              Completed Dishes
            </Link>

            {/* Categories dropdown */}
            <div ref={categoriesRef} className="relative">
              <button
                onClick={() => setCategoriesOpen((o) => !o)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  categoriesOpen || CATEGORIES.some((c) => pathname === `/${c.id}`)
                    ? "bg-recipe-navy text-white"
                    : "text-gray-600 hover:bg-recipe-cream hover:text-recipe-navy"
                }`}
              >
                Categories
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {categoriesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[640px] bg-white rounded-2xl shadow-xl border border-gray-100 p-5 grid grid-cols-4 gap-x-5 gap-y-4 z-50">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <Link
                        href={`/${cat.id}`}
                        className="block font-bold text-recipe-navy text-xs mb-1.5 hover:text-recipe-pink transition-colors"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        {cat.name}
                      </Link>
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/${cat.id}`}
                          className="block text-xs text-gray-500 hover:text-recipe-pink py-0.5 transition-colors"
                          onClick={() => setCategoriesOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/authors" className={navLinkClass(pathname === "/authors")}>
              Authors
            </Link>
          </nav>

          {/* Right side: Add Recipe + Auth + hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => openAddModal()}
              className="hidden sm:flex items-center gap-1.5 bg-recipe-pink text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-opacity-90 shadow-sm hover:shadow-md"
            >
              <span className="text-lg leading-none">+</span> Add Recipe
            </button>

            {/* Auth area */}
            {!authLoading && (
              user ? (
                <div className="hidden lg:flex items-center gap-2">
                  <Link
                    href={`/author/${encodeURIComponent(user.name)}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-recipe-navy hover:text-recipe-pink transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1 rounded-full hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="hidden lg:flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-recipe-navy px-3 py-1.5 rounded-full hover:bg-recipe-cream transition-all"
                >
                  Sign In
                </button>
              )
            )}

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
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-playfair font-bold text-recipe-navy text-lg">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile user info */}
            {user && (
              <div className="flex items-center gap-3 px-5 py-3 bg-recipe-cream border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-recipe-navy text-sm truncate">{user.name}</p>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="text-xs text-gray-400 hover:text-recipe-pink"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-xl font-semibold mb-1 ${pathname === "/" ? "bg-recipe-navy text-white" : "text-recipe-navy hover:bg-recipe-cream"}`}
              >
                Home
              </Link>

              {user && (
                <Link
                  href={`/author/${encodeURIComponent(user.name)}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-xl font-semibold mb-1 ${pathname === `/author/${encodeURIComponent(user.name)}` ? "bg-recipe-navy text-white" : "text-recipe-navy hover:bg-recipe-cream"}`}
                >
                  My Recipes
                </Link>
              )}

              <Link
                href="/favorites"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-xl font-semibold mb-1 ${pathname === "/favorites" ? "bg-recipe-navy text-white" : "text-recipe-navy hover:bg-recipe-cream"}`}
              >
                My Favorites
              </Link>

              <Link
                href="/completed"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-xl font-semibold mb-1 ${pathname === "/completed" ? "bg-recipe-navy text-white" : "text-recipe-navy hover:bg-recipe-cream"}`}
              >
                Completed Dishes
              </Link>

              <Link
                href="/authors"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-xl font-semibold mb-1 ${pathname === "/authors" ? "bg-recipe-navy text-white" : "text-recipe-navy hover:bg-recipe-cream"}`}
              >
                Authors
              </Link>

              {/* Categories accordion */}
              <button
                onClick={() => setMobileCategoriesOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-recipe-navy hover:bg-recipe-cream mb-1"
              >
                <span>Categories</span>
                <svg
                  className={`w-4 h-4 transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileCategoriesOpen && (
                <div className="ml-3 mb-1 space-y-0.5">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/${cat.id}`}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${
                        pathname === `/${cat.id}` ? "bg-recipe-navy text-white" : "text-gray-700 hover:bg-recipe-cream hover:text-recipe-navy"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </nav>

            <div className="p-4 border-t border-gray-100 space-y-2">
              {!user && (
                <button
                  onClick={() => { setMobileOpen(false); openAuthModal(); }}
                  className="w-full border-2 border-recipe-navy text-recipe-navy py-3 rounded-xl font-bold text-sm hover:bg-recipe-cream"
                >
                  Sign In / Create Account
                </button>
              )}
              <button
                onClick={() => { setMobileOpen(false); openAddModal(); }}
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
