import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/hooks/useUser';

// Define the type for our template data
interface CollectibleTemplate {
  id: string;
  issuer_name: string;
  title: string;
  description: string;
  image_url: string;
  tier: number;
}

export default function CollectiblesPage() {
  const [templates, setTemplates] = useState<CollectibleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser(); // Get the user's main profile

  // Fetch templates from Supabase on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('collectible_templates')
        .select('*');
      
      if (error) {
        setError(error.message);
      } else {
        setTemplates(data);
      }
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  if (loading) {
    return <div className="text-center p-10 text-white">Loading collectibles...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">Discover Collectibles</h1>
          <p className="text-lg text-gray-400">Claim credentials to build your on-chain reputation.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <CollectibleCard key={template.id} template={template} profileId={profile?.profile_nft_id} />
          ))}
        </div>
      </div>
    </div>
  );
}

// A sub-component for each collectible card
function CollectibleCard({ template, profileId }: { template: CollectibleTemplate, profileId: number | undefined }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!profileId) {
      setClaimError("You must have a TrustFi profile to claim collectibles.");
      return;
    }
    
    setIsLoading(true);
    setClaimError(null);

    try {
      // 1. Create metadata for this collectible
      const metadataPayload = {
        name: template.title,
        description: template.description,
        image: template.image_url,
        attributes: [
          { trait_type: "Issuer", value: template.issuer_name },
          { trait_type: "Tier", value: template.tier },
        ]
      };

      // 2. Upload metadata to IPFS
      const { data: pinResponse, error: pinError } = await supabase.functions.invoke('pin-metadata', {
        body: { metadata: metadataPayload },
      });

      if (pinError || pinResponse?.error) {
        throw new Error(pinError?.message || pinResponse.error);
      }
      const metadataURI = `ipfs://${pinResponse.IpfsHash}`;

      // 3. Call our secure backend function to issue the card
      const { data: issueResponse, error: issueError } = await supabase.functions.invoke('issue-card', {
        body: {
          profileId: profileId,
          tier: template.tier,
          tokenURI: metadataURI,
        },
      });

      if (issueError || issueResponse?.error) {
        throw new Error(issueError?.message || issueResponse.error);
      }

      console.log("Successfully issued card:", issueResponse);
      setIsSuccess(true);

    } catch (error: any) {
      console.error("Claim failed:", error);
      setClaimError(error.message || "Failed to claim collectible.");
    } finally {
      setIsLoading(false);
    }
  };

  let buttonText = "Claim";
  if (isLoading) buttonText = "Claiming...";
  if (isSuccess) buttonText = "Claimed!";

  return (
    <div className="bg-[#1A202C] border border-[#374151] rounded-lg overflow-hidden flex flex-col">
      <img src={template.image_url || 'https://via.placeholder.com/400x300'} alt={template.title} className="w-full h-48 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-sm text-gray-400">{template.issuer_name}</p>
        <h3 className="text-xl font-bold mt-1">{template.title}</h3>
        <p className="text-gray-300 mt-2 flex-grow">{template.description}</p>
        <button
          onClick={handleClaim}
          disabled={isLoading || isSuccess}
          className="mt-4 w-full py-2 px-4 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonText}
        </button>
        {claimError && (
          <p className="mt-2 text-sm text-red-400">{claimError}</p>
        )}
        {isSuccess && (
          <p className="mt-2 text-sm text-green-400">Card successfully claimed!</p>
        )}
      </div>
    </div>
   );
}
