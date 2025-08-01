// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateGeminiImage } from "../../ai/imageService";
import { imageStylePrompts } from "../../ai/imagePrompts";

export async function GET(req: NextRequest) {
  const style = req.nextUrl.searchParams.get("style") || "anime";
  const prompt = imageStylePrompts[style];

  if (!prompt) {
    return NextResponse.json({ error: "Invalid style" }, { status: 400 });
  }

  const imageBuffer = await generateGeminiImage(prompt);

  if (!imageBuffer) {
    return NextResponse.json({ error: "Image generation failed." }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(imageBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
}
