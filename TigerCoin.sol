// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TigerCoin is ERC20, ERC20Permit, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;

    constructor() ERC20("TigerCoin", "TIGR") ERC20Permit("TigerCoin") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);  // Mint initial supply to contract deployer
    }

    // Function to mint new tokens (only the owner can call this)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Function to spend tokens for featuring a question
    function spendToFeature(address spender, uint256 amount) external {
        _transfer(spender, address(this), amount);  // Transfers tokens to contract's address
    }


}
