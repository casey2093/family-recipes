"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AddRecipeModal from "@/components/AddRecipeModal";
import { Recipe } from "@/lib/types";

interface ModalContextType {
  openAddModal: (defaultCategory?: string) => void;
  openEditModal: (recipe: Recipe) => void;
}

const ModalContext = createContext<ModalContextType>({
  openAddModal: () => {},
  openEditModal: () => {},
});

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>();
  const [editRecipe, setEditRecipe] = useState<Recipe | undefined>();

  const openAddModal = (category?: string) => {
    setEditRecipe(undefined);
    setDefaultCategory(category);
    setIsOpen(true);
  };

  const openEditModal = (recipe: Recipe) => {
    setEditRecipe(recipe);
    setDefaultCategory(undefined);
    setIsOpen(true);
  };

  return (
    <ModalContext.Provider value={{ openAddModal, openEditModal }}>
      {children}
      {isOpen && (
        <AddRecipeModal
          defaultCategory={defaultCategory}
          editRecipe={editRecipe}
          onClose={() => { setIsOpen(false); setEditRecipe(undefined); }}
        />
      )}
    </ModalContext.Provider>
  );
}
