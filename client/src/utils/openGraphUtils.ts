import type { ReputationCard } from '@/types/reputationCard';

export interface OpenGraphMetadata {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
  siteName?: string;
  // Twitter Card specific
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
}

/**
 * Generate Open Graph metadata for a reputation card
 */
export function generateCardOGMetadata(
  card: ReputationCard,
  verificationUrl: string,
  chainId?: string
): OpenGraphMetadata {
  const title = card.metadata?.title || card.description || 'Reputation Card';
  const description = card.metadata?.description || 
    `A ${card.category} reputation card with a value of +${card.value} on TrustFi`;
  
  // Get image URL
  let image: string | undefined;
  if (card.metadata?.image) {
    if (card.metadata.image.startsWith('ipfs://')) {
      const hash = card.metadata.image.replace('ipfs://', '');
      const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';
      image = `https://${gateway}/ipfs/${hash}`;
    } else {
      image = card.metadata.image;
    }
  }

  const chainName = chainId === '1284' ? 'Moonbeam' : 
                    chainId === '1287' ? 'Moonbase Alpha' : 
                    'Blockchain';

  return {
    title: `${title} | TrustFi`,
    description: `${description} Verified on ${chainName}.`,
    image,
    url: verificationUrl,
    type: 'website',
    siteName: 'TrustFi',
    twitterCard: image ? 'summary_large_image' : 'summary',
    twitterSite: '@TrustFi', // Update with actual Twitter handle
  };
}

/**
 * Update document meta tags with Open Graph data
 */
export function updateMetaTags(metadata: OpenGraphMetadata): void {
  // Update title
  document.title = metadata.title;

  // Helper to set or update meta tag
  const setMetaTag = (property: string, content: string, isName = false) => {
    const attribute = isName ? 'name' : 'property';
    let element = document.querySelector(`meta[${attribute}="${property}"]`);
    
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, property);
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  // Open Graph tags
  setMetaTag('og:title', metadata.title);
  setMetaTag('og:description', metadata.description);
  setMetaTag('og:url', metadata.url);
  
  if (metadata.type) {
    setMetaTag('og:type', metadata.type);
  }
  
  if (metadata.siteName) {
    setMetaTag('og:site_name', metadata.siteName);
  }
  
  if (metadata.image) {
    setMetaTag('og:image', metadata.image);
    setMetaTag('og:image:alt', metadata.title);
  }

  // Twitter Card tags
  if (metadata.twitterCard) {
    setMetaTag('twitter:card', metadata.twitterCard, true);
  }
  
  setMetaTag('twitter:title', metadata.title, true);
  setMetaTag('twitter:description', metadata.description, true);
  
  if (metadata.image) {
    setMetaTag('twitter:image', metadata.image, true);
    setMetaTag('twitter:image:alt', metadata.title, true);
  }
  
  if (metadata.twitterSite) {
    setMetaTag('twitter:site', metadata.twitterSite, true);
  }
  
  if (metadata.twitterCreator) {
    setMetaTag('twitter:creator', metadata.twitterCreator, true);
  }

  // Standard meta description
  setMetaTag('description', metadata.description, true);
}

/**
 * Reset meta tags to default values
 */
export function resetMetaTags(): void {
  document.title = 'TrustFi - Decentralized Reputation Platform';
  
  const defaultDescription = 'Build, verify, and showcase your trustworthiness through blockchain-based credentials. Own your reputation with verifiable NFT credentials.';
  
  const setMetaTag = (property: string, content: string, isName = false) => {
    const attribute = isName ? 'name' : 'property';
    const element = document.querySelector(`meta[${attribute}="${property}"]`);
    if (element) {
      element.setAttribute('content', content);
    }
  };

  setMetaTag('description', defaultDescription, true);
  setMetaTag('og:title', 'TrustFi - Decentralized Reputation Platform');
  setMetaTag('og:description', defaultDescription);
}
