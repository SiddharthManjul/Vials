/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Search, Wallet, Image, ExternalLink, Clock, Hash, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle, TrendingUp } from 'lucide-react';

const NFTExplorer = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  type NFTData = {
    address: string;
    summary?: {
      totalNFTTransfers?: number;
      totalNFTCollections?: number;
      totalTransactions?: number;
      totalEthVolumeIn?: string;
      totalEthVolumeOut?: string;
      totalGasPaidFormatted?: string;
    };
    nftTransfers?: NFT[];
    nftCollections?: Collection[];
  };

  const [data, setData] = useState<NFTData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchNFTData = async () => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch('/api/blockchain-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to fetch NFT data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e) e.preventDefault();
    fetchNFTData();
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fetchNFTData();
  };

  const formatAddress = (addr: string | any[]) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  type NFT = {
    tokenId: string;
    contractAddress: string;
    tokenType: string;
    amount?: number;
    timestamp: number;
    from: string;
    transactionHash?: string;
    metadata?: {
      image?: string;
      name?: string;
      description?: string;
    };
  };

  const NFTCard = ({ nft }: { nft: NFT }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 relative">
        {nft.metadata?.image ? (
          <img 
            src={nft.metadata.image.startsWith('ipfs://') 
              ? nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
              : nft.metadata.image
            }
            alt={nft.metadata?.name || `Token ${nft.tokenId}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              if (img.nextSibling && img.nextSibling instanceof HTMLElement) {
                (img.nextSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100" 
             style={{display: nft.metadata?.image ? 'none' : 'flex'}}>
          <Image className="w-16 h-16 text-gray-400" />
        </div>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            nft.tokenType === 'ERC-721' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {nft.tokenType}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 truncate">
          {nft.metadata?.name || `Token #${nft.tokenId}`}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            <span>ID: {nft.tokenId}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span>{formatAddress(nft.contractAddress)}</span>
          </div>
          
          {nft.amount && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Amount: {nft.amount}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formatTimestamp(nft.timestamp)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {nft.from.toLowerCase() === address.toLowerCase() ? (
              <ArrowUpRight className="w-4 h-4 text-red-500" />
            ) : (
              <ArrowDownLeft className="w-4 h-4 text-green-500" />
            )}
            <span>
              {nft.from.toLowerCase() === address.toLowerCase() ? 'Sent' : 'Received'}
            </span>
          </div>
        </div>
        
        {nft.metadata?.description && (
          <p className="mt-3 text-sm text-gray-700 line-clamp-3">
            {nft.metadata.description}
          </p>
        )}
        
        {nft.transactionHash && (
          <a 
            href={`https://monad-testnet.blockscout.com/tx/${nft.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Transaction <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );

  type Collection = {
    name?: string;
    contractAddress: string;
    tokenCount: number;
  };

  const CollectionCard = ({ collection }: { collection: Collection }) => (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            {collection.name || 'Unknown Collection'}
          </h3>
          <p className="text-sm text-gray-600">
            {formatAddress(collection.contractAddress)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            {collection.tokenCount}
          </p>
          <p className="text-sm text-gray-500">Tokens</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NFT Explorer
          </h1>
          <p className="text-lg text-gray-600">
            Discover NFTs on Monad Testnet
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter wallet address (0x...)"
                value={address}
                className="w-full pl-10 pr-24 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
              <button
                onClick={handleButtonClick}
                disabled={loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="max-w-7xl mx-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total NFTs</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {data.summary?.totalNFTTransfers || 0}
                    </p>
                  </div>
                  <Image className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Collections</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {data.summary?.totalNFTCollections || 0}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-green-600">
                      {data.summary?.totalTransactions || 0}
                    </p>
                  </div>
                  <Hash className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ETH Volume</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {parseFloat(data.summary?.totalEthVolumeIn || '0').toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-md">
              {['overview', 'nfts', 'collections'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-md font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">Account Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Address</h3>
                      <p className="text-gray-600 break-all">{data.address}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Gas Paid</h3>
                      <p className="text-gray-600">{data.summary?.totalGasPaidFormatted || '0'} MON</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">ETH In</h3>
                      <p className="text-gray-600">{data.summary?.totalEthVolumeIn || '0'} MON</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">ETH Out</h3>
                      <p className="text-gray-600">{data.summary?.totalEthVolumeOut || '0'} MON</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'nfts' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">NFT Transfers</h2>
                  {data.nftTransfers && data.nftTransfers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {data.nftTransfers.map((nft, index) => (
                        <NFTCard key={index} nft={nft} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No NFT transfers found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'collections' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">NFT Collections</h2>
                  {data.nftCollections && data.nftCollections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.nftCollections.map((collection, index) => (
                        <CollectionCard key={index} collection={collection} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No NFT collections found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTExplorer;