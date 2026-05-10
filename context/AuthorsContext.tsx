"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Author } from "@/lib/types";

type AuthorsMap = Record<string, Omit<Author, "passwordHash">>;

interface AuthorsContextValue {
  authorsMap: AuthorsMap;
  refreshAuthors: () => void;
}

const AuthorsContext = createContext<AuthorsContextValue>({ authorsMap: {}, refreshAuthors: () => {} });

export function useAuthors() {
  return useContext(AuthorsContext).authorsMap;
}

export function useRefreshAuthors() {
  return useContext(AuthorsContext).refreshAuthors;
}

export function AuthorsProvider({ children }: { children: ReactNode }) {
  const [authorsMap, setAuthorsMap] = useState<AuthorsMap>({});

  const fetchAuthors = useCallback(() => {
    fetch("/api/authors", { cache: "no-store" })
      .then((r) => r.json())
      .then((authors: Omit<Author, "passwordHash">[]) => {
        const map: AuthorsMap = {};
        authors.forEach((a) => { map[a.name.toLowerCase()] = a; });
        setAuthorsMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAuthors();
    // Re-fetch whenever the tab becomes visible so profile photos stay current
    const onVisible = () => { if (document.visibilityState === "visible") fetchAuthors(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchAuthors]);

  return (
    <AuthorsContext.Provider value={{ authorsMap, refreshAuthors: fetchAuthors }}>
      {children}
    </AuthorsContext.Provider>
  );
}
