import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import MetaMaskConnect from '../components/MetaMaskConnect';
import CryptoBalances from '../components/CryptoBalances';

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return <div>Redirecting to login...</div>;
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>👤 Profile</h1>
      
      {/* Crypto Balances */}
      <CryptoBalances walletAddress={user.ethAddress || null} />
      
      {/* User Information */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginTop: '0', marginBottom: '1rem' }}>Account Information</h2>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <strong>Username:</strong> {user.username}
          </div>
          
          <div>
            <strong>Account Created:</strong> {formatDate(user.createdAt)}
          </div>
          
          {user.email && (
            <div>
              <strong>Email:</strong> {user.email}
            </div>
          )}
        </div>
      </div>

      {/* Wallet Information */}
      <div style={{
        backgroundColor: '#fff',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginTop: '0', marginBottom: '1.5rem' }}>🦊 Wallet Connection</h2>
        
        {user.ethAddress ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ✅ Wallet Connected
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {user.ethAddress}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
                Your account is linked to this MetaMask wallet
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '6px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⚠️ No Wallet Connected
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              Connect your MetaMask wallet to enable crypto features
            </div>
          </div>
        )}
        
        <MetaMaskConnect />
      </div>

      {/* Account Features */}
      <div style={{
        backgroundColor: '#e7f3ff',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ marginTop: '0', marginBottom: '1rem' }}>🚀 Account Features</h3>
        
        <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📱</span>
            <span>Scan UPI QR codes to create payment requests</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💸</span>
            <span>View and fulfill open payment requests</span>
          </div>
          
          {user.ethAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔗</span>
              <span><strong>Crypto settlements enabled</strong> - Pay with crypto, get rupees</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}>
              <span>🔗</span>
              <span>Crypto settlements (connect wallet to enable)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;