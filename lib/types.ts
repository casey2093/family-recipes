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
  imageUrl?: string;
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
  imageUrl: string;
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
  imageUrl: "",
  uploadedBy: "",
};

export interface Author {
  id: string;
  name: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Reply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  author: string;
  text: string;
  imageUrl?: string;
  likes: number;
  replies: Reply[];
  createdAt: string;
}
