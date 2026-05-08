"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { RecipeFormData, emptyFormData, Recipe } from "@/lib/types";
import RecipeCardFull from "./RecipeCardFull";

type Step = "method-select" | "manual" | "upload" | "processing" | "preview" | "edit";

interface Props {
  defaultCategory?: string;
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
    uploadedBy: form.uploadedBy || "Anonymous",
    uploadedAt: new Date().toISOString(),
  };
}

export default function AddRecipeModal({ defaultCategory, onClose }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("method-select");
  const [form, setForm] = useState<RecipeFormData>(() => buildInitialForm(defaultCategory));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>("image/jpeg");
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RecipeFormData, string>>>({});

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // --- Form helpers ---
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
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const selectedCategory = CATEGORIES.find((c) => c.id === form.category);

  // --- Validation ---
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

  // --- Image handling ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setImageBase64(base64);
      setImageMediaType(file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif");
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!imageBase64) return;
    setStep("processing");
    setProcessingError(null);
    try {
      const res = await fetch("/api/extract-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType: imageMediaType }),
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

  // --- Submit ---
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ingredients: form.ingredients.filter((s) => s.trim()),
          instructions: form.instructions.filter((s) => s.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to save recipe");
      router.refresh();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Step titles ---
  const stepTitles: Record<Step, string> = {
    "method-select": "Add a Recipe",
    manual: "Recipe Details",
    upload: "Upload a Photo",
    processing: "Reading your recipe…",
    preview: "Preview Your Recipe",
    edit: "Edit Recipe",
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step !== "method-select" && (
              <button
                onClick={() => {
                  if (step === "manual" || step === "upload") setStep("method-select");
                  else if (step === "processing") setStep("upload");
                  else if (step === "preview") {
                    setStep(imageBase64 ? "upload" : "manual");
                  }
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step: Method select ──────────────────────────── */}
          {step === "method-select" && (
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-6 text-center">
                How would you like to add your recipe?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => { setImageBase64(null); setImagePreview(null); setStep("upload"); }}
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
                  <div className="w-16 h-16 rounded-2xl bg-recipe-cream flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
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

          {/* ── Step: Upload ─────────────────────────────────── */}
          {step === "upload" && (
            <div className="p-6">
              {processingError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  ⚠️ {processingError}
                </div>
              )}

              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-recipe-pink hover:bg-recipe-rose/10 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Recipe preview"
                      className="max-h-56 mx-auto rounded-xl object-contain"
                    />
                    <p className="text-sm text-gray-500">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-5xl">📄</div>
                    <p className="font-semibold text-gray-700">
                      Click to upload a photo
                    </p>
                    <p className="text-sm text-gray-400">
                      JPG, PNG, WEBP up to 20MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {imagePreview && (
                <button
                  onClick={handleExtract}
                  className="mt-5 w-full bg-recipe-pink text-white py-3.5 rounded-xl font-bold hover:bg-opacity-90 shadow-sm"
                >
                  ✨ Extract Recipe from Photo
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

          {/* ── Step: Processing ─────────────────────────────── */}
          {step === "processing" && (
            <div className="p-10 flex flex-col items-center justify-center gap-5 min-h-[300px]">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-recipe-rose flex items-center justify-center text-4xl animate-bounce">
                  🍳
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-recipe-navy text-lg">Reading your recipe…</p>
                <p className="text-sm text-gray-500">
                  Claude is extracting all the ingredients and steps
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-recipe-pink opacity-70 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step: Manual / Edit form ──────────────────────── */}
          {(step === "manual" || step === "edit") && (
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. Grandma's Famous Apple Pie"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-recipe-navy transition-colors ${
                    errors.title ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              {/* Category + Subcategory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = CATEGORIES.find((c) => c.id === e.target.value);
                      setField("category", e.target.value);
                      setField("subcategory", cat?.subcategories[0]?.id ?? "");
                    }}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-recipe-navy ${
                      errors.category ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                    Subcategory *
                  </label>
                  <select
                    value={form.subcategory}
                    onChange={(e) => setField("subcategory", e.target.value)}
                    disabled={!form.category}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-recipe-navy disabled:opacity-50 ${
                      errors.subcategory ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select…</option>
                    {selectedCategory?.subcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.subcategory && <p className="mt-1 text-xs text-red-500">{errors.subcategory}</p>}
                </div>
              </div>

              {/* Times + Servings */}
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
                      className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-recipe-navy ${
                        errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
                  </div>
                ))}
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                  Ingredients *
                </label>
                {errors.ingredients && (
                  <p className="mb-1.5 text-xs text-red-500">{errors.ingredients}</p>
                )}
                <div className="space-y-2">
                  {form.ingredients.map((ing, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={ing}
                        onChange={(e) => updateListItem("ingredients", i, e.target.value)}
                        placeholder={`Ingredient ${i + 1} (e.g. 2 cups flour)`}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-recipe-navy"
                      />
                      {form.ingredients.length > 1 && (
                        <button
                          onClick={() => removeListItem("ingredients", i)}
                          className="px-2 text-gray-400 hover:text-red-400 rounded-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addListItem("ingredients")}
                    className="text-sm text-recipe-navy font-semibold hover:text-recipe-pink flex items-center gap-1"
                  >
                    + Add ingredient
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                  Instructions *
                </label>
                {errors.instructions && (
                  <p className="mb-1.5 text-xs text-red-500">{errors.instructions}</p>
                )}
                <div className="space-y-2">
                  {form.instructions.map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-recipe-cream flex items-center justify-center text-xs font-bold text-recipe-navy mt-2">
                        {i + 1}
                      </div>
                      <textarea
                        value={step}
                        onChange={(e) => updateListItem("instructions", i, e.target.value)}
                        placeholder={`Step ${i + 1}…`}
                        rows={2}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-recipe-navy resize-none"
                      />
                      {form.instructions.length > 1 && (
                        <button
                          onClick={() => removeListItem("instructions", i)}
                          className="px-2 text-gray-400 hover:text-red-400 rounded-lg self-start mt-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addListItem("instructions")}
                    className="text-sm text-recipe-navy font-semibold hover:text-recipe-pink flex items-center gap-1"
                  >
                    + Add step
                  </button>
                </div>
              </div>

              {/* Source (optional) */}
              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                  Original Source{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setField("source", e.target.value)}
                  placeholder="e.g. Grandma's recipe card, or paste a URL"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-recipe-navy"
                />
              </div>

              {/* Your name */}
              <div>
                <label className="block text-sm font-bold text-recipe-navy mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={form.uploadedBy}
                  onChange={(e) => setField("uploadedBy", e.target.value)}
                  placeholder="e.g. Aunt Carol"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-recipe-navy ${
                    errors.uploadedBy ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.uploadedBy && (
                  <p className="mt-1 text-xs text-red-500">{errors.uploadedBy}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step: Preview ─────────────────────────────────── */}
          {step === "preview" && (
            <div className="p-4 sm:p-6 space-y-5">
              <p className="text-sm text-gray-500 text-center">
                Here&apos;s how your recipe card will look. Does everything look right?
              </p>

              {/* Scrollable recipe card preview */}
              <div className="border-2 border-recipe-cream rounded-2xl overflow-hidden">
                <RecipeCardFull recipe={formToPreviewRecipe(form)} showMeta={true} />
              </div>

              {/* Name field if not filled */}
              {!form.uploadedBy.trim() && (
                <div className="bg-recipe-cream rounded-xl p-4 space-y-2">
                  <label className="block text-sm font-bold text-recipe-navy">
                    One last thing — who&apos;s adding this recipe? *
                  </label>
                  <input
                    type="text"
                    value={form.uploadedBy}
                    onChange={(e) => setField("uploadedBy", e.target.value)}
                    placeholder="Your name (e.g. Aunt Carol)"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-recipe-navy bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(step === "manual" || step === "edit" || step === "preview") && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
            {(step === "manual" || step === "edit") && (
              <button
                onClick={() => {
                  if (validateForm()) setStep("preview");
                }}
                className="w-full bg-recipe-navy text-white py-3.5 rounded-xl font-bold hover:bg-opacity-90 shadow-sm"
              >
                Preview Recipe Card →
              </button>
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
                  disabled={isSubmitting || !form.uploadedBy.trim()}
                  className="flex-1 bg-recipe-pink text-white py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving…" : "✓ Looks Good! Save It"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
