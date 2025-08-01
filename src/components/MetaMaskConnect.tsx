import React, { useState } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { userService } from '../services/userService';
import { useAuth } from '../hooks/AuthContext';

const MetaMaskConnect: React.FC = () => {
  const { account, isConnected, isConnecting, error, connect, disconnect, isMetaMaskInstalled } = useMetaMask();
  const { user, login } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState('');

  const handleConnect = async () => {
    if (!user) return;

    setConnecting(true);
    setWalletError('');

    try {
      const connectedAccount = await connect();
      if (connectedAccount) {
        // Check if user already has a wallet address
        if (user.ethAddress && user.ethAddress !== connectedAccount) {
          setWalletError(`You can only connect to your registered wallet: ${formatAddress(user.ethAddress)}`);
          disconnect();
          return;
        }

        // Update user's ETH address in the database
        console.log('Updating wallet for user:', user.username, 'with address:', connectedAccount);
        const updatedUser = await userService.updateUserWallet(connectedAccount, user.username);
        login(updatedUser); // Update the user context with new wallet info
        console.log('Wallet address saved to database');
      }
    } catch (error: any) {
      setWalletError(error.message || 'Failed to connect wallet');
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isMetaMaskInstalled) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#fff3cd',
        color: '#856404',
        borderRadius: '4px',
        fontSize: '0.9rem'
      }}>
        ⚠️ Please install MetaMask
      </div>
    );
  }

  // Show connected wallet if it matches user's registered wallet
  if (isConnected && account && user?.ethAddress === account) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          <span style={{ fontSize: '1rem' }}>🦊</span>
          <span>{formatAddress(account)}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>✓ Verified</span>
        </div>
        <button
          onClick={disconnect}
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Show registered wallet address if user has one but not connected
  if (user?.ethAddress && !isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          <span style={{ fontSize: '1rem' }}>🦊</span>
          <span>Registered: {formatAddress(user.ethAddress)}</span>
        </div>
        
        <button
          onClick={handleConnect}
          disabled={connecting}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: connecting ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: connecting ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          <span style={{ fontSize: '1rem' }}>🦊</span>
          {connecting ? 'Connecting...' : 'Connect Registered Wallet'}
        </button>
      </div>
    );
  }

  // Show connect button for users without a registered wallet
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {(error || walletError) && (
        <div style={{
          padding: '0.5rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          fontSize: '0.8rem',
          maxWidth: '250px'
        }}>
          {walletError || error}
        </div>
      )}
      
      <button
        onClick={handleConnect}
        disabled={connecting || isConnecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: (connecting || isConnecting) ? '#ccc' : '#ff6f00',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: (connecting || isConnecting) ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}
      >
        <span style={{ fontSize: '1rem' }}>🦊</span>
        {connecting || isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {!user?.ethAddress && (
        <p style={{ 
          fontSize: '0.7rem', 
          color: '#666', 
          margin: '0',
          textAlign: 'center',
          lineHeight: 1.3
        }}>
          First-time connection will bind this wallet to your account
        </p>
      )}
    </div>
  );
};

export default MetaMaskConnect;