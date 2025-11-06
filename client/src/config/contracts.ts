// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Hardhat local network
  31337: {
    ProfileNFT: "0xedaaAa2393De28d15cacCBa6933B1b24215a8699",
    ReputationCard: "0x61cd4010d3bA7456755651D130e013F3EEf6bFdf"
  },
  // Moonbase Alpha Testnet
  1287: {
    ProfileNFT: "0xB96f6215AF24a5488348cAF7ab708195834EE182", // Update this after deployment
    ReputationCard: "0x0000000000000000000000000000000000000000" // Update this after deployment
  },
  // Add other networks when deploying to mainnet/testnets
  // 1: { // Ethereum Mainnet
  //   ProfileNFT: "0x...",
  //   ReputationCard: "0x..."
  // },
  // 11155111: { // Sepolia Testnet
  //   ProfileNFT: "0x...",
  //   ReputationCard: "0x..."
  // }
} as const;

// Network configurations
export const NETWORKS = {
  31337: {
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
  },
  1287: {
    name: "Moonbase Alpha",
    rpcUrl: "https://rpc.api.moonbase.moonbeam.network",
    chainId: 1287,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;
