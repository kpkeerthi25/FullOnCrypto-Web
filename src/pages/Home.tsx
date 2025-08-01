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
          <h2>Welcome back, {user?.username}! 👋</h2>
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
          <p>Get started by creating an account or logging in.</p>
          
          <div style={{ marginTop: '2rem' }}>
            <Link 
              to="/signup" 
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                marginRight: '1rem'
              }}
            >
              📝 Sign Up
            </Link>
            
            <Link 
              to="/login" 
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem'
              }}
            >
              🔐 Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;