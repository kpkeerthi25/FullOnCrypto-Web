import React from 'react';
import MetaMaskLogin from '../components/MetaMaskLogin';

const Login: React.FC = () => {
  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '0 auto', 
      padding: '2rem',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          background: 'linear-gradient(45deg, #00d4ff, #5a67d8, #667eea)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          fontWeight: '700'
        }}>
          💎 FullOnCrypto
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666', 
          margin: '0',
          fontWeight: '500'
        }}>
          Connect your wallet to get started
        </p>
      </div>
      
      {/* Wallet Login Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '3rem',
        borderRadius: '20px',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)'
      }}>
        <MetaMaskLogin />
      </div>

      <div style={{ 
        textAlign: 'center',
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: 'rgba(0, 212, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 212, 255, 0.1)'
      }}>
        <p style={{ 
          fontSize: '0.9rem', 
          color: '#666', 
          margin: '0',
          lineHeight: 1.6
        }}>
          🔒 <strong>Secure & Decentralized</strong><br/>
          No passwords, no emails - just your wallet address.<br/>
          Your identity is secured by blockchain cryptography.
        </p>
      </div>
    </div>
  );
};

export default Login;