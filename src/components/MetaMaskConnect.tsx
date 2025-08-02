import React from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { useAuth } from '../hooks/AuthContext';

const MetaMaskConnect: React.FC = () => {
  const { account, isConnected, isConnecting, error, connect, disconnect, isMetaMaskInstalled } = useMetaMask();
  const { user } = useAuth();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isMetaMaskInstalled) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(255, 243, 205, 0.1)',
        color: '#ffa726',
        borderRadius: '12px',
        fontSize: '0.9rem',
        border: '1px solid rgba(255, 167, 38, 0.2)'
      }}>
        🦊 Please install MetaMask
      </div>
    );
  }

  // Show connected wallet status
  if (isConnected && account) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          color: '#00d4ff',
          borderRadius: '12px',
          fontSize: '0.9rem',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          <span style={{ fontSize: '1.1rem' }}>🦊</span>
          <span style={{ fontWeight: '600' }}>{formatAddress(account)}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>✓</span>
        </div>
        <button
          onClick={disconnect}
          style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#e2e8f0',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Show connect button
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          color: '#ff6b6b',
          borderRadius: '12px',
          fontSize: '0.8rem',
          border: '1px solid rgba(255, 59, 48, 0.2)'
        }}>
          {error}
        </div>
      )}
      
      <button
        onClick={connect}
        disabled={isConnecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: isConnecting ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #ff6f00, #ff8f00)',
          color: 'white',
          border: '1px solid rgba(255, 111, 0, 0.3)',
          borderRadius: '12px',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
          fontWeight: '600',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: isConnecting ? 'none' : '0 4px 15px rgba(255, 111, 0, 0.3)'
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>🦊</span>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default MetaMaskConnect;