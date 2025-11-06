// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ProfileNFT
 * @dev ERC721 contract for managing user profiles in the TrustFi system
 * Each NFT represents a unique user profile with reputation data
 */
contract ProfileNFT is ERC721, Ownable, Pausable {
    
    // Profile data structure
    struct Profile {
        string name;
        string bio;
        uint256 reputationScore;
        uint256 createdAt;
        bool isActive;
    }
    
    // State variables
    uint256 private _nextTokenId = 1;
    mapping(uint256 => Profile) private _profiles;
    mapping(address => uint256) private _ownerToTokenId;
    mapping(address => bool) private _authorizedContracts;
    
    // Events
    event ProfileCreated(uint256 indexed tokenId, address indexed owner, string name);
    event ProfileUpdated(uint256 indexed tokenId, string name, string bio);
    event ReputationScoreUpdated(uint256 indexed tokenId, uint256 newScore);
    event ProfileDeactivated(uint256 indexed tokenId);
    event ContractAuthorized(address indexed contractAddress);
    event ContractRevoked(address indexed contractAddress);
    
    // Errors
    error ProfileAlreadyExists();
    error ProfileNotFound();
    error UnauthorizedAccess();
    error InvalidProfileData();
    
    constructor() ERC721("TrustFi Profile", "TFPROFILE") Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new profile NFT for the caller
     * @param name The display name for the profile
     * @param bio The biography/description for the profile
     * @return tokenId The ID of the newly created profile NFT
     */
    function createProfile(string memory name, string memory bio) 
        external 
        whenNotPaused 
        returns (uint256) 
    {
        // Check if user already has a profile
        if (_ownerToTokenId[msg.sender] != 0) {
            revert ProfileAlreadyExists();
        }
        
        // Validate input data
        if (bytes(name).length == 0 || bytes(name).length > 50) {
            revert InvalidProfileData();
        }
        if (bytes(bio).length > 200) {
            revert InvalidProfileData();
        }
        
        uint256 tokenId = _nextTokenId++;
        
        // Create the profile
        _profiles[tokenId] = Profile({
            name: name,
            bio: bio,
            reputationScore: 0,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Mint the NFT to the caller
        _safeMint(msg.sender, tokenId);
        
        // Map owner to token ID for quick lookup
        _ownerToTokenId[msg.sender] = tokenId;
        
        emit ProfileCreated(tokenId, msg.sender, name);
        
        return tokenId;
    }
    
    /**
     * @dev Retrieves profile data for a given token ID
     * @param tokenId The ID of the profile NFT
     * @return profile The profile data
     */
    function getProfile(uint256 tokenId) 
        external 
        view 
        returns (Profile memory profile) 
    {
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        return _profiles[tokenId];
    }
    
    /**
     * @dev Updates the reputation score for a profile
     * @param tokenId The ID of the profile NFT
     * @param newScore The new reputation score
     */
    function updateReputationScore(uint256 tokenId, uint256 newScore) 
        external 
        whenNotPaused 
    {
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        // Only owner, contract owner, or authorized contracts can update reputation score
        if (ownerOf(tokenId) != msg.sender && owner() != msg.sender && !_authorizedContracts[msg.sender]) {
            revert UnauthorizedAccess();
        }
        
        _profiles[tokenId].reputationScore = newScore;
        
        emit ReputationScoreUpdated(tokenId, newScore);
    }
    
    /**
     * @dev Retrieves profile data by owner address
     * @param profileOwner The address of the profile owner
     * @return tokenId The token ID of the profile (0 if not found)
     * @return profile The profile data
     */
    function getProfileByOwner(address profileOwner) 
        external 
        view 
        returns (uint256 tokenId, Profile memory profile) 
    {
        tokenId = _ownerToTokenId[profileOwner];
        
        if (tokenId == 0) {
            // Return empty profile if not found
            return (0, Profile("", "", 0, 0, false));
        }
        
        profile = _profiles[tokenId];
        return (tokenId, profile);
    }
    
    /**
     * @dev Updates profile information (name and bio)
     * @param tokenId The ID of the profile NFT
     * @param name The new display name
     * @param bio The new biography
     */
    function updateProfile(uint256 tokenId, string memory name, string memory bio) 
        external 
        whenNotPaused 
    {
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        // Only the owner can update their profile
        if (ownerOf(tokenId) != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        // Validate input data
        if (bytes(name).length == 0 || bytes(name).length > 50) {
            revert InvalidProfileData();
        }
        if (bytes(bio).length > 200) {
            revert InvalidProfileData();
        }
        
        _profiles[tokenId].name = name;
        _profiles[tokenId].bio = bio;
        
        emit ProfileUpdated(tokenId, name, bio);
    }
    
    /**
     * @dev Deactivates a profile (marks as inactive)
     * @param tokenId The ID of the profile NFT
     */
    function deactivateProfile(uint256 tokenId) 
        external 
        whenNotPaused 
    {
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        // Only the owner can deactivate their profile
        if (ownerOf(tokenId) != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        _profiles[tokenId].isActive = false;
        
        emit ProfileDeactivated(tokenId);
    }
    
    /**
     * @dev Checks if a profile exists for a given token ID
     * @param tokenId The token ID to check
     * @return exists True if the profile exists
     */
    function profileExists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }
    
    /**
     * @dev Returns the total number of profiles created
     * @return count The total number of profiles
     */
    function totalProfiles() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @dev Authorizes a contract to update reputation scores
     * @param contractAddress The address of the contract to authorize
     */
    function authorizeContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }
    
    /**
     * @dev Revokes authorization for a contract
     * @param contractAddress The address of the contract to revoke
     */
    function revokeContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = false;
        emit ContractRevoked(contractAddress);
    }
    
    /**
     * @dev Checks if a contract is authorized to update reputation scores
     * @param contractAddress The address to check
     * @return authorized True if the contract is authorized
     */
    function isAuthorizedContract(address contractAddress) external view returns (bool) {
        return _authorizedContracts[contractAddress];
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
     * @dev Override _update to handle owner mapping updates and prevent transfers
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        

        if (from != address(0) && to != address(0)) {
            revert UnauthorizedAccess();
        }
        
        // Update owner mapping when minting
        if (from != address(0)) {
            _ownerToTokenId[from] = 0;
        }
        if (to != address(0)) {
            _ownerToTokenId[to] = tokenId;
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