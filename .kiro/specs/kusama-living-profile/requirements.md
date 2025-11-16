# Requirements Document

## Introduction

The Kusama Living Profile is a dynamic NFT collectible that reflects a user's real-time on-chain reputation score. This feature leverages on-chain SVG art generation to create a "living" profile that updates automatically as the user's reputation changes. The implementation includes deploying a generative art contract to a Kusama EVM parachain (Moonriver), creating a special collectible template, and building a serverless metadata endpoint that serves dynamic tokenURI data.

## Glossary

- **Living Profile**: A dynamic NFT collectible whose visual representation and metadata change based on the owner's current reputation score
- **SVG Art Contract**: A smart contract deployed on Kusama Hub that generates SVG images based on reputation scores
- **ReputationCard Contract**: The main smart contract that manages user profiles and reputation scores
- **Metadata Endpoint**: A serverless function that generates dynamic tokenURI responses for the Living Profile NFT
- **CollectibleTemplate**: A database record defining the properties and configuration of a claimable collectible type
- **Kusama Hub**: The Kusama Asset Hub with Ethereum compatibility (Chain ID: 420420418) where the SVG art contract will be deployed
- **ProfileNFT**: The on-chain identity token that represents a user's profile
- **Template ID**: A unique identifier for a collectible template (999 for Kusama Living Profile)

## Requirements

### Requirement 1

**User Story:** As a user with a profile, I want to claim a Kusama Living Profile collectible, so that I can showcase my dynamic reputation score as an NFT

#### Acceptance Criteria

1. WHEN a user with a valid ProfileNFT requests to claim the Kusama Living Profile collectible, THE ReputationCard Contract SHALL mint a new token with template ID 999
2. WHEN the Kusama Living Profile token is minted, THE ReputationCard Contract SHALL store the dynamic metadata URI pointing to the serverless endpoint
3. IF a user attempts to claim the Kusama Living Profile without a valid ProfileNFT, THEN THE ReputationCard Contract SHALL reject the transaction
4. WHEN the claim transaction completes successfully, THE system SHALL display a success confirmation to the user
5. THE CollectiblesPage Component SHALL display the Kusama Living Profile template with appropriate visual indicators distinguishing it from static collectibles

### Requirement 2

**User Story:** As a system, I want to generate dynamic SVG art based on reputation scores, so that the Living Profile visually represents the user's current standing

#### Acceptance Criteria

1. THE KusamaSVGArt Contract SHALL accept a reputation score value between 0 and 100 as input
2. WHEN the reputation score is below 30, THE KusamaSVGArt Contract SHALL generate SVG art with red color indicators
3. WHEN the reputation score is between 30 and 69, THE KusamaSVGArt Contract SHALL generate SVG art with orange color indicators
4. WHEN the reputation score is 70 or above, THE KusamaSVGArt Contract SHALL generate SVG art with green color indicators
5. THE KusamaSVGArt Contract SHALL return a complete JSON metadata object containing the SVG image as a base64-encoded data URI
6. THE generated SVG SHALL include a circular progress indicator that fills proportionally to the reputation score
7. THE generated SVG SHALL display the numeric reputation score value as text

### Requirement 3

**User Story:** As the system, I want to deploy the SVG art contract to Kusama Hub, so that the generative art functionality is available on the Kusama network with Ethereum compatibility

#### Acceptance Criteria

1. THE KusamaSVGArt Contract SHALL be compiled with Solidity version 0.8.20 or higher
2. THE KusamaSVGArt Contract SHALL import and utilize OpenZeppelin's Base64 utility library
3. WHEN the contract is deployed to Kusama Hub (Chain ID 420420418), THE deployment script SHALL verify the contract address and log it for configuration
4. THE deployment process SHALL include verification that the generateSVG function executes successfully with test inputs
5. THE deployed contract address SHALL be documented in the environment configuration
6. THE deployment script SHALL use the Kusama Hub RPC URL (https://kusama-asset-hub-eth-rpc.polkadot.io) for network connection

### Requirement 4

**User Story:** As the system, I want a serverless metadata endpoint that generates dynamic tokenURI responses, so that NFT marketplaces and wallets display the current reputation score

#### Acceptance Criteria

1. THE dynamic-metadata Edge Function SHALL accept a token ID as a URL path parameter
2. WHEN the function receives a valid token ID, THE function SHALL query the ReputationCard Contract to retrieve the associated profile ID
3. WHEN the profile ID is retrieved, THE function SHALL call calculateScoreForProfile on the ReputationCard Contract to get the current reputation score
4. WHEN the reputation score is obtained, THE function SHALL call the KusamaSVGArt Contract's generateSVG function with the score value
5. THE function SHALL return the generated JSON metadata with appropriate Content-Type headers
6. IF any step in the metadata generation fails, THEN THE function SHALL return an error response with status code 500 and error details
7. IF the token ID is missing from the request, THEN THE function SHALL return an error response with status code 400

### Requirement 5

**User Story:** As a system administrator, I want to configure the Kusama Living Profile template in the database, so that users can discover and claim this special collectible

#### Acceptance Criteria

1. THE collectible_templates table SHALL contain a record for the Kusama Living Profile with template_id 999
2. THE template record SHALL include the issuer_name "TrustFi Core Team"
3. THE template record SHALL include the title "Kusama Living Profile"
4. THE template record SHALL include a description explaining the dynamic nature of the collectible
5. THE template record SHALL have tier value 3 indicating highest tier status
6. THE template record SHALL have a token_uri_prefix pointing to the deployed dynamic-metadata Edge Function URL
7. THE template record SHALL include a placeholder image_url for display before claiming

### Requirement 6

**User Story:** As a user viewing the collectibles page, I want to see the Kusama Living Profile as a claimable option, so that I can understand and claim this unique collectible

#### Acceptance Criteria

1. WHEN the CollectiblesPage component loads, THE component SHALL fetch all collectible templates including the Kusama Living Profile from Supabase
2. THE CollectiblesPage component SHALL render the Kusama Living Profile template with its title, description, and placeholder image
3. WHEN a user with a valid profile clicks the claim button for the Kusama Living Profile, THE component SHALL initiate the claim process with template ID 999
4. WHEN processing the claim for template ID 999, THE CollectibleCard component SHALL use the dynamic metadata URI instead of uploading static metadata to IPFS
5. THE CollectibleCard component SHALL construct the metadata URI by appending the user's profile ID to the token_uri_prefix
6. IF the user does not have a profile, THEN THE component SHALL display a message prompting profile creation instead of the claim button

### Requirement 7

**User Story:** As a developer, I want clear deployment and configuration scripts, so that I can set up the Kusama Living Profile feature in different environments

#### Acceptance Criteria

1. THE deployment documentation SHALL include step-by-step instructions for deploying the KusamaSVGArt Contract to Kusama Hub using Hardhat
2. THE configuration scripts SHALL include a template setup script that creates the database record for template ID 999
3. THE Edge Function deployment process SHALL include instructions for setting required environment variables
4. THE environment variables SHALL include REPUTATION_CARD_CONTRACT_ADDRESS, KUSAMA_SVG_CONTRACT_ADDRESS, and SUPABASE_URL
5. THE setup documentation SHALL specify the correct token_uri_prefix format for the template configuration
6. THE deployment configuration SHALL include Kusama Hub network details (Chain ID: 420420418, RPC URL: https://kusama-asset-hub-eth-rpc.polkadot.io)
