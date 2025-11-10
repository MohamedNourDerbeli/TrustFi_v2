// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ProfileNFT.sol";

/**
 * @title ReputationCard
 * @dev ERC721 contract for managing reputation cards in the TrustFi system
 * Each NFT represents a verifiable credential issued to users based on their actions
 */
contract ReputationCard is ERC721, Ownable, Pausable, ReentrancyGuard {
    
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
    
    // Collectible minting structures
    
    // Eligibility types for collectible claiming
    enum EligibilityType {
        OPEN,              // Anyone can claim
        WHITELIST,         // Only whitelisted addresses
        TOKEN_HOLDER,      // Must hold specific token
        PROFILE_REQUIRED   // Must have TrustFi profile
    }
    
    // Minting mode for reputation cards
    enum MintingMode {
        DIRECT,            // Issuer mints to recipient
        COLLECTIBLE        // User mints to self
    }
    
    // Rarity tier constants
    uint8 public constant RARITY_COMMON = 0;
    uint8 public constant RARITY_UNCOMMON = 1;
    uint8 public constant RARITY_RARE = 2;
    uint8 public constant RARITY_EPIC = 3;
    uint8 public constant RARITY_LEGENDARY = 4;
    
    // Collectible template structure
    struct CollectibleTemplate {
        uint256 templateId;
        string title;             // Display name for the collectible
        string category;
        string description;
        uint256 value;
        address issuer;
        uint256 maxSupply;        // 0 = unlimited
        uint256 currentSupply;
        uint256 startTime;        // 0 = immediate
        uint256 endTime;          // 0 = no expiration
        EligibilityType eligibilityType;
        bytes eligibilityData;    // Flexible data for eligibility criteria
        bool isPaused;
        bool isActive;
        string metadataURI;       // IPFS or other URI for rich metadata
        uint8 rarityTier;         // 0-4 (common, uncommon, rare, epic, legendary)
    }
    
    // State variables
    uint256 private _nextCardId = 1;
    mapping(uint256 => Card) private _cards;
    mapping(uint256 => string) private _tokenURIs; // cardId => metadata URI
    mapping(uint256 => uint256[]) private _profileCards; // profileId => cardIds[]
    mapping(address => bool) private _authorizedIssuers;
    
    // Category stored separately for filtering (optional - can be removed to save more gas)
    mapping(uint256 => bytes32) private _cardCategories; // cardId => category hash
    
    // Collectible minting state variables
    uint256 private _nextTemplateId = 1;
    mapping(uint256 => CollectibleTemplate) private _collectibleTemplates; // templateId => template
    mapping(uint256 => mapping(address => bool)) private _collectibleClaims; // templateId => user => hasClaimed
    mapping(uint256 => mapping(address => bool)) private _collectibleWhitelist; // templateId => address => isWhitelisted
    mapping(uint256 => MintingMode) private _cardMintingMode; // cardId => minting mode
    
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
    
    // Collectible events
    event CollectibleCreated(
        uint256 indexed templateId,
        address indexed issuer,
        string category,
        uint256 maxSupply,
        EligibilityType eligibilityType
    );
    event CollectibleClaimed(
        uint256 indexed templateId,
        uint256 indexed cardId,
        address indexed claimer,
        uint256 timestamp
    );
    event CollectiblePaused(uint256 indexed templateId, address indexed issuer);
    event CollectibleResumed(uint256 indexed templateId, address indexed issuer);
    event CollectibleMetadataUpdated(uint256 indexed templateId);
    event WhitelistUpdated(uint256 indexed templateId, uint256 addressCount);
    
    // Errors
    error ProfileNotFound();
    error UnauthorizedIssuer();
    error CardNotFound();
    error InvalidCardData();
    error CardAlreadyRevoked();
    error UnauthorizedAccess();
    
    // Collectible errors
    error CollectibleNotFound();
    error CollectibleNotActive();
    error CollectibleIsPaused();
    error ClaimPeriodNotStarted();
    error ClaimPeriodEnded();
    error MaxSupplyReached();
    error AlreadyClaimed();
    error NotEligible();
    error CannotEditAfterClaims();
    error InvalidEligibilityData();
    error InvalidTimeRange();
    error InvalidStringLength();
    error InvalidNumericRange();
    
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
        
        // Set minting mode to DIRECT
        _cardMintingMode[cardId] = MintingMode.DIRECT;
        
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
    
    // ============================================
    // COLLECTIBLE CREATION AND MANAGEMENT FUNCTIONS
    // ============================================
    
    /**
     * @dev Creates a new collectible template that users can claim
     * @param category The category of the collectible (e.g., "Event Badge", "Achievement")
     * @param description Detailed description of the collectible
     * @param value The reputation value awarded when claimed
     * @param maxSupply Maximum number of claims allowed (0 = unlimited)
     * @param startTime Unix timestamp when claiming starts (0 = immediate)
     * @param endTime Unix timestamp when claiming ends (0 = no expiration)
     * @param eligibilityType Type of eligibility check (OPEN, WHITELIST, TOKEN_HOLDER, PROFILE_REQUIRED)
     * @param eligibilityData Encoded data for eligibility verification (format depends on eligibilityType)
     * @param metadataURI IPFS or other URI containing rich metadata
     * @param rarityTier Rarity level (0-4: Common, Uncommon, Rare, Epic, Legendary)
     * @return templateId The ID of the created collectible template
     */
    function createCollectible(
        string memory title,
        string memory category,
        string memory description,
        uint256 value,
        uint256 maxSupply,
        uint256 startTime,
        uint256 endTime,
        EligibilityType eligibilityType,
        bytes memory eligibilityData,
        string memory metadataURI,
        uint8 rarityTier
    ) external whenNotPaused returns (uint256) {
        // Validate issuer authorization
        if (!_authorizedIssuers[msg.sender] && owner() != msg.sender) {
            revert UnauthorizedIssuer();
        }
        
        // Validate string lengths
        if (bytes(title).length == 0 || bytes(title).length > 100) {
            revert InvalidStringLength();
        }
        if (bytes(category).length == 0 || bytes(category).length > 50) {
            revert InvalidStringLength();
        }
        if (bytes(description).length == 0 || bytes(description).length > 1000) {
            revert InvalidStringLength();
        }
        // metadataURI is optional, but if provided must be valid length
        if (bytes(metadataURI).length > 500) {
            revert InvalidStringLength();
        }
        
        // Validate numeric ranges
        if (value == 0 || value > 1000) {
            revert InvalidNumericRange();
        }
        if (rarityTier > RARITY_LEGENDARY) {
            revert InvalidNumericRange();
        }
        
        // Validate time validity
        if (startTime > 0 && endTime > 0 && startTime >= endTime) {
            revert InvalidTimeRange();
        }
        if (endTime > 0 && endTime <= block.timestamp) {
            revert InvalidTimeRange();
        }
        
        // Validate eligibility data based on type
        if (eligibilityType == EligibilityType.TOKEN_HOLDER) {
            // For TOKEN_HOLDER, eligibilityData should contain token address (20 bytes) + min balance (32 bytes)
            if (eligibilityData.length < 52) {
                revert InvalidEligibilityData();
            }
        } else if (eligibilityType == EligibilityType.PROFILE_REQUIRED) {
            // For PROFILE_REQUIRED, eligibilityData can contain optional min reputation score (32 bytes)
            // Empty or 32 bytes is valid
            if (eligibilityData.length != 0 && eligibilityData.length != 32) {
                revert InvalidEligibilityData();
            }
        }
        
        uint256 templateId = _nextTemplateId++;
        
        // Create and store the collectible template
        _collectibleTemplates[templateId] = CollectibleTemplate({
            templateId: templateId,
            title: title,
            category: category,
            description: description,
            value: value,
            issuer: msg.sender,
            maxSupply: maxSupply,
            currentSupply: 0,
            startTime: startTime,
            endTime: endTime,
            eligibilityType: eligibilityType,
            eligibilityData: eligibilityData,
            isPaused: false,
            isActive: true,
            metadataURI: metadataURI,
            rarityTier: rarityTier
        });
        
        emit CollectibleCreated(
            templateId,
            msg.sender,
            category,
            maxSupply,
            eligibilityType
        );
        
        return templateId;
    }
    
    /**
     * @dev Pauses a collectible, preventing new claims
     * @param templateId The ID of the collectible template to pause
     */
    function pauseCollectible(uint256 templateId) external whenNotPaused {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        // Verify collectible exists
        if (!template.isActive) {
            revert CollectibleNotFound();
        }
        
        // Verify caller is issuer or owner
        if (template.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        // Update isPaused flag
        template.isPaused = true;
        
        emit CollectiblePaused(templateId, msg.sender);
    }
    
    /**
     * @dev Resumes a paused collectible, allowing claims again
     * @param templateId The ID of the collectible template to resume
     */
    function resumeCollectible(uint256 templateId) external whenNotPaused {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        // Verify collectible exists
        if (!template.isActive) {
            revert CollectibleNotFound();
        }
        
        // Verify caller is issuer or owner
        if (template.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        // Update isPaused flag
        template.isPaused = false;
        
        emit CollectibleResumed(templateId, msg.sender);
    }
    
    /**
     * @dev Updates collectible metadata (only allowed before any claims are made)
     * @param templateId The ID of the collectible template
     * @param category New category string
     * @param description New description string
     * @param metadataURI New metadata URI
     */
    function updateCollectibleMetadata(
        uint256 templateId,
        string memory category,
        string memory description,
        string memory metadataURI
    ) external whenNotPaused {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        // Verify collectible exists
        if (!template.isActive) {
            revert CollectibleNotFound();
        }
        
        // Verify caller is issuer
        if (template.issuer != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        // Check that no claims have been made yet
        if (template.currentSupply > 0) {
            revert CannotEditAfterClaims();
        }
        
        // Validate string lengths
        if (bytes(category).length == 0 || bytes(category).length > 100) {
            revert InvalidStringLength();
        }
        if (bytes(description).length == 0 || bytes(description).length > 1000) {
            revert InvalidStringLength();
        }
        if (bytes(metadataURI).length == 0 || bytes(metadataURI).length > 500) {
            revert InvalidStringLength();
        }
        
        // Update metadata fields
        template.category = category;
        template.description = description;
        template.metadataURI = metadataURI;
        
        emit CollectibleMetadataUpdated(templateId);
    }
    
    // ============================================
    // ELIGIBILITY VERIFICATION FUNCTIONS
    // ============================================
    
    /**
     * @dev Checks if a user is eligible to claim a collectible
     * @param templateId The ID of the collectible template
     * @param user The address of the user to check
     * @return eligible True if the user is eligible to claim
     */
    function isEligibleToClaim(uint256 templateId, address user) public view returns (bool) {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        // Check collectible is active
        if (!template.isActive) {
            return false;
        }
        
        // Check collectible is not paused
        if (template.isPaused) {
            return false;
        }
        
        // Verify time window
        if (template.startTime > 0 && block.timestamp < template.startTime) {
            return false; // Not started yet
        }
        if (template.endTime > 0 && block.timestamp > template.endTime) {
            return false; // Already ended
        }
        
        // Check supply availability
        if (template.maxSupply > 0 && template.currentSupply >= template.maxSupply) {
            return false; // Supply exhausted
        }
        
        // Verify user hasn't already claimed
        if (_collectibleClaims[templateId][user]) {
            return false; // Already claimed
        }
        
        // Check eligibility based on type
        if (template.eligibilityType == EligibilityType.OPEN) {
            // OPEN: Always eligible (or check if profile required)
            return true;
        } else if (template.eligibilityType == EligibilityType.WHITELIST) {
            // WHITELIST: Check if address is in whitelist mapping
            return _collectibleWhitelist[templateId][user];
        } else if (template.eligibilityType == EligibilityType.TOKEN_HOLDER) {
            // TOKEN_HOLDER: Decode eligibilityData and check token balance
            // eligibilityData format: [token address (20 bytes)][min balance (32 bytes)]
            bytes memory eligData = template.eligibilityData;
            if (eligData.length < 52) {
                return false; // Invalid data
            }
            
            // Extract token address (first 20 bytes)
            address tokenAddress;
            assembly {
                tokenAddress := mload(add(eligData, 20))
            }
            
            // Extract minimum balance (next 32 bytes)
            uint256 minBalance;
            assembly {
                minBalance := mload(add(eligData, 52))
            }
            
            // Check token balance using ERC20 interface
            try IERC20(tokenAddress).balanceOf(user) returns (uint256 balance) {
                return balance >= minBalance;
            } catch {
                return false; // Token contract call failed
            }
        } else if (template.eligibilityType == EligibilityType.PROFILE_REQUIRED) {
            // PROFILE_REQUIRED: Check if user has a profile
            // Try to get profile by owner - if it reverts, user has no profile
            try profileNFT.getProfileByOwner(user) returns (
                uint256 profileId,
                ProfileNFT.Profile memory,
                string memory
            ) {
                // Check minimum reputation if specified in eligibilityData
                bytes memory eligData = template.eligibilityData;
                if (eligData.length == 32) {
                    uint256 minReputation;
                    assembly {
                        minReputation := mload(add(eligData, 32))
                    }
                    
                    uint256 currentReputation = calculateReputationScore(profileId);
                    return currentReputation >= minReputation;
                }
                
                return true; // Profile exists and no min reputation required
            } catch {
                return false; // No profile
            }
        }
        
        return false; // Unknown eligibility type
    }
    
    /**
     * @dev Checks if a user has already claimed a specific collectible
     * @param templateId The ID of the collectible template
     * @param user The address of the user to check
     * @return claimed True if the user has already claimed this collectible
     */
    function hasClaimedCollectible(uint256 templateId, address user) public view returns (bool) {
        return _collectibleClaims[templateId][user];
    }
    
    /**
     * @dev Adds addresses to the whitelist for a collectible
     * @param templateId The ID of the collectible template
     * @param addresses Array of addresses to add to the whitelist
     */
    function addToWhitelist(uint256 templateId, address[] memory addresses) external whenNotPaused {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        // Verify collectible exists
        if (!template.isActive) {
            revert CollectibleNotFound();
        }
        
        // Verify caller is issuer or owner
        if (template.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        // Add addresses to whitelist
        for (uint256 i = 0; i < addresses.length; i++) {
            _collectibleWhitelist[templateId][addresses[i]] = true;
        }
        
        emit WhitelistUpdated(templateId, addresses.length);
    }
    
    /**
     * @dev Removes addresses from the whitelist for a collectible
     * @param templateId The ID of the collectible template
     * @param addresses Array of addresses to remove from the whitelist
     */
    function removeFromWhitelist(uint256 templateId, address[] memory addresses) external whenNotPaused {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        // Verify collectible exists
        if (!template.isActive) {
            revert CollectibleNotFound();
        }
        
        // Verify caller is issuer or owner
        if (template.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        // Remove addresses from whitelist
        for (uint256 i = 0; i < addresses.length; i++) {
            _collectibleWhitelist[templateId][addresses[i]] = false;
        }
        
        emit WhitelistUpdated(templateId, addresses.length);
    }
    
    // ============================================
    // COLLECTIBLE CLAIMING FUNCTIONS
    // ============================================
    
    /**
     * @dev Claims a collectible and mints it to the caller's wallet
     * @param templateId The ID of the collectible template to claim
     * @return cardId The ID of the newly minted card
     */
    function claimCollectible(uint256 templateId) external whenNotPaused nonReentrant returns (uint256) {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        // Verify collectible exists and is active
        if (!template.isActive) {
            revert CollectibleNotActive();
        }
        
        // Check if collectible is paused
        if (template.isPaused) {
            revert CollectibleIsPaused();
        }
        
        // Verify time window
        if (template.startTime > 0 && block.timestamp < template.startTime) {
            revert ClaimPeriodNotStarted();
        }
        if (template.endTime > 0 && block.timestamp > template.endTime) {
            revert ClaimPeriodEnded();
        }
        
        // Verify supply limit not reached
        if (template.maxSupply > 0 && template.currentSupply >= template.maxSupply) {
            revert MaxSupplyReached();
        }
        
        // Check eligibility using isEligibleToClaim
        if (!isEligibleToClaim(templateId, msg.sender)) {
            revert NotEligible();
        }
        
        // Increment currentSupply atomically
        template.currentSupply++;
        
        // Mark user as claimed in _collectibleClaims mapping
        _collectibleClaims[templateId][msg.sender] = true;
        
        // Generate new cardId
        uint256 cardId = _nextCardId++;
        
        // Create Card struct with collectible data and msg.sender as recipient
        _cards[cardId] = Card({
            profileId: 0, // Will be set if profile exists
            value: template.value,
            issuedAt: block.timestamp,
            issuer: template.issuer,
            isValid: true
        });
        
        // Store category hash for filtering
        bytes32 categoryHash = keccak256(abi.encodePacked(template.category));
        _cardCategories[cardId] = categoryHash;
        
        // Store the metadata URI
        _tokenURIs[cardId] = template.metadataURI;
        
        // Set minting mode to COLLECTIBLE
        _cardMintingMode[cardId] = MintingMode.COLLECTIBLE;
        
        // Mint NFT to msg.sender
        _safeMint(msg.sender, cardId);
        
        // Get user's profileId if exists
        uint256 profileId = 0;
        try profileNFT.getProfileByOwner(msg.sender) returns (
            uint256 _profileId,
            ProfileNFT.Profile memory,
            string memory
        ) {
            profileId = _profileId;
            
            // Update card with profileId
            _cards[cardId].profileId = profileId;
            
            // Add card to profile's card list
            _profileCards[profileId].push(cardId);
            
            // Update profile reputation score
            _updateProfileReputationScore(profileId);
        } catch {
            // User has no profile - card is still minted but not associated with a profile
        }
        
        // Emit CollectibleClaimed event
        emit CollectibleClaimed(
            templateId,
            cardId,
            msg.sender,
            block.timestamp
        );
        
        // Return cardId
        return cardId;
    }
    
    // ============================================
    // QUERY AND ANALYTICS FUNCTIONS
    // ============================================
    
    /**
     * @dev Gets a collectible template by ID
     * @param templateId The ID of the collectible template
     * @return template The collectible template struct
     */
    function getCollectibleTemplate(uint256 templateId) external view returns (CollectibleTemplate memory) {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        // Revert if template doesn't exist (isActive will be false for non-existent templates)
        if (!template.isActive) {
            revert CollectibleNotFound();
        }
        
        return template;
    }
    
    /**
     * @dev Gets all active collectibles that are currently claimable
     * @return templateIds Array of active collectible template IDs
     */
    function getActiveCollectibles() external view returns (uint256[] memory) {
        uint256 totalTemplates = _nextTemplateId - 1;
        
        // First pass: count active collectibles
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= totalTemplates; i++) {
            CollectibleTemplate storage template = _collectibleTemplates[i];
            
            // Filter by isActive=true and isPaused=false
            if (template.isActive && !template.isPaused) {
                // Check time window is valid
                bool timeValid = true;
                if (template.startTime > 0 && block.timestamp < template.startTime) {
                    timeValid = false; // Not started yet
                }
                if (template.endTime > 0 && block.timestamp > template.endTime) {
                    timeValid = false; // Already ended
                }
                
                if (timeValid) {
                    activeCount++;
                }
            }
        }
        
        // Second pass: build result array
        uint256[] memory templateIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalTemplates; i++) {
            CollectibleTemplate storage template = _collectibleTemplates[i];
            
            // Apply same filters
            if (template.isActive && !template.isPaused) {
                bool timeValid = true;
                if (template.startTime > 0 && block.timestamp < template.startTime) {
                    timeValid = false;
                }
                if (template.endTime > 0 && block.timestamp > template.endTime) {
                    timeValid = false;
                }
                
                if (timeValid) {
                    templateIds[index] = i;
                    index++;
                }
            }
        }
        
        return templateIds;
    }
    
    /**
     * @dev Gets claim statistics for a collectible
     * @param templateId The ID of the collectible template
     * @return totalClaims The total number of claims (currentSupply)
     * @return remainingSupply The remaining supply (maxSupply - currentSupply)
     * @return isActive Whether the collectible is active
     */
    function getClaimStats(uint256 templateId) external view returns (
        uint256 totalClaims,
        uint256 remainingSupply,
        bool isActive
    ) {
        CollectibleTemplate storage template = _collectibleTemplates[templateId];
        
        totalClaims = template.currentSupply;
        isActive = template.isActive;
        
        // Handle unlimited supply case (maxSupply=0)
        if (template.maxSupply == 0) {
            remainingSupply = type(uint256).max; // Effectively unlimited
        } else {
            remainingSupply = template.maxSupply - template.currentSupply;
        }
        
        return (totalClaims, remainingSupply, isActive);
    }
    
    /**
     * @dev Gets all collectibles created by a specific issuer
     * @param issuer The address of the issuer
     * @return templateIds Array of template IDs created by this issuer
     */
    function getCollectiblesByIssuer(address issuer) external view returns (uint256[] memory) {
        uint256 totalTemplates = _nextTemplateId - 1;
        
        // First pass: count collectibles by this issuer
        uint256 count = 0;
        for (uint256 i = 1; i <= totalTemplates; i++) {
            CollectibleTemplate storage template = _collectibleTemplates[i];
            if (template.issuer == issuer && template.isActive) {
                count++;
            }
        }
        
        // Second pass: build result array
        uint256[] memory templateIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalTemplates; i++) {
            CollectibleTemplate storage template = _collectibleTemplates[i];
            if (template.issuer == issuer && template.isActive) {
                templateIds[index] = i;
                index++;
            }
        }
        
        return templateIds;
    }
    
    /**
     * @dev Gets the minting mode for a specific card
     * @param cardId The ID of the card
     * @return mode The minting mode (DIRECT or COLLECTIBLE)
     */
    function getCardMintingMode(uint256 cardId) external view returns (MintingMode) {
        if (!_exists(cardId)) {
            revert CardNotFound();
        }
        return _cardMintingMode[cardId];
    }
    
    /**
     * @dev Revokes a collectible token (marks as invalid)
     * @param cardId The ID of the card to revoke
     */
    function revokeCollectibleToken(uint256 cardId) external whenNotPaused {
        // Verify card exists
        if (!_exists(cardId)) {
            revert CardNotFound();
        }
        
        Card storage card = _cards[cardId];
        
        // Verify caller is issuer or owner
        if (card.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        // Check card was minted via collectible
        if (_cardMintingMode[cardId] != MintingMode.COLLECTIBLE) {
            revert UnauthorizedAccess();
        }
        
        // Check card is not already revoked
        if (!card.isValid) {
            revert CardAlreadyRevoked();
        }
        
        // Mark card as invalid
        card.isValid = false;
        
        // Update profile reputation score if card is associated with a profile
        if (card.profileId != 0) {
            _updateProfileReputationScore(card.profileId);
        }
        
        // Emit CardRevoked event
        emit CardRevoked(cardId, msg.sender);
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