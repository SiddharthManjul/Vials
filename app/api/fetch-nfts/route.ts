// app/api/fetch-nfts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchNFTInteractions } from "../../indexing/indexing";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const result = await fetchNFTInteractions(address.toLowerCase());
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch NFT data" }, { status: 500 });
  }
}
