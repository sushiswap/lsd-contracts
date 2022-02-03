import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
const hre = require('hardhat');

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"
const LSD_TOKEN_ADDRESS = "0x749b964f3dd571b177fc6e415a07f62b05047da4"
// balance: 1299999999999999994 @blockNum: 14127849
const LSD_HOLDER_ADDRESS = "0x5F43Cd8B5Eead549de4444a644B4Cb425A4ea5b2"
const TOKEN_ID = BigNumber.from(0)

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
    LSD = await LSD.connect(this.lsdHolder);
    const lsd = await LSD.attach(LSD_TOKEN_ADDRESS);
    const balance_before_redemption = await lsd.balanceOf(LSD_HOLDER_ADDRESS);
    const balance_after_expected = balance_before_redemption.mod(getBigNumber(1));

    const LSDHelper = await ethers.getContractFactory("LSDHelper");
    let lsdHelper = await LSDHelper.deploy(LSD_TOKEN_ADDRESS, "");
    await lsdHelper.deployed();
    lsdHelper = await lsdHelper.connect(this.lsdHolder);

    // redeem ERC20 for NFT
    await lsd.approve(lsdHelper.address, balance_before_redemption);
    await lsdHelper.redeem(1);

    const balance_after_actual = await lsd.balanceOf(LSD_HOLDER_ADDRESS);

    // validate the burned balance
    expect(balance_after_expected).to.equal(balance_after_actual);

    const burn_balance_actual = await lsd.balanceOf(BURN_ADDRESS);
    const burn_balance_expected = balance_after_actual;
    expect(burn_balance_actual).to.equal(balance_before_redemption.sub(balance_after_expected));

    // Instantiate the already deployed ERC1155 contract
    const ERC1155 = await ethers.getContractFactory("ERC1155_");
    let address = await lsdHelper.nft();
    const erc1155 = await ERC1155.attach(address);

    // validate nft balance of LSDHelper
    const helper_nft_balance = await erc1155.balanceOf(lsdHelper.address, TOKEN_ID);
    expect(helper_nft_balance).to.equal(BigNumber.from(299));

    // validate nft balacne of lsdHolder
    const lsd_holder_nft_balance = await erc1155.balanceOf(LSD_HOLDER_ADDRESS, TOKEN_ID);
    expect(lsd_holder_nft_balance).to.equal(BigNumber.from(1));
  });
});

const getBigNumber = (amount:number, decimals = 18) => {
  const BASE_TEN = 10
  return BigNumber.from(amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
}