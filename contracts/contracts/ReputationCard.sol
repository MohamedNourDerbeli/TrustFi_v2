// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Interface to interact with ProfileNFT contract
interface IProfileNFT {
    function addressToProfileId(address owner) external view returns (uint256);
}

contract ReputationCard is ERC721, AccessControl, EIP712 {
    // --- ROLES ---
    bytes32 public constant TEMPLATE_MANAGER_ROLE = keccak256("TEMPLATE_MANAGER_ROLE");

    // --- ON-CHAIN TEMPLATE DATA ---
    struct Template {
        address issuer;
        uint256 maxSupply;
        uint256 currentSupply;
        uint8 tier;
    }

    // --- STATE ---
    uint256 private _nextTokenId;
    address public immutable profileNFTContract;

    // --- MAPPINGS ---
    mapping(uint256 => Template) public templates;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => uint256) public cardToProfileId;
    mapping(uint8 => uint256) public tierToScore;
    mapping(uint256 => string) private _tokenURIs;

    // --- EIP-712 SIGNATURE HASH ---
    bytes32 private constant CLAIM_TYPEHASH = keccak256("Claim(address user,uint256 templateId,uint256 nonce)");

    // --- EVENTS ---
    event CardIssued(uint256 indexed profileId, uint256 indexed cardId, address indexed issuer, uint8 tier);
    event TemplateCreated(uint256 indexed templateId, address indexed issuer, uint256 maxSupply, uint8 tier);

    constructor(address admin, address _profileNFTContract)
        ERC721("TrustFi Reputation Card", "TFIC")
        EIP712("TrustFi ReputationCard", "1")
    {
        profileNFTContract = _profileNFTContract;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TEMPLATE_MANAGER_ROLE, admin);
        tierToScore[1] = 10;
        tierToScore[2] = 50;
        tierToScore[3] = 200;
    }

    // --- ISSUER/ADMIN FUNCTION ---
    function createTemplate(uint256 _templateId, address _issuer, uint256 _maxSupply, uint8 _tier) public onlyRole(TEMPLATE_MANAGER_ROLE) {
        require(templates[_templateId].issuer == address(0), "Template ID already exists");
        require(_issuer != address(0), "Issuer cannot be the zero address");
        require(_tier > 0 && _tier <= 3, "Invalid tier");
        templates[_templateId] = Template({
            issuer: _issuer,
            maxSupply: _maxSupply,
            currentSupply: 0,
            tier: _tier
        });
        emit TemplateCreated(_templateId, _issuer, _maxSupply, _tier);
    }

    // --- USER-FACING CLAIM FUNCTION ---
    function claimWithSignature(
        address _user,
        address _profileOwner,
        uint256 _templateId,
        uint256 _nonce,
        string memory _tokenURI,
        bytes calldata _signature
    ) public returns (uint256) {
        require(_user == msg.sender, "Signature is for a different user");
        
        Template storage template = templates[_templateId];
        require(template.issuer != address(0), "Template does not exist");

        if (template.maxSupply > 0) {
            require(template.currentSupply < template.maxSupply, "Max supply reached");
        }

        require(!hasClaimed[_templateId][msg.sender], "Already claimed this collectible");

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, _user, _templateId, _nonce)));
        address signer = ECDSA.recover(digest, _signature);
        require(signer == template.issuer, "Invalid signature from unauthorized issuer");

        uint256 profileId = IProfileNFT(profileNFTContract).addressToProfileId(_profileOwner);
        require(profileId != 0, "Profile not found for owner");

        template.currentSupply++;
        hasClaimed[_templateId][msg.sender] = true;

        uint256 cardId = _nextTokenId++;
        _mint(profileNFTContract, cardId);
        _setTokenURI(cardId, _tokenURI);
        cardToProfileId[cardId] = profileId;

        emit CardIssued(profileId, cardId, template.issuer, template.tier);
        return cardId;
    }
    
    // --- OTHER FUNCTIONS ---

    function setTierScore(uint8 tier, uint256 score) public onlyRole(DEFAULT_ADMIN_ROLE) {
        tierToScore[tier] = score;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) {
            require(from == to || from == profileNFTContract, "ReputationCards are non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
    }

    // --- THIS IS THE FIX ---
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // The _requireOwned(tokenId) check is removed to make it public.
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Helper function to check if a token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
