// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Hardhat local network
  "31337": {
    ProfileNFT: "0x8dE001e46FbF6C87A988E348447456831E30dD5e",
    ReputationCard: "0xc64d1c1c0b5F255639bE76952f2D8Dfc45032aEB",
  },
  // Moonbase Alpha Testnet
  "1287": {
    ProfileNFT: "0xB96f6215AF24a5488348cAF7ab708195834EE182",
    ReputationCard: "0x0000000000000000000000000000000000000000",
  },
};

// Network configurations
export const NETWORKS = {
  "31337": {
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
  },
  "1287": {
    name: "Moonbase Alpha",
    rpcUrl: "https://rpc.api.moonbase.moonbeam.network",
    chainId: 1287,
  },
};

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;
