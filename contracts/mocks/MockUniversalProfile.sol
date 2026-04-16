// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC725Y} from "@erc725/smart-contracts/contracts/interfaces/IERC725Y.sol";

/// @title MockUniversalProfile
/// @notice Minimal Universal Profile mock for testing.
///         Implements ERC725Y getData/setData and accepts LSP1 delegate calls.
///         Also implements LSP1 UniversalReceiver so force=false minting works.
contract MockUniversalProfile is IERC725Y {
    mapping(bytes32 => bytes) private _store;

    // ─────────────────────────────────────────────────────────────────────
    // ERC725Y
    // ─────────────────────────────────────────────────────────────────────

    function getData(bytes32 dataKey) external view override returns (bytes memory) {
        return _store[dataKey];
    }

    function getDataBatch(bytes32[] memory dataKeys)
        external view override returns (bytes[] memory values)
    {
        values = new bytes[](dataKeys.length);
        for (uint256 i; i < dataKeys.length; ) {
            values[i] = _store[dataKeys[i]];
            unchecked { i++; }
        }
    }

    function setData(bytes32 dataKey, bytes memory dataValue) external payable override {
        _store[dataKey] = dataValue;
        emit DataChanged(dataKey, dataValue);
    }

    function setDataBatch(bytes32[] memory dataKeys, bytes[] memory dataValues) external payable override {
        require(dataKeys.length == dataValues.length, "MockUP: length mismatch");
        for (uint256 i; i < dataKeys.length; ) {
            _store[dataKeys[i]] = dataValues[i];
            emit DataChanged(dataKeys[i], dataValues[i]);
            unchecked { i++; }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // LSP1 — so LSP8 force=false minting succeeds
    // ─────────────────────────────────────────────────────────────────────

    // LSP1 interface ID
    bytes4 private constant _INTERFACE_ID_LSP1 = 0x6bb56a14;

    function universalReceiver(bytes32, bytes calldata)
        external payable returns (bytes memory)
    {
        return "";
    }

    // ─────────────────────────────────────────────────────────────────────
    // ERC165
    // ─────────────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == _INTERFACE_ID_LSP1
            || interfaceId == 0x01ffc9a7  // ERC165
            || interfaceId == 0x714df77c; // IERC725Y
    }
}
