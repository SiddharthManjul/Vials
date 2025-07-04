/* eslint-disable @next/next/no-img-element */
// app/page.tsx
"use client";

import { useState } from "react";

const styles = [
  { id: "2d-pixel", label: "2D Pixel" },
  { id: "anime", label: "Anime" },
  { id: "manga", label: "Manga" },
  { id: "manhwa", label: "Manhwa" },
  { id: "american-toons", label: "American Toons" },
  { id: "ghiblify", label: "Ghibli" },
  { id: "disney", label: "Disney" },
];

export default function HomePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingStyle, setLoadingStyle] = useState<string | null>(null);

  const handleGenerate = async (styleId: string) => {
    setLoadingStyle(styleId);
    const res = await fetch(`/api/generate-image?style=${styleId}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } else {
      alert("Failed to generate image");
    }
    setLoadingStyle(null);
  };

  return (
    <main className="p-4">
      <div className="flex flex-wrap gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => handleGenerate(style.id)}
            className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            disabled={loadingStyle !== null}
          >
            {loadingStyle === style.id ? "Generating..." : style.label}
          </button>
        ))}
      </div>

      {imageUrl && (
        <div className="mt-6">
          <img src={imageUrl} alt="Generated" className="max-w-md border rounded shadow" />
        </div>
      )}
    </main>
  );
}
