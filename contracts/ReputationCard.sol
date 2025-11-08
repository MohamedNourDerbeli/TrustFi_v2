// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ProfileNFT.sol";

/**
 * @title ReputationCard
 * @dev ERC721 contract for managing reputation cards in the TrustFi system
 * Each NFT represents a verifiable credential issued to users based on their actions
 */
contract ReputationCard is ERC721, Ownable, Pausable {
    
    // Reputation card data structure
    // Only essential data stored on-chain to minimize gas costs
    // Descriptive data (category, description, etc.) stored in metadata
    struct Card {
        uint256 profileId;
        uint256 value;
        uint256 issuedAt;
        address issuer;
        bool isValid;
    }
    
    // State variables
    uint256 private _nextCardId = 1;
    mapping(uint256 => Card) private _cards;
    mapping(uint256 => string) private _tokenURIs; // cardId => metadata URI
    mapping(uint256 => uint256[]) private _profileCards; // profileId => cardIds[]
    mapping(address => bool) private _authorizedIssuers;
    
    // Category stored separately for filtering (optional - can be removed to save more gas)
    mapping(uint256 => bytes32) private _cardCategories; // cardId => category hash
    
    // Reference to ProfileNFT contract
    ProfileNFT public immutable profileNFT;
    
    // Events
    event CardIssued(
        uint256 indexed cardId, 
        uint256 indexed profileId, 
        address indexed issuer,
        bytes32 categoryHash,
        uint256 value,
        string metadataURI
    );
    event CardRevoked(uint256 indexed cardId, address indexed revoker);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event ReputationScoreUpdated(uint256 indexed profileId, uint256 newScore);
    
    // Errors
    error ProfileNotFound();
    error UnauthorizedIssuer();
    error CardNotFound();
    error InvalidCardData();
    error CardAlreadyRevoked();
    error UnauthorizedAccess();
    
    constructor(address _profileNFT) ERC721("TrustFi Reputation Card", "TFCARD") Ownable(msg.sender) {
        profileNFT = ProfileNFT(_profileNFT);
        // Contract owner is automatically an authorized issuer
        _authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Issues a new reputation card to a profile
     * @param profileId The ID of the profile receiving the card
     * @param categoryHash Hash of the category (for filtering/indexing)
     * @param value The reputation value of this card
     * @param metadataURI IPFS URI containing full card metadata (category, description, image, proof, etc.)
     * @return cardId The ID of the newly issued card
     */
    function issueCard(
        uint256 profileId,
        bytes32 categoryHash,
        uint256 value,
        string memory metadataURI
    ) external whenNotPaused returns (uint256) {
        // Check if caller is authorized to issue cards
        if (!_authorizedIssuers[msg.sender] && owner() != msg.sender) {
            revert UnauthorizedIssuer();
        }
        
        // Verify the profile exists
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        // Validate input data
        if (value == 0 || value > 1000) { // Max value of 1000 points per card
            revert InvalidCardData();
        }
        if (bytes(metadataURI).length == 0) {
            revert InvalidCardData();
        }
        
        uint256 cardId = _nextCardId++;
        
        // Create the reputation card with minimal on-chain data
        _cards[cardId] = Card({
            profileId: profileId,
            value: value,
            issuedAt: block.timestamp,
            issuer: msg.sender,
            isValid: true
        });
        
        // Store category hash for filtering
        _cardCategories[cardId] = categoryHash;
        
        // Store the metadata URI
        _tokenURIs[cardId] = metadataURI;
        
        // Add card to profile's card list
        _profileCards[profileId].push(cardId);
        
        // Mint the card NFT to the profile owner
        address profileOwner = profileNFT.ownerOf(profileId);
        _safeMint(profileOwner, cardId);
        
        // Update the profile's reputation score
        _updateProfileReputationScore(profileId);
        
        emit CardIssued(cardId, profileId, msg.sender, categoryHash, value, metadataURI);
        
        return cardId;
    }
    
    /**
     * @dev Retrieves reputation card data for a given card ID
     * @param cardId The ID of the reputation card
     * @return card The reputation card data
     * @return categoryHash The category hash
     * @return metadataURI The metadata URI
     */
    function getCard(uint256 cardId) external view returns (
        Card memory card,
        bytes32 categoryHash,
        string memory metadataURI
    ) {
        if (!_exists(cardId)) {
            revert CardNotFound();
        }
        
        return (_cards[cardId], _cardCategories[cardId], _tokenURIs[cardId]);
    }
    
    /**
     * @dev Retrieves all card IDs associated with a profile
     * @param profileId The ID of the profile
     * @return cardIds Array of card IDs belonging to the profile
     */
    function getCardsByProfile(uint256 profileId) external view returns (uint256[] memory) {
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        return _profileCards[profileId];
    }
    
    /**
     * @dev Verifies if a reputation card is valid and authentic
     * @param cardId The ID of the card to verify
     * @return isValid True if the card is valid and not revoked
     */
    function verifyCard(uint256 cardId) external view returns (bool) {
        if (!_exists(cardId)) {
            return false;
        }
        
        return _cards[cardId].isValid;
    }
    
    /**
     * @dev Revokes a reputation card (marks as invalid)
     * @param cardId The ID of the card to revoke
     */
    function revokeCard(uint256 cardId) external whenNotPaused {
        if (!_exists(cardId)) {
            revert CardNotFound();
        }
        
        Card storage card = _cards[cardId];
        
        // Only the issuer or contract owner can revoke a card
        if (card.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        if (!card.isValid) {
            revert CardAlreadyRevoked();
        }
        
        card.isValid = false;
        
        // Update the profile's reputation score after revocation
        _updateProfileReputationScore(card.profileId);
        
        emit CardRevoked(cardId, msg.sender);
    }
    
    /**
     * @dev Calculates the total reputation score for a profile
     * @param profileId The ID of the profile
     * @return totalScore The calculated reputation score
     */
    function calculateReputationScore(uint256 profileId) public view returns (uint256) {
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        uint256[] memory cardIds = _profileCards[profileId];
        uint256 totalScore = 0;
        
        for (uint256 i = 0; i < cardIds.length; i++) {
            Card memory card = _cards[cardIds[i]];
            if (card.isValid) {
                totalScore += card.value;
            }
        }
        
        return totalScore;
    }
    
    /**
     * @dev Authorizes an address to issue reputation cards
     * @param issuer The address to authorize
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        _authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }
    
    /**
     * @dev Revokes authorization for an issuer
     * @param issuer The address to revoke authorization from
     */
    function revokeIssuer(address issuer) external onlyOwner {
        _authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }
    
    /**
     * @dev Checks if an address is authorized to issue cards
     * @param issuer The address to check
     * @return authorized True if the address is authorized
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return _authorizedIssuers[issuer] || issuer == owner();
    }
    
    /**
     * @dev Returns the total number of cards issued
     * @return count The total number of cards
     */
    function totalCards() external view returns (uint256) {
        return _nextCardId - 1;
    }
    
    /**
     * @dev Returns the number of valid cards for a profile
     * @param profileId The ID of the profile
     * @return count The number of valid cards
     */
    function getValidCardCount(uint256 profileId) external view returns (uint256) {
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        uint256[] memory cardIds = _profileCards[profileId];
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < cardIds.length; i++) {
            if (_cards[cardIds[i]].isValid) {
                validCount++;
            }
        }
        
        return validCount;
    }
    
    /**
     * @dev Calculates reputation score for a specific category
     * @param profileId The ID of the profile
     * @param categoryHash The hash of the category to calculate score for
     * @return categoryScore The reputation score for this category
     */
    function getReputationByCategory(uint256 profileId, bytes32 categoryHash) 
        public 
        view 
        returns (uint256) 
    {
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        uint256[] memory cardIds = _profileCards[profileId];
        uint256 categoryScore = 0;
        
        for (uint256 i = 0; i < cardIds.length; i++) {
            Card memory card = _cards[cardIds[i]];
            
            // Only count valid cards in this category
            if (card.isValid && _cardCategories[cardIds[i]] == categoryHash) {
                categoryScore += card.value;
            }
        }
        
        return categoryScore;
    }
    
    /**
     * @dev Gets all unique category hashes for a profile
     * @param profileId The ID of the profile
     * @return categoryHashes Array of unique category hashes
     */
    function getProfileCategories(uint256 profileId) 
        public 
        view 
        returns (bytes32[] memory) 
    {
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        uint256[] memory cardIds = _profileCards[profileId];
        bytes32[] memory tempCategories = new bytes32[](cardIds.length);
        uint256 uniqueCount = 0;
        
        for (uint256 i = 0; i < cardIds.length; i++) {
            bytes32 categoryHash = _cardCategories[cardIds[i]];
            
            // Check if category already exists
            bool exists = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (tempCategories[j] == categoryHash) {
                    exists = true;
                    break;
                }
            }
            
            if (!exists) {
                tempCategories[uniqueCount] = categoryHash;
                uniqueCount++;
            }
        }
        
        // Create result array with exact size
        bytes32[] memory categoryHashes = new bytes32[](uniqueCount);
        for (uint256 i = 0; i < uniqueCount; i++) {
            categoryHashes[i] = tempCategories[i];
        }
        
        return categoryHashes;
    }
    
    /**
     * @dev Gets reputation breakdown by all categories
     * @param profileId The ID of the profile
     * @return categoryHashes Array of category hashes
     * @return scores Array of scores corresponding to each category
     */
    function getReputationBreakdown(uint256 profileId) 
        external 
        view 
        returns (
            bytes32[] memory categoryHashes,
            uint256[] memory scores
        ) 
    {
        categoryHashes = getProfileCategories(profileId);
        scores = new uint256[](categoryHashes.length);
        
        for (uint256 i = 0; i < categoryHashes.length; i++) {
            scores[i] = getReputationByCategory(profileId, categoryHashes[i]);
        }
        
        return (categoryHashes, scores);
    }
    
    /**
     * @dev Gets all card IDs for a specific category
     * @param profileId The ID of the profile
     * @param categoryHash The category hash to filter by
     * @return cardIds Array of card IDs in this category
     */
    function getCardsByCategory(uint256 profileId, bytes32 categoryHash) 
        external 
        view 
        returns (uint256[] memory) 
    {
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        uint256[] memory allCardIds = _profileCards[profileId];
        
        // Count matching cards
        uint256 count = 0;
        for (uint256 i = 0; i < allCardIds.length; i++) {
            if (_cardCategories[allCardIds[i]] == categoryHash) {
                count++;
            }
        }
        
        // Build result array
        uint256[] memory cardIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allCardIds.length; i++) {
            if (_cardCategories[allCardIds[i]] == categoryHash) {
                cardIds[index] = allCardIds[i];
                index++;
            }
        }
        
        return cardIds;
    }
    
    /**
     * @dev Gets card IDs filtered by category and issuer
     * @param profileId The ID of the profile
     * @param categoryHash The category hash to filter by
     * @param issuer The issuer address to filter by
     * @return cardIds Array of card IDs matching both filters
     */
    function getCardsByCategoryAndIssuer(
        uint256 profileId,
        bytes32 categoryHash,
        address issuer
    ) external view returns (uint256[] memory) {
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        uint256[] memory allCardIds = _profileCards[profileId];
        
        // Count matching cards
        uint256 count = 0;
        for (uint256 i = 0; i < allCardIds.length; i++) {
            Card memory card = _cards[allCardIds[i]];
            if (_cardCategories[allCardIds[i]] == categoryHash && card.issuer == issuer) {
                count++;
            }
        }
        
        // Build result array
        uint256[] memory cardIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allCardIds.length; i++) {
            Card memory card = _cards[allCardIds[i]];
            if (_cardCategories[allCardIds[i]] == categoryHash && card.issuer == issuer) {
                cardIds[index] = allCardIds[i];
                index++;
            }
        }
        
        return cardIds;
    }
    
    /**
     * @dev Gets all card IDs issued by a specific issuer for a profile
     * @param profileId The ID of the profile
     * @param issuer The issuer address to filter by
     * @return cardIds Array of card IDs from this issuer
     */
    function getCardsByIssuer(uint256 profileId, address issuer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        if (!profileNFT.profileExists(profileId)) {
            revert ProfileNotFound();
        }
        
        uint256[] memory allCardIds = _profileCards[profileId];
        
        // Count matching cards
        uint256 count = 0;
        for (uint256 i = 0; i < allCardIds.length; i++) {
            if (_cards[allCardIds[i]].issuer == issuer) {
                count++;
            }
        }
        
        // Build result array
        uint256[] memory cardIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allCardIds.length; i++) {
            if (_cards[allCardIds[i]].issuer == issuer) {
                cardIds[index] = allCardIds[i];
                index++;
            }
        }
        
        return cardIds;
    }
    
    /**
     * @dev Gets all cards issued by a specific issuer across all profiles
     * @param issuer The issuer address
     * @return cardIds Array of all card IDs issued by this address
     */
    function getAllCardsIssuedBy(address issuer) external view returns (uint256[] memory) {
        uint256 totalCardsCount = _nextCardId - 1;
        
        // Count matching cards
        uint256 count = 0;
        for (uint256 i = 1; i <= totalCardsCount; i++) {
            if (_exists(i) && _cards[i].issuer == issuer) {
                count++;
            }
        }
        
        // Build result array
        uint256[] memory cardIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalCardsCount; i++) {
            if (_exists(i) && _cards[i].issuer == issuer) {
                cardIds[index] = i;
                index++;
            }
        }
        
        return cardIds;
    }
    
    /**
     * @dev Pauses the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Internal function to update profile reputation score
     * @param profileId The ID of the profile to update
     */
    function _updateProfileReputationScore(uint256 profileId) internal {
        uint256 newScore = calculateReputationScore(profileId);
        
        // Update the reputation score in the ProfileNFT contract
        // Note: This requires the ReputationCard contract to be authorized
        // to update reputation scores in the ProfileNFT contract
        try profileNFT.updateReputationScore(profileId, newScore) {
            emit ReputationScoreUpdated(profileId, newScore);
        } catch {
            // If update fails, emit event but don't revert the transaction
            // This allows card operations to continue even if score update fails
        }
    }
    
    /**
     * @dev Override _update to handle card transfers
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override 
        returns (address) 
    {
        // Reputation cards should not be transferable after issuance
        // They are bound to the profile they were issued to
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert UnauthorizedAccess();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Returns the metadata URI for a given token ID
     * @param tokenId The ID of the token
     * @return The metadata URI string
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) {
            revert CardNotFound();
        }
        
        return _tokenURIs[tokenId];
    }
    
    /**
     * @dev Updates the metadata URI for a card (only issuer or owner)
     * @param cardId The ID of the card
     * @param newMetadataURI The new metadata URI
     */
    function updateMetadataURI(uint256 cardId, string memory newMetadataURI) external {
        if (!_exists(cardId)) {
            revert CardNotFound();
        }
        
        Card storage card = _cards[cardId];
        
        // Only the issuer or contract owner can update metadata
        if (card.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        _tokenURIs[cardId] = newMetadataURI;
    }
    
    /**
     * @dev Check if a token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}