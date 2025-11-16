import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox"; // This includes ethers
import "dotenv/config";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey ) {
  throw new Error("Please set your PRIVATE_KEY in a .env file");
}

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    moonbaseAlpha: {
      url: process.env.MOONBASE_RPC_URL || "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: [privateKey],
    },
    paseo: {
      url: "https://kusama-asset-hub-eth-rpc.polkadot.io",
      chainId: 420420418,
      accounts: [privateKey],
    },
  },
};

export default config;
