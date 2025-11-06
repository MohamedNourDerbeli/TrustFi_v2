import { type Wallet } from '@talismn/connect-wallets';

/**
 * Filters out duplicate wallets based on extensionName and title
 * This prevents React key duplication warnings when rendering wallet lists
 */
export function getUniqueWallets(wallets: Wallet[]): Wallet[] {
  return wallets.filter((wallet, index, self) => {
    return index === self.findIndex((w) => 
      w.extensionName === wallet.extensionName && w.title === wallet.title
    );
  });
}

/**
 * Generates a unique key for a wallet in React components
 */
export function getWalletKey(wallet: Wallet, index: number): string {
  return `${wallet.extensionName}-${wallet.title}-${index}`;
}

