import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI extraction is not configured. Please add your ANTHROPIC_API_KEY to .env.local and restart the server.",
      },
      { status: 503 }
    );
  }

  try {
    const { imageBase64, mediaType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `You are a recipe extraction assistant. Look at this image and extract all recipe information.

Return ONLY a valid JSON object with exactly this structure (no other text, no markdown):
{
  "title": "Recipe title here",
  "ingredients": ["1 cup flour", "2 eggs", "...each ingredient as its own string with quantity"],
  "instructions": ["Step 1: Do this...", "Step 2: Do that...", "...each step as its own string"],
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
- If you cannot read the recipe clearly, do your best to extract what you can
- Return ONLY the JSON object, nothing else`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response from AI");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse recipe data from image. Please try manual entry.");
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ recipe: recipeData });
  } catch (error) {
    console.error("Error extracting recipe:", error);
    const message =
      error instanceof Error ? error.message : "Failed to extract recipe from image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
