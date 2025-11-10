import { useEffect } from 'react';
import { updateMetaTags, resetMetaTags, type OpenGraphMetadata } from '@/utils/openGraphUtils';

/**
 * Hook to manage Open Graph meta tags for a page
 * Automatically resets tags when component unmounts
 */
export function useOpenGraph(metadata: OpenGraphMetadata | null) {
  useEffect(() => {
    if (metadata) {
      updateMetaTags(metadata);
    }

    // Cleanup: reset to default meta tags when component unmounts
    return () => {
      resetMetaTags();
    };
  }, [metadata]);
}
