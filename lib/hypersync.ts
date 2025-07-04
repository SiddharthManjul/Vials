/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  HypersyncClient,
  JoinMode,
  BlockField,
  TransactionField,
  TraceField,
  LogField,
  Query,
} from "@envio-dev/hypersync-client"; // Adjust import based on your environment
import {
  formatGwei,
  formatEther,
  decodeAbiParameters,
  parseAbiParameters,
} from "viem";

import fs from "node:fs";

// ERC-721 Transfer event signature: Transfer(address,address,uint256)
const ERC721_TRANSFER_SIGNATURE =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// ERC-1155 TransferSingle event signature: TransferSingle(address,address,address,uint256,uint256)
const ERC1155_TRANSFER_SINGLE_SIGNATURE =
  "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";
// ERC-1155 TransferBatch event signature: TransferBatch(address,address,address,uint256[],uint256[])
const ERC1155_TRANSFER_BATCH_SIGNATURE =
  "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";

interface NFTTransfer {
  transactionHash: string;
  blockNumber: number;
  timestamp?: number;
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
  tokenType: "ERC-721" | "ERC-1155";
  amount?: string; // For ERC-1155
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    animationUrl?: string;
    attributes?: any[];
  };
}

interface NFTCollection {
  contractAddress: string;
  name?: string;
  symbol?: string;
  tokenCount: number;
  floorPrice?: string;
}

