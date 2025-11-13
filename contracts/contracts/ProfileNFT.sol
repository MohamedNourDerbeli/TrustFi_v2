// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Interface for the ReputationCard contract to call it
interface IReputationCard {
    function calculateScoreForProfile(uint256 profileId) external view returns (uint256);
}

contract ProfileNFT is ERC721, AccessControl, IERC721Receiver {
    // --- ROLES ---
    bytes32 public constant SCORE_PROVIDER_ROLE = keccak256("SCORE_PROVIDER_ROLE");

    // --- STATE ---
    uint256 private _nextTokenId = 1; // Start at 1 to avoid collision with default mapping value
    address public scoreProviderAddress;
    mapping(address => uint256) public addressToProfileId;
    mapping(uint256 => uint256) public profileIdToScore;
    mapping(uint256 => string) private _tokenURIs;

    // --- EVENTS ---
    event ProfileCreated(uint256 indexed tokenId, address indexed owner, string tokenURI);
    event ScoreUpdated(uint256 indexed tokenId, uint256 newScore);

    constructor(address admin) ERC721("TrustFi Profile", "TFP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // --- CORE FUNCTIONS ---
    function createProfile(string memory _tokenURI) public returns (uint256) {
        require(addressToProfileId[msg.sender] == 0, "Profile already exists for this address");

        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        addressToProfileId[msg.sender] = tokenId;

        emit ProfileCreated(tokenId, msg.sender, _tokenURI);
        return tokenId;
    }

    function recalculateMyScore() public {
        uint256 profileId = addressToProfileId[msg.sender];
        require(profileId != 0, "No profile found for this address");

        require(scoreProviderAddress != address(0), "Score provider not set");

        uint256 newScore = IReputationCard(scoreProviderAddress).calculateScoreForProfile(profileId);
        profileIdToScore[profileId] = newScore;

        emit ScoreUpdated(profileId, newScore);
    }

    /**
     * @dev Updates the metadata URI for a profile. Only the owner of the token can call this.
     */
    function updateProfileMetadata(string memory _newMetadataURI) public {
        uint256 tokenId = addressToProfileId[msg.sender];
        require(tokenId != 0, "No profile found for this address");
        require(_ownerOf(tokenId) == msg.sender, "Caller is not owner of this token");
        
        _setTokenURI(tokenId, _newMetadataURI);
        // We don't need a dedicated event, the front-end can just refetch.
    }

    // --- ADMIN & CONFIG ---
    function setScoreProvider(address providerAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (scoreProviderAddress != address(0)) {
            revokeRole(SCORE_PROVIDER_ROLE, scoreProviderAddress);
        }
        scoreProviderAddress = providerAddress;
        grantRole(SCORE_PROVIDER_ROLE, providerAddress);
    }

    // --- SOULBOUND LOGIC (OZ v5 style) ---
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) {
            require(_ownerOf(tokenId) == to, "ProfileNFTs are non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    // --- URI STORAGE (OZ v5 style) ---
    function _setTokenURI(uint256 tokenId, string memory _tokenURIValue) internal virtual {
        _tokenURIs[tokenId] = _tokenURIValue;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory _tokenURIValue = _tokenURIs[tokenId];
        require(bytes(_tokenURIValue).length > 0, "ERC721: URI query for nonexistent token");
        return _tokenURIValue;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId || super.supportsInterface(interfaceId);
    }

    // --- IERC721Receiver IMPLEMENTATION ---
    /**
     * @dev Allows this contract to receive ERC721 tokens (ReputationCards)
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
