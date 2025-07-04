// gemini-runner.ts
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

export async function generateGeminiImage(prompt: string): Promise<Buffer | null> {
  const ai = new GoogleGenAI({});
  const imagePath = path.join(process.cwd(), "public/ape.png");
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  if (
    response.candidates?.[0]?.content?.parts
  ) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && typeof part.inlineData.data === "string") {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        return buffer;
      }
    }
  }

  return null;
}
