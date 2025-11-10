import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Send, Sparkles } from 'lucide-react';

export type MintingMode = 'DIRECT' | 'COLLECTIBLE';

interface MintingModeSelectorProps {
  value: MintingMode;
  onChange: (mode: MintingMode) => void;
  disabled?: boolean;
}

export function MintingModeSelector({ value, onChange, disabled }: MintingModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Minting Mode</h3>
        <p className="text-sm text-muted-foreground">
          Choose how this reputation card will be distributed
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as MintingMode)}
        disabled={disabled}
        className="grid gap-4"
      >
        {/* Direct Minting Option */}
        <Card
          className={`relative cursor-pointer transition-all ${
            value === 'DIRECT'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onChange('DIRECT')}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <RadioGroupItem value="DIRECT" id="mode-direct" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Send className="w-5 h-5 text-purple-600" />
                  </div>
                  <Label
                    htmlFor="mode-direct"
                    className="text-base font-semibold cursor-pointer"
                  >
                    Direct Minting
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You mint the NFT and assign it directly to a specific recipient's wallet address.
                  Best for verified credentials, awards, and personalized recognition.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">
                    Issuer-controlled
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">
                    One recipient
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">
                    Immediate delivery
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Collectible Minting Option */}
        <Card
          className={`relative cursor-pointer transition-all ${
            value === 'COLLECTIBLE'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onChange('COLLECTIBLE')}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <RadioGroupItem value="COLLECTIBLE" id="mode-collectible" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Sparkles className="w-5 h-5 text-green-600" />
                  </div>
                  <Label
                    htmlFor="mode-collectible"
                    className="text-base font-semibold cursor-pointer"
                  >
                    Collectible Minting
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Create a claimable NFT that eligible users can mint to their own wallets.
                  Perfect for event badges, achievement unlocks, and community rewards.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
                    User-initiated
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
                    Multiple recipients
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
                    Self-service
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </RadioGroup>
    </div>
  );
}
