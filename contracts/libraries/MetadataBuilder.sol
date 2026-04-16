// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title MetadataBuilder
/// @notice Helpers for encoding LSP4-compatible metadata pointers.
///         The encoded bytes are passed to LSP8 _mint() and stored as token metadata.
library MetadataBuilder {
    /// @notice JSONURL verification function prefix (keccak256 hash method)
    bytes4 internal constant HASH_FUNCTION_KECCAK256 = 0x6f357c6a;

    /// @notice Encode an IPFS URL + content hash into LSP4 JSONURL bytes.
    ///         Format: bytes4(0x6f357c6a) + bytes32(contentHash) + bytes(url)
    /// @param ipfsUrl     IPFS URL string (e.g. "ipfs://Qm...")
    /// @param contentHash keccak256 of the JSON content
    function encodeJsonUrl(
        string memory ipfsUrl,
        bytes32 contentHash
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            HASH_FUNCTION_KECCAK256,
            contentHash,
            bytes(ipfsUrl)
        );
    }

    /// @notice Compute the tokenId for a badge given its parameters.
    ///         Kept here so it can be shared between the badge contract and off-chain tooling
    ///         that uses the library's ABI.
    function badgeTokenId(
        address owner,
        uint8 celebrationType,
        uint16 year
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner, celebrationType, year));
    }
}
