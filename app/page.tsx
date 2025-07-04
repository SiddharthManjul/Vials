/* eslint-disable @next/next/no-img-element */
// app/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export default function HomePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch("/api/generate-image");
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } else {
      alert("Failed to generate image");
    }
    setLoading(false);
  };

  return (
    <main className="p-4">
      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate Gemini Image"}
      </button>

      {imageUrl && (
        <div>
          <Image
            src={imageUrl}
            alt="Gemini Output"
            className="max-w-md"
            width={500}
            height={500}
            unoptimized
          />
          <img src={imageUrl} alt="Gemini Output" className="max-w-md" />
        </div>
      )}
    </main>
  );
}
