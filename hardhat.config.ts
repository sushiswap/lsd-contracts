import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity:  {
    compilers: [
      {
        version: "0.8.4",
      }
    ],
    overrides: {
      "contracts/mocks/ERC20.sol": {
        version: "0.6.12",
        settings: { },
      },
      "@openzeppelin/contracts-legacy/token/ERC20/IERC20.sol": {
        version: "0.6.12",
        settings: { },
      },
      "@openzeppelin/contracts-legacy/math/SafeMath.sol": {
        version: "0.6.12",
        settings: { },
      },
      "@openzeppelin/contracts-legacy/GSN/Context.sol": {
        version: "0.6.12",
        settings: { },
      },
      "contracts/mocks/IERC20.sol": {
        version: "0.6.12",
        settings: { },
      },
      "contracts/mocks/IMisoToken.sol": {
        version: "0.6.12",
        settings: { },
      },
      "contracts/mocks/FixedToken.sol": {
        version: "0.6.12",
        settings: { },
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        blockNumber: 14127849
      },
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
