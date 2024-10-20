import { HardhatUserConfig } from "hardhat/config";
import '@oasisprotocol/sapphire-hardhat';
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-switch-network";
// import "dotenv/config"
import "./tasks"

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    'bsc-testnet': {
      url: 'https://bsc-testnet-rpc.publicnode.com',
      // url: 'https://bsc-testnet.blockpi.network/v1/rpc/public',
      // url: `https://bsc-testnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 97,
      accounts,
    },
    'sapphire-testnet': {
      // This is Testnet! If you want Mainnet, add a new network config item.
      url: "https://testnet.sapphire.oasis.io",
      accounts,
      chainId: 23295, // 0x5aff
    },
  },
};

export default config;
