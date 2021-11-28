pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ERC20 is IERC20, IERC20Permit{

}

contract NFT is ERC1155 {
  ERC20 immutable redemptionToken;

  constructor(address _redemptionToken, string memory _uri)
  ERC1155(
        _uri
  )
  {
    redemptionToken = ERC20(_redemptionToken);
    _mint(address(this), 0, 300*10**18, "");
  }

  function redeemERC20ForNFT(address redeemer) public {
    uint256 balance = redemptionToken.allowance(redeemer, address(this)) / 10**18;
    require(balance > 0, "Balance of redemption token less than 1");
    redemptionToken.transferFrom(redeemer, address(this), balance * 10**18);
    safeTransferFrom(address(this), redeemer, 0, balance * 10**18, "");
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
      redemptionToken.permit(owner, spender, value, deadline, v, r, s);
      redeemERC20ForNFT(owner);
    }
}