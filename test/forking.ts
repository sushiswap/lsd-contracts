import { expect } from "chai";
import { ethers } from "hardhat";
const hre = require('hardhat');

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"
const LSD_TOKEN_ADDRESS = "0x749b964f3dd571b177fc6e415a07f62b05047da4"
const LSD_HOLDER_ADDRESS = "0x5F43Cd8B5Eead549de4444a644B4Cb425A4ea5b2"

describe("LSDHelper", function () {
  before(async function () {
    this.signers = await ethers.getSigners();
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LSD_HOLDER_ADDRESS],
    });
    this.lsdHolder = await ethers.provider.getSigner(LSD_HOLDER_ADDRESS);
  })
  it("Redeem ERC20 for NFT", async function () {

    let LSD = await ethers.getContractFactory("FixedToken");
    LSD = await LSD.connect(this.lsdHolder)
    const lsd = await LSD.attach(LSD_TOKEN_ADDRESS)
    const balance_before_transfer = await lsd.balanceOf(LSD_HOLDER_ADDRESS);
    
    await lsd.transfer(BURN_ADDRESS, balance_before_transfer)
    const balance_after_transfer = await lsd.balanceOf(LSD_HOLDER_ADDRESS);

    const LSDHelper = await ethers.getContractFactory("LSDHelper");
    this.lsdHelper = await LSDHelper.deploy(LSD_TOKEN_ADDRESS, "");
    await this.lsdHelper.deployed();

    console.log("balance before: " + balance_before_transfer)
    console.log("balance after: " + balance_after_transfer)
  });
});