import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      // Use default Hardhat accounts for funding, then we'll add your key
    },
    localhostCustom: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: ["0x6527d94cfbcd7d52564ee5c59cfcfd5582d43b090721780c7d8d39c2d2b91be3"],
    },
    moonbase: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
