import { NextRequest, NextResponse } from "next/server";

// Tell Next.js to use the Node.js runtime (required for native dependencies)
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    // Dynamic import to ensure server-side only execution
    const { fetchNFTInteractions } = await import("../../indexing/indexing");
    const result = await fetchNFTInteractions(address.toLowerCase());
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in fetch-nfts API:", err);
    
    // More specific error handling
    if (err instanceof Error) {
      if (err.message.includes('hypersync') || err.message.includes('native')) {
        return NextResponse.json({ 
          error: "Server configuration error with native dependencies" 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: "Failed to fetch NFT data" }, { status: 500 });
  }
}