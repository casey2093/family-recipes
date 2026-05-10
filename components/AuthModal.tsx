"use client";

import { useState, useEffect } from "react";

interface Props {
  onClose: () => void;
  onSuccess: (name: string) => void;
  message?: string;
}

export default function AuthModal({ onClose, onSuccess, message }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (tab === "register") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      onSuccess(data.name);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (newTab: "login" | "register") => {
    setTab(newTab);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-playfair font-bold text-recipe-navy text-xl">
              {message ? (tab === "login" ? "Sign in to continue" : "Join the kitchen") : (tab === "login" ? "Welcome back!" : "Join the kitchen")}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contextual prompt message */}
          {message && (
            <div className="bg-recipe-cream rounded-xl px-3 py-2.5 mb-4 text-center">
              <p className="text-sm text-recipe-navy font-medium">{message}</p>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            <button
              onClick={() => switchTab("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === "login"
                  ? "bg-white text-recipe-navy shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === "register"
                  ? "bg-white text-recipe-navy shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name field */}
            <div>
              <label className="block text-xs font-bold text-recipe-navy mb-1">
                {tab === "login" ? "Name" : "Your name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder={tab === "login" ? "Enter your name" : "e.g. Grandma Rose"}
                autoComplete="username"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-recipe-navy mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder={tab === "register" ? "Min. 6 characters" : "Enter your password"}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            {tab === "register" && (
              <div>
                <label className="block text-xs font-bold text-recipe-navy mb-1">Confirm password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy"
                />
              </div>
            )}

            {/* Register helper text */}
            {tab === "register" && (
              <p className="text-xs text-gray-500 leading-relaxed">
                Already share recipes here? Use your exact name to claim your profile.
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-recipe-pink text-white py-3 rounded-xl font-bold text-sm hover:bg-opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? tab === "login" ? "Signing in…" : "Creating account…"
                : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            {tab === "login" ? (
              <>Don&apos;t have an account?{" "}
                <button onClick={() => switchTab("register")} className="text-recipe-pink font-semibold hover:underline">
                  Create one
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => switchTab("login")} className="text-recipe-pink font-semibold hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
