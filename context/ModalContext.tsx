"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AddRecipeModal from "@/components/AddRecipeModal";

interface ModalContextType {
  openAddModal: (defaultCategory?: string) => void;
}

const ModalContext = createContext<ModalContextType>({
  openAddModal: () => {},
});

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>();

  const openAddModal = (category?: string) => {
    setDefaultCategory(category);
    setIsOpen(true);
  };

  return (
    <ModalContext.Provider value={{ openAddModal }}>
      {children}
      {isOpen && (
        <AddRecipeModal
          defaultCategory={defaultCategory}
          onClose={() => setIsOpen(false)}
        />
      )}
    </ModalContext.Provider>
  );
}
