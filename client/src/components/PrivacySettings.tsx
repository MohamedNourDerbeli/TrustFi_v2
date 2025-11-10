import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Eye, Lock, Globe, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrivacySettingsProps {
  address: string;
  currentSettings?: any;
  onSave?: () => void;
}

export default function PrivacySettings({ address, currentSettings, onSave }: PrivacySettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Privacy settings
  const [showEmail, setShowEmail] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(true);
  const [showBio, setShowBio] = useState(true);
  const [showReputationScore, setShowReputationScore] = useState(true);
  const [showCredentials, setShowCredentials] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showWalletAddress, setShowWalletAddress] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'connections_only'>('public');

  // Tracking preferences
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [allowProfileViews, setAllowProfileViews] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const [allowSearchIndexing, setAllowSearchIndexing] = useState(true);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current settings
  useEffect(() => {
    const values: any = {
      showEmail: false,
      showSocialLinks: true,
      showBio: true,
      showReputationScore: true,
      showCredentials: true,
      showActivity: true,
      showWalletAddress: true,
      profileVisibility: 'public',
      allowAnalytics: true,
      allowProfileViews: true,
      showOnlineStatus: false,
      allowSearchIndexing: true,
    };

    if (currentSettings?.privacy_settings) {
      const ps = currentSettings.privacy_settings;
      values.showEmail = ps.show_email ?? false;
      values.showSocialLinks = ps.show_social_links ?? true;
      values.showBio = ps.show_bio ?? true;
      values.showReputationScore = ps.show_reputation_score ?? true;
      values.showCredentials = ps.show_credentials ?? true;
      values.showActivity = ps.show_activity ?? true;
      values.showWalletAddress = ps.show_wallet_address ?? true;
      values.profileVisibility = ps.profile_visibility ?? 'public';
    }

    if (currentSettings?.tracking_preferences) {
      const tp = currentSettings.tracking_preferences;
      values.allowAnalytics = tp.allow_analytics ?? true;
      values.allowProfileViews = tp.allow_profile_views ?? true;
      values.showOnlineStatus = tp.show_online_status ?? false;
      values.allowSearchIndexing = tp.allow_search_indexing ?? true;
    }

    setOriginalValues(values);
    setShowEmail(values.showEmail);
    setShowSocialLinks(values.showSocialLinks);
    setShowBio(values.showBio);
    setShowReputationScore(values.showReputationScore);
    setShowCredentials(values.showCredentials);
    setShowActivity(values.showActivity);
    setShowWalletAddress(values.showWalletAddress);
    setProfileVisibility(values.profileVisibility);
    setAllowAnalytics(values.allowAnalytics);
    setAllowProfileViews(values.allowProfileViews);
    setShowOnlineStatus(values.showOnlineStatus);
    setAllowSearchIndexing(values.allowSearchIndexing);
  }, [currentSettings]);

  // Check for changes whenever form values change
  useEffect(() => {
    if (!originalValues) {
      setHasChanges(false);
      return;
    }

    const changed = 
      showEmail !== originalValues.showEmail ||
      showSocialLinks !== originalValues.showSocialLinks ||
      showBio !== originalValues.showBio ||
      showReputationScore !== originalValues.showReputationScore ||
      showCredentials !== originalValues.showCredentials ||
      showActivity !== originalValues.showActivity ||
      showWalletAddress !== originalValues.showWalletAddress ||
      profileVisibility !== originalValues.profileVisibility ||
      allowAnalytics !== originalValues.allowAnalytics ||
      allowProfileViews !== originalValues.allowProfileViews ||
      showOnlineStatus !== originalValues.showOnlineStatus ||
      allowSearchIndexing !== originalValues.allowSearchIndexing;

    setHasChanges(changed);
  }, [
    originalValues,
    showEmail,
    showSocialLinks,
    showBio,
    showReputationScore,
    showCredentials,
    showActivity,
    showWalletAddress,
    profileVisibility,
    allowAnalytics,
    allowProfileViews,
    showOnlineStatus,
    allowSearchIndexing,
  ]);

  const handleCancel = () => {
    if (!originalValues) return;

    // Reset all fields to original values
    setShowEmail(originalValues.showEmail);
    setShowSocialLinks(originalValues.showSocialLinks);
    setShowBio(originalValues.showBio);
    setShowReputationScore(originalValues.showReputationScore);
    setShowCredentials(originalValues.showCredentials);
    setShowActivity(originalValues.showActivity);
    setShowWalletAddress(originalValues.showWalletAddress);
    setProfileVisibility(originalValues.profileVisibility);
    setAllowAnalytics(originalValues.allowAnalytics);
    setAllowProfileViews(originalValues.allowProfileViews);
    setShowOnlineStatus(originalValues.showOnlineStatus);
    setAllowSearchIndexing(originalValues.allowSearchIndexing);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { supabase } = await import('@/lib/supabase');

      const privacySettings = {
        show_email: showEmail,
        show_social_links: showSocialLinks,
        show_bio: showBio,
        show_reputation_score: showReputationScore,
        show_credentials: showCredentials,
        show_activity: showActivity,
        show_wallet_address: showWalletAddress,
        profile_visibility: profileVisibility,
      };

      const trackingPreferences = {
        allow_analytics: allowAnalytics,
        allow_profile_views: allowProfileViews,
        show_online_status: showOnlineStatus,
        allow_search_indexing: allowSearchIndexing,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          privacy_settings: privacySettings,
          tracking_preferences: trackingPreferences,
          visibility: profileVisibility,
        })
        .eq('address', address.toLowerCase());

      if (error) throw error;

      toast({
        title: 'Privacy Settings Saved',
        description: 'Your privacy preferences have been updated',
      });

      onSave?.();
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save privacy settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Profile Visibility</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Control who can see your profile
            </p>
          </div>
        </div>

        <Select value={profileVisibility} onValueChange={(value: any) => setProfileVisibility(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-xs text-muted-foreground">Anyone can view your profile</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="connections_only">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <div>
                  <div className="font-medium">Connections Only</div>
                  <div className="text-xs text-muted-foreground">Only your connections can view</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-xs text-muted-foreground">Only you can view your profile</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* What to Show */}
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <Eye className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">What to Show</h3>
            <p className="text-sm text-muted-foreground">
              Choose what information is visible on your profile
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Address</Label>
              <p className="text-xs text-muted-foreground">Show your email to visitors</p>
            </div>
            <Switch checked={showEmail} onCheckedChange={setShowEmail} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Social Links</Label>
              <p className="text-xs text-muted-foreground">Show Twitter, GitHub, LinkedIn, etc.</p>
            </div>
            <Switch checked={showSocialLinks} onCheckedChange={setShowSocialLinks} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bio</Label>
              <p className="text-xs text-muted-foreground">Show your biography</p>
            </div>
            <Switch checked={showBio} onCheckedChange={setShowBio} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reputation Score</Label>
              <p className="text-xs text-muted-foreground">Show your reputation points</p>
            </div>
            <Switch checked={showReputationScore} onCheckedChange={setShowReputationScore} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Credentials</Label>
              <p className="text-xs text-muted-foreground">Show your reputation cards</p>
            </div>
            <Switch checked={showCredentials} onCheckedChange={setShowCredentials} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activity</Label>
              <p className="text-xs text-muted-foreground">Show profile views and activity</p>
            </div>
            <Switch checked={showActivity} onCheckedChange={setShowActivity} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Wallet Address</Label>
              <p className="text-xs text-muted-foreground">Show your full wallet address</p>
            </div>
            <Switch checked={showWalletAddress} onCheckedChange={setShowWalletAddress} />
          </div>
        </div>
      </Card>

      {/* Tracking & Analytics */}
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Tracking & Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Control how your data is used
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Analytics</Label>
              <p className="text-xs text-muted-foreground">Help us improve with anonymous usage data</p>
            </div>
            <Switch checked={allowAnalytics} onCheckedChange={setAllowAnalytics} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Track Profile Views</Label>
              <p className="text-xs text-muted-foreground">Count how many people view your profile</p>
            </div>
            <Switch checked={allowProfileViews} onCheckedChange={setAllowProfileViews} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Online Status</Label>
              <p className="text-xs text-muted-foreground">Let others see when you're online</p>
            </div>
            <Switch checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Search Indexing</Label>
              <p className="text-xs text-muted-foreground">Allow your profile to appear in search results</p>
            </div>
            <Switch checked={allowSearchIndexing} onCheckedChange={setAllowSearchIndexing} />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline"
          onClick={handleCancel} 
          disabled={isSaving || !hasChanges}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>
    </div>
  );
}
