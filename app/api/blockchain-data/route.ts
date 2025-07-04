/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { fetchBlockchainData } from '@/lib/hypersync';

function serializeBigInt(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;

    console.log('✅ Received request body:', body);

    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      console.warn('❌ Invalid or missing address received:', address);
      return NextResponse.json(
        { error: 'Invalid Ethereum address provided' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching blockchain data for address: ${address}`);
    const data = await fetchBlockchainData(address);

    console.log(`📦 Total transactions: ${data.transactions.length}`);
    console.log(`🎨 NFT transfers: ${data.nftTransfers?.length || 0}`);
    console.log(`📚 NFT collections: ${data.nftCollections?.length || 0}`);

    if (data.transactions.length > 0) {
      console.log(`🔗 First transaction hash: ${data.transactions[0].hash}`);
    }

    if (data.nftTransfers?.length > 0) {
      console.log(
        `🎭 First NFT transfer: ${data.nftTransfers[0].contractAddress}:${data.nftTransfers[0].tokenId}`
      );
      console.log(
        `🖼️ NFT transfers with metadata: ${data.nftTransfers.filter(nft => nft.metadata).length}`
      );
      console.log(
        `🖼️ NFT transfers with artwork: ${data.nftTransfers.filter(nft => nft.metadata?.image || nft.metadata?.animationUrl).length}`
      );
    }

    if (data.nftCollections?.length > 0) {
      console.log('📁 NFT collections:', data.nftCollections.map(col => ({
        address: col.contractAddress,
        tokenCount: col.tokenCount,
        name: col.name || 'Unknown'
      })));
    }

    console.log('📊 Summary:', {
      totalTransactions: data.summary.totalTransactions,
      totalETHTransfers: data.summary.totalETHTransfers,
      totalNFTTransfers: data.summary.totalNFTTransfers,
      totalNFTCollections: data.summary.totalNFTCollections,
      totalGasPaid: data.summary.totalGasPaidFormatted,
      ethVolumeIn: data.summary.totalEthVolumeIn,
      ethVolumeOut: data.summary.totalEthVolumeOut,
      scannedBlocks: data.summary.scannedBlocks
    });

    return NextResponse.json(serializeBigInt(data));
  } catch (error) {
    console.error('🚨 Error processing blockchain data:', error);
    if (error instanceof Error) {
      console.error('Name:', error.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
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
