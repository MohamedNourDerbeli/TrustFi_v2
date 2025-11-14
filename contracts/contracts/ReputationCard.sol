// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IProfileNFT {
    function addressToProfileId(address owner) external view returns (uint256);
}

contract ReputationCard is ERC721, AccessControl, EIP712 {
    bytes32 public constant TEMPLATE_MANAGER_ROLE = keccak256("TEMPLATE_MANAGER_ROLE");

    // --- V3: EXPANDED TEMPLATE STRUCT ---
    struct Template {
        address issuer;
        uint256 maxSupply;
        uint256 currentSupply;
        uint8 tier;
        uint256 startTime; // 0 = immediate
        uint256 endTime;   // 0 = no expiration
        bool isPaused;
    }

    uint256 private _nextTokenId;
    address public immutable profileNFTContract;

    mapping(uint256 => Template) public templates;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => uint256) public cardToProfileId;
    mapping(uint8 => uint256) public tierToScore;
    mapping(uint256 => string) private _tokenURIs;

    bytes32 private constant CLAIM_TYPEHASH = keccak256("Claim(address user,uint256 templateId,uint256 nonce)");

    event CardIssued(uint256 indexed profileId, uint256 indexed cardId, address indexed issuer, uint8 tier);
    event TemplateCreated(uint256 indexed templateId, address indexed issuer, uint256 maxSupply, uint8 tier, uint256 startTime, uint256 endTime);
    event TemplatePaused(uint256 indexed templateId, bool isPaused);
    event DirectIssue(uint256 indexed profileId, uint256 indexed cardId, address indexed recipient);

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

    // --- V3: UPDATED TEMPLATE CREATION ---
    function createTemplate(
        uint256 _templateId,
        address _issuer,
        uint256 _maxSupply,
        uint8 _tier,
        uint256 _startTime,
        uint256 _endTime
    ) public onlyRole(TEMPLATE_MANAGER_ROLE) {
        require(templates[_templateId].issuer == address(0), "Template ID already exists");
        require(_issuer != address(0), "Issuer cannot be the zero address");
        require(_tier > 0 && _tier <= 3, "Invalid tier");
        if (_endTime > 0) {
            require(_startTime < _endTime, "Start time must be before end time");
        }

        templates[_templateId] = Template({
            issuer: _issuer,
            maxSupply: _maxSupply,
            currentSupply: 0,
            tier: _tier,
            startTime: _startTime,
            endTime: _endTime,
            isPaused: false
        });
        emit TemplateCreated(_templateId, _issuer, _maxSupply, _tier, _startTime, _endTime);
    }

    // --- V3: NEW DIRECT MINTING FUNCTION ---
    function issueDirect(address _recipient, uint256 _templateId, string memory _tokenURI) public returns (uint256) {
        Template storage template = templates[_templateId];
        require(template.issuer != address(0), "Template does not exist");
        require(template.issuer == msg.sender, "Only the template issuer can direct-issue");

        if (template.maxSupply > 0) {
            require(template.currentSupply < template.maxSupply, "Max supply reached");
        }
        require(!template.isPaused, "Template is paused");

        uint256 profileId = IProfileNFT(profileNFTContract).addressToProfileId(_recipient);
        require(profileId != 0, "Recipient does not have a profile");

        template.currentSupply++;

        uint256 cardId = _nextTokenId++;
        _mint(profileNFTContract, cardId);
        _setTokenURI(cardId, _tokenURI);
        cardToProfileId[cardId] = profileId;

        emit CardIssued(profileId, cardId, msg.sender, template.tier);
        emit DirectIssue(profileId, cardId, _recipient);
        return cardId;
    }

    // --- V3: UPDATED CLAIM FUNCTION ---
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

        // V3 Checks
        if (template.maxSupply > 0) {
            require(template.currentSupply < template.maxSupply, "Max supply reached");
        }
        require(!template.isPaused, "Template is paused");
        if (template.startTime > 0) {
            require(block.timestamp >= template.startTime, "Claim period not started");
        }
        if (template.endTime > 0) {
            require(block.timestamp <= template.endTime, "Claim period has ended");
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

    // --- V3: NEW PAUSE/RESUME FUNCTION ---
    function setTemplatePaused(uint256 _templateId, bool _isPaused) public {
        Template storage template = templates[_templateId];
        require(template.issuer != address(0), "Template does not exist");
        require(template.issuer == msg.sender || hasRole(TEMPLATE_MANAGER_ROLE, msg.sender), "Not authorized");
        
        template.isPaused = _isPaused;
        emit TemplatePaused(_templateId, _isPaused);
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

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
