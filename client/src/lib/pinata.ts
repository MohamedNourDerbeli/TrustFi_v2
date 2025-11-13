import axios from 'axios';

export async function pinJSONToIPFS(metadata: any): Promise<string> {
  const pinataJWT = import.meta.env.VITE_PINATA_JWT;
  
  if (!pinataJWT) {
    throw new Error("Pinata JWT not configured. Please add VITE_PINATA_JWT to your .env file");
  }

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pinataJWT}`
        }
      }
    );

    return response.data.IpfsHash;
  } catch (error: any) {
    console.error("Pinata API Error:", error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to pin to IPFS');
  }
}
