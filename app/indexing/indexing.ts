// app/Indexing/indexer.ts
import {
  HypersyncClient,
  Decoder,
  BlockField,
  LogField,
} from "@envio-dev/hypersync-client";
import {
  hasIndexedToAndFromTopics,
  holdDispalyThreshold,
  hyperSyncEndpoint,
} from "./config";

const transferEventSigHash =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // ERC721 Transfer

export async function fetchNFTInteractions(targetContract: string) {
  const client = HypersyncClient.new({ url: hyperSyncEndpoint });

  const query = {
    fromBlock: 0,
    logs: [
      {
        address: [targetContract],
        topics: [[transferEventSigHash]],
      },
    ],
    fieldSelection: {
      block: [BlockField.Timestamp],
      log: [
        LogField.Data,
        LogField.Topic0,
        LogField.Topic1,
        LogField.Topic2,
        LogField.Topic3,
      ],
    },
  };

  const receiver = await client.streamEvents(query, {});
  const decoder = Decoder.fromSignatures([
    hasIndexedToAndFromTopics
      ? "Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      : "Transfer(address from, address to, uint256 tokenId)",
  ]);

  const nftInteractions: Record<
    string,
    {
      tokenIds: Set<bigint>;
      transfersIn: number;
      transfersOut: number;
    }
  > = {};

  while (true) {
    const res = await receiver.recv();
    if (res === null) break;

    const decodedLogs = await decoder.decodeEvents(res.data);

    for (let i = 0; i < decodedLogs.length; i++) {
      const log = decodedLogs[i];
      const rawLogData = res.data[i];

      if (
        !log ||
        !rawLogData.block ||
        !log.indexed ||
        !log.body ||
        log.indexed.length < (hasIndexedToAndFromTopics ? 2 : 0) ||
        log.body.length < (hasIndexedToAndFromTopics ? 0 : 3)
      ) {
        continue;
      }

      const from = (hasIndexedToAndFromTopics ? log.indexed[0] : log.body[0])
        .val as string;
      const to = (hasIndexedToAndFromTopics ? log.indexed[1] : log.body[1])
        .val as string;
      const tokenId = (hasIndexedToAndFromTopics ? log.indexed[2] : log.body[2])
        .val as bigint;

      if (!nftInteractions[from]) {
        nftInteractions[from] = {
          tokenIds: new Set(),
          transfersIn: 0,
          transfersOut: 0,
        };
      }

      if (!nftInteractions[to]) {
        nftInteractions[to] = {
          tokenIds: new Set(),
          transfersIn: 0,
          transfersOut: 0,
        };
      }

      nftInteractions[from].tokenIds.delete(tokenId);
      nftInteractions[from].transfersOut += 1;

      nftInteractions[to].tokenIds.add(tokenId);
      nftInteractions[to].transfersIn += 1;
    }
  }

  // Convert sets to arrays for serialization
  const result = Object.entries(nftInteractions).map(([address, data]) => ({
    address,
    tokenIds: Array.from(data.tokenIds),
    transfersIn: data.transfersIn,
    transfersOut: data.transfersOut,
  }));

  return result.filter((entry) => entry.tokenIds.length > holdDispalyThreshold);
}
