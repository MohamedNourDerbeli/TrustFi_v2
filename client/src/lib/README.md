# TrustFi Library Utilities

This directory contains core utility functions and configurations for the TrustFi application.

## Files Overview

### contracts.ts
Contract addresses and configuration for deployed smart contracts.

```typescript
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from './contracts';
```

### errors.ts
Error parsing utilities to convert contract errors into user-friendly messages.

```typescript
import { parseContractError, isUserRejection, isNetworkError } from './errors';

try {
  // Contract call
} catch (error) {
  const parsed = parseContractError(error);
  console.log(parsed.message); // User-friendly message
  console.log(parsed.action);  // Suggested action
}
```

**Features:**
- Parses common contract revert reasons
- Provides user-friendly error messages
- Suggests corrective actions
- Handles wallet, network, and permission errors

### signature.ts
EIP712 signature utilities for claim link generation and verification.

```typescript
import { getClaimTypedData, generateClaimLink, parseClaimLink } from './signature';

// Generate typed data for signing
const typedData = getClaimTypedData(claimParams, contractAddress);

// Generate a claim link
const link = generateClaimLink(baseUrl, claimParams, signature);

// Parse claim link from URL
const parsed = parseClaimLink(new URLSearchParams(window.location.search));
```

**Features:**
- EIP712 domain and type definitions
- Claim link generation with encoded parameters
- URL parameter parsing for claim pages
- Type-safe signature handling

### supabase.ts
Supabase client configuration and database type definitions.

```typescript
import { supabase } from './supabase';
import type { ProfileRow, TemplateCacheRow, ClaimLogRow } from './supabase';

// Query profiles
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('wallet', address);
```

**Features:**
- Configured Supabase client
- TypeScript types for all database tables
- Type-safe database operations

## Usage Examples

### Error Handling

```typescript
import { parseContractError } from './lib/errors';

async function createProfile(tokenURI: string) {
  try {
    const tx = await profileContract.createProfile(tokenURI);
    await tx.wait();
  } catch (error) {
    const { message, action } = parseContractError(error);
    alert(`${message}\n${action}`);
  }
}
```

### Claim Link Generation

```typescript
import { getClaimTypedData, generateClaimLink } from './lib/signature';
import { useSignTypedData } from 'wagmi';

function ClaimLinkGenerator() {
  const { signTypedDataAsync } = useSignTypedData();
  
  async function generateLink() {
    const claimParams = {
      user: userAddress,
      profileOwner: userAddress,
      templateId: 1n,
      nonce: 1n,
      tokenURI: 'ipfs://...'
    };
    
    const typedData = getClaimTypedData(claimParams, contractAddress);
    const signature = await signTypedDataAsync(typedData);
    const link = generateClaimLink('https://app.trustfi.com', claimParams, signature);
    
    return link;
  }
}
```

### Database Operations

```typescript
import { supabase } from './lib/supabase';
import type { ProfileInsert } from './lib/supabase';

async function saveProfile(profile: ProfileInsert) {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

## Type Definitions

All TypeScript types are defined in the `../types` directory:

- `types/profile.ts` - Profile and metadata types
- `types/template.ts` - Template and creation parameter types
- `types/card.ts` - Card and metadata types
- `types/claim.ts` - Claim signature and parameter types

Import types from the index:

```typescript
import type { Profile, Template, Card, ClaimSignature } from '../types';
```
