// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReputationCard is ERC721, AccessControl {
    // --- ROLES ---
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    // --- STATE ---
    uint256 private _nextTokenId;
    address public immutable profileNFTContract;

    // --- MAPPINGS ---
    mapping(uint256 => uint256) public cardToProfileId;
    mapping(uint256 => uint8) public cardToTier;
    mapping(uint8 => uint256) public tierToScore;
    mapping(uint256 => string) private _tokenURIs;

    // --- EVENTS ---
    event CardIssued(uint256 indexed profileId, uint256 indexed cardId, address indexed issuer, uint8 tier);

    constructor(address admin, address _profileNFTContract) ERC721("TrustFi Reputation Card", "TFIC") {
        profileNFTContract = _profileNFTContract;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);

        tierToScore[1] = 10; // Bronze
        tierToScore[2] = 50; // Silver
        tierToScore[3] = 200; // Gold
    }

    // --- CORE FUNCTIONS ---
    function issueCard(uint256 _profileId, uint8 _tier, string memory _tokenURI) public onlyRole(ISSUER_ROLE) returns (uint256) {
        require(_tier > 0 && _tier <= 3, "Invalid tier");
        
        uint256 cardId = _nextTokenId++;
        _mint(profileNFTContract, cardId);
        _setTokenURI(cardId, _tokenURI);

        cardToProfileId[cardId] = _profileId;
        cardToTier[cardId] = _tier;

        emit CardIssued(_profileId, cardId, msg.sender, _tier);
        return cardId;
    }

    function calculateScoreForProfile(uint256 /* profileId */) public pure returns (uint256) {
        // Placeholder for a real, gas-efficient on-chain calculation.
        return 123;
    }

    // --- ADMIN & CONFIG ---
    function setTierScore(uint8 tier, uint256 score) public onlyRole(DEFAULT_ADMIN_ROLE) {
        tierToScore[tier] = score;
    }

    // --- SOULBOUND LOGIC ---
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) {
            require(from == to || from == profileNFTContract, "ReputationCards are non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    // --- BOILERPLATE for ERC721 URI Storage ---
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