// Helper function to fetch NFT metadata from URI
async function fetchNFTMetadata(tokenUri: string): Promise<any> {
  try {
    // Handle IPFS URIs
    if (tokenUri.startsWith("ipfs://")) {
      tokenUri = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(tokenUri, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch metadata from ${tokenUri}:`, error);
    return null;
  }
}

// Helper function to get token URI from contract (simplified - you might need to implement actual contract calls)
async function getTokenURI(
  contractAddress: string,
  tokenId: string
): Promise<string | null> {
  // This would typically involve calling the contract's tokenURI method
  // For now, we'll return a placeholder - you'll need to implement actual contract calls
  // using your preferred method (ethers.js, viem, etc.)
  try {
    // Example implementation - replace with actual contract call
    // const contract = new Contract(contractAddress, ['function tokenURI(uint256) view returns (string)'], provider);
    // return await contract.tokenURI(tokenId);

    // Placeholder return - implement actual contract call
    return null;
  } catch (error) {
    console.error(
      `Failed to get token URI for ${contractAddress}:${tokenId}:`,
      error
    );
    return null;
  }
}

export async function fetchBlockchainData(address: string) {
  const targetAddress = address.toLowerCase();
  const hyperSyncEndpoint = "https://monad-testnet.hypersync.xyz";

  const client = HypersyncClient.new({
    url: hyperSyncEndpoint,
    maxNumRetries: 5,
    httpReqTimeoutMillis: 60000,
  });

  const query: Query = {
    fromBlock: 0,
    traces: [{ to: [targetAddress] }, { from: [targetAddress] }],
    transactions: [{ from: [targetAddress] }, { to: [targetAddress] }],
    logs: [
      // ERC-721 Transfer events
      {
        topics: [
          [ERC721_TRANSFER_SIGNATURE],
          [], // from (any address)
          [targetAddress], // to (target address)
          [], // tokenId (any)
        ],
      },
      {
        topics: [
          [ERC721_TRANSFER_SIGNATURE],
          [targetAddress], // from (target address)
          [], // to (any address)
          [], // tokenId (any)
        ],
      },
      // ERC-1155 TransferSingle events
      {
        topics: [
          [ERC1155_TRANSFER_SINGLE_SIGNATURE],
          [], // operator
          [targetAddress], // from (target address)
          [], // to (any address)
        ],
      },
      {
        topics: [
          [ERC1155_TRANSFER_SINGLE_SIGNATURE],
          [], // operator
          [], // from (any address)
          [targetAddress], // to (target address)
        ],
      },
      // ERC-1155 TransferBatch events
      {
        topics: [
          [ERC1155_TRANSFER_BATCH_SIGNATURE],
          [], // operator
          [targetAddress], // from (target address)
          [], // to (any address)
        ],
      },
      {
        topics: [
          [ERC1155_TRANSFER_BATCH_SIGNATURE],
          [], // operator
          [], // from (any address)
          [targetAddress], // to (target address)
        ],
      },
    ],
    fieldSelection: {
      block: [BlockField.Number, BlockField.Timestamp, BlockField.Hash],
      transaction: [
        TransactionField.Hash,
        TransactionField.Nonce,
        TransactionField.BlockHash,
        TransactionField.BlockNumber,
        TransactionField.TransactionIndex,
        TransactionField.From,
        TransactionField.To,
        TransactionField.Value,
        TransactionField.GasPrice,
        TransactionField.Gas,
        TransactionField.Input,
        TransactionField.Status,
        TransactionField.EffectiveGasPrice,
        TransactionField.GasUsed,
        TransactionField.MaxFeePerGas,
        TransactionField.MaxPriorityFeePerGas,
        TransactionField.Kind,
      ],
      trace: [
        TraceField.Value,
        TraceField.From,
        TraceField.To,
        TraceField.TransactionHash,
      ],
      log: [
        LogField.Address,
        LogField.Topic0,
        LogField.Topic1,
        LogField.Topic2,
        LogField.Topic3,
        LogField.Data,
        LogField.TransactionHash,
        LogField.BlockNumber,
      ],
    },
    joinMode: JoinMode.JoinNothing,
  };

  console.log("Running the query...");
  const receiver = await client.stream(query, {});

  // Base transaction interface from HyperSync
  interface Transaction {
    hash?: string;
    nonce?: number | bigint;
    blockHash?: string;
    blockNumber?: number;
    transactionIndex?: number;
    from?: string;
    to?: string;
    value?: string | bigint;
    gasPrice?: string | bigint;
    gas?: number | bigint;
    input?: string;
    status?: number;
    effectiveGasPrice?: string | bigint;
    gasUsed?: string | bigint;
    maxFeePerGas?: string | bigint;
    maxPriorityFeePerGas?: string | bigint;
    type?: number;
    timestamp?: number;
    transactionHash?: string;
    gasUsedForL1?: bigint;
  }

  // Enhanced transaction with formatted values
  interface EnhancedTransaction extends Transaction {
    gasUsedFormatted: string;
    gasPriceFormatted: string;
    gasFeeFormatted: string;
    valueFormatted: string;
  }

  // Collections
  const transactions: EnhancedTransaction[] = [];
  const nftTransfers: NFTTransfer[] = [];
  const nftCollections: Map<string, NFTCollection> = new Map();

  // Tracking variables
  let total_gas_paid = BigInt(0);
  let total_wei_volume_out = BigInt(0);
  let total_wei_volume_in = BigInt(0);
  let wei_count_in = 0;
  let wei_count_out = 0;
  let total_eoa_tx_sent = 0;
  let batchCount = 0;
  let highestBlockScanned = 0;

  // Process the results
  while (true) {
    const res = await receiver.recv();
    if (res === null) break;

    batchCount++;
    highestBlockScanned = Math.max(highestBlockScanned, res.nextBlock);

    // Process transactions
    if (res.data.transactions && res.data.transactions.length > 0) {
      for (const tx of res.data.transactions) {
        if (!tx.hash) continue;

        // Initialize enhanced transaction with base properties
        const enhancedTx: EnhancedTransaction = {
          ...tx,
          gasUsedFormatted: "0",
          gasPriceFormatted: "0 Gwei",
          gasFeeFormatted: "0 MON",
          valueFormatted: "0",
        };

        // Find block timestamp from block data and assign to transaction
        if (res.data.blocks && res.data.blocks.length > 0) {
          // First try to find by block hash
          const txBlock = res.data.blocks.find(
            (block) => block.hash === tx.blockHash
          );

          if (txBlock && txBlock.timestamp) {
            enhancedTx.timestamp = Number(txBlock.timestamp);
            console.log(
              `Found timestamp ${txBlock.timestamp} for tx ${tx.hash.slice(
                0,
                6
              )}`
            );
          } else {
            // Try to find by block number
            const blockByNumber = res.data.blocks.find(
              (block) => block.number === tx.blockNumber
            );

            if (blockByNumber && blockByNumber.timestamp) {
              enhancedTx.timestamp = Number(blockByNumber.timestamp);
              console.log(
                `Found timestamp by block number for tx ${tx.hash.slice(0, 6)}`
              );
            } else {
              // If no timestamp found, use block number * 100000 as a proxy timestamp
              const proxyTimestamp = tx.blockNumber
                ? Number(tx.blockNumber) * 100000
                : 0;
              enhancedTx.timestamp = proxyTimestamp;
              console.log(
                `Using block number ${
                  tx.blockNumber
                } as timestamp proxy for tx ${tx.hash.slice(0, 6)}`
              );
            }
          }
        }

        if (tx.gasUsed && tx.effectiveGasPrice) {
          const gasUsed = BigInt(tx.gasUsed);
          const gasPrice = BigInt(tx.effectiveGasPrice);
          const gasFee = gasPrice * gasUsed;

          enhancedTx.gasUsedFormatted = gasUsed.toString();
          enhancedTx.gasPriceFormatted = formatGwei(gasPrice);
          enhancedTx.gasFeeFormatted = formatEther(gasFee);

          if (tx.from && tx.from.toLowerCase() === targetAddress) {
            total_eoa_tx_sent += 1;
            total_gas_paid += gasFee;
          }
        }

        if (tx.value) {
          enhancedTx.valueFormatted = formatEther(BigInt(tx.value));

          // Count transactions with value as transfers
          const valueInWei = BigInt(tx.value);
          if (valueInWei > 0) {
            if (tx.from && tx.from.toLowerCase() === targetAddress) {
              // Outgoing transaction with value
              wei_count_out++;
              total_wei_volume_out += valueInWei;
            }

            if (tx.to && tx.to.toLowerCase() === targetAddress) {
              // Incoming transaction with value
              wei_count_in++;
              total_wei_volume_in += valueInWei;
            }
          }
        }

        transactions.push(enhancedTx);
      }
    }

    // Process traces for ETH transfers
    if (res.data.traces) {
      for (const trace of res.data.traces) {
        if (!trace.from || !trace.to || !trace.value) continue;

        const fromAddress = trace.from.toLowerCase();
        const toAddress = trace.to.toLowerCase();
        const traceValue = BigInt(trace.value);

        if (fromAddress === targetAddress) {
          wei_count_out++;
          total_wei_volume_out += traceValue;
        } else if (toAddress === targetAddress) {
          wei_count_in++;
          total_wei_volume_in += traceValue;
        }
      }
    }

    // Process logs for NFT transfers
    if (res.data.logs) {
      for (const log of res.data.logs) {
        if (!log.topics[0] || !log.address || !log.transactionHash) continue;

        try {
          const timestamp = res.data.blocks?.find(
            (block) => block.number === log.blockNumber
          )?.timestamp;

          if (log.topics[0] === ERC721_TRANSFER_SIGNATURE) {
            // ERC-721 Transfer
            if (log.topics[1] && log.topics[2] && log.topics[3]) {
              const from = "0x" + log.topics[1].slice(26); // Remove padding
              const to = "0x" + log.topics[2].slice(26); // Remove padding
              const tokenId = BigInt(log.topics[3]).toString();

              // Only process if our target address is involved
              if (
                from.toLowerCase() === targetAddress ||
                to.toLowerCase() === targetAddress
              ) {
                const nftTransfer: NFTTransfer = {
                  transactionHash: log.transactionHash,
                  blockNumber: log.blockNumber || 0,
                  timestamp: timestamp ? Number(timestamp) : undefined,
                  contractAddress: log.address,
                  tokenId,
                  from,
                  to,
                  tokenType: "ERC-721",
                };

                // Try to fetch metadata
                try {
                  const tokenUri = await getTokenURI(log.address, tokenId);
                  if (tokenUri) {
                    const metadata = await fetchNFTMetadata(tokenUri);
                    if (metadata) {
                      nftTransfer.metadata = metadata;
                    }
                  }
                } catch (error) {
                  console.error(
                    `Failed to fetch metadata for NFT ${log.address}:${tokenId}:`,
                    error
                  );
                }

                nftTransfers.push(nftTransfer);

                // Update collection tracking
                if (!nftCollections.has(log.address)) {
                  nftCollections.set(log.address, {
                    contractAddress: log.address,
                    tokenCount: 0,
                  });
                }
                const collection = nftCollections.get(log.address)!;
                collection.tokenCount++;
              }
            }
          } else if (log.topics[0] === ERC1155_TRANSFER_SINGLE_SIGNATURE) {
            // ERC-1155 TransferSingle
            if (log.topics[1] && log.topics[2] && log.topics[3] && log.data) {
              const operator = "0x" + log.topics[1].slice(26);
              const from = "0x" + log.topics[2].slice(26);
              const to = "0x" + log.topics[3].slice(26);

              // Only process if our target address is involved
              if (
                from.toLowerCase() === targetAddress ||
                to.toLowerCase() === targetAddress
              ) {
                try {
                  // Decode the data field to get tokenId and amount
                  const decoded = decodeAbiParameters(
                    parseAbiParameters("uint256, uint256"),
                    log.data as `0x${string}`
                  );
                  const tokenId = decoded[0].toString();
                  const amount = decoded[1].toString();

                  const nftTransfer: NFTTransfer = {
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber || 0,
                    timestamp: timestamp ? Number(timestamp) : undefined,
                    contractAddress: log.address,
                    tokenId,
                    from,
                    to,
                    tokenType: "ERC-1155",
                    amount,
                  };

                  // Try to fetch metadata
                  try {
                    const tokenUri = await getTokenURI(log.address, tokenId);
                    if (tokenUri) {
                      const metadata = await fetchNFTMetadata(tokenUri);
                      if (metadata) {
                        nftTransfer.metadata = metadata;
                      }
                    }
                  } catch (error) {
                    console.error(
                      `Failed to fetch metadata for NFT ${log.address}:${tokenId}:`,
                      error
                    );
                  }

                  nftTransfers.push(nftTransfer);

                  // Update collection tracking
                  if (!nftCollections.has(log.address)) {
                    nftCollections.set(log.address, {
                      contractAddress: log.address,
                      tokenCount: 0,
                    });
                  }
                  const collection = nftCollections.get(log.address)!;
                  collection.tokenCount++;
                } catch (error) {
                  console.error("Failed to decode ERC-1155 data:", error);
                }
              }
            }
          } else if (log.topics[0] === ERC1155_TRANSFER_BATCH_SIGNATURE) {
            // ERC-1155 TransferBatch - more complex, would need additional decoding
            // For now, we'll skip this or implement a simplified version
            console.log(
              "ERC-1155 TransferBatch detected but not fully implemented"
            );
          }
        } catch (error) {
          console.error("Error processing NFT log:", error);
        }
      }
    }
  }

  // Sort NFT transfers by timestamp (newest first)
  nftTransfers.sort((a, b) => {
    if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
    return (b.blockNumber || 0) - (a.blockNumber || 0);
  });

  // Define interface for our ETH transfer type
  interface EthTransfer {
    txHash: string;
    valueFormatted: string;
    from: string;
    to: string;
  }

  // Log what timestamps we have before returning
  console.log(
    "Transaction timestamps before return:",
    transactions.map((tx) => ({
      hash: tx.hash ? tx.hash.slice(0, 6) : "unknown",
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      date: tx.timestamp
        ? new Date(tx.timestamp * 1000).toLocaleString()
        : "None",
    }))
  );

  // Sort transactions by timestamp (newest first) or block number as fallback
  transactions.sort((a, b) => {
    // Primary sort by timestamp if available
    if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
    // Fallback to block number
    if (a.blockNumber && b.blockNumber)
      return Number(b.blockNumber) - Number(a.blockNumber);
    return 0;
  });

  // Return the enhanced data including NFTs
  return {
    address: targetAddress,
    summary: {
      totalTransactions: transactions.length,
      totalETHTransfers: wei_count_in + wei_count_out,
      totalNFTTransfers: nftTransfers.length,
      totalNFTCollections: nftCollections.size,
      totalERC20Transfers: 0,
      totalERC20Approvals: 0,
      totalERC20Tokens: 0,
      totalGasPaidFormatted: formatEther(total_gas_paid),
      totalEthVolumeIn: formatEther(total_wei_volume_in),
      totalEthVolumeOut: formatEther(total_wei_volume_out),
      scannedBlocks: highestBlockScanned,
    },
    transactions,
    nftTransfers,
    nftCollections: Array.from(nftCollections.values()),
    ethTransfers: [] as EthTransfer[],
    erc20Transfers: [],
    erc20Approvals: [],
  };
}
