import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFT", function () {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
    this.dev = this.signers[3]
    this.minter = this.signers[4]
  })
  it("Redeem and check balances", async function () {
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const erc20Mock = await ERC20Mock.deploy("Bad Trip", "LSD", "300000000000000000000");
  
    await erc20Mock.deployed();

    const RedeemNFT = await ethers.getContractFactory("RedeemNFT");
    const redeemNFT = await RedeemNFT.deploy(erc20Mock.address, "");
  
    await redeemNFT.deployed();

    await erc20Mock.approve(redeemNFT.address, "10000000000000000000");
    let allowance = await erc20Mock.allowance(this.alice.address, redeemNFT.address);

    await redeemNFT.redeemERC20ForNFT(this.alice.address);

    const ERC1155Mint = await ethers.getContractFactory("ERC1155Mint");
    let address = await redeemNFT.nft();
    const erc1155Mint = await ERC1155Mint.attach(address);

    let balance = await erc1155Mint.balanceOf(this.alice.address, "0");

    expect(await (await erc1155Mint.balanceOf(this.alice.address, "0")).toNumber()).to.equal(10);
  });
});
