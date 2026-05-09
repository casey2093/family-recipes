import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

function friendlyError(error: unknown): string {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (msg.includes("api key") || msg.includes("auth") || msg.includes("401") || msg.includes("403"))
    return "Recipe reading isn't configured. Please type your recipe in manually instead.";
  if (msg.includes("rate") || msg.includes("429"))
    return "Too many requests right now. Please wait a moment and try again.";
  if (msg.includes("could not parse") || msg.includes("parse") || msg.includes("json"))
    return "We had trouble reading the recipe from the photo. Try again, or type it in manually.";
  if (msg.includes("network") || msg.includes("connect"))
    return "Couldn't reach the AI service. Please check your internet and try again.";
  return "Couldn't read the recipe from the photo. Try again, or type it in manually.";
}

const EXTRACT_PROMPT = `You are a recipe extraction assistant. Extract all recipe information from the image(s) provided.

Return ONLY a valid JSON object with exactly this structure (no other text, no markdown):
{
  "title": "Recipe title here",
  "ingredients": ["1 cup flour", "2 eggs", "...each ingredient as its own string with quantity"],
  "instructions": ["Do this...", "Do that...", "...each step as its own string"],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "source": "URL or source text if visible, otherwise empty string"
}

Rules:
- Each ingredient must include the quantity, unit, and ingredient name
- Each instruction should be one complete step
- prepTime and cookTime must be integers in minutes (use 0 if not visible, estimate if implied)
- servings must be an integer (use 4 as default if not visible)
- Do NOT include "Step 1:", "Step 2:", "1.", "2." or any numbering in instruction text — steps are numbered automatically in the UI
- If you cannot read the recipe clearly, do your best to extract what you can
- Return ONLY the JSON object, nothing else`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Recipe reading isn't set up yet. Please type your recipe in manually instead." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    // Support both legacy single-image {imageBase64, mediaType} and new {images: [{base64, mediaType}]}
    type ImageInput = { base64: string; mediaType: string };
    const imageList: ImageInput[] = body.images
      ?? (body.imageBase64 ? [{ base64: body.imageBase64, mediaType: body.mediaType ?? "image/jpeg" }] : []);

    if (!imageList.length || !imageList[0].base64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const imageBlocks = imageList.map(({ base64, mediaType }) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: (mediaType || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: base64,
      },
    }));

    const preamble = imageList.length > 1
      ? `These are ${imageList.length} photos of the same recipe card (front and back). Combine information from all images to extract the complete recipe.`
      : `Look at this image and extract all recipe information.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: `${preamble}\n\n${EXTRACT_PROMPT}` },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response from AI");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse recipe data from image. Please try manual entry.");

    const recipeData = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ recipe: recipeData });
  } catch (error) {
    console.error("Error extracting recipe:", error);
    return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  }
}
