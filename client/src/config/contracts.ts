// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Hardhat local network
  "31337": {
    ProfileNFT: "0x3AbB9BE1ba1f966D609FaBC0Fc32434807D35112",
    ReputationCard: "0x329c874100fFf1eCd895c84335D3C9fF6cFA8499",
  },
  // Moonbase Alpha Testnet
  "1287": {
    ProfileNFT: "0xE4e866481DD94d3f79f3b45572569410204647ee",
    ReputationCard: "0x8C4e210D2D01f8fd5108c3E576eA30659D3aC0D8",
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
