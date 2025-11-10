import { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ReputationCard_ABI } from '@/config/ReputationCard.abi';
import type { ReputationCard } from '@/types/reputationCard';
import { MintingModeBadge } from '@/components/shared/MintingModeBadge';
import { MintingMode } from '@/types/collectible';
import { generateCardOGMetadata } from '@/utils/openGraphUtils';
import { useOpenGraph } from '@/hooks/useOpenGraph';

export default function VerifyCard() {
  const [, params] = useRoute('/verify/:chainId/:contractAddress/:cardId');
  const [card, setCard] = useState<ReputationCard | null>(null);
  const [recipient, setRecipient] = useState<string>('');
  const [mintingMode, setMintingMode] = useState<MintingMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'invalid' | 'pending'>('pending');

  // Generate Open Graph metadata when card is loaded
  const ogMetadata = card && params ? generateCardOGMetadata(
    card,
    `${window.location.origin}/verify/${params.chainId}/${params.contractAddress}/${params.cardId}`,
    params.chainId
  ) : null;

  // Update meta tags
  useOpenGraph(ogMetadata);

  useEffect(() => {
    const fetchCardData = async () => {
      if (!params?.chainId || !params?.contractAddress || !params?.cardId) {
        setError('Invalid verification URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get RPC URL for the chain
        const rpcUrls: Record<string, string> = {
          '31337': 'http://127.0.0.1:8545',
          '1284': 'https://rpc.api.moonbeam.network',
          '1287': 'https://rpc.api.moonbase.moonbeam.network',
          // Add more chains as needed
        };

        const rpcUrl = rpcUrls[params.chainId];
        if (!rpcUrl) {
          throw new Error(`Unsupported chain ID: ${params.chainId}`);
        }

        // Create provider (no wallet needed for read-only operations)
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Create contract instance
        const contract = new ethers.Contract(
          params.contractAddress,
          ReputationCard_ABI,
          provider
        );

        // Fetch card data
        const cardId = BigInt(params.cardId);
        const cardData = await contract.getCard(cardId);

        // Fetch minting mode
        let mode: MintingMode = MintingMode.DIRECT;
        try {
          const modeValue = await contract.getCardMintingMode(cardId);
          const modeNum = Number(modeValue);
          mode = modeNum === 1 ? MintingMode.COLLECTIBLE : MintingMode.DIRECT;
        } catch (err) {
          console.warn('Could not fetch minting mode, defaulting to DIRECT');
        }

        // Fetch metadata if URI exists
        let metadata = null;
        if (cardData.metadataURI) {
          try {
            const metadataUrl = cardData.metadataURI.startsWith('ipfs://')
              ? `https://${import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${cardData.metadataURI.replace('ipfs://', '')}`
              : cardData.metadataURI;
            
            const response = await fetch(metadataUrl);
            if (response.ok) {
              metadata = await response.json();
            }
          } catch (err) {
            console.warn('Could not fetch metadata:', err);
          }
        }

        // Transform to ReputationCard type
        const transformedCard: ReputationCard = {
          id: Number(cardId),
          cardId: Number(cardId),
          profileId: 0, // Not available in verification context
          category: cardData.category || 'Unknown',
          description: cardData.description || '',
          value: Number(cardData.value),
          issuer: cardData.issuer,
          issuedAt: Number(cardData.issuedAt),
          isValid: cardData.isValid,
          metadata: metadata || undefined
        };

        setCard(transformedCard);
        setRecipient(cardData.recipient);
        setMintingMode(mode);
        setVerificationStatus(cardData.isValid ? 'verified' : 'invalid');
      } catch (err: any) {
        console.error('Error fetching card data:', err);
        setError(err.message || 'Failed to verify card');
        setVerificationStatus('invalid');
      } finally {
        setLoading(false);
      }
    };

    fetchCardData();
  }, [params]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      education: 'bg-blue-500',
      professional: 'bg-purple-500',
      achievement: 'bg-green-500',
      community: 'bg-pink-500',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  const getImageUrl = (imageUri?: string) => {
    if (!imageUri) return null;
    
    if (imageUri.startsWith('ipfs://')) {
      const hash = imageUri.replace('ipfs://', '');
      const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';
      return `https://${gateway}/ipfs/${hash}`;
    }
    
    return imageUri;
  };

  const getBlockExplorerUrl = () => {
    if (!params?.chainId || !params?.contractAddress || !params?.cardId) return null;
    
    const explorers: Record<string, string | null> = {
      '31337': null, // Local network
      '1284': 'https://moonscan.io',
      '1287': 'https://moonbase.moonscan.io',
    };

    const baseUrl = explorers[params.chainId];
    if (!baseUrl) return null;

    return `${baseUrl}/token/${params.contractAddress}?a=${params.cardId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Verifying card on blockchain...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                <p className="text-muted-foreground mb-6 text-center">
                  {error || 'Could not verify this card. It may not exist or the URL is invalid.'}
                </p>
                <Button asChild>
                  <Link href="/">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to TrustFi
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl(card.metadata?.image);
  const title = card.metadata?.title || card.description || 'Reputation Card';
  const description = card.metadata?.description || card.description;
  const blockExplorerUrl = getBlockExplorerUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Shield className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">TrustFi</span>
              </div>
            </Link>
            <Badge 
              variant={verificationStatus === 'verified' ? 'default' : 'destructive'}
              className="gap-2"
            >
              {verificationStatus === 'verified' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Verified on Blockchain
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Invalid Card
                </>
              )}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Verification Banner */}
          <Card className="mb-8 border-2 border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">Blockchain Verified Credential</h2>
                  <p className="text-sm text-muted-foreground">
                    This reputation card has been verified on the blockchain and is cryptographically secure.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Display */}
          <Card>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left: Image */}
                <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                      style={{ minHeight: '400px' }}
                    />
                  ) : (
                    <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                      <Shield className="w-32 h-32 text-primary/30" />
                    </div>
                  )}
                </div>

                {/* Right: Details */}
                <div className="p-8 space-y-6">
                  <div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <Badge className={`${getCategoryColor(card.category)} text-white`}>
                        {card.metadata?.category || card.category}
                      </Badge>
                      {mintingMode !== null && (
                        <MintingModeBadge mintingMode={mintingMode} size="sm" />
                      )}
                      {card.isValid ? (
                        <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-red-500 text-red-600">
                          <XCircle className="w-3 h-3" />
                          Revoked
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{title}</h1>
                    {description && (
                      <p className="text-muted-foreground leading-relaxed">{description}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Reputation Value */}
                  <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="font-medium">Reputation Value</span>
                      </div>
                      <span className="text-4xl font-bold text-primary">+{card.value}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-muted-foreground">Verification Details</h3>
                    
                    {/* Issuer */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Issued by</span>
                      </div>
                      <div className="text-right">
                        {card.metadata?.issuerName ? (
                          <div>
                            <p className="font-medium">{card.metadata.issuerName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {formatAddress(card.issuer)}
                            </p>
                          </div>
                        ) : (
                          <p className="font-mono text-sm">{formatAddress(card.issuer)}</p>
                        )}
                      </div>
                    </div>

                    {/* Recipient */}
                    {recipient && (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Recipient</span>
                        </div>
                        <p className="font-mono text-sm">{formatAddress(recipient)}</p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {mintingMode === MintingMode.COLLECTIBLE ? 'Claimed on' : 'Issued on'}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-right">{formatDate(card.issuedAt)}</p>
                    </div>

                    {/* Card ID */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Card ID</span>
                      </div>
                      <p className="font-medium text-sm">#{card.id}</p>
                    </div>

                    {/* Chain ID */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Chain</span>
                      </div>
                      <p className="font-medium text-sm">
                        {params?.chainId === '1284' ? 'Moonbeam' : 
                         params?.chainId === '1287' ? 'Moonbase Alpha' : 
                         params?.chainId === '31337' ? 'Local Network' : 
                         `Chain ${params?.chainId}`}
                      </p>
                    </div>
                  </div>

                  {/* Attributes */}
                  {(() => {
                    const customAttributes = card.metadata?.attributes?.filter(attr => 
                      attr.trait_type !== 'Issuer' && 
                      attr.trait_type !== 'Issued At' &&
                      attr.trait_type !== 'Reputation Value'
                    ) || [];
                    
                    return customAttributes.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="font-semibold text-muted-foreground">Attributes</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {customAttributes.map((attr, index) => (
                              <div key={index} className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">{attr.trait_type}</p>
                                <p className="font-semibold text-sm">{attr.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Block Explorer Link */}
                  {blockExplorerUrl && (
                    <>
                      <Separator />
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        asChild
                      >
                        <a
                          href={blockExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Block Explorer
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="mt-8 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Get Your Own Reputation Cards</h3>
              <p className="text-muted-foreground mb-6">
                Join TrustFi to build your on-chain reputation and collect verifiable credentials
              </p>
              <Button size="lg" asChild>
                <Link href="/">
                  <Shield className="w-5 h-5 mr-2" />
                  Explore TrustFi
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 TrustFi. Building trust through blockchain verification.</p>
        </div>
      </footer>
    </div>
  );
}
