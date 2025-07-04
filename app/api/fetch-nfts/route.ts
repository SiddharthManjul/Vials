import { NextRequest, NextResponse } from "next/server";

// Tell Next.js to use the Node.js runtime instead of the Edge
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    // Dynamic import to avoid build-time issues with native dependencies
    const { fetchNFTInteractions } = await import("../../indexing/indexing");
    const result = await fetchNFTInteractions(address.toLowerCase());
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in fetch-nfts API:", err);
    return NextResponse.json({ error: "Failed to fetch NFT data" }, { status: 500 });
  }
}