# Dynamic Metadata Edge Function

This Supabase Edge Function serves dynamic NFT metadata for the Kusama Living Profile collectible. It queries the user's reputation score from the ReputationCard contract and generates SVG art using the KusamaSVGArt contract on Kusama Hub.

## Overview

The function:
1. Extracts the token ID from the URL path
2. Queries the ReputationCard contract for the profile's reputation score
3. Calls the KusamaSVGArt contract on Kusama Hub to generate dynamic SVG art
4. Returns the complete NFT metadata as JSON

## Deployment

### Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project set up
- Contract addresses for ReputationCard and KusamaSVGArt

### Deploy the Function

```bash
supabase functions deploy dynamic-metadata
```

### Set Environment Variables

Configure the following environment variables in your Supabase project:

```bash
supabase secrets set REPUTATION_CARD_CONTRACT_ADDRESS=0x8a58D43E1E70D6DBa811a452de7Acb30aCf06591
supabase secrets set KUSAMA_SVG_CONTRACT_ADDRESS=0x4EC70469102122D27011d3d7179FF1612F1d33DB
supabase secrets set MAIN_CHAIN_RPC_URL=https://rpc.api.moonbase.moonbeam.network
```

## Usage

### Endpoint Format

```
GET https://YOUR_PROJECT.supabase.co/functions/v1/dynamic-metadata/{tokenId}
```

### Example Request

```bash
curl https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/1
```

### Example Response

```json
{
  "name": "Kusama Living Profile #1",
  "description": "A living Kusama profile image that evolves with a TrustFi reputation score.",
  "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53...",
  "attributes": [
    {
      "trait_type": "Score",
      "value": 350
    }
  ]
}
```

## Error Responses

### 400 - Missing Token ID

```json
{
  "error": "Missing token ID",
  "message": "Token ID must be provided in the URL path"
}
```

### 500 - Contract Call Failed

```json
{
  "error": "Failed to read reputation score",
  "details": "Error message details"
}
```

## Testing

Test the function locally:

```bash
supabase functions serve dynamic-metadata
```

Then make a request:

```bash
curl http://localhost:54321/functions/v1/dynamic-metadata/1
```

## Architecture

- **Main Chain**: Moonbase Alpha (testnet) - hosts ReputationCard contract
- **Kusama Hub**: Chain ID 420420418 - hosts KusamaSVGArt contract
- **Cross-Chain**: Function queries both chains to generate dynamic metadata

## Requirements Satisfied

- 4.1: Accepts token ID as URL path parameter
- 4.2: Queries ReputationCard for profile ID
- 4.3: Calls calculateScoreForProfile for reputation score
- 4.4: Calls KusamaSVGArt to generate SVG
- 4.5: Returns JSON metadata with proper headers
- 4.6: Returns 400 for missing token ID
- 4.7: Returns 500 with error details on failures
- 7.3: Deployment instructions included
- 7.4: Environment variable configuration documented
