export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  accentColor: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    id: "breakfast",
    name: "Breakfast",
    emoji: "🍳",
    description: "Start your morning right",
    gradient: "from-amber-50 to-orange-100",
    accentColor: "#F59E0B",
    subcategories: [
      { id: "sweet", name: "Sweet" },
      { id: "savory", name: "Savory" },
      { id: "other", name: "Other" },
    ],
  },
  {
    id: "lunch",
    name: "Lunch",
    emoji: "🥗",
    description: "Midday meals & light bites",
    gradient: "from-green-50 to-emerald-100",
    accentColor: "#10B981",
    subcategories: [
      { id: "sandwiches-wraps", name: "Sandwiches & Wraps" },
      { id: "salads", name: "Salads" },
      { id: "soups", name: "Soups" },
      { id: "light-meals", name: "Light Meals" },
      { id: "other", name: "Other" },
    ],
  },
  {
    id: "dinner",
    name: "Dinner",
    emoji: "🍽️",
    description: "Hearty family dinners",
    gradient: "from-violet-50 to-purple-100",
    accentColor: "#8B5CF6",
    subcategories: [
      { id: "pasta-grains", name: "Pasta & Grains" },
      { id: "meat-poultry", name: "Meat & Poultry" },
      { id: "seafood", name: "Seafood" },
      { id: "vegetarian", name: "Vegetarian" },
      { id: "casseroles", name: "Casseroles" },
      { id: "other", name: "Other" },
    ],
  },
  {
    id: "appetizers",
    name: "Appetizers",
    emoji: "🥨",
    description: "Perfect party starters",
    gradient: "from-red-50 to-rose-100",
    accentColor: "#F43F5E",
    subcategories: [
      { id: "dips", name: "Dips" },
      { id: "finger-foods", name: "Finger Foods" },
      { id: "cheese-charcuterie", name: "Cheese & Charcuterie" },
      { id: "other", name: "Other" },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    emoji: "🍰",
    description: "Sweet treats & indulgences",
    gradient: "from-pink-50 to-fuchsia-100",
    accentColor: "#E8608A",
    subcategories: [
      { id: "baked-goods", name: "Baked Goods" },
      { id: "cakes", name: "Cakes" },
      { id: "pies-tarts", name: "Pies & Tarts" },
      { id: "frozen-treats", name: "Frozen Treats" },
      { id: "other", name: "Other" },
    ],
  },
  {
    id: "sides",
    name: "Sides",
    emoji: "🥦",
    description: "The perfect accompaniment",
    gradient: "from-lime-50 to-green-100",
    accentColor: "#84CC16",
    subcategories: [
      { id: "vegetables", name: "Vegetables" },
      { id: "potatoes-grains", name: "Potatoes & Grains" },
      { id: "breads", name: "Breads" },
      { id: "salads", name: "Salads" },
      { id: "other", name: "Other" },
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    emoji: "🍹",
    description: "Sips for every occasion",
    gradient: "from-cyan-50 to-sky-100",
    accentColor: "#0EA5E9",
    subcategories: [
      { id: "smoothies-juices", name: "Smoothies & Juices" },
      { id: "hot-drinks", name: "Hot Drinks" },
      { id: "cocktails", name: "Cocktails" },
      { id: "shots", name: "Shots" },
      { id: "other", name: "Other" },
    ],
  },
  {
    id: "snacks",
    name: "Snacks",
    emoji: "🥣",
    description: "Nibbles & between-meal bites",
    gradient: "from-yellow-50 to-amber-100",
    accentColor: "#D97706",
    subcategories: [
      { id: "healthy", name: "Healthy" },
      { id: "sweet", name: "Sweet" },
      { id: "savory", name: "Savory" },
      { id: "other", name: "Other" },
    ],
  },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getSubcategoryName(categoryId: string, subcategoryId: string): string {
  const cat = getCategoryById(categoryId);
  if (!cat) return subcategoryId;
  const sub = cat.subcategories.find((s) => s.id === subcategoryId);
  return sub?.name ?? subcategoryId;
}
