import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "0x" + "0".repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    luksoTestnet: {
      url: process.env.LUKSO_TESTNET_RPC_URL ?? "https://rpc.testnet.lukso.network",
      chainId: 4201,
      accounts: [PRIVATE_KEY],
    },
    lukso: {
      url: process.env.LUKSO_RPC_URL ?? "https://rpc.lukso.network",
      chainId: 42,
      accounts: [PRIVATE_KEY],
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
