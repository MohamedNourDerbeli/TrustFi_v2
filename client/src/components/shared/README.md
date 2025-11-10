# Shared UI Components for Collectibles

This directory contains reusable UI components for the collectibles feature.

## Components

### MintingModeBadge

Displays how a reputation card was minted (Awarded vs Claimed).

```tsx
import { MintingModeBadge } from '@/components/shared';
import { MintingMode } from '@/types/collectible';

<MintingModeBadge 
  mintingMode={MintingMode.DIRECT} 
  size="md"
  showIcon={true}
  showTooltip={true}
/>
```

**Props:**
- `mintingMode`: `MintingMode` - DIRECT (0) or COLLECTIBLE (1)
- `size`: `'sm' | 'md' | 'lg'` - Badge size (default: 'md')
- `showIcon`: `boolean` - Show icon (default: true)
- `showTooltip`: `boolean` - Show tooltip on hover (default: true)

### RarityIndicator

Displays the rarity tier of a collectible with color-coded styling.

```tsx
import { RarityIndicator } from '@/components/shared';
import { RarityTier } from '@/types/collectible';

<RarityIndicator 
  rarity={RarityTier.LEGENDARY} 
  showIcon={true}
  size="md"
/>
```

**Props:**
- `rarity`: `RarityTier` - 0-4 (Common, Uncommon, Rare, Epic, Legendary)
- `showIcon`: `boolean` - Show rarity icon (default: true)
- `size`: `'sm' | 'md' | 'lg'` - Badge size (default: 'md')

### SupplyIndicator

Shows supply status with progress bar and visual indicators.

```tsx
import { SupplyIndicator } from '@/components/shared';

<SupplyIndicator 
  currentSupply={75}
  maxSupply={100}
  showProgressBar={true}
  size="md"
/>
```

**Props:**
- `currentSupply`: `number` - Number of collectibles claimed
- `maxSupply`: `number` - Maximum supply (0 for unlimited)
- `showProgressBar`: `boolean` - Show progress bar (default: true)
- `size`: `'sm' | 'md' | 'lg'` - Text size (default: 'md')

### EligibilityChecker

Displays eligibility requirements with checkmarks/X marks.

```tsx
import { EligibilityChecker } from '@/components/shared';

<EligibilityChecker 
  template={collectibleTemplate}
  claimStatus={claimStatus}
  userAddress={address}
/>
```

**Props:**
- `template`: `CollectibleTemplate` - The collectible template
- `claimStatus`: `ClaimStatus` - User's claim status
- `userAddress`: `string` - User's wallet address

### TimeRemainingBadge

Shows countdown or status for time-based availability.

```tsx
import { TimeRemainingBadge } from '@/components/shared';

<TimeRemainingBadge 
  startTime={1234567890}
  endTime={1234567890}
  size="md"
/>
```

**Props:**
- `startTime`: `number` - Unix timestamp when claiming starts (0 for immediate)
- `endTime`: `number` - Unix timestamp when claiming ends (0 for no expiration)
- `size`: `'sm' | 'md' | 'lg'` - Badge size (default: 'md')

### CelebrationAnimation

Animated celebration effect for successful claims.

```tsx
import { CelebrationAnimation } from '@/components/shared';
import { RarityTier } from '@/types/collectible';

<CelebrationAnimation 
  rarity={RarityTier.LEGENDARY}
  duration={3000}
/>
```

**Props:**
- `rarity`: `RarityTier` - Determines animation intensity
- `duration`: `number` - Animation duration in ms (default: 3000)

## Usage Example

```tsx
import { 
  MintingModeBadge, 
  RarityIndicator, 
  SupplyIndicator,
  TimeRemainingBadge 
} from '@/components/shared';
import { MintingMode, RarityTier } from '@/types/collectible';

function CollectibleCard({ collectible }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex gap-2 mb-2">
        <RarityIndicator rarity={collectible.rarityTier} />
        <TimeRemainingBadge 
          startTime={collectible.startTime}
          endTime={collectible.endTime}
        />
      </div>
      
      <h3>{collectible.category}</h3>
      <p>{collectible.description}</p>
      
      <SupplyIndicator 
        currentSupply={collectible.currentSupply}
        maxSupply={collectible.maxSupply}
      />
    </div>
  );
}

function ReputationCard({ card, mintingMode }) {
  return (
    <div className="p-4 border rounded-lg">
      <MintingModeBadge mintingMode={mintingMode} />
      {/* Card content */}
    </div>
  );
}
```

## Styling

All components use Tailwind CSS and shadcn/ui components for consistent styling. They support both light and dark modes automatically.

## Requirements Mapping

- **MintingModeBadge**: Requirements 10.1, 10.2, 10.3
- **RarityIndicator**: Requirements 17.1, 17.3, 17.4
- **SupplyIndicator**: Requirements 4.4, 6.4
- **EligibilityChecker**: Requirements 4.3, 8.1, 8.2, 8.3, 8.4, 8.5
- **TimeRemainingBadge**: Requirements 7.4, 7.5
- **CelebrationAnimation**: Requirements 17.4
