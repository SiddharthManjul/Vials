// app/api/generate-image/route.ts
import { NextResponse } from "next/server";
import { generateGeminiImage } from "../../ai/imageService";

export async function GET() {
  const imageBuffer = await generateGeminiImage();

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
