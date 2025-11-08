/**
 * Metadata Service
 * Handles profile metadata storage and retrieval
 * Can use IPFS, centralized storage, or local storage for development
 */

export interface ProfileMetadata {
  name: string;
  bio: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export class MetadataService {
  private storageType: 'ipfs' | 'centralized' | 'local';
  private apiEndpoint?: string;

  constructor(storageType: 'ipfs' | 'centralized' | 'local' = 'local', apiEndpoint?: string) {
    this.storageType = storageType;
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Upload profile metadata and return URI
   */
  async uploadMetadata(metadata: ProfileMetadata): Promise<string> {
    // Validate metadata
    this.validateMetadata(metadata);

    switch (this.storageType) {
      case 'ipfs':
        return await this.uploadToIPFS(metadata);
      case 'centralized':
        return await this.uploadToCentralized(metadata);
      case 'local':
        return this.storeLocally(metadata);
      default:
        throw new Error('Invalid storage type');
    }
  }

  /**
   * Fetch metadata from URI
   */
  async fetchMetadata(uri: string): Promise<ProfileMetadata> {
    try {
      // Handle empty or undefined URI
      if (!uri || uri.trim().length === 0) {
        // Return default metadata for profiles without metadata
        return {
          name: 'Unknown User',
          bio: 'No profile information available',
        };
      }

      if (uri.startsWith('data:')) {
        // Handle data URI (base64 encoded JSON)
        return this.fetchFromDataURI(uri);
      } else if (uri.startsWith('ipfs://')) {
        return await this.fetchFromIPFS(uri);
      } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return await this.fetchFromHTTP(uri);
      } else if (uri.startsWith('local://')) {
        return this.fetchFromLocal(uri);
      } else {
        throw new Error('Invalid URI format');
      }
    } catch (error: any) {
      // Don't throw errors for empty URIs - they're expected for new users
      if (error.message !== 'Invalid URI format') {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Update existing metadata
   * Note: IPFS is immutable, so this creates a new file with new CID
   * The old file should be deleted manually after transaction confirmation
   * @deprecated Use uploadMetadata and deleteMetadata separately for better control
   */
  async updateMetadata(_oldUri: string, newMetadata: ProfileMetadata): Promise<string> {
    // Just upload new metadata - don't delete old one automatically
    // Deletion should happen after blockchain transaction is confirmed
    return await this.uploadMetadata(newMetadata);
  }

  /**
   * Delete metadata from storage by URI
   */
  async deleteMetadata(uri: string): Promise<void> {
    if (this.storageType === 'ipfs' && uri && uri.startsWith('ipfs://')) {
      try {
        const cid = uri.replace('ipfs://', '');
        await this.deleteFromPinata(cid);
      } catch (error) {
        console.error('Failed to delete metadata from Pinata:', error);
        throw error;
      }
    } else if (this.storageType === 'local' && uri && uri.startsWith('local://')) {
      const key = uri.replace('local://', '');
      localStorage.removeItem(key);
    }
  }

  /**
   * Delete file from Pinata by CID
   */
  private async deleteFromPinata(cid: string): Promise<void> {
    if (!this.apiEndpoint) {
      console.warn('No API endpoint configured for deletion');
      return;
    }

    const pinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJWT || pinataJWT === 'your_pinata_jwt_here') {
      console.warn('No Pinata JWT configured for deletion');
      return;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/pinning/unpin/${cid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If file doesn't exist (404), that's okay - it's already gone
        if (response.status === 404) {
          console.log('File already deleted or not found:', cid);
          return;
        }
        
        throw new Error(`Failed to delete file: ${errorData.error || response.statusText}`);
      }
      
      console.log('Successfully deleted from Pinata:', cid);
    } catch (error) {
      console.error('Pinata delete error:', error);
      // Don't throw - make deletion non-critical
      // throw error;
    }
  }

  /**
   * Validate metadata structure
   */
  private validateMetadata(metadata: ProfileMetadata): void {
    if (!metadata.name || metadata.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    if (metadata.name.length > 50) {
      throw new Error('Name must be 50 characters or less');
    }
    if (metadata.bio && metadata.bio.length > 500) {
      throw new Error('Bio must be 500 characters or less');
    }
  }

  /**
   * Upload to IPFS using Pinata (with optional server proxy)
   */
  private async uploadToIPFS(metadata: ProfileMetadata): Promise<string> {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    
    // Use server proxy if configured
    if (serverUrl) {
      try {
        return await this.uploadToIPFSViaServer(metadata, serverUrl);
      } catch (error) {
        console.warn('Server upload failed, falling back to direct upload:', error);
      }
    }

    // Fallback to direct upload
    return await this.uploadToIPFSDirect(metadata);
  }

  /**
   * Upload via server proxy (more secure)
   */
  private async uploadToIPFSViaServer(metadata: ProfileMetadata, serverUrl: string): Promise<string> {
    const response = await fetch(`${serverUrl}/upload/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization if needed
        // 'Authorization': `Bearer ${yourAuthToken}`
      },
      body: JSON.stringify({
        data: metadata,
        metadata: {
          name: `trustfi-profile-${metadata.name.replace(/\s+/g, '-').toLowerCase()}`
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Server upload failed: ${response.statusText}`);
    }

    const { ipfsUrl } = await response.json();
    return ipfsUrl;
  }

  /**
   * Direct upload to IPFS (fallback method)
   */
  private async uploadToIPFSDirect(metadata: ProfileMetadata): Promise<string> {
    if (!this.apiEndpoint) {
      throw new Error('IPFS API endpoint not configured');
    }

    const pinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJWT || pinataJWT === 'your_pinata_jwt_here') {
      throw new Error('Pinata JWT not configured. Please set VITE_PINATA_JWT in .env');
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pinataJWT}`,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `trustfi-profile-${metadata.name.replace(/\s+/g, '-').toLowerCase()}`,
          },
          pinataOptions: {
            cidVersion: 1,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to upload to IPFS: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  }

  /**
   * Upload to centralized storage (your own backend)
   */
  private async uploadToCentralized(metadata: ProfileMetadata): Promise<string> {
    if (!this.apiEndpoint) {
      throw new Error('API endpoint not configured');
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/api/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error('Failed to upload metadata');
      }

      const data = await response.json();
      return data.uri; // e.g., "https://api.trustfi.com/metadata/123"
    } catch (error) {
      console.error('Centralized upload error:', error);
      throw error;
    }
  }

  /**
   * Store locally (for development/testing)
   */
  private storeLocally(metadata: ProfileMetadata): string {
    const id = Date.now().toString();
    const key = `metadata_${id}`;
    localStorage.setItem(key, JSON.stringify(metadata));
    return `local://${key}`;
  }

  /**
   * Fetch from IPFS using Pinata gateway
   */
  private async fetchFromIPFS(uri: string): Promise<ProfileMetadata> {
    // Convert ipfs:// to HTTP gateway
    const hash = uri.replace('ipfs://', '');
    const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
    
    // Ensure gateway has https:// prefix
    const gatewayWithProtocol = gateway.startsWith('http') ? gateway : `https://${gateway}`;
    const gatewayUrl = `${gatewayWithProtocol}/ipfs/${hash}`;
    
    try {
      const response = await fetch(gatewayUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            'Profile data not found on IPFS. The files may have been deleted. ' +
            'Please update your profile to upload new data.'
          );
        }
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      // Provide helpful error message
      if (error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Unable to load profile data from IPFS. ` +
        `This might be a network issue or the data was deleted. ` +
        `Try refreshing the page or updating your profile. ` +
        `Original error: ${error.message}`
      );
    }
  }

  /**
   * Fetch from HTTP
   */
  private async fetchFromHTTP(uri: string): Promise<ProfileMetadata> {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Failed to fetch metadata');
    }
    
    return await response.json();
  }

  /**
   * Fetch from data URI (base64 encoded JSON)
   */
  private fetchFromDataURI(uri: string): ProfileMetadata {
    try {
      // Extract the base64 part from data:application/json;base64,<data>
      const base64Data = uri.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid data URI format');
      }
      
      // Decode base64
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse data URI:', error);
      throw new Error('Invalid data URI');
    }
  }

  /**
   * Fetch from local storage
   */
  private fetchFromLocal(uri: string): ProfileMetadata {
    const key = uri.replace('local://', '');
    const data = localStorage.getItem(key);
    
    if (!data) {
      throw new Error('Metadata not found in local storage');
    }
    
    return JSON.parse(data);
  }

  /**
   * Delete image from storage
   */
  async deleteImage(imageUri: string): Promise<void> {
    if (this.storageType === 'ipfs' && imageUri && imageUri.startsWith('ipfs://')) {
      try {
        const cid = imageUri.replace('ipfs://', '');
        await this.deleteFromPinata(cid);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  }

  /**
   * Upload image to storage
   */
  async uploadImage(file: File): Promise<string> {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image must be less than 5MB');
    }

    switch (this.storageType) {
      case 'ipfs':
        return await this.uploadImageToIPFS(file);
      case 'centralized':
        return await this.uploadImageToCentralized(file);
      case 'local':
        return await this.convertImageToDataURL(file);
      default:
        throw new Error('Invalid storage type');
    }
  }

  /**
   * Upload image to IPFS using Pinata (with optional server proxy)
   */
  private async uploadImageToIPFS(file: File): Promise<string> {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    
    // Use server proxy if configured
    if (serverUrl) {
      try {
        return await this.uploadImageToIPFSViaServer(file, serverUrl);
      } catch (error) {
        console.warn('Server upload failed, falling back to direct upload:', error);
      }
    }

    // Fallback to direct upload
    return await this.uploadImageToIPFSDirect(file);
  }

  /**
   * Upload image via server proxy (more secure)
   */
  private async uploadImageToIPFSViaServer(file: File, serverUrl: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${serverUrl}/upload/file`, {
      method: 'POST',
      headers: {
        // Add authorization if needed
        // 'Authorization': `Bearer ${yourAuthToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server upload failed: ${response.statusText}`);
    }

    const { ipfsUrl } = await response.json();
    return ipfsUrl;
  }

  /**
   * Direct upload to IPFS (fallback method)
   */
  private async uploadImageToIPFSDirect(file: File): Promise<string> {
    if (!this.apiEndpoint) {
      throw new Error('IPFS API endpoint not configured');
    }

    const pinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJWT || pinataJWT === 'your_pinata_jwt_here') {
      throw new Error('Pinata JWT not configured. Please set VITE_PINATA_JWT in .env');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name: `trustfi-image-${Date.now()}`,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    try {
      const response = await fetch(`${this.apiEndpoint}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to upload image to IPFS: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload image to centralized storage
   */
  private async uploadImageToCentralized(file: File): Promise<string> {
    if (!this.apiEndpoint) {
      throw new Error('API endpoint not configured');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${this.apiEndpoint}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Convert image to data URL (for local development)
   */
  private async convertImageToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Export singleton instance
// Use IPFS (Pinata) if JWT is configured, otherwise use local storage
const pinataJWT = import.meta.env.VITE_PINATA_JWT;
const usePinata = pinataJWT && pinataJWT !== 'your_pinata_jwt_here';

export const metadataService = new MetadataService(
  usePinata ? 'ipfs' : 'local',
  usePinata ? 'https://api.pinata.cloud' : undefined
);
