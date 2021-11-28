pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

interface ERC20 is IERC20, IERC20Permit{

}

contract ERC1155Mint is ERC1155 {
  constructor(address to, string memory _uri)
  ERC1155(
        _uri
  )
  {
    _mint(to, 0, 300, "");
  }
}

contract RedeemNFT {
  ERC20 public immutable token;
  ERC1155 public immutable nft;

  constructor(address _token, string memory _uri)
  {
    token = ERC20(_token);
    nft = new ERC1155Mint(address(this), _uri);
  }

  function redeemERC20ForNFT(address redeemer) public {
    uint256 balance = token.allowance(redeemer, address(this)) / 10**18;
    require(balance > 0, "Balance of redemption token less than 1");
    token.transferFrom(redeemer, address(this), balance * 10**18);
    uint256 nftbalance = nft.balanceOf(address(this), 0);
    nft.safeTransferFrom(address(this), redeemer, 0, balance, "");
  }

  function permitAndRedeemERC20ForNFT(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
      token.permit(owner, spender, value, deadline, v, r, s);
      redeemERC20ForNFT(owner);
    }
}