import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>FullOnCrypto</h1>
      
      {isAuthenticated ? (
        <div>
          <h2>Welcome back! 👋</h2>
          <p style={{ fontSize: '1rem', color: '#666', margin: '0.5rem 0' }}>
            Connected wallet: {user?.ethAddress ? `${user.ethAddress.slice(0, 6)}...${user.ethAddress.slice(-4)}` : 'Not connected'}
          </p>
          <p>Ready to scan QR codes and make crypto payments?</p>
          
          <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link 
              to="/scanner" 
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                textAlign: 'center',
                minWidth: '160px'
              }}
            >
              🔍 Scan QR Code
            </Link>
            
            <Link 
              to="/open-payments" 
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                textAlign: 'center',
                minWidth: '160px'
              }}
            >
              💸 Open Payments
            </Link>
            
            <Link 
              to="/profile" 
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                backgroundColor: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                textAlign: 'center',
                minWidth: '160px'
              }}
            >
              👤 Profile
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <h2>Welcome to FullOnCrypto! 🚀</h2>
          <p>Scan QR codes to make crypto payments in rupees.</p>
          <p>Connect your wallet to get started with crypto payments.</p>
          
          <div style={{ marginTop: '2rem' }}>
            <Link 
              to="/login" 
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem'
              }}
            >
              🔗 Connect Wallet
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;