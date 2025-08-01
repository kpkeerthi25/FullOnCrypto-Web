import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMetaMask } from '../hooks/useMetaMask';
import { userService } from '../services/userService';
import { useAuth } from '../hooks/AuthContext';

interface MetaMaskLoginProps {
  onSuccess?: () => void;
}

const MetaMaskLogin: React.FC<MetaMaskLoginProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [username, setUsername] = useState('');
  
  const { connect, signMessage, isMetaMaskInstalled } = useMetaMask();
  const { login } = useAuth();
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
      
      // Sign message
      const signature = await signMessage(message);

      try {
        // Try to login with existing wallet
        console.log('Attempting wallet login with:', { account, signature: signature.slice(0, 10) + '...' });
        const user = await userService.loginWithWallet(account, signature);
        console.log('Wallet login successful:', user);
        login(user);
        navigate('/');
        onSuccess?.();
      } catch (loginError: any) {
        console.error('Wallet login error:', loginError);
        // If login fails, user doesn't exist - show registration
        if (loginError.message.includes('not found') || loginError.message.includes('User not found')) {
          console.log('User not found, showing registration form');
          setShowUsernameInput(true);
          setError('');
        } else {
          throw loginError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletRegister = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Connect wallet (should already be connected)
      const account = await connect();
      if (!account) {
        throw new Error('Wallet not connected');
      }

      // Generate and sign message
      const message = generateLoginMessage(account);
      const signature = await signMessage(message);

      // Register new user with wallet
      const user = await userService.registerWithWallet(account, signature, username.trim());
      login(user);
      navigate('/');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to register with wallet');
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

  if (showUsernameInput) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Welcome to FullOnCrypto!</h3>
          <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
            Your wallet is new here. Please choose a username to get started.
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleWalletRegister()}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => {
              setShowUsernameInput(false);
              setUsername('');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
          
          <button
            onClick={handleWalletRegister}
            disabled={loading || !username.trim()}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
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