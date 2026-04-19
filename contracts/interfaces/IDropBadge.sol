// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title IDropBadge
/// @notice Interface for the DropBadge LSP8 contract.
///         TokenId format: keccak256(claimer, dropId) — one badge per (claimer, drop).
interface IDropBadge {
    /// @notice Mint a drop badge to `to` for the given `dropId`.
    ///         Only callable by the authorised drop minter (CelebrationsDrop).
    /// @param to            Recipient address (Universal Profile)
    /// @param dropId        The drop being claimed
    /// @param host          Creator/host of the drop campaign
    /// @param metadataBytes ABI-encoded LSP4 metadata bytes
    /// @param force         Pass true only for EOA recipients (tests); false in production
    /// @return tokenId      The minted tokenId: keccak256(to, dropId)
    function mintForDrop(
        address to,
        bytes32 dropId,
        address host,
        bytes calldata metadataBytes,
        bool force
    ) external returns (bytes32 tokenId);

    /// @notice Update token metadata for a claimed badge.
    ///         Only the drop host that created the source drop can call this.
    /// @param tokenId       Claimed drop badge token id
    /// @param metadataBytes ABI-encoded LSP4 metadata bytes
    function setTokenMetadataAsHost(bytes32 tokenId, bytes calldata metadataBytes) external;

    /// @notice Returns the drop host that created the campaign for `tokenId`
    function dropHostOf(bytes32 tokenId) external view returns (address);

    /// @notice Compute the deterministic tokenId for a (claimer, drop) pair
    function computeDropTokenId(address claimer, bytes32 dropId) external pure returns (bytes32);

    /// @notice Authorise a new drop minter address (only contract owner)
    function setDropMinter(address minter) external;

    /// @notice The address authorised to call mintForDrop
    function dropMinter() external view returns (address);
}
