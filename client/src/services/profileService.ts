/**
 * Profile Service - Free off-chain profile updates
 * Uses Supabase for storage and signature verification
 */

import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';

export interface OffChainProfile {
  address: string;
  username?: string;
  display_name?: string;
  bio?: string;
  email?: string;
  websiteUrl?: string;
  avatar?: string;
  banner?: string;
  twitterHandle?: string;
  githubHandle?: string;
  linkedinUrl?: string;
  discordHandle?: string;
  telegramHandle?: string;
  updatedAt?: string;
  visibility?: string;
  privacy_settings?: any;
  tracking_preferences?: any;
}

export class ProfileService {
  /**
   * Get profile data from Supabase by address
   */
  async getProfile(address: string): Promise<OffChainProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('address', address.toLowerCase())
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is normal
          return null;
        }
        throw error;
      }
      
      if (!data) return null;
      
      return this.mapProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Get profile data by username
   */
  async getProfileByUsername(username: string): Promise<OffChainProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      if (!data) return null;
      
      return this.mapProfileData(data);
    } catch (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_username_available', {
        check_username: username.toLowerCase()
      });
      
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  /**
   * Search profiles by username, display name, or address
   */
  async searchProfiles(query: string): Promise<OffChainProfile[]> {
    try {
      const { data, error } = await supabase.rpc('search_profiles', {
        search_query: query
      });
      
      if (error) throw error;
      if (!data) return [];
      
      return data.map((profile: any) => this.mapProfileData(profile));
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  }

  /**
   * Map database profile to OffChainProfile
   */
  private mapProfileData(data: any): OffChainProfile {
    return {
      address: data.address,
      username: data.username,
      display_name: data.display_name,
      bio: data.bio,
      email: data.email,
      websiteUrl: data.website_url,
      avatar: data.avatar_url,
      banner: data.banner_url,
      twitterHandle: data.twitter_handle,
      githubHandle: data.github_handle,
      linkedinUrl: data.linkedin_url,
      discordHandle: data.discord_handle,
      telegramHandle: data.telegram_handle,
      updatedAt: data.updated_at,
      visibility: data.visibility,
      privacy_settings: data.privacy_settings,
      tracking_preferences: data.tracking_preferences,
    };
  }

  /**
   * Update profile (free - no gas fees!)
   */
  async updateProfile(
    provider: ethers.BrowserProvider,
    _address: string,
    data: {
      username?: string;
      display_name?: string;
      bio?: string;
      email?: string;
      websiteUrl?: string;
      avatar?: File;
      banner?: File;
      twitterHandle?: string;
      githubHandle?: string;
      linkedinUrl?: string;
      discordHandle?: string;
      telegramHandle?: string;
    }
  ): Promise<OffChainProfile> {
    // Get signer first to ensure we have the correct address
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // Create message to sign
    const timestamp = Date.now();
    const message = `Update TrustFi profile\nAddress: ${signerAddress}\nTimestamp: ${timestamp}`;
    
    console.log('Signing message:', message);
    
    // Sign message (free - no gas!)
    const signature = await signer.signMessage(message);
    
    console.log('Signature:', signature);
    
    // Verify signature locally first
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error('Signature verification failed');
    }
    
    // Upload avatar if provided
    let avatarUrl: string | undefined;
    if (data.avatar) {
      const fileName = `${signerAddress.toLowerCase()}-avatar-${timestamp}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, data.avatar, {
          upsert: true,
          contentType: data.avatar.type,
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);
      
      avatarUrl = publicUrl;
    }
    
    // Upload banner if provided
    let bannerUrl: string | undefined;
    if (data.banner) {
      const fileName = `${signerAddress.toLowerCase()}-banner-${timestamp}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, data.banner, {
          upsert: true,
          contentType: data.banner.type,
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(uploadData.path);
      
      bannerUrl = publicUrl;
    }
    
    // Validate username if provided
    if (data.username) {
      // Check if username is already taken by another user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('address')
        .eq('username', data.username.toLowerCase())
        .single();
      
      if (existingProfile && existingProfile.address.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('Username is already taken');
      }
    }

    // Update profile in database
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        address: signerAddress.toLowerCase(),
        username: data.username?.toLowerCase(),
        display_name: data.display_name || data.username, // Use display_name if provided, fallback to username
        bio: data.bio,
        email: data.email,
        website_url: data.websiteUrl,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        twitter_handle: data.twitterHandle,
        github_handle: data.githubHandle,
        linkedin_url: data.linkedinUrl,
        discord_handle: data.discordHandle,
        telegram_handle: data.telegramHandle,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'address',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return this.mapProfileData(profile);
  }
}

export const profileService = new ProfileService();
