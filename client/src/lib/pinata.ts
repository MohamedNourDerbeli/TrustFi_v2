// lib/pinata.ts
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
// Use CORS-friendly IPFS gateway instead of Pinata's restricted gateway
const PINATA_GATEWAY = 'https://ipfs.io/ipfs/';

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.warn('Pinata credentials not configured. Image uploads will not work.');
}

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Upload a file to Pinata IPFS
 */
export async function uploadToPinata(file: File): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    throw new Error('Pinata credentials not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: file.name,
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', options);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to Pinata: ${error}`);
  }

  const data: PinataUploadResponse = await response.json();
  return `${PINATA_GATEWAY}${data.IpfsHash}`;
}

/**
 * Upload JSON metadata to Pinata IPFS
 */
export async function uploadJSONToPinata(json: object): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    throw new Error('Pinata credentials not configured');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
    body: JSON.stringify({
      pinataContent: json,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload JSON to Pinata: ${error}`);
  }

  const data: PinataUploadResponse = await response.json();
  return `${PINATA_GATEWAY}${data.IpfsHash}`;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File, maxSizeMB: number): string | null {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)';
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  return null;
}
