"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AuthModal from "@/components/AuthModal";

export interface AuthUser {
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  openAuthModal: (message?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  openAuthModal: (_message?: string) => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string>("");

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser({ name: data.name });
        localStorage.setItem("wfk_author_name", data.name);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    localStorage.removeItem("wfk_author_name");
  };

  const handleAuthSuccess = (name: string) => {
    setUser({ name });
    localStorage.setItem("wfk_author_name", name);
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        openAuthModal: (message?: string) => { setAuthModalMessage(message ?? ""); setAuthModalOpen(true); },
        logout,
        refreshUser,
      }}
    >
      {children}
      {authModalOpen && (
        <AuthModal
          message={authModalMessage}
          onClose={() => { setAuthModalOpen(false); setAuthModalMessage(""); }}
          onSuccess={handleAuthSuccess}
        />
      )}
    </AuthContext.Provider>
  );
}
