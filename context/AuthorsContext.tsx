"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Author } from "@/lib/types";

// Map from lowercase name → author record (without passwordHash, as returned by GET /api/authors)
type AuthorsMap = Record<string, Omit<Author, "passwordHash">>;

const AuthorsContext = createContext<AuthorsMap>({});

export function useAuthors() {
  return useContext(AuthorsContext);
}

export function AuthorsProvider({ children }: { children: ReactNode }) {
  const [authorsMap, setAuthorsMap] = useState<AuthorsMap>({});

  useEffect(() => {
    fetch("/api/authors")
      .then((r) => r.json())
      .then((authors: Omit<Author, "passwordHash">[]) => {
        const map: AuthorsMap = {};
        authors.forEach((a) => { map[a.name.toLowerCase()] = a; });
        setAuthorsMap(map);
      })
      .catch(() => {});
  }, []);

  return (
    <AuthorsContext.Provider value={authorsMap}>
      {children}
    </AuthorsContext.Provider>
  );
}
