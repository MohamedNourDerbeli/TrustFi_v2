// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ProfileNFT
 * @dev ERC721 contract for managing user profiles with metadata URIs
 * Profile data (name, bio, image) stored off-chain as metadata
 * Only essential data (reputation, timestamps) stored on-chain
 */
contract ProfileNFT is ERC721, Ownable, Pausable {
    
    // Minimal on-chain profile data
    struct Profile {
        uint256 reputationScore;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
    }
    
    // State variables
    uint256 private _nextTokenId = 1;
    mapping(uint256 => Profile) private _profiles;
    mapping(uint256 => string) private _tokenURIs;
    mapping(address => uint256) private _ownerToTokenId;
    mapping(address => bool) private _authorizedContracts;
    
    // Events
    event ProfileCreated(uint256 indexed tokenId, address indexed owner, string metadataURI);
    event ProfileMetadataUpdated(uint256 indexed tokenId, string newMetadataURI);
    event ReputationScoreUpdated(uint256 indexed tokenId, uint256 newScore);
    event ProfileDeactivated(uint256 indexed tokenId);
    event ContractAuthorized(address indexed contractAddress);
    event ContractRevoked(address indexed contractAddress);
    
    // Errors
    error ProfileAlreadyExists();
    error ProfileNotFound();
    error UnauthorizedAccess();
    error InvalidMetadataURI();
    
    constructor() ERC721("TrustFi Profile", "TFPROFILE") Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new profile NFT with metadata URI
     * @param metadataURI IPFS or HTTP URI pointing to profile metadata JSON
     * Metadata JSON format:
     * {
     *   "name": "User Name",
     *   "bio": "User biography",
     *   "image": "ipfs://...",
     *   "attributes": [...]
     * }
     * @return tokenId The ID of the newly created profile NFT
     */
    function createProfile(string memory metadataURI) 
        external 
        whenNotPaused 
        returns (uint256) 
    {
        // Check if user already has a profile
        if (_ownerToTokenId[msg.sender] != 0) {
            revert ProfileAlreadyExists();
        }
        
        // Validate metadata URI
        if (bytes(metadataURI).length == 0) {
            revert InvalidMetadataURI();
        }
        
        uint256 tokenId = _nextTokenId++;
        
        // Create minimal on-chain profile
        _profiles[tokenId] = Profile({
            reputationScore: 0,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        // Mint NFT and set metadata URI
        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        
        // Map owner to token
        _ownerToTokenId[msg.sender] = tokenId;
        
        emit ProfileCreated(tokenId, msg.sender, metadataURI);
        
        return tokenId;
    }
    
    /**
     * @dev Returns the token URI for a given token ID
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        return _tokenURIs[tokenId];
    }
    
    /**
     * @dev Updates the metadata URI for a profile
     * @param tokenId The profile token ID
     * @param newMetadataURI New IPFS or HTTP URI
     */
    function updateProfileMetadata(uint256 tokenId, string memory newMetadataURI) 
        external 
        whenNotPaused 
    {
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        // Only owner can update their profile
        if (ownerOf(tokenId) != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        if (bytes(newMetadataURI).length == 0) {
            revert InvalidMetadataURI();
        }
        
        _tokenURIs[tokenId] = newMetadataURI;
        _profiles[tokenId].lastUpdated = block.timestamp;
        
        emit ProfileMetadataUpdated(tokenId, newMetadataURI);
    }
    
    /**
     * @dev Get profile data by token ID
     */
    function getProfile(uint256 tokenId) 
        external 
        view 
        returns (Profile memory profile, string memory metadataURI) 
    {
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        return (_profiles[tokenId], tokenURI(tokenId));
    }
    
    /**
     * @dev Get profile by owner address
     */
    function getProfileByOwner(address owner) 
        external 
        view 
        returns (uint256 tokenId, Profile memory profile, string memory metadataURI) 
    {
        tokenId = _ownerToTokenId[owner];
        if (tokenId == 0) {
            revert ProfileNotFound();
        }
        
        return (tokenId, _profiles[tokenId], tokenURI(tokenId));
    }
    
    /**
     * @dev Update reputation score (only authorized contracts)
     */
    function updateReputationScore(uint256 tokenId, uint256 newScore) 
        external 
        whenNotPaused 
    {
        if (!_authorizedContracts[msg.sender]) {
            revert UnauthorizedAccess();
        }
        
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        _profiles[tokenId].reputationScore = newScore;
        _profiles[tokenId].lastUpdated = block.timestamp;
        
        emit ReputationScoreUpdated(tokenId, newScore);
    }
    
    /**
     * @dev Deactivate a profile
     */
    function deactivateProfile(uint256 tokenId) 
        external 
        whenNotPaused 
    {
        if (!_exists(tokenId)) {
            revert ProfileNotFound();
        }
        
        if (ownerOf(tokenId) != msg.sender) {
            revert UnauthorizedAccess();
        }
        
        _profiles[tokenId].isActive = false;
        
        emit ProfileDeactivated(tokenId);
    }
    
    /**
     * @dev Authorize a contract to update reputation scores
     */
    function authorizeContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }
    
    /**
     * @dev Revoke contract authorization
     */
    function revokeContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = false;
        emit ContractRevoked(contractAddress);
    }
    
    /**
     * @dev Check if a contract is authorized
     */
    function isAuthorizedContract(address contractAddress) external view returns (bool) {
        return _authorizedContracts[contractAddress];
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Check if profile exists (public function for external contracts)
     */
    function profileExists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @dev Check if token exists (internal)
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Override to prevent transfers (soulbound)
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Prevent transfers (from != address(0) && to != address(0))
        if (from != address(0) && to != address(0)) {
            revert UnauthorizedAccess();
        }
        
        return super._update(to, tokenId, auth);
    }
}
