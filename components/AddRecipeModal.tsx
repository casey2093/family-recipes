"use client";

import { useState, useRef, useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";
import { RecipeFormData, emptyFormData, Recipe, Author } from "@/lib/types";

function recipeToFormData(recipe: Recipe): RecipeFormData {
  return {
    title: recipe.title,
    category: recipe.category,
    subcategory: recipe.subcategory,
    ingredients: recipe.ingredients.length ? recipe.ingredients : [""],
    instructions: recipe.instructions.length ? recipe.instructions : [""],
    prepTime: String(recipe.prepTime),
    cookTime: String(recipe.cookTime),
    servings: String(recipe.servings),
    source: recipe.source ?? "",
    imageUrl: recipe.imageUrl ?? "",
    uploadedBy: recipe.uploadedBy,
  };
}
import RecipeCardFull from "./RecipeCardFull";
import AuthorInput from "./AuthorInput";
import { uploadImage } from "@/lib/clientUpload";

type Step = "method-select" | "manual" | "upload" | "processing" | "preview" | "edit" | "saved";

interface Props {
  defaultCategory?: string;
  editRecipe?: Recipe;
  onClose: () => void;
}

function buildInitialForm(defaultCategory?: string): RecipeFormData {
  const cat = CATEGORIES.find((c) => c.id === defaultCategory);
  return {
    ...emptyFormData,
    category: defaultCategory ?? "",
    subcategory: cat?.subcategories[0]?.id ?? "",
  };
}

function formToPreviewRecipe(form: RecipeFormData): Recipe {
  return {
    id: "preview",
    title: form.title || "Untitled Recipe",
    category: form.category,
    subcategory: form.subcategory,
    ingredients: form.ingredients.filter((s) => s.trim()),
    instructions: form.instructions.filter((s) => s.trim()),
    prepTime: Number(form.prepTime) || 0,
    cookTime: Number(form.cookTime) || 0,
    servings: Number(form.servings) || 1,
    source: form.source.trim() || undefined,
    imageUrl: form.imageUrl || undefined,
    uploadedBy: form.uploadedBy || "Anonymous",
    uploadedAt: new Date().toISOString(),
  };
}


export default function AddRecipeModal({ defaultCategory, editRecipe, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dishImageInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editRecipe;
  const [step, setStep] = useState<Step>(() => (editRecipe ? "edit" : "method-select"));
  const [form, setForm] = useState<RecipeFormData>(() =>
    editRecipe ? recipeToFormData(editRecipe) : buildInitialForm(defaultCategory)
  );
  const [recipeImages, setRecipeImages] = useState<Array<{ preview: string; base64: string; mediaType: string }>>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RecipeFormData, string>>>({});


  // Dish image
  const [dishImageFile, setDishImageFile] = useState<File | null>(null);
  const [dishImagePreview, setDishImagePreview] = useState<string | null>(null);

  // Profile creation
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);

  // Authors for autocomplete
  const [authors, setAuthors] = useState<Author[]>([]);

  useEffect(() => {
    fetch("/api/authors").then((r) => r.json()).then(setAuthors).catch(() => {});
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const setField = <K extends keyof RecipeFormData>(key: K, value: RecipeFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const updateListItem = (field: "ingredients" | "instructions", index: number, value: string) => {
    setForm((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addListItem = (field: "ingredients" | "instructions") => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeListItem = (field: "ingredients" | "instructions", index: number) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const selectedCategory = CATEGORIES.find((c) => c.id === form.category);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RecipeFormData, string>> = {};
    if (!form.title.trim()) newErrors.title = "Recipe title is required.";
    if (!form.category) newErrors.category = "Please select a category.";
    if (!form.subcategory) newErrors.subcategory = "Please select a subcategory.";
    if (!form.ingredients.some((s) => s.trim())) newErrors.ingredients = "Add at least one ingredient.";
    if (!form.instructions.some((s) => s.trim())) newErrors.instructions = "Add at least one instruction.";
    if (!form.prepTime || isNaN(Number(form.prepTime))) newErrors.prepTime = "Enter a valid prep time.";
    if (!form.cookTime && form.cookTime !== "0") newErrors.cookTime = "Enter a cook time (use 0 if none).";
    if (!form.servings || isNaN(Number(form.servings))) newErrors.servings = "Enter the number of servings.";
    if (!form.uploadedBy.trim()) newErrors.uploadedBy = "Please enter your name.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setRecipeImages((prev) => {
          if (prev.length >= 2) return prev;
          return [...prev, { preview: result, base64: result.split(",")[1], mediaType: file.type || "image/jpeg" }];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleDishImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDishImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setDishImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfileImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (recipeImages.length === 0) return;
    setStep("processing");
    setProcessingError(null);
    try {
      const res = await fetch("/api/extract-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: recipeImages.map(({ base64, mediaType }) => ({ base64, mediaType })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      const extracted = data.recipe;
      setForm((prev) => ({
        ...prev,
        title: extracted.title || "",
        ingredients: extracted.ingredients?.length ? extracted.ingredients : [""],
        instructions: extracted.instructions?.length ? extracted.instructions : [""],
        prepTime: String(extracted.prepTime ?? ""),
        cookTime: String(extracted.cookTime ?? ""),
        servings: String(extracted.servings ?? ""),
        source: extracted.source || "",
      }));
      setStep("preview");
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("upload");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let imageUrl = form.imageUrl;
      if (dishImageFile) {
        const result = await uploadImage(dishImageFile);
        if (result.error) {
          alert(result.error);
          return;
        }
        if (result.url) imageUrl = result.url;
      }

      const payload = {
        ...form,
        imageUrl: imageUrl || undefined,
        ingredients: form.ingredients.filter((s) => s.trim()),
        instructions: form.instructions.filter((s) => s.trim()),
        ...(isEditing ? { id: editRecipe!.id } : {}),
      };

      const res = await fetch("/api/recipes", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Save failed (${res.status})`);
      }

      localStorage.setItem("wfk_author_name", form.uploadedBy.trim());

      if (isEditing) {
        onClose();
        window.location.reload();
        return;
      }
      const hasProfile = authors.some(
        (a) => a.name.toLowerCase() === form.uploadedBy.toLowerCase()
      );
      if (hasProfile) {
        onClose();
      } else {
        setStep("saved");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProfile = async () => {
    setCreatingProfile(true);
    try {
      let imageUrl: string | undefined;
      if (profileImageFile) {
        const result = await uploadImage(profileImageFile);
        if (result.error) {
          alert(result.error + "\n\nYour recipe was saved — you can add a profile photo later from your author page.");
        } else {
          imageUrl = result.url;
        }
      }
      await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.uploadedBy, imageUrl }),
      });
      localStorage.setItem("wfk_author_name", form.uploadedBy.trim());
    } catch {
      // profile creation is optional — still close
    } finally {
      setCreatingProfile(false);
      onClose();
    }
  };

  const stepTitles: Record<Step, string> = {
    "method-select": "Add a Recipe",
    manual: "Recipe Details",
    upload: "Upload a Photo",
    processing: "Reading your recipe…",
    preview: "Preview Your Recipe",
    edit: isEditing ? "Edit Recipe" : "Edit Recipe",
    saved: "Recipe Saved!",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step !== "method-select" && step !== "saved" && (
              <button
                onClick={() => {
                  if (step === "manual" || step === "upload") setStep("method-select");
                  else if (step === "processing") setStep("upload");
                  else if (step === "preview") setStep(recipeImages.length > 0 ? "upload" : "manual");
                  else if (step === "edit") setStep("preview");
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="font-playfair font-bold text-recipe-navy text-lg sm:text-xl">
              {stepTitles[step]}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Method select ── */}
          {step === "method-select" && (
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-6 text-center">
                How would you like to add your recipe?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => { setRecipeImages([]); setStep("upload"); }}
                  className="group flex items-center sm:flex-col sm:items-center gap-5 sm:gap-4 p-5 sm:p-6 rounded-2xl border-2 border-gray-200 hover:border-recipe-pink hover:bg-recipe-rose/30 transition-all text-left sm:text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-recipe-rose flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    📷
                  </div>
                  <div>
                    <p className="font-bold text-recipe-navy text-base">Upload a Photo</p>
                    <p className="text-sm text-gray-500 mt-1">
                      We&apos;ll read the recipe from your image automatically
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setStep("manual")}
                  className="group flex items-center sm:flex-col sm:items-center gap-5 sm:gap-4 p-5 sm:p-6 rounded-2xl border-2 border-gray-200 hover:border-recipe-navy hover:bg-recipe-cream transition-all text-left sm:text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    ✏️
                  </div>
                  <div>
                    <p className="font-bold text-recipe-navy text-base">Type It In</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter your recipe details step by step
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Upload ── */}
          {step === "upload" && (
            <div className="p-6">
              {processingError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  ⚠️ {processingError}
                </div>
              )}

              {/* Uploaded image previews */}
              {recipeImages.length > 0 && (
                <div className={`grid gap-3 mb-4 ${recipeImages.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-xs mx-auto"}`}>
                  {recipeImages.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.preview} alt={`Recipe side ${i + 1}`} className="w-full h-44 object-cover" />
                      <div className="absolute top-2 left-2 bg-white/90 text-xs font-bold text-gray-600 px-2 py-0.5 rounded-full shadow-sm">
                        Side {i + 1}
                      </div>
                      <button
                        onClick={() => setRecipeImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 shadow-sm text-xs"
                        aria-label="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload zone — hidden once 2 photos loaded */}
              {recipeImages.length < 2 && (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-2xl text-center cursor-pointer hover:border-recipe-pink hover:bg-recipe-rose/10 transition-all"
                  style={{ padding: recipeImages.length === 0 ? "2rem" : "1rem 2rem" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {recipeImages.length === 0 ? (
                    <div className="space-y-3">
                      <div className="text-5xl">📄</div>
                      <p className="font-semibold text-gray-700">Click to upload a photo</p>
                      <p className="text-sm text-gray-400">You can add up to 2 photos — great for double-sided cards</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-500">
                      <span className="text-lg">📄</span> Add the other side of the card
                    </div>
                  )}
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

              {recipeImages.length > 0 && (
                <button
                  onClick={handleExtract}
                  className="mt-4 w-full bg-recipe-pink text-white py-3.5 rounded-xl font-bold hover:bg-opacity-90 shadow-sm"
                >
                  ✨ Extract Recipe from Photo{recipeImages.length > 1 ? "s" : ""}
                </button>
              )}
              <button
                onClick={() => setStep("manual")}
                className="mt-3 w-full text-sm text-gray-500 hover:text-recipe-navy py-3 font-medium"
              >
                Or type the recipe in manually →
              </button>
            </div>
          )}

          {/* ── Processing ── */}
          {step === "processing" && (
            <div className="p-10 flex flex-col items-center justify-center gap-5 min-h-[300px]">
              <div className="w-20 h-20 rounded-full bg-recipe-rose flex items-center justify-center text-4xl animate-bounce">
                🍳
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-recipe-navy text-lg">Reading your recipe…</p>
                <p className="text-sm text-gray-500">Claude is extracting all the ingredients and steps</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-recipe-pink opacity-70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Manual / Edit form ── */}
          {(step === "manual" || step === "edit") && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">Recipe Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. Grandma's Famous Apple Pie"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-recipe-navy transition-colors ${errors.title ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-recipe-navy mb-1.5">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = CATEGORIES.find((c) => c.id === e.target.value);
                      setField("category", e.target.value);
                      setField("subcategory", cat?.subcategories[0]?.id ?? "");
                    }}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-recipe-navy ${errors.category ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-recipe-navy mb-1.5">Subcategory *</label>
                  <select
                    value={form.subcategory}
                    onChange={(e) => setField("subcategory", e.target.value)}
                    disabled={!form.category}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-recipe-navy disabled:opacity-50 ${errors.subcategory ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                  >
                    <option value="">Select…</option>
                    {selectedCategory?.subcategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.subcategory && <p className="mt-1 text-xs text-red-500">{errors.subcategory}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(["prepTime", "cookTime", "servings"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                      {field === "prepTime" ? "Prep (mins) *" : field === "cookTime" ? "Cook (mins) *" : "Servings *"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form[field]}
                      onChange={(e) => setField(field, e.target.value)}
                      placeholder="0"
                      className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-recipe-navy ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                    />
                    {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">Ingredients *</label>
                {errors.ingredients && <p className="mb-1.5 text-xs text-red-500">{errors.ingredients}</p>}
                <div className="space-y-2">
                  {form.ingredients.map((ing, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={ing}
                        onChange={(e) => updateListItem("ingredients", i, e.target.value)}
                        placeholder={`Ingredient ${i + 1}`}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-recipe-navy"
                      />
                      {form.ingredients.length > 1 && (
                        <button onClick={() => removeListItem("ingredients", i)} className="px-2 text-gray-400 hover:text-red-400 rounded-lg">✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addListItem("ingredients")} className="text-sm text-recipe-navy font-semibold hover:text-recipe-pink flex items-center gap-1">+ Add ingredient</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">Instructions *</label>
                {errors.instructions && <p className="mb-1.5 text-xs text-red-500">{errors.instructions}</p>}
                <div className="space-y-2">
                  {form.instructions.map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-recipe-cream flex items-center justify-center text-xs font-bold text-recipe-navy mt-2">{i + 1}</div>
                      <textarea
                        value={step}
                        onChange={(e) => updateListItem("instructions", i, e.target.value)}
                        placeholder={`Step ${i + 1}…`}
                        rows={2}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-recipe-navy resize-none"
                      />
                      {form.instructions.length > 1 && (
                        <button onClick={() => removeListItem("instructions", i)} className="px-2 text-gray-400 hover:text-red-400 rounded-lg self-start mt-2">✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addListItem("instructions")} className="text-sm text-recipe-navy font-semibold hover:text-recipe-pink flex items-center gap-1">+ Add step</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                  Original Source <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setField("source", e.target.value)}
                  placeholder="e.g. Grandma's recipe card, or paste a URL"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-recipe-navy"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                  Photo of the dish <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-recipe-pink hover:bg-recipe-rose/10 transition-all"
                  onClick={() => dishImageInputRef.current?.click()}
                >
                  {dishImagePreview ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dishImagePreview} alt="Dish preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                      <p className="text-xs text-gray-500">Click to change</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Click to upload a photo of the finished dish</p>
                  )}
                </div>
                <input ref={dishImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleDishImageChange} />
              </div>

              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">Your Name *</label>
                <AuthorInput
                  value={form.uploadedBy}
                  onChange={(name) => setField("uploadedBy", name)}
                  authors={authors}
                  error={errors.uploadedBy}
                />
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {step === "preview" && (
            <div className="p-4 sm:p-6 space-y-5">
              <p className="text-sm text-gray-500 text-center">
                Here&apos;s how your recipe card will look. Does everything look right?
              </p>

              {/* Category/subcategory — always visible at top of preview */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-recipe-navy">Category</p>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = CATEGORIES.find((c) => c.id === e.target.value);
                      setField("category", e.target.value);
                      setField("subcategory", cat?.subcategories[0]?.id ?? "");
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-recipe-navy bg-white"
                  >
                    <option value="">Category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={form.subcategory}
                    onChange={(e) => setField("subcategory", e.target.value)}
                    disabled={!form.category}
                    className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-recipe-navy bg-white disabled:opacity-50"
                  >
                    <option value="">Subcategory…</option>
                    {selectedCategory?.subcategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dish image upload */}
              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-2">
                  Photo of the dish <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-recipe-pink hover:bg-recipe-rose/10 transition-all"
                  onClick={() => dishImageInputRef.current?.click()}
                >
                  {dishImagePreview ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dishImagePreview} alt="Dish preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                      <p className="text-xs text-gray-500">Click to change</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Add a photo of the finished dish</p>
                  )}
                </div>
                <input ref={dishImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleDishImageChange} />
              </div>

              {/* Recipe card preview */}
              <div className="border-2 border-recipe-cream rounded-2xl overflow-hidden">
                <RecipeCardFull recipe={formToPreviewRecipe(form)} showMeta={true} />
              </div>

              {/* Name field */}
              <div className="bg-recipe-cream rounded-xl p-4 space-y-2">
                <label className="block text-sm font-bold text-recipe-navy">
                  One last thing — who&apos;s adding this recipe? *
                </label>
                <AuthorInput
                  value={form.uploadedBy}
                  onChange={(name) => setField("uploadedBy", name)}
                  authors={authors}
                />
              </div>
            </div>
          )}

          {/* ── Saved / Profile creation ── */}
          {step === "saved" && (
            <div className="p-6 space-y-5 text-center">
              <div className="text-5xl mt-2">🎉</div>
              <div>
                <h3 className="font-playfair font-bold text-recipe-navy text-2xl mb-1">Recipe saved!</h3>
                <p className="text-gray-500 text-sm">
                  Want to set up a quick profile, {form.uploadedBy}?
                </p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-bold text-recipe-navy mb-2">
                  Profile photo <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-recipe-pink hover:bg-recipe-rose/10 transition-all"
                  onClick={() => profileImageInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={profileImagePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                      <p className="text-xs text-gray-500">Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-2xl font-bold font-playfair">
                        {form.uploadedBy.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm text-gray-400">Click to upload a photo</p>
                    </div>
                  )}
                </div>
                <input ref={profileImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:border-gray-300"
                >
                  Skip
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={creatingProfile}
                  className="flex-1 bg-recipe-navy text-white py-3 rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50"
                >
                  {creatingProfile ? "Saving…" : "Create Profile"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(step === "manual" || step === "edit" || step === "preview") && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
            {(step === "manual" || step === "edit") && (
              <div className={isEditing ? "flex gap-3" : ""}>
                <button
                  onClick={() => { if (validateForm()) setStep("preview"); }}
                  className={`${isEditing ? "flex-1 border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:border-recipe-navy hover:text-recipe-navy" : "w-full bg-recipe-navy text-white py-3.5 rounded-xl font-bold hover:bg-opacity-90 shadow-sm"}`}
                >
                  Preview Recipe Card →
                </button>
                {isEditing && (
                  <button
                    onClick={() => { if (validateForm()) handleSubmit(); }}
                    disabled={isSubmitting}
                    className="flex-1 bg-recipe-pink text-white py-3.5 rounded-xl font-bold hover:bg-opacity-90 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving…" : "✓ Save Changes"}
                  </button>
                )}
              </div>
            )}
            {step === "preview" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep("edit")}
                  className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:border-recipe-navy hover:text-recipe-navy"
                >
                  ✏️ Edit Recipe
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !form.uploadedBy.trim() || !form.category || !form.subcategory}
                  className="flex-1 bg-recipe-pink text-white py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving…" : isEditing ? "✓ Save Changes" : "✓ Looks Good! Save It"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
