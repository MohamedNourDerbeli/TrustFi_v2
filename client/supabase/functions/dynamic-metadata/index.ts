import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createPublicClient, http, parseAbi } from "https://esm.sh/viem@2.7.1";

// Configuration constants
const REPUTATION_CARD_ADDRESS = Deno.env.get("REPUTATION_CARD_CONTRACT_ADDRESS") as `0x${string}`;
const KUSAMA_SVG_ADDRESS = Deno.env.get("KUSAMA_SVG_CONTRACT_ADDRESS") as `0x${string}`;
const MAIN_CHAIN_RPC = Deno.env.get("MAIN_CHAIN_RPC_URL") || "https://rpc.api.moonbase.moonbeam.network";
// Both contracts are currently on Moonbase Alpha for testing
const KUSAMA_HUB_RPC = MAIN_CHAIN_RPC;

// Contract ABIs
const REPUTATION_CARD_ABI = parseAbi([
  "function calculateScoreForProfile(uint256 profileId) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
]);

const KUSAMA_SVG_ABI = parseAbi([
  "function tokenMetadata(uint256 tokenId, uint256 score, string memory title) pure returns (string memory)",
  "function generateSVG(uint256 score) pure returns (string memory)",
  "function imageDataURI(uint256 score) pure returns (string memory)",
]);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract token ID from URL path
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    
    // The last segment should be the token ID
    const tokenIdStr = pathSegments[pathSegments.length - 1];
    
    // Validate token ID is present
    if (!tokenIdStr || tokenIdStr === "dynamic-metadata") {
      return new Response(
        JSON.stringify({ 
          error: "Missing token ID",
          message: "Token ID must be provided in the URL path" 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Parse token ID and map to profile ID
    // For Living Profile, tokenId = profileId
    const tokenId = BigInt(tokenIdStr);
    const profileId = tokenId;
    
    // Create viem public client for main chain
    const mainChainClient = createPublicClient({
      transport: http(MAIN_CHAIN_RPC),
    });
    
    // Query reputation score from ReputationCard contract
    let reputationScore: bigint;
    try {
      reputationScore = await mainChainClient.readContract({
        address: REPUTATION_CARD_ADDRESS,
        abi: REPUTATION_CARD_ABI,
        functionName: "calculateScoreForProfile",
        args: [profileId],
      }) as bigint;
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to read reputation score",
          details: error.message 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Create viem public client for Kusama Hub
    const kusamaHubClient = createPublicClient({
      transport: http(KUSAMA_HUB_RPC),
    });
    
    // Call KusamaSVGArt contract to generate metadata
    let metadataDataURI: string;
    try {
      metadataDataURI = await kusamaHubClient.readContract({
        address: KUSAMA_SVG_ADDRESS,
        abi: KUSAMA_SVG_ABI,
        functionName: "tokenMetadata",
        args: [tokenId, reputationScore, "Kusama Living Profile"],
      }) as string;
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate SVG art",
          details: error.message 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Parse the data URI to extract JSON metadata
    let metadata: any;
    try {
      // The contract returns: data:application/json;base64,<base64-encoded-json>
      if (!metadataDataURI.startsWith("data:application/json;base64,")) {
        throw new Error("Invalid metadata format from contract");
      }
      
      const base64Data = metadataDataURI.replace("data:application/json;base64,", "");
      const jsonString = atob(base64Data);
      metadata = JSON.parse(jsonString);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse metadata JSON",
          details: error.message 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Return parsed metadata with proper Content-Type header
    return new Response(
      JSON.stringify(metadata), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
