// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title MockToken
/// @notice Minimal ERC-20 / LSP7-compatible balanceOf mock for testing drop eligibility gates.
///         Only implements balanceOf(address) → uint256.
contract MockToken {
    mapping(address => uint256) private _balances;

    function setBalance(address account, uint256 amount) external {
        _balances[account] = amount;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
}
