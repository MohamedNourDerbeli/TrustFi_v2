# NFT-Style Card Display with Modal

## Overview
Updated the reputation card display to look like OpenSea NFTs with a clean grid layout and detailed modal view on click.

## Changes Made

### 1. Compact Card Display (`ReputationCardDisplay.tsx`)

**OpenSea-Style Features:**
- ✅ Square aspect ratio (1:1) for consistent grid
- ✅ Full-bleed image with overlay text
- ✅ Category badge in corner
- ✅ Title and reputation value on image
- ✅ Hover effects (scale + overlay)
- ✅ Click to open detailed view
- ✅ Fallback design for cards without images

**Layout:**
```
┌─────────────────┐
│                 │
│     IMAGE       │
│                 │
│  ┌──────────┐   │
│  │ Category │   │
│  └──────────┘   │
│  Title          │
│  +100 Rep       │
└─────────────────┘
```

### 2. Detailed Modal (`ReputationCardModal.tsx`)

**Two-Column Layout:**
- **Left:** Full-size image
- **Right:** Complete details

**Features:**
- ✅ Large image display
- ✅ Full title and description
- ✅ Reputation value highlighted
- ✅ Issuer information with copy button
- ✅ Issue date and time
- ✅ Card ID
- ✅ Valid/Revoked status badge
- ✅ Attributes grid (if available)
- ✅ External links (website, proof document)
- ✅ Responsive design

### 3. Updated Profile Page

**Grid Layout:**
- 1 column on mobile
- 2 columns on small screens
- 3 columns on large screens
- 4 columns on extra-large screens

**Interaction:**
- Click any card to open modal
- Modal shows full details
- Click outside or X to close

## Visual Design

### Card Grid (Like OpenSea)
```
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 1  │ │ 2  │ │ 3  │ │ 4  │
└────┘ └────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 5  │ │ 6  │ │ 7  │ │ 8  │
└────┘ └────┘ └────┘ └────┘
```

### Modal Layout
```
┌─────────────────────────────────────┐
│  ┌──────────┐  ┌─────────────────┐  │
│  │          │  │ Category  Valid │  │
│  │          │  │                 │  │
│  │  IMAGE   │  │ Title           │  │
│  │          │  │ Description     │  │
│  │          │  │                 │  │
│  │          │  │ +100 Reputation │  │
│  │          │  │                 │  │
│  │          │  │ Issued by: ...  │  │
│  │          │  │ Date: ...       │  │
│  │          │  │                 │  │
│  │          │  │ [Attributes]    │  │
│  │          │  │ [Links]         │  │
│  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────┘
```

## Features

### Card Display
- **Hover Effects:** Subtle scale and overlay
- **Image Handling:** IPFS gateway support, error fallback
- **Responsive:** Adapts to screen size
- **Status Indicators:** Valid/Revoked badges
- **Category Colors:** Visual categorization

### Modal Details
- **Copy Functionality:** Click to copy issuer address
- **External Links:** Open proof documents and verification pages
- **Attributes Display:** Grid layout for metadata attributes
- **Status Badge:** Clear valid/revoked indicator
- **Responsive:** Works on mobile and desktop

## Usage

### Viewing Cards
1. Navigate to any profile page
2. Cards display in a grid
3. Click any card to see full details
4. Modal opens with complete information

### Card Information Shown

**On Card:**
- Image
- Title
- Category
- Reputation value
- Status (if revoked)

**In Modal:**
- Everything from card, plus:
- Full description
- Issuer name and address
- Exact issue date/time
- Card ID
- All attributes
- Links to external resources
- Proof documents

## Styling

### Colors
- **Education:** Blue
- **Professional:** Purple
- **Achievement:** Green
- **Community:** Pink

### Effects
- Hover: Scale 105% + overlay
- Transition: 300ms smooth
- Shadow: Elevated on hover
- Cursor: Pointer on cards

## Technical Details

### Components
1. `ReputationCardDisplay` - Compact card view
2. `ReputationCardModal` - Detailed modal view
3. `PublicProfile` - Grid layout and state management

### State Management
```typescript
const [selectedCard, setSelectedCard] = useState<ReputationCard | null>(null);
const [showCardModal, setShowCardModal] = useState(false);
```

### Props
```typescript
interface ReputationCardDisplayProps {
  card: ReputationCard;
  isLoading?: boolean;
  onClick?: () => void;
}

interface ReputationCardModalProps {
  card: ReputationCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

## Benefits

1. **Clean Design:** OpenSea-inspired, familiar to NFT users
2. **Information Hierarchy:** Quick overview → detailed view
3. **Better UX:** Click to expand instead of cramming info
4. **Responsive:** Works on all screen sizes
5. **Accessible:** Keyboard navigation, screen reader friendly
6. **Performance:** Only loads modal content when needed

## Next Steps

- [ ] Add card sharing functionality
- [ ] Implement card filtering by category
- [ ] Add animation when opening modal
- [ ] Support for video NFTs
- [ ] Add card comparison view
- [ ] Implement card search
