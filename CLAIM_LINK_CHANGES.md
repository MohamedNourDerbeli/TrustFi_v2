# Claim Link Generator Changes

## Summary
The ClaimLinkGenerator has been updated to work like collectibles - no recipient address required, only people with the link can claim, and it doesn't show in the discover page.

## Database Schema
Created `client/supabase-claim-links-table.sql` with the following structure:
- Stores claim links separately from collectibles
- Tracks nonce, signature, and claim status
- Not shown in discover page (separate table)

## Changes Needed in ClaimLinkGenerator.tsx

### 1. Remove State Variables
Remove these lines (around line 36-44):
```typescript
const [userAddress, setUserAddress] = useState('');
const [checkingProfile, setCheckingProfile] = useState(false);
```

### 2. Remove Validation Functions
Remove these functions (around line 87-135):
```typescript
const validateUserAddress = (addr: string): boolean => { ... }
const checkUserProfile = async (addr: Address): Promise<Address | null> => { ... }
```

### 3. Update handleGenerateLink Function
- Remove user address validation call
- Remove profile checking call
- Use placeholder address instead of userAddress:
```typescript
const placeholderAddress = '0x0000000000000000000000000000000000000000' as Address;
```
- Store claim link in database instead of generating URL with params
- Generate link as: `${baseUrl}/claim/${claimLinkData.id}`

### 4. Remove Recipient Address Field from Form
Remove the entire "User Address" div section (around line 414-434)

### 5. Update disabled attributes
Replace all occurrences of:
```typescript
disabled={isSigning || checkingProfile || isUploading}
```
With:
```typescript
disabled={isSigning || isUploading}
```

### 6. Update Submit Button Text
Remove the "Verifying Profile..." state from the button text

### 7. Update handleReset Function
Remove `setUserAddress('')` line

### 8. Update Page Description
Change the description to:
"Create a shareable link - anyone with the link can claim (not shown in discover page)"

## Next Steps
1. Apply the changes to ClaimLinkGenerator.tsx
2. Update PublicClaimPage.tsx to support both URL params (existing) and database lookup (new `/claim/:id` route)
3. Add route for `/claim/:id` in routes/index.tsx
4. Run the SQL migration to create the claim_links table

## Key Differences
- **Collectibles**: Stored in `collectibles` table, shown on discover page, anyone can see and claim
- **Claim Links**: Stored in `claim_links` table, NOT shown on discover page, only accessible via direct link
