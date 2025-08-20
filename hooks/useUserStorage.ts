'use client';

import { useState, useEffect, useCallback } from 'react';

export const useUserStorage = () => {
  const [totalStorage, setTotalStorage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStorage = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/storage');
      if (!response.ok) {
        throw new Error('Failed to fetch storage data');
      }
      const data = await response.json();
      setTotalStorage(data.totalStorage || 0);
    } catch (error) {
      console.error(error);
      setTotalStorage(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  // Return the state and a function to manually trigger a refresh
  return { totalStorage, isLoading, refreshStorage: fetchStorage };
};