/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { fetchBlockchainData } from '@/lib/hypersync';

// Add this helper function at the top of your file
function serializeBigInt(data: any): any {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export const runtime = 'nodejs'; // Force Node.js runtime

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address provided' },
        { status: 400 }
      );
    }

    console.log(`Fetching blockchain data for address: ${address}`);
    const data = await fetchBlockchainData(address);

    // Enhanced logging for debugging
    console.log(`Found ${data.transactions.length} transactions`);
    console.log(`Found ${data.nftTransfers?.length || 0} NFT transfers`);
    console.log(`Found ${data.nftCollections?.length || 0} NFT collections`);
    
    if (data.transactions.length > 0) {
      console.log(`First transaction hash: ${data.transactions[0].hash}`);
    }

    if (data.nftTransfers && data.nftTransfers.length > 0) {
      console.log(`First NFT transfer: ${data.nftTransfers[0].contractAddress}:${data.nftTransfers[0].tokenId}`);
      console.log(`NFT transfers with metadata: ${data.nftTransfers.filter(nft => nft.metadata).length}`);
      console.log(`NFT transfers with artwork: ${data.nftTransfers.filter(nft => nft.metadata?.image || nft.metadata?.animationUrl).length}`);
    }

    if (data.nftCollections && data.nftCollections.length > 0) {
      console.log(`NFT collections found:`, data.nftCollections.map(col => ({
        address: col.contractAddress,
        tokenCount: col.tokenCount,
        name: col.name || 'Unknown'
      })));
    }

    // Log summary statistics
    console.log('Summary:', {
      totalTransactions: data.summary.totalTransactions,
      totalETHTransfers: data.summary.totalETHTransfers,
      totalNFTTransfers: data.summary.totalNFTTransfers,
      totalNFTCollections: data.summary.totalNFTCollections,
      totalGasPaid: data.summary.totalGasPaidFormatted,
      ethVolumeIn: data.summary.totalEthVolumeIn,
      ethVolumeOut: data.summary.totalEthVolumeOut,
      scannedBlocks: data.summary.scannedBlocks
    });

    // Return serialized data with enhanced structure
    return NextResponse.json(serializeBigInt(data));

  } catch (error) {
    console.error("Error processing blockchain data:", error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch blockchain data', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}