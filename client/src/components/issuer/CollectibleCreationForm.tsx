import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar as CalendarIcon,
  Upload,
  X,
  Loader2,
  Sparkles,
  Users,
  Lock,
  Coins,
  UserCheck,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CollectibleFormData } from '@/types/collectible';
import { EligibilityType, RarityTier } from '@/types/collectible';

interface CollectibleCreationFormProps {
  onSubmit: (data: CollectibleFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const RARITY_CONFIG = {
  [RarityTier.COMMON]: {
    name: 'Common',
    color: 'bg-gray-500',
    borderColor: 'border-gray-500',
    textColor: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-500/10',
  },
  [RarityTier.UNCOMMON]: {
    name: 'Uncommon',
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    textColor: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-500/10',
  },
  [RarityTier.RARE]: {
    name: 'Rare',
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  [RarityTier.EPIC]: {
    name: 'Epic',
    color: 'bg-purple-500',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  [RarityTier.LEGENDARY]: {
    name: 'Legendary',
    color: 'bg-orange-500',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
};

export function CollectibleCreationForm({ onSubmit, isSubmitting }: CollectibleCreationFormProps) {
  const [formData, setFormData] = useState<CollectibleFormData>({
    title: '',
    category: 'achievement',
    description: '',
    value: 100,
    maxSupply: 0,
    startTime: null,
    endTime: null,
    eligibilityType: EligibilityType.OPEN,
    eligibilityConfig: {},
    rarityTier: RarityTier.COMMON,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgePreview, setBadgePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleBadgeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, image: 'Please select an image file' });
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors({ ...errors, image: 'Image must be less than 5MB' });
      return;
    }

    setBadgeImage(file);
    const reader = new FileReader();
    reader.onload = () => setBadgePreview(reader.result as string);
    reader.readAsDataURL(file);
    
    // Clear image error
    const newErrors = { ...errors };
    delete newErrors.image;
    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.value < 1 || formData.value > 1000) {
      newErrors.value = 'Value must be between 1 and 1000';
    }

    if (formData.maxSupply < 0) {
      newErrors.maxSupply = 'Supply cannot be negative';
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    // Eligibility-specific validation
    if (formData.eligibilityType === EligibilityType.WHITELIST) {
      if (!formData.eligibilityConfig.whitelist || formData.eligibilityConfig.whitelist.length === 0) {
        newErrors.whitelist = 'At least one address is required for whitelist';
      }
    }

    if (formData.eligibilityType === EligibilityType.TOKEN_HOLDER) {
      if (!formData.eligibilityConfig.tokenAddress) {
        newErrors.tokenAddress = 'Token address is required';
      }
      if (!formData.eligibilityConfig.minBalance || formData.eligibilityConfig.minBalance <= 0) {
        newErrors.minBalance = 'Minimum balance must be greater than 0';
      }
    }

    if (formData.eligibilityType === EligibilityType.PROFILE_REQUIRED) {
      if (formData.eligibilityConfig.minReputationScore && formData.eligibilityConfig.minReputationScore < 0) {
        newErrors.minReputationScore = 'Minimum reputation score cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Include image in form data
    const submitData: CollectibleFormData = {
      ...formData,
      image: badgeImage || undefined,
    };

    await onSubmit(submitData);
  };

  const rarityConfig = RARITY_CONFIG[formData.rarityTier];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Early Adopter Badge"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The display name for this collectible
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="education">🎓 Education</SelectItem>
                <SelectItem value="professional">💼 Professional</SelectItem>
                <SelectItem value="achievement">🏆 Achievement</SelectItem>
                <SelectItem value="community">🤝 Community</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this collectible represents..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length} characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Reputation Value</Label>
            <Input
              id="value"
              type="number"
              min="1"
              max="1000"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
              className={errors.value ? 'border-destructive' : ''}
            />
            {errors.value && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.value}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Points awarded when claimed (1-1000)
            </p>
          </div>
        </div>
      </Card>

      {/* Supply & Availability */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Supply & Availability</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxSupply">Maximum Supply</Label>
            <Input
              id="maxSupply"
              type="number"
              min="0"
              placeholder="0 for unlimited"
              value={formData.maxSupply}
              onChange={(e) => setFormData({ ...formData, maxSupply: parseInt(e.target.value) || 0 })}
              className={errors.maxSupply ? 'border-destructive' : ''}
            />
            {errors.maxSupply && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.maxSupply}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Set to 0 for unlimited supply
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.startTime && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startTime ? format(formData.startTime, 'PPP') : 'Immediate'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startTime || undefined}
                    onSelect={(date) => setFormData({ ...formData, startTime: date || null })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  {formData.startTime && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setFormData({ ...formData, startTime: null })}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                When claiming becomes available
              </p>
            </div>

            <div className="space-y-2">
              <Label>End Time (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.endTime && 'text-muted-foreground',
                      errors.endTime && 'border-destructive'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endTime ? format(formData.endTime, 'PPP') : 'No expiration'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endTime || undefined}
                    onSelect={(date) => setFormData({ ...formData, endTime: date || null })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  {formData.endTime && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setFormData({ ...formData, endTime: null })}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {errors.endTime && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.endTime}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                When claiming expires
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Eligibility */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Eligibility Requirements</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Who can claim this collectible?</Label>
            <Select
              value={formData.eligibilityType.toString()}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  eligibilityType: parseInt(value) as EligibilityType,
                  eligibilityConfig: {},
                });
                setErrors({});
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EligibilityType.OPEN.toString()}>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Open - Anyone can claim</span>
                  </div>
                </SelectItem>
                <SelectItem value={EligibilityType.WHITELIST.toString()}>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Whitelist - Specific addresses only</span>
                  </div>
                </SelectItem>
                <SelectItem value={EligibilityType.TOKEN_HOLDER.toString()}>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <span>Token Holder - Must own specific token</span>
                  </div>
                </SelectItem>
                <SelectItem value={EligibilityType.PROFILE_REQUIRED.toString()}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Profile Required - Must have TrustFi profile</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Eligibility Configuration */}
          {formData.eligibilityType === EligibilityType.WHITELIST && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <Label htmlFor="whitelist">Whitelist Addresses</Label>
              <Textarea
                id="whitelist"
                placeholder="Enter wallet addresses (one per line)&#10;0x123...&#10;0x456..."
                rows={5}
                value={formData.eligibilityConfig.whitelist?.join('\n') || ''}
                onChange={(e) => {
                  const addresses = e.target.value
                    .split('\n')
                    .map(addr => addr.trim())
                    .filter(addr => addr.length > 0);
                  setFormData({
                    ...formData,
                    eligibilityConfig: { ...formData.eligibilityConfig, whitelist: addresses },
                  });
                }}
                className={cn('font-mono text-sm', errors.whitelist && 'border-destructive')}
              />
              {errors.whitelist && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.whitelist}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.eligibilityConfig.whitelist?.length || 0} addresses
              </p>
            </div>
          )}

