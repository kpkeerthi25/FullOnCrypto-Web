import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import CryptoBalances from '../components/CryptoBalances';
import { contractService, FormattedPaymentRequest } from '../services/contractService';
import { priceService } from '../services/priceService';

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [openRequests, setOpenRequests] = useState<FormattedPaymentRequest[]>([]);
  const [fulfilledRequests, setFulfilledRequests] = useState<FormattedPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [ethPrice, setEthPrice] = useState<number>(200000);
  const [daiPrice, setDaiPrice] = useState<number>(83);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        await contractService.initialize();
        await fetchUserRequests();
        await fetchPrices();
      } catch (err: any) {
        console.error('Failed to initialize wallet:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.ethAddress) {
      initializeWallet();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchUserRequests = async () => {
    if (!user?.ethAddress) return;

    try {
      // Get all requests created by this user (including fulfilled ones)
      const userRequests = await contractService.getUserRequests(user.ethAddress);
      
      // Separate open and fulfilled requests
      const open = userRequests.filter((req: FormattedPaymentRequest) => 
        req.status === 'pending' || req.status === 'acknowledged'
      );
      const fulfilled = userRequests.filter((req: FormattedPaymentRequest) => 
        req.status === 'settled'
      );
      
      setOpenRequests(open);
      setFulfilledRequests(fulfilled);
    } catch (error) {
      console.error('Failed to fetch user requests:', error);
    }
  };

  const fetchPrices = async () => {
    try {
      const ethPriceResult = await priceService.getETHPriceInINR();
      const daiPriceResult = await priceService.getDAIPriceInINR();
      setEthPrice(ethPriceResult);
      setDaiPrice(daiPriceResult);
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return <div>Redirecting to login...</div>;
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getTotalValueInINR = (request: FormattedPaymentRequest) => {
    const daiValueINR = priceService.calculateDAIValueInINR(request.daiAmount, daiPrice);
    const ethValueINR = priceService.calculateETHValueInINR(request.payerFee, ethPrice);
    return daiValueINR + ethValueINR;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: '20px',
        color: 'white'
      }}>
        <div style={{ fontSize: '3rem' }}>👤</div>
        <div>
          <h1 style={{ margin: '0', fontSize: '2rem', fontWeight: '700' }}>Profile</h1>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '1rem',
            opacity: 0.8,
            marginTop: '0.5rem'
          }}>
            {user.ethAddress ? `${user.ethAddress.slice(0, 8)}...${user.ethAddress.slice(-6)}` : 'No wallet connected'}
          </div>
        </div>
      </div>
      
      {/* Crypto Balances */}
      <CryptoBalances walletAddress={user.ethAddress || null} />
      
      {/* Open Payment Requests */}
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        border: '1px solid #e9ecef',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ 
          margin: '0 0 1.5rem 0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: '#1a1a2e'
        }}>
          🌟 Your Open Requests ({openRequests.length})
        </h2>
        
        {openRequests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            color: '#666'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <p style={{ margin: '0', fontSize: '1.1rem' }}>No open payment requests</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Create your first request using the Scanner</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {openRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745', fontSize: '1.3rem' }}>
                      {formatAmount(request.amount)}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Created {formatDate(request.createdAt)}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: request.status === 'pending' ? '#fff3cd' : '#d1ecf1',
                    color: request.status === 'pending' ? '#856404' : '#0c5460',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {request.status === 'pending' ? '🟡 PENDING' : '⚡ COMMITTED'}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem',
                  fontSize: '0.9rem'
                }}>
                  <div>
                    <strong>Crypto Deposit:</strong><br/>
                    {request.daiAmount.toFixed(4)} DAI + {request.payerFee.toFixed(6)} ETH
                  </div>
                  <div>
                    <strong>Total Value:</strong><br/>
                    ≈ ₹{getTotalValueInINR(request).toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fulfilled Payment Requests */}
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        border: '1px solid #e9ecef',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ 
          margin: '0 0 1.5rem 0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: '#1a1a2e'
        }}>
          ✅ Fulfilled Requests ({fulfilledRequests.length})
        </h2>
        
        {fulfilledRequests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            color: '#666'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <p style={{ margin: '0', fontSize: '1.1rem' }}>No completed requests yet</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Your fulfilled requests will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {fulfilledRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#d4edda',
                  borderRadius: '12px',
                  border: '1px solid #c3e6cb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#155724', fontSize: '1.3rem' }}>
                      {formatAmount(request.amount)}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: '#155724', opacity: 0.8 }}>
                      Completed {formatDate(request.createdAt)}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    ✅ COMPLETED
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem',
                  fontSize: '0.9rem',
                  color: '#155724'
                }}>
                  <div>
                    <strong>Crypto Received:</strong><br/>
                    {request.daiAmount.toFixed(4)} DAI + {request.payerFee.toFixed(6)} ETH
                  </div>
                  <div>
                    <strong>Total Value:</strong><br/>
                    ≈ ₹{getTotalValueInINR(request).toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;