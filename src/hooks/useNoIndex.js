import { useEffect } from 'react';

/**
 * Hook to add noindex meta tag to prevent search engines from indexing the page
 * Useful for private/functional pages like login, signup, etc.
 */
export const useNoIndex = () => {
  useEffect(() => {
    // Create or update noindex meta tag
    let metaTag = document.querySelector('meta[name="robots"]');
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'robots';
      document.head.appendChild(metaTag);
    }
    
    metaTag.content = 'noindex, follow';
    
    // Cleanup: revert to index on component unmount
    return () => {
      if (metaTag) {
        metaTag.content = 'index, follow';
      }
    };
  }, []);
};
