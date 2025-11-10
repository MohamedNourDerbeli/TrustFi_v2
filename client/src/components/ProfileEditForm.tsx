import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Globe, 
  Twitter, 
  Github, 
  Linkedin, 
  MessageCircle,
  Send,
  Image as ImageIcon,
  Check,
  X,
  Sparkles
} from 'lucide-react';

interface ProfileEditFormProps {
  address: string;
}

export default function ProfileEditForm({ address }: ProfileEditFormProps) {
  const { provider } = useWallet();
  const { offChainData } = useProfile();
  const { toast } = useToast();

  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string>('');
  const [editEmail, setEditEmail] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editDiscord, setEditDiscord] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editBannerPreview, setEditBannerPreview] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing profile data
  useEffect(() => {
    const loadData = async () => {
      if (!address || !provider) return;

      if (offChainData) {
        const values = {
          username: offChainData.username || '',
          display_name: offChainData.display_name || '',
          bio: offChainData.bio || '',
          email: offChainData.email || '',
          websiteUrl: offChainData.websiteUrl || '',
          twitterHandle: offChainData.twitterHandle || '',
          githubHandle: offChainData.githubHandle || '',
          linkedinUrl: offChainData.linkedinUrl || '',
          discordHandle: offChainData.discordHandle || '',
          telegramHandle: offChainData.telegramHandle || '',
          avatar: offChainData.avatar_url || '',
          banner: offChainData.banner_url || '',
        };
        
        setOriginalValues(values);
        setEditUsername(values.username);
        setEditDisplayName(values.display_name);
        setEditBio(values.bio);
        setEditEmail(values.email);
        setEditWebsite(values.websiteUrl);
        setEditTwitter(values.twitterHandle);
        setEditGithub(values.githubHandle);
        setEditLinkedin(values.linkedinUrl);
        setEditDiscord(values.discordHandle);
        setEditTelegram(values.telegramHandle);
        
        if (values.avatar) {
          setEditImagePreview(values.avatar);
        }
        if (values.banner) {
          setEditBannerPreview(values.banner);
        }
        return;
      }

      try {
        const { profileService } = await import('@/services/profileService');
        const data = await profileService.getProfile(address);
        
        if (data) {
          const values = {
            username: data.username || '',
            display_name: data.display_name || '',
            bio: data.bio || '',
            email: data.email || '',
            websiteUrl: data.websiteUrl || '',
            twitterHandle: data.twitterHandle || '',
            githubHandle: data.githubHandle || '',
            linkedinUrl: data.linkedinUrl || '',
            discordHandle: data.discordHandle || '',
            telegramHandle: data.telegramHandle || '',
            avatar: data.avatar_url || '',
            banner: data.banner_url || '',
          };
          
          setOriginalValues(values);
          setEditUsername(values.username);
          setEditDisplayName(values.display_name);
          setEditBio(values.bio);
          setEditEmail(values.email);
          setEditWebsite(values.websiteUrl);
          setEditTwitter(values.twitterHandle);
          setEditGithub(values.githubHandle);
          setEditLinkedin(values.linkedinUrl);
          setEditDiscord(values.discordHandle);
          setEditTelegram(values.telegramHandle);
          
          if (values.avatar) {
            setEditImagePreview(values.avatar);
          }
          if (values.banner) {
            setEditBannerPreview(values.banner);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadData();
  }, [address, provider, offChainData]);

  // Check for changes whenever form values change
  useEffect(() => {
    if (!originalValues) {
      // If we have any non-empty values, consider it as changes
      const hasAnyValue = 
        editUsername.trim() !== '' ||
        editDisplayName.trim() !== '' ||
        editBio.trim() !== '' ||
        editEmail.trim() !== '' ||
        editWebsite.trim() !== '' ||
        editTwitter.trim() !== '' ||
        editGithub.trim() !== '' ||
        editLinkedin.trim() !== '' ||
        editDiscord.trim() !== '' ||
        editTelegram.trim() !== '' ||
        editImageFile !== null ||
        editBannerFile !== null;
      
      setHasChanges(hasAnyValue);
      return;
    }

    const changed = 
      editUsername.trim() !== (originalValues.username || '').trim() ||
      editDisplayName.trim() !== (originalValues.display_name || '').trim() ||
      editBio.trim() !== (originalValues.bio || '').trim() ||
      editEmail.trim() !== (originalValues.email || '').trim() ||
      editWebsite.trim() !== (originalValues.websiteUrl || '').trim() ||
      editTwitter.trim() !== (originalValues.twitterHandle || '').trim() ||
      editGithub.trim() !== (originalValues.githubHandle || '').trim() ||
      editLinkedin.trim() !== (originalValues.linkedinUrl || '').trim() ||
      editDiscord.trim() !== (originalValues.discordHandle || '').trim() ||
      editTelegram.trim() !== (originalValues.telegramHandle || '').trim() ||
      editImageFile !== null ||
      editBannerFile !== null;

    setHasChanges(changed);
  }, [
    originalValues,
    editUsername,
    editDisplayName,
    editBio,
    editEmail,
    editWebsite,
    editTwitter,
    editGithub,
    editLinkedin,
    editDiscord,
    editTelegram,
    editImageFile,
    editBannerFile,
  ]);

  const checkUsername = async (username: string) => {
    if (username === offChainData?.username) {
      setUsernameAvailable(true);
      setUsernameError('');
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');

    try {
      const { profileService } = await import('@/services/profileService');
      const available = await profileService.isUsernameAvailable(username);
      setUsernameAvailable(available);
      
      if (!available) {
        setUsernameError('Username is already taken');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleCancel = () => {
    if (!originalValues) return;

    // Reset all fields to original values
    setEditUsername(originalValues.username);
    setEditDisplayName(originalValues.display_name);
    setEditBio(originalValues.bio);
    setEditEmail(originalValues.email);
    setEditWebsite(originalValues.websiteUrl);
    setEditTwitter(originalValues.twitterHandle);
    setEditGithub(originalValues.githubHandle);
    setEditLinkedin(originalValues.linkedinUrl);
    setEditDiscord(originalValues.discordHandle);
    setEditTelegram(originalValues.telegramHandle);
    setEditImageFile(null);
    setEditBannerFile(null);
    setEditImagePreview(originalValues.avatar);
    setEditBannerPreview(originalValues.banner);
    setUsernameAvailable(null);
    setUsernameError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setEditImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setEditBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setEditBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      toast({
        title: 'Username Required',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }

    if (usernameAvailable === false) {
      toast({
        title: 'Username Unavailable',
        description: 'Please choose a different username',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);

      toast({
        title: 'Sign Message',
        description: 'Please sign the message to update your profile (free!)',
      });

      const { profileService } = await import('@/services/profileService');
      
      const updatedProfile = await profileService.updateProfile(
        provider!,
        address!,
        {
          username: editUsername.trim().toLowerCase(),
          display_name: editDisplayName.trim() || undefined,
          bio: editBio.trim(),
          email: editEmail.trim() || undefined,
          websiteUrl: editWebsite.trim() || undefined,
          twitterHandle: editTwitter.trim() || undefined,
          githubHandle: editGithub.trim() || undefined,
          linkedinUrl: editLinkedin.trim() || undefined,
          discordHandle: editDiscord.trim() || undefined,
          telegramHandle: editTelegram.trim() || undefined,
          avatar: editImageFile || undefined,
          banner: editBannerFile || undefined,
        }
      );

      toast({
        title: 'Success!',
        description: 'Your profile has been updated!',
      });

      // Invalidate React Query cache to refresh all profile data
      const { queryClient } = await import('@/lib/queryClient');
      await queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', address!.toLowerCase()] });

      // Force reload profile data from ProfileContext
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
      
      // Reset form to show updated values
      setOriginalValues({
        username: updatedProfile.username || '',
        display_name: updatedProfile.display_name || '',
        bio: updatedProfile.bio || '',
        email: updatedProfile.email || '',
        websiteUrl: updatedProfile.websiteUrl || '',
        twitterHandle: updatedProfile.twitterHandle || '',
        githubHandle: updatedProfile.githubHandle || '',
        linkedinUrl: updatedProfile.linkedinUrl || '',
        discordHandle: updatedProfile.discordHandle || '',
        telegramHandle: updatedProfile.telegramHandle || '',
        avatar: updatedProfile.avatar_url || '',
        banner: updatedProfile.banner_url || '',
      });
      
      // Clear file inputs
      setEditImageFile(null);
      setEditBannerFile(null);
      
      // Don't redirect - stay on settings page
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Banner with Profile Picture Overlay */}
      <div className="relative">
        {/* Banner */}
        <div className="relative group cursor-pointer" onClick={() => document.getElementById('banner-upload')?.click()}>
          {editBannerPreview ? (
            <img
              src={editBannerPreview}
              alt="Banner"
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <p className="text-white font-medium">Click to change banner</p>
          </div>
        </div>
        <input
          id="banner-upload"
          type="file"
          accept="image/*"
          onChange={handleBannerChange}
          className="hidden"
        />

        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-8 flex items-end gap-3">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
            {editImagePreview ? (
              <img
                src={editImagePreview}
                alt="Avatar"
                className="w-32 h-32 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-background bg-muted flex items-center justify-center">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!address) return;
              const { generateAvatarFile } = await import('@/utils/avatarGenerator');
              const avatarFile = generateAvatarFile(address, 500);
              setEditImageFile(avatarFile);
              const reader = new FileReader();
              reader.onload = () => setEditImagePreview(reader.result as string);
              reader.readAsDataURL(avatarFile);
              toast({
                title: 'Avatar Generated',
                description: 'Unique avatar created from your wallet address',
              });
            }}
            className="mb-2"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6 pt-16">
        {/* Display Name */}
        <div>
          <Label htmlFor="displayName" className="text-sm font-semibold mb-2 block">
            Display Name
            <span className="text-muted-foreground font-normal ml-2">
              (Your full name or preferred name)
            </span>
          </Label>
          <Input
            id="displayName"
            value={editDisplayName}
            onChange={(e) => setEditDisplayName(e.target.value)}
            disabled={isUpdating}
            maxLength={50}
            placeholder="e.g., Akira"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This is the main name shown on your profile
          </p>
        </div>

        {/* Username */}
        <div>
          <Label htmlFor="username" className="text-sm font-semibold mb-2 block">
            Username
            <span className="text-muted-foreground font-normal ml-2">
              (Your unique @username)
            </span>
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              @
            </div>
            <Input
              id="username"
              value={editUsername}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setEditUsername(value);
                if (value.length >= 3) {
                  checkUsername(value);
                } else {
                  setUsernameAvailable(null);
                  setUsernameError('');
                }
              }}
              disabled={isUpdating}
              maxLength={20}
              placeholder="your_username"
              className="text-sm pl-7"
            />
            {isCheckingUsername && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!isCheckingUsername && usernameAvailable === true && editUsername.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                <Check className="w-4 h-4" />
              </div>
            )}
            {!isCheckingUsername && usernameAvailable === false && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                <X className="w-4 h-4" />
              </div>
            )}
          </div>
          {usernameError && (
            <p className="text-xs text-destructive mt-1">{usernameError}</p>
          )}
          {usernameAvailable === true && editUsername.length >= 3 && (
            <p className="text-xs text-green-600 mt-1">✓ Username is available</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            3-20 characters, lowercase, letters, numbers, and underscore only
          </p>
          {editUsername && (
            <p className="text-xs text-muted-foreground mt-1">
              Your profile URL: /{editUsername}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio" className="text-sm font-semibold mb-2 block">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            disabled={isUpdating}
            maxLength={200}
            className="min-h-[100px] text-sm"
            placeholder="Tell the world your story!"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {editBio.length}/200 characters
          </p>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-sm font-semibold mb-2 block flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            disabled={isUpdating}
            placeholder="your@email.com"
            className="text-sm"
          />
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website" className="text-sm font-semibold mb-2 block flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={editWebsite}
            onChange={(e) => setEditWebsite(e.target.value)}
            disabled={isUpdating}
            placeholder="https://yourwebsite.com"
            className="text-sm"
          />
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Social Connections</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="twitter" className="text-xs flex items-center gap-2 mb-1">
                <Twitter className="w-3.5 h-3.5" />
                Twitter
              </Label>
              <Input
                id="twitter"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                disabled={isUpdating}
                placeholder="@username"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="github" className="text-xs flex items-center gap-2 mb-1">
                <Github className="w-3.5 h-3.5" />
                GitHub
              </Label>
              <Input
                id="github"
                value={editGithub}
                onChange={(e) => setEditGithub(e.target.value)}
                disabled={isUpdating}
                placeholder="username"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="linkedin" className="text-xs flex items-center gap-2 mb-1">
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                type="url"
                value={editLinkedin}
                onChange={(e) => setEditLinkedin(e.target.value)}
                disabled={isUpdating}
                placeholder="https://linkedin.com/in/username"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="discord" className="text-xs flex items-center gap-2 mb-1">
                <MessageCircle className="w-3.5 h-3.5" />
                Discord
              </Label>
              <Input
                id="discord"
                value={editDiscord}
                onChange={(e) => setEditDiscord(e.target.value)}
                disabled={isUpdating}
                placeholder="username#1234"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="telegram" className="text-xs flex items-center gap-2 mb-1">
                <Send className="w-3.5 h-3.5" />
                Telegram
              </Label>
              <Input
                id="telegram"
                value={editTelegram}
                onChange={(e) => setEditTelegram(e.target.value)}
                disabled={isUpdating}
                placeholder="@username"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-start gap-3 pt-6">
          <Button
            onClick={handleSaveProfile}
            disabled={isUpdating || !editUsername.trim() || usernameAvailable === false || !hasChanges}
            className="px-8"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating || !hasChanges}
            className="px-8"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
