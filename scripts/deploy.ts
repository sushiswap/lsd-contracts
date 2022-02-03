// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
const hre = require('hardhat');

const fs = require('fs');
const config:any = {};

const readJSON = (dir:string, file:string) => {
  return new Promise((resolve, reject) => {
      fs.readFile(dir + "/" + file, 'utf8', (err:string, jsonString:string) => {
          if (err) {
              reject(err)
          }
          resolve(JSON.parse(jsonString))
      })
  })
}
const readConfig = async() => {
  config.token = await readJSON("./data/", "token.json")
  config.uri = await readJSON("./data/", "uri.json")
}

async function main() {
    await readConfig()
    // Instantiate and deploy the LSDHelper contract
    const LSDHelper = await ethers.getContractFactory("LSDHelper");
    const lsdHelper = await LSDHelper.deploy(config.token.address, config.uri.uri);
    await lsdHelper.deployed();

    console.log(lsdHelper.address);
    console.log(await lsdHelper.nft());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