          {formData.eligibilityType === EligibilityType.TOKEN_HOLDER && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="tokenAddress">Token Contract Address</Label>
                <Input
                  id="tokenAddress"
                  placeholder="0x..."
                  value={formData.eligibilityConfig.tokenAddress || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibilityConfig: { ...formData.eligibilityConfig, tokenAddress: e.target.value },
                    })
                  }
                  className={cn('font-mono text-sm', errors.tokenAddress && 'border-destructive')}
                />
                {errors.tokenAddress && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.tokenAddress}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minBalance">Minimum Balance</Label>
                <Input
                  id="minBalance"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.eligibilityConfig.minBalance || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibilityConfig: {
                        ...formData.eligibilityConfig,
                        minBalance: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className={errors.minBalance ? 'border-destructive' : ''}
                />
                {errors.minBalance && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.minBalance}
                  </p>
                )}
              </div>
            </div>
          )}

          {formData.eligibilityType === EligibilityType.PROFILE_REQUIRED && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <Label htmlFor="minReputationScore">Minimum Reputation Score (Optional)</Label>
              <Input
                id="minReputationScore"
                type="number"
                min="0"
                placeholder="0 for any reputation"
                value={formData.eligibilityConfig.minReputationScore || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    eligibilityConfig: {
                      ...formData.eligibilityConfig,
                      minReputationScore: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className={errors.minReputationScore ? 'border-destructive' : ''}
              />
              {errors.minReputationScore && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.minReputationScore}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Leave at 0 to allow any profile holder
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Rarity & Image */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Appearance</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rarity Tier</Label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(RARITY_CONFIG).map(([tier, config]) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setFormData({ ...formData, rarityTier: parseInt(tier) as RarityTier })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    formData.rarityTier === parseInt(tier)
                      ? `${config.borderColor} ${config.bgColor}`
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Sparkles className={cn('w-5 h-5 mx-auto mb-1', config.color.replace('bg-', 'text-'))} />
                  <p className="text-xs font-medium">{config.name}</p>
                </button>
              ))}
            </div>
            <div className={cn('p-3 rounded-lg', rarityConfig.bgColor)}>
              <p className={cn('text-sm font-medium', rarityConfig.textColor)}>
                Selected: {rarityConfig.name}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="badgeImage">Collectible Image</Label>
            {badgePreview ? (
              <div className="relative group">
                <div className="aspect-square w-full max-w-xs mx-auto rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                  <img
                    src={badgePreview}
                    alt="Badge preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  onClick={() => {
                    setBadgeImage(null);
                    setBadgePreview('');
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                <Input
                  id="badgeImage"
                  type="file"
                  accept="image/*"
                  onChange={handleBadgeImageChange}
                  className="hidden"
                />
                <label htmlFor="badgeImage" className="cursor-pointer block">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-sm font-semibold mb-2">
                    Click to upload collectible image
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    Recommended: 1000x1000px (1:1 ratio)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </label>
              </div>
            )}
            {errors.image && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.image}
              </p>
            )}
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-blue-600 text-lg">💡</span>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                <p className="font-semibold mb-1">For OpenSea Compatibility:</p>
                <p>Upload an image to ensure your collectible displays properly on OpenSea and other NFT marketplaces.</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="metadataURI" className="flex items-center gap-2">
              Advanced: Custom Metadata URI (Optional)
              <span className="text-xs text-muted-foreground font-normal">
                - Override auto-generated metadata
              </span>
            </Label>
            <Input
              id="metadataURI"
              placeholder="ipfs://QmXxx... or https://example.com/metadata.json"
              value={formData.metadataURI || ''}
              onChange={(e) => setFormData({ ...formData, metadataURI: e.target.value })}
              className="font-mono text-sm"
            />
            <div className="text-xs space-y-1">
              <p className="text-muted-foreground">
                💡 Leave empty to auto-generate metadata from image and form data
              </p>
              <p className="text-muted-foreground">
                Only use this if you have pre-prepared metadata JSON
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating Collectible...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Create Collectible
          </>
        )}
      </Button>
    </form>
  );
}
