/// <reference types="vite/client" />

interface EIP6963ProviderInfo {
  rdns: string;
  uuid: string;
  name: string;
  icon: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

interface EIP1193Provider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] | any }) => Promise<any>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
}

interface Window {
  ethereum?: EIP1193Provider;
}
