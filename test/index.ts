import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("LSDHelper", function () {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
    this.dev = this.signers[3]
    this.minter = this.signers[4]
  })
  beforeEach(async function() {
    // Instantiate and deploy Mock $LSD contract
    const FixedToken = await ethers.getContractFactory("FixedToken");
    this.erc20 = await FixedToken.deploy();
    await this.erc20.deployed();
    await this.erc20["initToken(string,string,address,uint256)"]("Bad Trip", "LSD", this.bob.address, "300000000000000000000");

    // Instantiate and deploy the LSDHelper contract
    const LSDHelper = await ethers.getContractFactory("LSDHelper");
    this.lsdHelper = await LSDHelper.deploy(this.erc20.address, "");
    await this.lsdHelper.deployed();

    // Instantiate the already deployed ERC1155 contract
    const ERC1155Mint = await ethers.getContractFactory("ERC1155Mint");
    let address = await this.lsdHelper.nft();
    this.erc1155 = await ERC1155Mint.attach(address);
  });
  it("Redeem ERC20 for NFT w/ permit and check balances", async function () {
    const AMOUNT = BigNumber.from("10000000000000000000");
    const EXPECTED_BALANCE = BigNumber.from("290000000000000000000");
    const TOKEN_ID = "0";

    // Signing permit for $LSD token
    const deadline = (await this.alice.provider._internalBlockNumber).respTime + 10000

    const signedPermitERC20 = await signPermitERC20(
        this.alice.provider._network.chainId,
        this.erc20,
        this.alice,
        this.lsdHelper.address,
        AMOUNT,
        deadline
    );

    const erc20Sig = ethers.utils.splitSignature(signedPermitERC20)
    
    // Redeem the $LSD token for NFT
    await this.lsdHelper.permitAndRedeemERC20ForNFT(this.alice.address, this.lsdHelper.address, AMOUNT, deadline, erc20Sig.v, erc20Sig.r, erc20Sig.s);

    // Check that Alice's ERC1155 balance has increased
    expect(await (await this.erc1155.balanceOf(this.alice.address, TOKEN_ID)).toNumber()).to.equal(10);

    // Check that Alice's $LSD balance has decreased
    expect(await (await this.erc20.balanceOf(this.alice.address))).to.equal(EXPECTED_BALANCE);
  });
  it("Redeem NFT for ERC20 and check balances", async function () {
    const AMOUNT = BigNumber.from("10000000000000000000");
    const EXPECTED_BALANCE = BigNumber.from("290000000000000000000");
    const EXPECTED_NFT_BALANCE = 0;
    const EXPECTED_NFT_BALANCE_POST_REDEMPTION = 10;
    const EXPECTED_BALANCE_POST_REDEMPTION = BigNumber.from("300000000000000000000");
    const TOKEN_ID = "0";
    const deadline = (await this.alice.provider._internalBlockNumber).respTime + 10000

    // Signing permit for $LSD token
    const signedPermitERC20 = await signPermitERC20(
        this.alice.provider._network.chainId,
        this.erc20,
        this.alice,
        this.lsdHelper.address,
        AMOUNT,
        deadline
    );

    const erc20Sig = ethers.utils.splitSignature(signedPermitERC20)
    
    // Redeem the $LSD token for NFT
    await this.lsdHelper.permitAndRedeemERC20ForNFT(this.alice.address, this.lsdHelper.address, AMOUNT, deadline, erc20Sig.v, erc20Sig.r, erc20Sig.s);
    // Check that Alice's ERC1155 balance has increased
    expect(await (await this.erc1155.balanceOf(this.alice.address, TOKEN_ID)).toNumber()).to.equal(EXPECTED_NFT_BALANCE_POST_REDEMPTION);

    // Check that Alice's $LSD balance has decreased
    expect(await (await this.erc20.balanceOf(this.alice.address))).to.equal(EXPECTED_BALANCE);

    const signedERC1155Permit = await signERC1155Permit(
        this.alice.provider._network.chainId,
        this.erc1155,
        this.alice,
        this.lsdHelper.address,
        true,
        deadline
    );

    const erc1155Sig = ethers.utils.splitSignature(signedERC1155Permit)
    
    // Redeem the NFT token for $LSD
    await this.lsdHelper.permitAndRedeemNFTForERC20(this.alice.address, this.lsdHelper.address, true, deadline, erc1155Sig.v, erc1155Sig.r, erc1155Sig.s);

    // Check that Alice's ERC1155 balance has decreased
    expect(await (await this.erc1155.balanceOf(this.alice.address, TOKEN_ID))).to.equal(EXPECTED_NFT_BALANCE);

    // Check that Alice's $LSD balance has decreased
    expect(await (await this.erc20.balanceOf(this.alice.address))).to.equal(EXPECTED_BALANCE_POST_REDEMPTION);
  });
});

const signPermitERC20 = async (chainId:BigNumber, verifyingContract:Contract, signer:SignerWithAddress, spender:string, value:BigNumber, deadline:BigNumber) => {
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

const signERC1155Permit = async (chainId:BigNumber, verifyingContract:Contract, signer:SignerWithAddress, spender:string, approved:Boolean, deadline:BigNumber) => {
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
          name: "approved",
          type: "bool"
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
      approved,
      nonce,
      deadline
    }
  }
  return signer._signTypedData( typedData.domain , typedData.types , typedData.message);
}