/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/nft-search/page.tsx
"use client";

import { useState } from "react";

export default function NFTSearchPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(`/api/fetch-nfts?address=${address}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResults(data);
      }
    } catch (e) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">NFT Holdings Lookup</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
          placeholder="Enter contract address"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {results.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Results:</h2>
          {results.map((res, i) => (
            <div
              key={i}
              className="border rounded p-3 mb-2 bg-gray-100 text-sm"
            >
              <p><strong>Address:</strong> {res.address}</p>
              <p><strong>Token IDs:</strong> {res.tokenIds.join(", ")}</p>
              <p><strong>Transfers In:</strong> {res.transfersIn}</p>
              <p><strong>Transfers Out:</strong> {res.transfersOut}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
