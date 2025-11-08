# Modal Cleanup - Remove Duplicate Information

## Issue
The issuer address and other details were appearing twice in the card modal:
1. In the "Details" section (intended location)
2. In the "Attributes" section (duplicate from metadata)

## Solution

### 1. Filter Duplicate Attributes in Modal
**File:** `client/src/components/ReputationCardModal.tsx`

Added filtering to exclude attributes that are already shown in the Details section:
- `Issuer` - Already shown with copy button
- `Issued At` - Already shown as formatted date
- `Reputation Value` - Already shown in highlighted box

The Attributes section now only shows custom attributes that aren't displayed elsewhere.

### 2. Remove Default Attributes from Metadata
**File:** `client/src/pages/Issuer.tsx`

Removed the default attributes that were being added to metadata:
```typescript
// Before
attributes: [
  { trait_type: 'Reputation Value', value: 100 },
  { trait_type: 'Issued At', value: '2025-11-08...' },
  { trait_type: 'Issuer', value: '0x...' }
]

// After
attributes: [] // Only custom attributes if needed
```

These values are already stored on-chain and displayed in the Details section, so no need to duplicate them in metadata.

## Result

**Details Section (Always Shown):**
- ✅ Issued by: [Name or Address with copy button]
- ✅ Issued on: [Formatted date and time]
- ✅ Card ID: [Number]
- ✅ Reputation Value: [Highlighted in box above]

**Attributes Section (Only if custom attributes exist):**
- Shows only custom attributes
- Hidden if no custom attributes
- No duplicate information

## Benefits

1. **Cleaner UI:** No duplicate information
2. **Better UX:** Clear information hierarchy
3. **Flexible:** Can still add custom attributes if needed
4. **Efficient:** Smaller metadata files (less IPFS storage)

## Future: Adding Custom Attributes

If you want to add custom attributes in the future, just add them to the metadata:

```typescript
attributes: [
  { trait_type: 'Course Level', value: 'Advanced' },
  { trait_type: 'Completion Score', value: '95%' },
  { trait_type: 'Certificate Number', value: 'CERT-2025-001' }
]
```

These will appear in the Attributes section without duplicating the standard details.
