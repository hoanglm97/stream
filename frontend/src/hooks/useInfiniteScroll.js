import { useState, useEffect, useCallback } from 'react';

const useInfiniteScroll = (fetchMore, hasMore) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isLoading || !hasMore) {
      return;
    }
    
    setIsLoading(true);
    fetchMore().finally(() => setIsLoading(false));
  }, [fetchMore, hasMore, isLoading]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { isLoading };
};

export default useInfiniteScroll;