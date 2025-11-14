// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @dev Minimal interface used for calling calculateScoreForProfile
interface IReputationCalculator {
    function calculateScoreForProfile(uint256 profileId) external view returns (uint256);
}

/// @title ProfileNFT (Soulbound profile holding ReputationCards)
contract ProfileNFT is ERC721, AccessControl, IERC721Receiver {
    bytes32 public constant DEFAULT_ADMIN = DEFAULT_ADMIN_ROLE;

    uint256 private _nextTokenId = 1; // start at 1 to avoid tokenId == 0
    address public reputationContract; // ReputationCard contract

    mapping(address => uint256) public addressToProfileId;
    mapping(uint256 => uint256) public profileIdToScore;
    mapping(uint256 => string) private _tokenURIs;

    // profileId => attached cardIds
    mapping(uint256 => uint256[]) private profileToCards;
    // cardId => profileId
    mapping(uint256 => uint256) public cardToProfile;

    event ProfileCreated(uint256 indexed tokenId, address indexed owner, string tokenURI);
    event ScoreUpdated(uint256 indexed tokenId, uint256 newScore);
    event ReputationContractSet(address indexed previous, address indexed current);
    event CardAttached(uint256 indexed profileId, uint256 indexed cardId);

    modifier onlyReputationContract() {
        require(msg.sender == reputationContract, "Only reputation contract");
        _;
    }

    constructor(address admin) ERC721("TrustFi Profile", "TFP") {
        _grantRole(DEFAULT_ADMIN, admin);
    }

    /// @notice Create a soulbound profile for msg.sender
    function createProfile(string calldata _tokenURI) external returns (uint256) {
        require(addressToProfileId[msg.sender] == 0, "Profile exists");

        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        addressToProfileId[msg.sender] = tokenId;

        emit ProfileCreated(tokenId, msg.sender, _tokenURI);
        return tokenId;
    }

    /// @notice Recalculate score using external ReputationCard
    function recalculateMyScore() external {
        uint256 profileId = addressToProfileId[msg.sender];
        require(profileId != 0, "No profile found");
        require(reputationContract != address(0), "Reputation contract not set");

        uint256 newScore = IReputationCalculator(reputationContract).calculateScoreForProfile(profileId);
        profileIdToScore[profileId] = newScore;

        emit ScoreUpdated(profileId, newScore);
    }

    /// @notice Update profile metadata
    function updateProfileMetadata(string calldata _newMetadataURI) external {
        uint256 tokenId = addressToProfileId[msg.sender];
        require(tokenId != 0, "No profile found");
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        _setTokenURI(tokenId, _newMetadataURI);
    }

    /// @notice Admin sets the reputation contract address
    function setReputationContract(address _reputationContract) external onlyRole(DEFAULT_ADMIN) {
        address prev = reputationContract;
        reputationContract = _reputationContract;
        emit ReputationContractSet(prev, _reputationContract);
    }

    /// @notice Called by ReputationCard when a new card is minted
    function notifyNewCard(uint256 profileId, uint256 cardId) external onlyReputationContract {
        require(_ownerOf(profileId) != address(0), "Profile does not exist");
        profileToCards[profileId].push(cardId);
        cardToProfile[cardId] = profileId;
        emit CardAttached(profileId, cardId);
    }

    /// @notice Get list of card IDs attached to a profile
    function getCardsForProfile(uint256 profileId) external view returns (uint256[] memory) {
        return profileToCards[profileId];
    }

    /// @dev Internal tokenURI storage
    function _setTokenURI(uint256 tokenId, string memory _tokenURIValue) internal {
        _tokenURIs[tokenId] = _tokenURIValue;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        string memory _tokenURIValue = _tokenURIs[tokenId];
        require(bytes(_tokenURIValue).length > 0, "Empty tokenURI");
        return _tokenURIValue;
    }

    /// @dev Soulbound: blocks transfers after mint (except burn)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert("Non-transferable");
        return super._update(to, tokenId, auth);
    }

    /// @notice Accept ERC721s (ReputationCards)
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
