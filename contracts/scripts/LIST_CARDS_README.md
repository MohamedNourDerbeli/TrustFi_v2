# List Reputation Cards Scripts

These scripts allow you to query the blockchain and list all reputation cards that have been issued by admins.

## Prerequisites

1. Make sure you have the contract address set in your `.env` file:
   ```
   REPUTATION_CARD_CONTRACT_ADDRESS=0xYourContractAddress
   ```

2. Ensure you're connected to the correct network in `hardhat.config.ts`

## Scripts

### 1. Basic Card Listing (`list-all-cards.ts`)

Lists all issued reputation cards with basic information.

**Usage:**
```bash
npx hardhat run scripts/list-all-cards.ts --network moonbase
```

**Output:**
- Card ID
- Owner address
- Profile ID
- Issuer address
- Tier (Bronze/Silver/Gold)
- Token URI
- Block number and transaction hash
- Summary statistics (cards by tier, cards by issuer)

---

### 2. Detailed Card Listing (`list-cards-detailed.ts`)

Advanced script with filtering options and template information.

**Usage:**
```bash
# List all cards
npx hardhat run scripts/list-cards-detailed.ts --network moonbase

# Show all templates
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --templates

# Filter by owner
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --owner=0x1234...

# Filter by template ID
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --template=999

# Filter by tier (1=Bronze, 2=Silver, 3=Gold)
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --tier=3

# Export as JSON
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --json > cards.json

# Combine filters
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --tier=3 --templates
```

**Options:**
- `--owner=<address>` - Filter by card owner address
- `--template=<id>` - Filter by template ID
- `--tier=<1|2|3>` - Filter by tier
- `--templates` - Show all available templates
- `--json` - Export results as JSON

**Output:**
- All card details including timestamps
- Template information (if --templates flag is used)
- Advanced statistics
- Unique card holders count

---

## Example Outputs

### Basic Listing
```
═══════════════════════════════════════════════════════════
           LISTING ALL REPUTATION CARDS ON-CHAIN
═══════════════════════════════════════════════════════════

Network: moonbase (Chain ID: 1287)
Contract Address: 0x1234...

✅ Found 5 issued card(s)

Card ID: 1
  Owner:      0xabcd...
  Profile ID: 1
  Issuer:     0x91ed...
  Tier:       3
  Token URI:  https://...
  Block:      12345
  Tx Hash:    0x5678...
───────────────────────────────────────────────────────────

SUMMARY
═══════════════════════════════════════════════════════════
Total Cards Issued: 5

Cards by Tier:
  Tier 1 (Bronze): 2 card(s)
  Tier 3 (Gold): 3 card(s)

Cards by Issuer:
  0x91ed...: 5 card(s)
```

### Detailed Listing with Templates
```
═══════════════════════════════════════════════════════════
                    AVAILABLE TEMPLATES
═══════════════════════════════════════════════════════════

Template ID: 999
  Issuer:         0x91ed...
  Tier:           3
  Max Supply:     1000
  Current Supply: 5
  Is Paused:      false
  Start Time:     Immediate
  End Time:       No expiry
───────────────────────────────────────────────────────────
```

## Notes

- The scripts query blockchain events (`CardIssued` and `TemplateCreated`)
- Make sure you have sufficient RPC credits for the network you're querying
- For large numbers of cards, the scripts may take some time to complete
- The `--json` export is useful for further processing or integration with other tools

## Troubleshooting

**Error: "CALL_EXCEPTION"**
- Verify the contract address in your `.env` file
- Ensure you're connected to the correct network
- Check that the contract is deployed on the network you're querying

**Error: "No cards have been issued yet"**
- This means no `CardIssued` events were found
- Verify cards have been issued on this network
- Check you're querying the correct contract address

**Slow performance**
- Querying from block 0 can be slow on networks with many blocks
- Consider modifying the scripts to query from a specific block range
- Use a dedicated RPC endpoint with higher rate limits
