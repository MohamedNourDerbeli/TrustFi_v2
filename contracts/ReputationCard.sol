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
    struct Card {
        uint256 profileId;
        string category;
        string description;
        uint256 value;
        uint256 issuedAt;
        address issuer;
        bool isValid;
    }
    
    // State variables
    uint256 private _nextCardId = 1;
    mapping(uint256 => Card) private _cards;
    mapping(uint256 => uint256[]) private _profileCards; // profileId => cardIds[]
    mapping(address => bool) private _authorizedIssuers;
    
    // Reference to ProfileNFT contract
    ProfileNFT public immutable profileNFT;
    
    // Events
    event CardIssued(
        uint256 indexed cardId, 
        uint256 indexed profileId, 
        address indexed issuer,
        string category,
        uint256 value
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
     * @param category The category of the reputation card
     * @param description Description of the achievement or activity
     * @param value The reputation value of this card
     * @return cardId The ID of the newly issued card
     */
    function issueCard(
        uint256 profileId,
        string memory category,
        string memory description,
        uint256 value
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
        if (bytes(category).length == 0 || bytes(category).length > 50) {
            revert InvalidCardData();
        }
        if (bytes(description).length == 0 || bytes(description).length > 200) {
            revert InvalidCardData();
        }
        if (value == 0 || value > 1000) { // Max value of 1000 points per card
            revert InvalidCardData();
        }
        
        uint256 cardId = _nextCardId++;
        
        // Create the reputation card
        _cards[cardId] = Card({
            profileId: profileId,
            category: category,
            description: description,
            value: value,
            issuedAt: block.timestamp,
            issuer: msg.sender,
            isValid: true
        });
        
        // Add card to profile's card list
        _profileCards[profileId].push(cardId);
        
        // Mint the card NFT to the profile owner
        address profileOwner = profileNFT.ownerOf(profileId);
        _safeMint(profileOwner, cardId);
        
        // Update the profile's reputation score
        _updateProfileReputationScore(profileId);
        
        emit CardIssued(cardId, profileId, msg.sender, category, value);
        
        return cardId;
    }
    
    /**
     * @dev Retrieves reputation card data for a given card ID
     * @param cardId The ID of the reputation card
     * @return card The reputation card data
     */
    function getCard(uint256 cardId) external view returns (Card memory) {
        if (!_exists(cardId)) {
            revert CardNotFound();
        }
        
        return _cards[cardId];
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
     * @dev Check if a token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}