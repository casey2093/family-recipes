"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import { useAuthors } from "@/context/AuthorsContext";
import { Notification } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newRecipesCount, setNewRecipesCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { openAddModal } = useModal();
  const { user, loading: authLoading, openAuthModal, logout } = useAuth();
  const authorsMap = useAuthors();
  const categoriesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setNewRecipesCount(data.newRecipesCount ?? 0);
      setUnreadCount(data.unreadCount ?? 0);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleBellClick = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setProfileOpen(false);
    if (opening && unreadCount > 0) {
      // Mark all as read
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_read" }),
        });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setNewRecipesCount(0);
        setUnreadCount(0);
      } catch { /* silent */ }
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setCategoriesOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
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

          {/* Right side: Add Recipe + Bell + Auth + hamburger */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => openAddModal()}
              className="hidden sm:flex items-center gap-1.5 bg-recipe-pink text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-opacity-90 shadow-sm hover:shadow-md"
            >
              <span className="text-lg leading-none">+</span> Add Recipe
            </button>

            {/* Auth area */}
            {!authLoading && (
              user ? (
                <>
                {/* Notification bell */}
                <div ref={notifRef} className="relative hidden lg:block">
                  <button
                    onClick={handleBellClick}
                    aria-label="Notifications"
                    className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-recipe-cream transition-all"
                  >
                    {unreadCount > 0 ? (
                      /* Filled navy bell when there are unread */
                      <svg className="w-5 h-5 text-recipe-navy" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                      </svg>
                    ) : (
                      /* Outline bell when no unread */
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    )}
                    {/* Pink badge */}
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-recipe-pink rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-recipe-navy text-sm">Notifications</span>
                        {notifications.length + newRecipesCount === 0 && (
                          <span className="text-xs text-gray-400">All caught up!</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {newRecipesCount > 0 && (
                          <div className="px-4 py-3 bg-sky-50/60">
                            <p className="text-sm font-semibold text-recipe-navy">
                              🍳 {newRecipesCount} new {newRecipesCount === 1 ? "recipe" : "recipes"} added since your last visit
                            </p>
                            <Link
                              href="/#categories"
                              className="text-xs text-recipe-pink hover:underline"
                              onClick={() => setNotifOpen(false)}
                            >
                              Browse them →
                            </Link>
                          </div>
                        )}
                        {notifications.length === 0 && newRecipesCount === 0 && (
                          <div className="px-4 py-8 text-center text-gray-400 text-sm">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            No notifications
                          </div>
                        )}
                        {[...notifications].reverse().map((n) => (
                          <Link
                            key={n.id}
                            href={`/${n.recipeCategory}`}
                            onClick={() => setNotifOpen(false)}
                            className={`block px-4 py-3 hover:bg-recipe-cream transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
                          >
                            <p className="text-xs font-semibold text-recipe-navy leading-snug">
                              {n.type === "comment"
                                ? <><span className="text-recipe-pink">{n.fromUser}</span> commented on your recipe</>
                                : <><span className="text-recipe-pink">{n.fromUser}</span> replied to your comment</>
                              }
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate font-medium">
                              &ldquo;{n.recipeTitle}&rdquo;
                            </p>
                            {n.commentPreview && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">
                                &ldquo;{n.commentPreview}&rdquo;
                              </p>
                            )}
                            <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div ref={profileRef} className="relative hidden lg:block">
                  {/* Profile button */}
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-full hover:bg-recipe-cream px-2 py-1 transition-all"
                  >
                    {authorsMap[user.name.toLowerCase()]?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authorsMap[user.name.toLowerCase()].imageUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-sm font-bold flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-recipe-navy max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${profileOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                      <Link
                        href={`/author/${encodeURIComponent(user.name)}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-recipe-navy hover:bg-recipe-cream transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                      <div className="mx-3 my-1 border-t border-gray-100" />
                      <button
                        onClick={() => { setProfileOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
                </>
              ) : (
                <button
                  onClick={() => openAuthModal()}
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
