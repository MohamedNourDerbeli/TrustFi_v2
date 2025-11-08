/**
 * Reputation Card Metadata Service
 * Handles metadata for reputation cards (images, proof documents, etc.)
 */

export interface ReputationCardMetadata {
  title: string;
  description: string;
  category: string;
  image?: string; // Badge/certificate image
  proofDocument?: string; // Supporting document (PDF, image, etc.)
  issuerName?: string;
  issuerLogo?: string;
  externalUrl?: string; // Link to more info
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export class ReputationCardMetadataService {
  private storageType: 'ipfs' | 'local';
  private apiEndpoint?: string;

  constructor(storageType: 'ipfs' | 'local' = 'local', apiEndpoint?: string) {
    this.storageType = storageType;
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Upload reputation card metadata
   */
  async uploadMetadata(metadata: ReputationCardMetadata): Promise<string> {
    this.validateMetadata(metadata);

    switch (this.storageType) {
      case 'ipfs':
        return await this.uploadToIPFS(metadata);
      case 'local':
        return this.storeLocally(metadata);
      default:
        throw new Error('Invalid storage type');
    }
  }

  /**
   * Fetch metadata from URI
   */
  async fetchMetadata(uri: string): Promise<ReputationCardMetadata> {
    if (!uri || uri.trim().length === 0) {
      throw new Error('Invalid metadata URI');
    }

    if (uri.startsWith('ipfs://')) {
      return await this.fetchFromIPFS(uri);
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return await this.fetchFromHTTP(uri);
    } else if (uri.startsWith('local://')) {
      return this.fetchFromLocal(uri);
    } else {
      throw new Error('Invalid URI format');
    }
  }

  /**
   * Upload image (badge/certificate)
   */
  async uploadImage(file: File): Promise<string> {
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
      case 'local':
        return await this.convertToDataURL(file);
      default:
        throw new Error('Invalid storage type');
    }
  }

  /**
   * Upload proof document (PDF, image, etc.)
   */
  async uploadDocument(file: File): Promise<string> {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File must be PDF or image');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Document must be less than 10MB');
    }

    switch (this.storageType) {
      case 'ipfs':
        return await this.uploadDocumentToIPFS(file);
      case 'local':
        return await this.convertToDataURL(file);
      default:
        throw new Error('Invalid storage type');
    }
  }

  /**
   * Delete metadata
   */
  async deleteMetadata(uri: string): Promise<void> {
    if (this.storageType === 'ipfs' && uri && uri.startsWith('ipfs://')) {
      try {
        const cid = uri.replace('ipfs://', '');
        await this.deleteFromPinata(cid);
      } catch (error) {
        console.error('Failed to delete metadata:', error);
      }
    } else if (this.storageType === 'local' && uri && uri.startsWith('local://')) {
      const key = uri.replace('local://', '');
      localStorage.removeItem(key);
    }
  }

  /**
   * Validate metadata
   */
  private validateMetadata(metadata: ReputationCardMetadata): void {
    if (!metadata.title || metadata.title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (metadata.title.length > 100) {
      throw new Error('Title must be 100 characters or less');
    }
    if (!metadata.description || metadata.description.trim().length === 0) {
      throw new Error('Description is required');
    }
    if (metadata.description.length > 500) {
      throw new Error('Description must be 500 characters or less');
    }
    if (!metadata.category || metadata.category.trim().length === 0) {
      throw new Error('Category is required');
    }
  }

  /**
   * Upload to IPFS
   */
  private async uploadToIPFS(metadata: ReputationCardMetadata): Promise<string> {
    if (!this.apiEndpoint) {
      throw new Error('IPFS API endpoint not configured');
    }

    const pinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJWT || pinataJWT === 'your_pinata_jwt_here') {
      throw new Error('Pinata JWT not configured');
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
            name: `trustfi-card-${metadata.title.replace(/\s+/g, '-').toLowerCase()}`,
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
   * Upload image to IPFS
   */
  private async uploadImageToIPFS(file: File): Promise<string> {
    if (!this.apiEndpoint) {
      throw new Error('IPFS API endpoint not configured');
    }

    const pinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJWT || pinataJWT === 'your_pinata_jwt_here') {
      throw new Error('Pinata JWT not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: `trustfi-card-image-${Date.now()}`,
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
        throw new Error(`Failed to upload image: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload document to IPFS
   */
  private async uploadDocumentToIPFS(file: File): Promise<string> {
    // Same as image upload but for documents
    return await this.uploadImageToIPFS(file);
  }

  /**
   * Fetch from IPFS
   */
  private async fetchFromIPFS(uri: string): Promise<ReputationCardMetadata> {
    const hash = uri.replace('ipfs://', '');
    const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
    const gatewayWithProtocol = gateway.startsWith('http') ? gateway : `https://${gateway}`;
    const gatewayUrl = `${gatewayWithProtocol}/ipfs/${hash}`;

    try {
      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reputation card metadata not found on IPFS');
        }
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Unable to load reputation card metadata: ${error.message}`);
    }
  }

  /**
   * Fetch from HTTP
   */
  private async fetchFromHTTP(uri: string): Promise<ReputationCardMetadata> {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Failed to fetch metadata');
    }
    return await response.json();
  }

  /**
   * Store locally
   */
  private storeLocally(metadata: ReputationCardMetadata): string {
    const id = Date.now().toString();
    const key = `card_metadata_${id}`;
    localStorage.setItem(key, JSON.stringify(metadata));
    return `local://${key}`;
  }

  /**
   * Fetch from local storage
   */
  private fetchFromLocal(uri: string): ReputationCardMetadata {
    const key = uri.replace('local://', '');
    const data = localStorage.getItem(key);

    if (!data) {
      throw new Error('Metadata not found in local storage');
    }

    return JSON.parse(data);
  }

  /**
   * Convert file to data URL
   */
  private async convertToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Delete from Pinata
   */
  private async deleteFromPinata(cid: string): Promise<void> {
    if (!this.apiEndpoint) {
      return;
    }

    const pinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJWT || pinataJWT === 'your_pinata_jwt_here') {
      return;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/pinning/unpin/${cid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        console.error('Failed to delete from Pinata:', response.statusText);
      }
    } catch (error) {
      console.error('Pinata delete error:', error);
    }
  }
}

// Export singleton instance
const pinataJWT = import.meta.env.VITE_PINATA_JWT;
const usePinata = pinataJWT && pinataJWT !== 'your_pinata_jwt_here';

export const reputationCardMetadataService = new ReputationCardMetadataService(
  usePinata ? 'ipfs' : 'local',
  usePinata ? 'https://api.pinata.cloud' : undefined
);
