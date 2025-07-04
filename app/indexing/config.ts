// app/Indexing/config.ts
export const holdDispalyThreshold = 10;
export const hasIndexedToAndFromTopics =
  process.env.NOT_INDEXED_TO_FROM !== "true";
export const hyperSyncEndpoint =
  "https://monad-testnet.rpc.hypersync.xyz/";
