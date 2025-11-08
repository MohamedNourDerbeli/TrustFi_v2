import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, User, LogOut, Plus, Star, ChevronDown, Settings } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useProfile } from '@/contexts/ProfileContext';

export default function WalletConnectButton() {
  const [, setLocation] = useLocation();
  const { connected, address, connectWallet, disconnectWallet, isConnecting, userProfile } = useWallet();
  const { offChainData, isLoading: isLoadingProfile } = useProfile();
  const [open, setOpen] = useState(false);

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Use offChainData username, fallback to on-chain name, then Anonymous
  const displayName = offChainData?.username || (userProfile?.tokenId ? `User #${userProfile.tokenId}` : 'Anonymous');
  const displayUsername = offChainData?.username ? `@${offChainData.username}` : null;
  const displayAvatar = offChainData?.avatar;

  if (isConnecting || (connected && isLoadingProfile)) {
    return (
      <Button disabled variant="outline">
        <Wallet className="w-4 h-4 mr-2 animate-pulse" />
        {isConnecting ? 'Checking...' : 'Loading...'}
      </Button>
    );
  }

  if (connected && address) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 h-auto py-1.5 px-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center">
                    <User className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                {/* MetaMask badge */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-background rounded-sm flex items-center justify-center p-0.5">
                  <svg viewBox="0 0 318.6 318.6" className="w-full h-full">
                    <polygon fill="#E2761B" stroke="#E2761B" points="274.1,35.5 174.6,109.4 193,65.8"/>
                    <g fill="#E4761B" stroke="#E4761B">
                      <polygon points="44.4,35.5 143.1,110.1 125.6,65.8"/>
                      <polygon points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/>
                      <polygon points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"/>
                      <polygon points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/>
                      <polygon points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"/>
                      <polygon points="106.8,247.4 140.6,230.9 111.4,208.1"/>
                      <polygon points="177.9,230.9 211.8,247.4 207.1,208.1"/>
                    </g>
                    <g fill="#D7C1B3" stroke="#D7C1B3">
                      <polygon points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"/>
                      <polygon points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"/>
                    </g>
                    <polygon fill="#233447" stroke="#233447" points="138.8,193.5 110.6,185.2 130.5,176.1"/>
                    <polygon fill="#233447" stroke="#233447" points="179.7,193.5 188,176.1 208,185.2"/>
                    <g fill="#CD6116" stroke="#CD6116">
                      <polygon points="106.8,247.4 111.6,206.8 80.3,207.7"/>
                      <polygon points="207,206.8 211.8,247.4 238.3,207.7"/>
                      <polygon points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2"/>
                      <polygon points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1"/>
                    </g>
                    <g fill="#E4751F" stroke="#E4751F">
                      <polygon points="87.8,162.1 111.4,208.1 110.6,185.2"/>
                      <polygon points="208.1,185.2 207.1,208.1 230.8,162.1"/>
                      <polygon points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7"/>
                      <polygon points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5"/>
                    </g>
                    <polygon fill="#F6851B" stroke="#F6851B" points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"/>
                    <polygon fill="#C0AD9E" stroke="#C0AD9E" points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"/>
                    <polygon fill="#161616" stroke="#161616" points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"/>
                    <g fill="#763D16" stroke="#763D16">
                      <polygon points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2"/>
                      <polygon points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5"/>
                    </g>
                    <polygon fill="#F6851B" stroke="#F6851B" points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs font-medium leading-none truncate max-w-[100px]">
                  {displayUsername || displayName}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5 font-mono">{truncateAddress(address)}</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-0 bg-background border-border">
          {/* Header */}
          <div className="px-3 py-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-background rounded-sm flex items-center justify-center p-0.5">
                  <svg viewBox="0 0 318.6 318.6" className="w-full h-full">
                    <polygon fill="#E2761B" stroke="#E2761B" points="274.1,35.5 174.6,109.4 193,65.8"/>
                    <g fill="#E4761B" stroke="#E4761B">
                      <polygon points="44.4,35.5 143.1,110.1 125.6,65.8"/>
                      <polygon points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/>
                      <polygon points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"/>
                      <polygon points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/>
                      <polygon points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"/>
                      <polygon points="106.8,247.4 140.6,230.9 111.4,208.1"/>
                      <polygon points="177.9,230.9 211.8,247.4 207.1,208.1"/>
                    </g>
                    <g fill="#D7C1B3" stroke="#D7C1B3">
                      <polygon points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"/>
                      <polygon points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"/>
                    </g>
                    <polygon fill="#233447" stroke="#233447" points="138.8,193.5 110.6,185.2 130.5,176.1"/>
                    <polygon fill="#233447" stroke="#233447" points="179.7,193.5 188,176.1 208,185.2"/>
                    <g fill="#CD6116" stroke="#CD6116">
                      <polygon points="106.8,247.4 111.6,206.8 80.3,207.7"/>
                      <polygon points="207,206.8 211.8,247.4 238.3,207.7"/>
                      <polygon points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2"/>
                      <polygon points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1"/>
                    </g>
                    <g fill="#E4751F" stroke="#E4751F">
                      <polygon points="87.8,162.1 111.4,208.1 110.6,185.2"/>
                      <polygon points="208.1,185.2 207.1,208.1 230.8,162.1"/>
                      <polygon points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7"/>
                      <polygon points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5"/>
                    </g>
                    <polygon fill="#F6851B" stroke="#F6851B" points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"/>
                    <polygon fill="#C0AD9E" stroke="#C0AD9E" points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"/>
                    <polygon fill="#161616" stroke="#161616" points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"/>
                    <g fill="#763D16" stroke="#763D16">
                      <polygon points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2"/>
                      <polygon points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5"/>
                    </g>
                    <polygon fill="#F6851B" stroke="#F6851B" points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{displayUsername || displayName}</p>
                <p className="text-xs text-muted-foreground font-mono">{truncateAddress(address)}</p>
              </div>
            </div>
          </div>

          {/* Wallet Badge */}
          <div className="px-3 py-2 border-b border-border">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border">
              <span className="text-xs font-semibold">1</span>
              <span className="text-xs text-muted-foreground">WALLET</span>
            </div>
          </div>

          {/* Current Wallet */}
          <div className="px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="relative">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-background rounded-sm flex items-center justify-center p-0.5">
                  <svg viewBox="0 0 318.6 318.6" className="w-full h-full">
                    <polygon fill="#E2761B" stroke="#E2761B" points="274.1,35.5 174.6,109.4 193,65.8"/>
                    <g fill="#E4761B" stroke="#E4761B">
                      <polygon points="44.4,35.5 143.1,110.1 125.6,65.8"/>
                      <polygon points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/>
                      <polygon points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"/>
                      <polygon points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/>
                      <polygon points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"/>
                      <polygon points="106.8,247.4 140.6,230.9 111.4,208.1"/>
                      <polygon points="177.9,230.9 211.8,247.4 207.1,208.1"/>
                    </g>
                    <g fill="#D7C1B3" stroke="#D7C1B3">
                      <polygon points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"/>
                      <polygon points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"/>
                    </g>
                    <polygon fill="#233447" stroke="#233447" points="138.8,193.5 110.6,185.2 130.5,176.1"/>
                    <polygon fill="#233447" stroke="#233447" points="179.7,193.5 188,176.1 208,185.2"/>
                    <g fill="#CD6116" stroke="#CD6116">
                      <polygon points="106.8,247.4 111.6,206.8 80.3,207.7"/>
                      <polygon points="207,206.8 211.8,247.4 238.3,207.7"/>
                      <polygon points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2"/>
                      <polygon points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1"/>
                    </g>
                    <g fill="#E4751F" stroke="#E4751F">
                      <polygon points="87.8,162.1 111.4,208.1 110.6,185.2"/>
                      <polygon points="208.1,185.2 207.1,208.1 230.8,162.1"/>
                      <polygon points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7"/>
                      <polygon points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5"/>
                    </g>
                    <polygon fill="#F6851B" stroke="#F6851B" points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"/>
                    <polygon fill="#C0AD9E" stroke="#C0AD9E" points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"/>
                    <polygon fill="#161616" stroke="#161616" points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"/>
                    <g fill="#763D16" stroke="#763D16">
                      <polygon points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2"/>
                      <polygon points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5"/>
                    </g>
                    <polygon fill="#F6851B" stroke="#F6851B" points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"/>
                    <polygon fill="#F6851B" stroke="#F6851B" points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{displayUsername || displayName}</p>
                <p className="text-xs text-muted-foreground font-mono">{truncateAddress(address)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Link Wallet */}
          <div className="px-2 py-1.5 border-b border-border">
            <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Link Wallet</span>
            </button>
          </div>

          {/* Profile */}
          <div className="px-2 py-1.5">
            <button
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              onClick={() => {
                setOpen(false);
                if (offChainData?.username) {
                  setLocation(`/${offChainData.username}`);
                } else {
                  setLocation(`/${address}`);
                }
              }}
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Profile</span>
            </button>
          </div>

          {/* Settings - Only show if user has profile */}
          {(userProfile?.hasProfile || offChainData) && (
            <div className="px-2 py-1.5 border-b border-border">
              <button
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                onClick={() => {
                  setOpen(false);
                  setLocation('/settings/profile');
                }}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
              </button>
            </div>
          )}

          {/* Logout */}
          <div className="px-2 py-1.5">
            <button
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-destructive/10 transition-colors text-left text-destructive"
              onClick={() => {
                setOpen(false);
                disconnectWallet();
              }}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={connectWallet}>
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
