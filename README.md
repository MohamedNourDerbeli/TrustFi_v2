# TrustFi Reputation Platform

A web3 reputation and collectibles platform. Users mint a Profile NFT, collect Reputation Cards, and verify credentials. Issuers manage templates and issue cards. Admins supervise and configure the system.

This repository contains:
- client: React + TypeScript + Vite app (wagmi/viem, Tailwind, motion)
- contracts: Hardhat workspace with ProfileNFT and ReputationCard contracts
- supabase: SQL schema and Edge Function references for off-chain features (claim links, activity log, dynamic metadata)

Key integrations:
- Supabase (database + functions)
- KILT credentials for verification display in dashboard
- Moonbase Alpha / Paseo EVM (configurable), with local dev support

## Overview & Objectives

- Enable users to build portable, verifiable on-chain reputation via Profile NFTs and tiered Reputation Cards.
- Give issuers a safe, role-gated portal to create templates and issue cards at scale (direct or signature flows).
- Provide admins with visibility and control over issuers, templates, and platform health.
- Offer a modern, responsive UX with grid/list views, search/filters, activity, and progress/achievements.
- Ship a developer-friendly stack with clear envs, scripts, and an ABI sync workflow for fast iteration.

## Features

- Profiles: Profile NFT with score and on-chain linkage to Reputation Cards
- Reputation Cards: tiered collectibles with template limits and points
- Issuer Portal: create/manage templates and issue cards (signature/direct claim)
- Admin Portal: manage issuers, review templates, and system stats
- Dashboard: search, filters, list/grid views, activity timeline, progress/achievements
- Credential Verification: KILT credentials mapped to card_id and surfaced in UI
- Hackathon Role Sandbox: optional local override buttons to test Admin/Issuer flows

## Architecture

- Contracts
   - ProfileNFT: profile minting, linking cards, score tracking, access control
   - ReputationCard: templates, issuance, point tiers, pausing, access control
- Frontend
   - React + TypeScript + Vite, Tailwind, motion/react, lucide-react
   - wagmi + viem for wallet and contract I/O
   - Supabase client for data/cache, Edge Function calls
- Data
   - Supabase tables: profiles, templates_cache, claim_links, claims_log, collectibles, issuers, etc. (SQL in client/)
   - Optional Edge Functions (e.g., generate-signature) invoked from the app

## Getting Started

Prerequisites
- Node.js 18+
- Git
- A Supabase project (URL + anon key)
- Wallet extension (MetaMask, Talisman)

Clone and install
```
git clone https://github.com/MohamedNourDerbeli/TrustFi_v2.git
cd TrustFi_v2

# Frontend deps
cd client
npm install

# Contracts deps
cd ../contracts
npm install
```

### Environment configuration

client/.env (example)
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Dynamic metadata base url (used for template 999 demo)
VITE_DYNAMIC_METADATA_URI=https://YOUR-PROJECT.supabase.co/functions/v1/dynamic-metadata?wallet=

# Contract addresses (after you deploy contracts)
VITE_PROFILE_NFT_ADDRESS=0x...
VITE_REPUTATION_CARD_ADDRESS=0x...

