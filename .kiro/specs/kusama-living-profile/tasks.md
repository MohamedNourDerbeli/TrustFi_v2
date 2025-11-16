# Implementation Plan

- [x] 1. Set up Kusama Hub network configuration





  - Install required dependencies: `npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers`
  - Add Kusama Hub network to hardhat.config.ts with url "https://kusama-asset-hub-eth-rpc.polkadot.io" and chainId 420420418
  - Ensure PRIVATE_KEY environment variable is configured for deployment
  - _Requirements: 3.6, 7.6_

- [x] 2. Implement KusamaSVGArt smart contract






  - [x] 2.1 Create KusamaSVGArt.sol contract file

    - Write contract with OpenZeppelin Base64 import
    - Implement generateSVG function that accepts uint256 score parameter
    - Add score normalization logic (cap at 100)
    - Implement color selection logic (red < 30, orange 30-69, green >= 70)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_


  - [x] 2.2 Implement SVG generation logic

    - Create SVG structure with 200x200 viewBox
    - Add dark background rectangle (#1a1a1a)
    - Add base circle with gray stroke (#333)
    - Add dynamic colored progress circle with stroke-dasharray
    - Add numeric score text element
    - Add "Reputation Score" label text
    - _Requirements: 2.5, 2.6, 2.7_



  - [x] 2.3 Implement JSON metadata generation

    - Create JSON object with name, description, and image fields
    - Encode SVG to base64 using OpenZeppelin Base64 library
    - Format image as data URI (data:image/svg+xml;base64,...)
    - Return complete JSON string

    - _Requirements: 2.5_



  - [x] 2.4 Add uint256 to string helper function

    - Implement uint2str function for number conversion
    - Handle zero case
    - Use bytes manipulation for efficient conversion
    - _Requirements: 2.7_
- [x] 3. Deploy KusamaSVGArt contract to Moonbase Alpha (Testnet)

  - [x] 3.1 Create deployment script
    - ✅ Created scripts/deploy-kusama-svg.ts with enhanced deployment logic
    - ✅ Added balance checking before deployment
    - ✅ Added contract verification with multiple test scores
    - ✅ Tests generateSVG and tokenMetadata functions
    - ✅ Logs deployed contract address and network info
    - _Requirements: 3.3, 3.4, 7.1_

  - [x] 3.2 Execute deployment
    - ✅ Upgraded contract with enhanced KusamaLivingArt version
    - ✅ Added tokenMetadata, imageDataURI, and paletteAndRings functions
    - ✅ Deployed to Moonbase Alpha: `0x4EC70469102122D27011d3d7179FF1612F1d33DB`
    - ✅ Contract uses dynamic color palettes (5 tiers) and ring counts (3-7 rings)
    - ✅ Documented contract address in .env file
    - ✅ Created helper scripts: check-balance.ts and test-kusama-svg.ts
    - _Requirements: 3.3, 3.5_

  - [x] 3.3 Test deployed contract
    - ✅ Tested generateSVG with scores: 25, 49, 50, 149, 150, 399, 400, 799, 800, 1000
    - ✅ Verified palette changes at thresholds (50, 150, 400, 800)
    - ✅ Validated tokenMetadata function returns proper data URI
    - ✅ Validated imageDataURI function works correctly
    - ✅ Confirmed JSON format and base64 encoding
    - ✅ All tests passed successfully
    - _Requirements: 3.4_

  **Note**: Deployed to Moonbase Alpha testnet first for testing. Production deployment to Kusama Hub requires funding the deployer account with KSM tokens.

- [x] 4. Create template 999 on-chain





  - Write script to call createTemplate on ReputationCard contract
  - Set templateId to 999, tier to 3, maxSupply to 0 (unlimited)
  - Set startTime to 0 (immediate) and endTime to 0 (no expiry)
  - Execute transaction and verify template created
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Implement dynamic-metadata Edge Function





  - [x] 5.1 Create Edge Function file structure


    - Create supabase/functions/dynamic-metadata/index.ts
    - Set up Deno imports for serve, supabase-js, and viem
    - Define configuration constants for contract addresses and ABIs
    - _Requirements: 4.1, 7.3, 7.4_

  - [x] 5.2 Implement token ID extraction and validation


    - Parse URL pathname to extract token ID from path segments
    - Validate token ID is present
    - Return 400 error if missing
    - Map token ID to profile ID (for Living Profile, tokenId = profileId)
    - _Requirements: 4.1, 4.6_

  - [x] 5.3 Implement reputation score query


    - Create viem public client for main chain
    - Create contract instance for ReputationCard
    - Call calculateScoreForProfile with profile ID
    - Handle contract call errors with 500 response
    - _Requirements: 4.2, 4.3, 4.5_



  - [x] 5.4 Implement SVG art contract call

    - Create viem public client for Kusama Hub
    - Create contract instance for KusamaSVGArt
    - Call generateSVG with reputation score

    - Parse returned JSON metadata string
    - _Requirements: 4.4_

  - [x] 5.5 Implement response formatting

    - Return parsed metadata with Content-Type: application/json
    - Add error handling for JSON parsing failures
    - Include error details in 500 responses
    - _Requirements: 4.5_

- [x] 6. Deploy and configure Edge Function





  - [x] 6.1 Deploy function to Supabase




    - Run supabase functions deploy dynamic-metadata
    - Verify function is accessible
    - Test with curl command
    - _Requirements: 7.3_




  - [x] 6.2 Set environment variables
    - Configure REPUTATION_CARD_CONTRACT_ADDRESS
    - Configure KUSAMA_SVG_CONTRACT_ADDRESS
    - Configure SUPABASE_URL and SUPABASE_ANON_KEY
    - _Requirements: 7.4_

  - [ ]* 6.3 Test Edge Function
    - Test with valid profile ID
    - Test with missing token ID (expect 400)
    - Test with invalid profile ID
    - Verify metadata format and SVG encoding
    - _Requirements: 4.6, 4.7_

- [x] 7. Configure database template record
  - [x] 7.1 Create template insertion script
    - Write SQL or TypeScript script to insert template 999 record
    - Set issuer_name to "TrustFi Core Team"
    - Set title to "Kusama Living Profile"
    - Set description explaining dynamic nature
    - Set tier to 3, template_id to 999
    - Set token_uri_prefix to deployed Edge Function URL
    - Add placeholder image_url
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.2_

  - [x] 7.2 Execute template insertion








    - Run insertion script against Supabase database
    - Verify record created with correct values
    - Test query from frontend
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 8. Update CollectiblesPage component






  - [x] 8.1 Add template 999 detection logic

    - In handleClaim function, check if templateId === 999
    - Branch logic for dynamic vs static metadata
    - _Requirements: 6.4_


  - [x] 8.2 Implement dynamic metadata URI construction

    - For template 999, construct URI using token_uri_prefix + profileId
    - Skip IPFS upload for template 999
    - Pass dynamic URI to claimWithSignature
    - _Requirements: 6.5_


  - [x] 8.3 Update UI for dynamic collectible

    - Add visual indicator (badge/icon) for template 999
    - Add tooltip explaining dynamic nature
    - Ensure claim button works with dynamic URI

    - _Requirements: 6.1, 6.2_

  - [x] 8.4 Handle profile requirement

    - Verify user has profile before allowing claim
    - Show "Create Profile First" message if no profile
    - _Requirements: 6.6_

- [ ] 9. Create deployment documentation
  - [ ] 9.1 Document contract deployment steps
    - Write step-by-step guide for deploying KusamaSVGArt
    - Include network configuration instructions
    - Document contract verification process
    - _Requirements: 7.1, 7.6_

  - [ ] 9.2 Document Edge Function setup
    - Write guide for deploying dynamic-metadata function
    - Document environment variable configuration
    - Include testing instructions
    - _Requirements: 7.3, 7.4_

  - [ ] 9.3 Document database configuration
    - Write guide for inserting template 999 record
    - Document token_uri_prefix format
    - Include verification steps
    - _Requirements: 7.2, 7.5_

  - [ ] 9.4 Create end-to-end setup guide
    - Combine all deployment steps in order
    - Add troubleshooting section
    - Include example commands and outputs
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10. Integration testing and verification
  - [ ]* 10.1 Test complete claim flow
    - Create test profile
    - Claim Kusama Living Profile collectible
    - Verify NFT minted with dynamic URI
    - Query tokenURI and verify format
    - Call dynamic metadata endpoint
    - Verify metadata reflects current score
    - _Requirements: 1.1, 1.2, 1.4, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 10.2 Test dynamic update behavior
    - Claim Living Profile with initial score
    - Claim additional collectibles to increase score
    - Query metadata endpoint again
    - Verify SVG reflects updated score
    - Verify color changes at thresholds (30, 70)
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 10.3 Test error scenarios
    - Test claim without profile (expect rejection)
    - Test metadata endpoint with invalid token ID
    - Test metadata endpoint with missing token ID
    - Verify appropriate error messages
    - _Requirements: 1.3, 4.6, 4.7_
