import { useState, useEffect, useCallback } from 'react';
import { balanceService, TokenBalance } from '../services/balanceService';

export const useTokenBalances = (walletAddress: string | null) => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) {
      setBalances([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching token balances for:', walletAddress, 'on Base L2');
      const tokenBalances = await balanceService.getTokenBalances(walletAddress);
      setBalances(tokenBalances);
      setLastFetch(new Date());
      console.log('Fetched', tokenBalances.length, 'token balances');
    } catch (err: any) {
      console.error('Failed to fetch token balances:', err);
      setError(err.message || 'Failed to fetch balances');
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch balances when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchBalances();
    } else {
      setBalances([]);
      setError(null);
    }
  }, [walletAddress, fetchBalances]);

  // Auto-refresh every 30 seconds if wallet is connected
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(() => {
      fetchBalances();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [walletAddress, fetchBalances]);

  const refreshBalances = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    lastFetch,
    refreshBalances
  };
};