export interface Recipe {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  source?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RecipeFormData {
  title: string;
  category: string;
  subcategory: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: string;
  source: string;
  uploadedBy: string;
}

export const emptyFormData: RecipeFormData = {
  title: "",
  category: "",
  subcategory: "",
  ingredients: [""],
  instructions: [""],
  prepTime: "",
  cookTime: "",
  servings: "",
  source: "",
  uploadedBy: "",
};
