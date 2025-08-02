import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMetaMask } from '../hooks/useMetaMask';
import { useAuth } from '../hooks/AuthContext';

interface MetaMaskLoginProps {
  onSuccess?: () => void;
}

const MetaMaskLogin: React.FC<MetaMaskLoginProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { connect, signMessage, isMetaMaskInstalled } = useMetaMask();
  const { loginWithWallet } = useAuth();
  const navigate = useNavigate();

  const generateLoginMessage = (address: string) => {
    const timestamp = Date.now();
    return `Welcome to FullOnCrypto!\n\nPlease sign this message to authenticate your wallet.\n\nWallet: ${address}\nTimestamp: ${timestamp}`;
  };

  const handleWalletLogin = async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Connect wallet
      const account = await connect();
      if (!account) {
        throw new Error('Failed to connect wallet');
      }

      // Generate message to sign
      const message = generateLoginMessage(account);
      
      // Sign message for verification (optional - for security)
      await signMessage(message);

      // Login with wallet address only
      console.log('Wallet login with address:', account);
      loginWithWallet(account);
      navigate('/');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with wallet');
    } finally {
      setLoading(false);
    }
  };


  if (!isMetaMaskInstalled) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fff3cd',
        color: '#856404',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #ffeaa7'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🦊</div>
        <p style={{ margin: '0 0 1rem 0' }}>
          MetaMask is required for wallet login
        </p>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#ff6f00',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          Install MetaMask
        </a>
      </div>
    );
  }


  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🦊</div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Login with MetaMask</h3>
        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
          Connect your wallet to sign in securely
        </p>
      </div>

      {error && (
        <div style={{
          color: 'white',
          backgroundColor: '#dc3545',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleWalletLogin}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1rem',
          backgroundColor: loading ? '#ccc' : '#ff6f00',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🦊</span>
        {loading ? 'Connecting Wallet...' : 'Connect & Sign In'}
      </button>

      <p style={{ 
        fontSize: '0.8rem', 
        color: '#666', 
        marginTop: '1rem',
        lineHeight: 1.4
      }}>
        By connecting your wallet, you'll be asked to sign a message to prove ownership. 
        No transaction fees required.
      </p>
    </div>
  );
};

export default MetaMaskLogin;