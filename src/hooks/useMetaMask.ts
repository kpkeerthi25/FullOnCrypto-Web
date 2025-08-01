import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useMetaMask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Check if already connected on load
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled()) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking MetaMask connection:', error);
        }
      }
    };

    checkConnection();
  }, [isMetaMaskInstalled]);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return null;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        return accounts[0];
      }
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      if (error.code === 4001) {
        setError('Please connect to MetaMask to continue.');
      } else {
        setError('Failed to connect to MetaMask. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }

    return null;
  }, [isMetaMaskInstalled]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnect();
        } else {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [isMetaMaskInstalled, disconnect]);

  // Sign message for authentication
  const signMessage = useCallback(async (message: string) => {
    if (!isMetaMaskInstalled() || !account) {
      throw new Error('MetaMask not connected');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });
      
      return signature;
    } catch (error: any) {
      console.error('Error signing message:', error);
      if (error.code === 4001) {
        throw new Error('User rejected the request');
      }
      throw new Error('Failed to sign message');
    }
  }, [account, isMetaMaskInstalled]);

  return {
    account,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    signMessage,
    isMetaMaskInstalled: isMetaMaskInstalled()
  };
};