# Optional: show role override buttons in Dashboard for judging
VITE_ENABLE_HACKATHON_ROLE_BUTTONS=true
```

contracts/.env
```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
# Optional additional networks are in hardhat.config.ts
```

### Supabase setup

Run the SQL files in `client/` to create the tables and views used by the app:
- `client/supabase-schema.sql`
- `client/supabase-issuers-table.sql`
- `client/supabase-collectibles-table.sql`
- `client/supabase-template-counter.sql`
- `client/supabase-claim-links-table.sql`

If you use the signature flow, deploy the Edge Function referenced by the app (e.g., `generate-signature`). Ensure RLS policies allow your usage.

### Smart contracts

Compile
```
cd contracts
npx hardhat compile
```

Deploy (example: Moonbase Alpha)
```
cd contracts
npx hardhat run scripts/deploy.ts --network moonbaseAlpha
```

After deploying, update `client/.env` with the new addresses. Then sync ABIs to the frontend:
```
pwsh ./scripts/sync-abis.ps1
```

### Frontend (dev)

```
cd client
npm run dev
```

Navigate to:
- `/dashboard` User Dashboard
- `/discover` Discover collectibles
- `/admin` Admin Portal (requires admin)
- `/issuer` Issuer Portal (requires issuer)

To quickly evaluate restricted areas during judging, enable `VITE_ENABLE_HACKATHON_ROLE_BUTTONS=true` and use the buttons on the dashboard to locally assume roles. This does not grant on-chain permissions.

### Build & preview

```
cd client
npm run build
npm run preview
```

## Setup & Usage (at a glance)

1) Configure `client/.env` and `contracts/.env` (Supabase keys, RPC, private key, dynamic metadata URL).
2) Run the SQL files in `client/` to provision Supabase tables and views.
3) Compile and deploy contracts (e.g., Moonbase Alpha); update `client/.env` addresses.
4) Sync ABIs to the frontend: `pwsh ./scripts/sync-abis.ps1`.
5) Start the app: `npm run dev` in `client`. Visit `/dashboard`, `/discover`, `/issuer`, `/admin`.
6) For judging, enable local role buttons by setting `VITE_ENABLE_HACKATHON_ROLE_BUTTONS=true` and toggling roles in the Dashboard panel.

## Project Structure (high level)

```
TrustFi_v2/
├─ client/
│  ├─ src/
│  │  ├─ components/ (admin, issuer, user, shared, auth)
│  │  ├─ pages/ (Dashboard, Discover, Profile, etc.)
│  │  ├─ lib/ (contracts.ts, supabase.ts, template-sync.ts, *.abi.json)
│  │  ├─ routes/ (AppRoutes)
│  │  ├─ contexts/ (AuthContext, DataCacheContext)
│  │  └─ hooks/ (auth, templates, collectibles, etc.)
│  └─ vite.config.ts
├─ contracts/
│  ├─ contracts/ (ProfileNFT.sol, ReputationCard.sol)
│  ├─ scripts/ (deploy.ts, deploy-templates.ts, etc.)
│  └─ hardhat.config.ts
└─ scripts/
    └─ sync-abis.ps1 (copy ABIs into client/src/lib)
```

## Dependencies & Technologies

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, motion/react, lucide-react
- Web3: wagmi v2, viem, WalletConnect/appkit (via wagmi connectors)
- State/Data: React Contexts, hooks, optional @tanstack/react-query chunk
- Backend-as-a-Service: Supabase (Postgres, Auth, Edge Functions)
- Smart contracts: Hardhat, Solidity 0.8.x, OpenZeppelin Contracts
- Target networks: Moonbase Alpha (default config), Paseo EVM; local Hardhat supported

## Roles & Access

- DEFAULT_ADMIN_ROLE: full admin on contracts
- TEMPLATE_MANAGER_ROLE: issuer privileges on ReputationCard
- Frontend `ProtectedRoute` enforces `requireAdmin` and `requireIssuer`
- Optional hackathon override sets `isAdmin`/`isIssuer` locally via `localStorage`

## Troubleshooting

404 on `/dashboard`
- Ensure the route exists (it is defined in `client/src/routes/index.tsx`) and wallet is connected; some sections are behind `ProtectedRoute`.

Vite EPERM rename on Windows
```
# From client folder
Remove-Item "node_modules/.vite" -Recurse -Force
npm run dev
```
The project also sets a stable `cacheDir` and forces prebundling in `vite.config.ts` to reduce lock issues.

Images/metadata not loading for a card
- Frontend falls back to a visual placeholder; check `VITE_DYNAMIC_METADATA_URI` or the tokenURI on chain.

Credentials not shown as verified
- A KILT credential is mapped to a `card_id`. The app shows verified status when it finds a matching, non-revoked credential for that card.

## License

MIT

## Acknowledgements

Built with React, TypeScript, Vite, wagmi/viem, Tailwind, Hardhat, and Supabase. Thanks to the Moonbeam/Moonbase and KILT communities.