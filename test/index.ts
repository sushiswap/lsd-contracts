import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const signPermitMessage = async (chainId:BigNumber, verifyingContract:Contract, signer:SignerWithAddress, spender:string, value:BigNumber, deadline:BigNumber) => {
  const owner = signer.address
  const nonce = await verifyingContract.nonces(signer.address)
  
  const typedData:any = {
    types: {
      Permit: [
        {
          name: "owner",
          type: "address"
        },
        {
          name: "spender",
          type: "address"
        },
        {
          name: "value",
          type: "uint256"
        },
        {
          name: "nonce",
          type: "uint256"
        },
        {
          name: "deadline",
          type: "uint256"
        }
      ],
    },
    primaryType: 'Permit' as const,
    domain: {
      chainId: chainId,
      verifyingContract: verifyingContract.address,
    },
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline
    }
  }
  return signer._signTypedData( typedData.domain , typedData.types , typedData.message);
}

describe("RedeemNFT", function () {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
    this.dev = this.signers[3]
    this.minter = this.signers[4]
  })
  it("Redeem w/o permit and check balances", async function () {
    // Instantiate and deploy Mock $LSD contract
    const FixedToken = await ethers.getContractFactory("FixedToken");
    const fixedToken = await FixedToken.deploy();
    await fixedToken.deployed();
    await fixedToken["initToken(string,string,address,uint256)"]("Bad Trip", "LSD", this.bob.address, "300000000000000000000");

    // Instantiate and deploy the RedeemNFT contract
    const RedeemNFT = await ethers.getContractFactory("RedeemNFT");
    const redeemNFT = await RedeemNFT.deploy(fixedToken.address, "");
    await redeemNFT.deployed();

    // Approve redeemNFT as a spender of Alice's $LSD tokens
    await fixedToken.approve(redeemNFT.address, "10000000000000000000");

    // Redeem the $LSD token for NFT
    await redeemNFT.redeemERC20ForNFT(this.alice.address);

    // Instantiate the already deployed ERC1155 contract
    const ERC1155Mint = await ethers.getContractFactory("ERC1155Mint");
    let address = await redeemNFT.nft();
    const erc1155Mint = await ERC1155Mint.attach(address);

    // Check that Alice's ERC1155 balance has increased
    expect(await (await erc1155Mint.balanceOf(this.alice.address, "0")).toNumber()).to.equal(10);

    // Check that Alice's $LSD balance has decreased
    expect(await (await fixedToken.balanceOf(this.alice.address)).toString()).to.equal("290000000000000000000");
  });
  it("Redeem w/ permit and check balances", async function () {
    // Instantiate and deploy Mock $LSD contract
    const FixedToken = await ethers.getContractFactory("FixedToken");
    const fixedToken = await FixedToken.deploy();
    await fixedToken.deployed();
    await fixedToken["initToken(string,string,address,uint256)"]("Bad Trip", "LSD", this.bob.address, "300000000000000000000");

    // Instantiate and deploy the RedeemNFT contract
    const RedeemNFT = await ethers.getContractFactory("RedeemNFT");
    const redeemNFT = await RedeemNFT.deploy(fixedToken.address, "");
    await redeemNFT.deployed();

    // Signing permit for $LSD token
    const deadline = (await this.alice.provider._internalBlockNumber).respTime + 10000

    const signedPermitMessage = await signPermitMessage(
        this.alice.provider._network.chainId,
        fixedToken,
        this.alice,
        redeemNFT.address,
        BigNumber.from(("10000000000000000000")),
        deadline
    );

    const { v, r, s } = ethers.utils.splitSignature(signedPermitMessage)
    
    // Redeem the $LSD token for NFT
    await redeemNFT.permitAndRedeemERC20ForNFT(this.alice.address, redeemNFT.address, BigNumber.from("10000000000000000000"), deadline, v, r, s);

    // Instantiate the already deployed ERC1155 contract
    const ERC1155Mint = await ethers.getContractFactory("ERC1155Mint");
    let address = await redeemNFT.nft();
    const erc1155Mint = await ERC1155Mint.attach(address);

    // Check that Alice's ERC1155 balance has increased
    expect(await (await erc1155Mint.balanceOf(this.alice.address, "0")).toNumber()).to.equal(10);

    // Check that Alice's $LSD balance has decreased
    expect(await (await fixedToken.balanceOf(this.alice.address)).toString()).to.equal("290000000000000000000");
  });
});
