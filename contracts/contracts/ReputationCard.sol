// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IProfileNFT {
    function addressToProfileId(address owner) external view returns (uint256);
    function notifyNewCard(uint256 profileId, uint256 cardId) external;
    function getCardsForProfile(uint256 profileId) external view returns (uint256[] memory);
}

contract ReputationCard is ERC721, AccessControl, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant TEMPLATE_MANAGER_ROLE = keccak256("TEMPLATE_MANAGER_ROLE");
    bytes32 public constant DEFAULT_ADMIN = DEFAULT_ADMIN_ROLE;

    struct Template {
        address issuer;
        uint256 maxSupply;
        uint256 currentSupply;
        uint8 tier;
        uint256 startTime;
        uint256 endTime;
        bool isPaused;
    }

    uint256 private _nextTokenId = 1;
    address public immutable profileNFTContract;

    mapping(uint256 => Template) public templates;
    mapping(uint256 => mapping(uint256 => bool)) public hasProfileClaimed;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint8 => uint256) public tierToScore;
    mapping(uint256 => uint256) private cardToTemplate;
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) public usedNonceForTemplate;

    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address user,address profileOwner,uint256 templateId,uint256 nonce)");

    event CardIssued(uint256 indexed profileId, uint256 indexed cardId, address indexed issuer, uint8 tier);
    event TemplateCreated(
        uint256 indexed templateId,
        address indexed issuer,
        uint256 maxSupply,
        uint8 tier,
        uint256 startTime,
        uint256 endTime
    );
    event TemplatePaused(uint256 indexed templateId, bool isPaused);

    constructor(address admin, address _profileNFTContract)
        ERC721("TrustFi Reputation Card", "TFIC")
        EIP712("TrustFi ReputationCard", "1")
    {
        require(_profileNFTContract != address(0), "Profile contract zero");
        profileNFTContract = _profileNFTContract;

        _grantRole(DEFAULT_ADMIN, admin);
        _grantRole(TEMPLATE_MANAGER_ROLE, admin);

        tierToScore[1] = 10;
        tierToScore[2] = 50;
        tierToScore[3] = 200;
    }

    /* ----------------------- TEMPLATE MANAGEMENT ----------------------- */

    function createTemplate(
        uint256 templateId,
        address issuer,
        uint256 maxSupply,
        uint8 tier,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(TEMPLATE_MANAGER_ROLE) {
        require(templates[templateId].issuer == address(0), "Template exists");
        require(issuer != address(0), "Zero issuer");
        require(tier >= 1 && tierToScore[tier] > 0, "Invalid tier");
        if (endTime > 0) require(startTime < endTime, "Start < End");

        templates[templateId] = Template({
            issuer: issuer,
            maxSupply: maxSupply,
            currentSupply: 0,
            tier: tier,
            startTime: startTime,
            endTime: endTime,
            isPaused: false
        });

        emit TemplateCreated(templateId, issuer, maxSupply, tier, startTime, endTime);
    }

    function setTemplatePaused(uint256 templateId, bool isPaused) external {
        Template storage t = templates[templateId];
        require(t.issuer != address(0), "Template missing");
        require(msg.sender == t.issuer || hasRole(TEMPLATE_MANAGER_ROLE, msg.sender), "Not allowed");
        t.isPaused = isPaused;
        emit TemplatePaused(templateId, isPaused);
    }

    function setTierScore(uint8 tier, uint256 score) external onlyRole(DEFAULT_ADMIN) {
        tierToScore[tier] = score;
    }

    /* ----------------------- DIRECT ISSUE ----------------------- */

    function issueDirect(
        address recipient,
        uint256 templateId,
        string calldata tokenURI_
    ) external returns (uint256) {
        Template storage t = templates[templateId];
        require(t.issuer != address(0), "Template missing");
        require(msg.sender == t.issuer, "Only issuer");
        require(!t.isPaused, "Paused");
        require(tierToScore[t.tier] > 0, "Invalid tier");

        if (t.maxSupply > 0) require(t.currentSupply < t.maxSupply, "Max supply");

        uint256 profileId = IProfileNFT(profileNFTContract).addressToProfileId(recipient);
        require(profileId != 0, "No profile");
        require(!hasProfileClaimed[templateId][profileId], "Already claimed");

        hasProfileClaimed[templateId][profileId] = true;
        t.currentSupply++;

        uint256 cardId = _nextTokenId++;
        _mint(profileNFTContract, cardId);
        _tokenURIs[cardId] = tokenURI_;
        cardToTemplate[cardId] = templateId;

        IProfileNFT(profileNFTContract).notifyNewCard(profileId, cardId);

        emit CardIssued(profileId, cardId, msg.sender, t.tier);
        return cardId;
    }

    /* ----------------------- CLAIM WITH SIGNATURE ----------------------- */

    function claimWithSignature(
        address user,
        address profileOwner,
        uint256 templateId,
        uint256 nonce,
        string calldata tokenURI_,
        bytes calldata signature
    ) external returns (uint256) {
        require(user == msg.sender, "Must claim yourself");

        Template storage t = templates[templateId];
        require(t.issuer != address(0), "Template missing");
        require(!t.isPaused, "Paused");
        require(tierToScore[t.tier] > 0, "Invalid tier");

        if (t.maxSupply > 0) require(t.currentSupply < t.maxSupply, "Max supply");
        if (t.startTime > 0) require(block.timestamp >= t.startTime, "Not started");
        if (t.endTime > 0) require(block.timestamp <= t.endTime, "Ended");

        uint256 profileId = IProfileNFT(profileNFTContract).addressToProfileId(profileOwner);
        require(profileId != 0, "No profile");
        require(!hasProfileClaimed[templateId][profileId], "Already claimed");
        require(!usedNonceForTemplate[templateId][profileId][nonce], "Nonce used");

        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, user, profileOwner, templateId, nonce));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == t.issuer, "Bad signature");

        hasProfileClaimed[templateId][profileId] = true;
        usedNonceForTemplate[templateId][profileId][nonce] = true;
        t.currentSupply++;

        uint256 cardId = _nextTokenId++;
        _mint(profileNFTContract, cardId);
        _tokenURIs[cardId] = tokenURI_;
        cardToTemplate[cardId] = templateId;

        IProfileNFT(profileNFTContract).notifyNewCard(profileId, cardId);

        emit CardIssued(profileId, cardId, t.issuer, t.tier);
        return cardId;
    }

    /* ----------------------- SCORE CALCULATION ----------------------- */

    function calculateScoreForProfile(uint256 profileId) external view returns (uint256 total) {
        uint256[] memory cards = IProfileNFT(profileNFTContract).getCardsForProfile(profileId);
        for (uint256 i = 0; i < cards.length; i++) {
            uint256 cardId = cards[i];
            uint8 tier = templates[cardToTemplate[cardId]].tier;
            total += tierToScore[tier];
        }
    }

    /* ----------------------- VIEWS ----------------------- */

    /// @notice Get detailed card information for a profile
    /// @param profileId The profile ID to query
    /// @return cardIds Array of card IDs
    /// @return templateIds Array of template IDs for each card
    /// @return tiers Array of tiers for each card
    /// @return issuers Array of issuer addresses for each card
    function getCardsDetailForProfile(uint256 profileId)
        external
        view
        returns (
            uint256[] memory cardIds,
            uint256[] memory templateIds,
            uint8[] memory tiers,
            address[] memory issuers
        )
    {
        cardIds = IProfileNFT(profileNFTContract).getCardsForProfile(profileId);
        uint256 length = cardIds.length;

        templateIds = new uint256[](length);
        tiers = new uint8[](length);
        issuers = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 cardId = cardIds[i];
            uint256 templateId = cardToTemplate[cardId];
            Template storage t = templates[templateId];

            templateIds[i] = templateId;
            tiers[i] = t.tier;
            issuers[i] = t.issuer;
        }

        return (cardIds, templateIds, tiers, issuers);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent");
        return _tokenURIs[tokenId];
    }

    /* ----------------------- SOULBOUND ----------------------- */

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert("Non-transferable");
        return super._update(to, tokenId, auth);
    }

    /* ----------------------- INTERFACES ----------------------- */

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
