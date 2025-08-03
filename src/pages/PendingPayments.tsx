import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractService, FormattedPaymentRequest } from '../services/contractService';
import { useAuth } from '../hooks/AuthContext';
import { generateUPIQRCode } from '../utils/qrGenerator';
import { priceService } from '../services/priceService';
import { PLATFORM_CONFIG } from '../config/platform';

const PendingPayments: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<FormattedPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FormattedPaymentRequest | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentUserAddress, setCurrentUserAddress] = useState<string>('');
  const [ethPrice, setEthPrice] = useState<number>(200000); // Default fallback
  const [daiPrice, setDaiPrice] = useState<number>(83); // Default fallback (~1 USD)
  const [transactionNumber, setTransactionNumber] = useState('');
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Initialize wallet connection
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        await contractService.initialize();
        const address = await contractService.getCurrentUserAddress();
        setCurrentUserAddress(address);
        setWalletConnected(true);
      } catch (err: any) {
        setError(err.message || 'Failed to connect wallet');
        setWalletConnected(false);
      }
    };

    if (isAuthenticated) {
      initializeWallet();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchPendingRequests = async () => {
    try {
      setError('');
      // Get all committed requests by the current user
      const requests = await contractService.getPayerCommittedRequests(currentUserAddress);
      setPendingRequests(requests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (walletConnected && currentUserAddress) {
      fetchPendingRequests();
      fetchETHPrice();
      fetchDAIPrice();
    }
  }, [walletConnected, currentUserAddress]);

  const fetchETHPrice = async () => {
    try {
      const price = await priceService.getETHPriceInINR();
      setEthPrice(price);
    } catch (error) {
      console.error('Failed to fetch ETH price:', error);
      // ethPrice will remain at fallback value
    }
  };

  const fetchDAIPrice = async () => {
    try {
      const price = await priceService.getDAIPriceInINR();
      setDaiPrice(price);
    } catch (error) {
      console.error('Failed to fetch DAI price:', error);
      // daiPrice will remain at fallback value
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingRequests();
    fetchETHPrice(); // Also refresh ETH price
    fetchDAIPrice(); // Also refresh DAI price
  };

  const handleShowQR = async (payment: FormattedPaymentRequest) => {
    try {
      setGeneratingQR(true);
      setError('');
      
      // Generate QR code for this payment
      const qrCode = await generateUPIQRCode({
        upiId: payment.upiId,
        payeeName: payment.payeeName,
        amount: payment.amount,
        note: payment.note,
        merchantCode: PLATFORM_CONFIG.MERCHANT_CODE
      });
      
      setSelectedPayment(payment);
      setQrCodeDataURL(qrCode);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleCloseQR = () => {
    setSelectedPayment(null);
    setQrCodeDataURL(null);
    setTransactionNumber('');
  };

  const handleFulfillPayment = async () => {
    if (!selectedPayment) return;
    
    // Validate transaction number
    if (!transactionNumber.trim()) {
      setError('Please enter the 12-digit UPI transaction number');
      return;
    }
    
    if (!/^\d{12}$/.test(transactionNumber.trim())) {
      setError('Transaction number must be exactly 12 digits');
      return;
    }
    
    try {
      setFulfilling(true);
      setError('');
      
      // Fulfill the payment on blockchain with transaction number
      const fulfillTx = await contractService.fulfillPayment(selectedPayment.id, transactionNumber.trim());
      await fulfillTx.wait();
      
      // Close the QR modal
      handleCloseQR();
      
      // Refresh the pending requests to show updated status
      fetchPendingRequests();
      
      alert(`Payment fulfilled successfully! Transaction Number: ${transactionNumber.trim()}\nYou should receive the crypto in your wallet.`);
    } catch (err: any) {
      setError(err.message || 'Failed to fulfill payment');
    } finally {
      setFulfilling(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getETHPriceInINR = (ethAmount: number) => {
    return priceService.calculateETHValueInINR(ethAmount, ethPrice);
  };

  const getDAIPriceInINR = (daiAmount: number) => {
    return priceService.calculateDAIValueInINR(daiAmount, daiPrice);
  };

  const getTotalValueInINR = (request: FormattedPaymentRequest) => {
    const daiValueINR = getDAIPriceInINR(request.daiAmount);
    const ethValueINR = getETHPriceInINR(request.payerFee);
    return daiValueINR + ethValueINR;
  };

  const getTimeRemaining = (payment: FormattedPaymentRequest) => {
    // Commitment timeout is 5 minutes (300 seconds) from contract
    const commitmentTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // If no committedAt timestamp, this shouldn't be in pending payments
    if (!payment.committedAt) {
      return 'No Commitment';
    }
    
    // Use the actual committedAt timestamp from the contract
    const committedTime = new Date(payment.committedAt).getTime(); 
    const expiryTime = committedTime + commitmentTimeout;
    const now = Date.now();
    const remaining = expiryTime - now;
    
    if (remaining <= 0) {
      return 'Expired';
    }
    
    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  if (!walletConnected) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <h1>🔗 Connect Your Wallet</h1>
        <p>Please connect your MetaMask wallet to view your pending payments.</p>
        {error && (
          <div style={{ 
            color: 'white', 
            backgroundColor: '#dc3545', 
            padding: '1rem', 
            borderRadius: '4px', 
            marginTop: '1rem' 
          }}>
            {error}
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>⏳ My Pending Payments</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: refreshing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: refreshing ? 'not-allowed' : 'pointer'
          }}
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <p style={{ marginBottom: '2rem', color: '#666' }}>
        These are payment requests you've committed to. Complete the UPI payment and fulfill them to receive your crypto rewards!
      </p>
      
      {currentUserAddress && (
        <div style={{ 
          backgroundColor: '#e7f3ff', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '2rem',
          fontSize: '0.9rem'
        }}>
          <strong>🔗 Connected Wallet:</strong> {currentUserAddress.slice(0, 6)}...{currentUserAddress.slice(-4)}
        </div>
      )}

      {error && (
        <div style={{ 
          color: 'white', 
          backgroundColor: '#dc3545', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '2rem' 
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading your pending payments...</p>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3>No Pending Payments</h3>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            You haven't committed to any payment requests yet.
          </p>
          <button
            onClick={() => navigate('/open-payments')}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔍 Find Payments to Fulfill
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {pendingRequests.map((request) => {
            const timeRemaining = getTimeRemaining(request);
            const isExpired = timeRemaining === 'Expired';
            
            return (
              <div
                key={request.id}
                style={{
                  backgroundColor: '#fff',
                  border: `1px solid ${isExpired ? '#dc3545' : '#ffc107'}`,
                  borderRadius: '8px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>
                      {formatAmount(request.amount)}
                    </h3>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                      {request.committedAt ? `Committed ${formatDate(request.committedAt)}` : `Created ${formatDate(request.createdAt)}`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      backgroundColor: isExpired ? '#dc3545' : '#ffc107',
                      color: isExpired ? 'white' : '#000',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '0.5rem'
                    }}>
                      {isExpired ? 'EXPIRED' : 'COMMITTED'}
                    </span>
                    {!isExpired && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#666',
                        fontFamily: 'monospace'
                      }}>
                        ⏰ {timeRemaining}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem', 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#666', 
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      💰 Pay via UPI
                    </div>
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      color: '#28a745' 
                    }}>
                      {formatAmount(request.amount)}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#666', 
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      🪙 You'll Get
                    </div>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: 'bold', 
                      color: '#0066cc',
                      lineHeight: '1.2'
                    }}>
                      {request.daiAmount.toFixed(4)} DAI + {request.payerFee.toFixed(6)} ETH
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#155724',
                        fontWeight: 'bold',
                        marginTop: '0.25rem'
                      }}>
                        Total: ≈ ₹{getTotalValueInINR(request).toFixed(0)}
                      </div>
                      {request.payerFee > 0 && (
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: '#6c757d',
                          fontWeight: 'normal',
                          fontStyle: 'italic',
                          marginTop: '0.25rem'
                        }}>
                          (₹{getDAIPriceInINR(request.daiAmount).toFixed(0)} DAI + ₹{getETHPriceInINR(request.payerFee).toFixed(0)} ETH)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requester Info */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>👤 Requester:</strong>
                    <span style={{ 
                      marginLeft: '0.5rem', 
                      fontFamily: 'monospace', 
                      backgroundColor: '#f8f9fa',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}>
                      {request.requester.slice(0, 6)}...{request.requester.slice(-4)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleShowQR(request)}
                    disabled={generatingQR || isExpired}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: isExpired ? '#ccc' : (generatingQR ? '#ccc' : '#007bff'),
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (generatingQR || isExpired) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {generatingQR ? '⏳ Generating...' : (isExpired ? '❌ Expired' : '📱 Show QR Code')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      {pendingRequests.length > 0 && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem', 
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{ margin: '0', fontSize: '0.9rem', color: '#856404' }}>
            ⚠️ <strong>Important:</strong> You have 5 minutes from commitment to complete each payment. 
            After that, the commitment expires and others can fulfill the request.
          </p>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedPayment && qrCodeDataURL && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={handleCloseQR}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>

            <h2 style={{ marginTop: '0', marginBottom: '1.5rem', color: '#28a745' }}>
              📱 Scan to Pay
            </h2>

            {/* Payment Summary */}
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#666', 
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    💰 Pay via UPI
                  </div>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: '#28a745' 
                  }}>
                    {formatAmount(selectedPayment.amount)}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#666', 
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    🪙 You'll Get
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    color: '#0066cc',
                    lineHeight: '1.2'
                  }}>
                    {selectedPayment.daiAmount.toFixed(4)} DAI + {selectedPayment.payerFee.toFixed(6)} ETH
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#155724',
                      fontWeight: 'bold',
                      marginTop: '0.25rem'
                    }}>
                      Total: ≈ ₹{getTotalValueInINR(selectedPayment).toFixed(0)}
                    </div>
                    {selectedPayment.payerFee > 0 && (
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: '#6c757d',
                        fontWeight: 'normal',
                        fontStyle: 'italic',
                        marginTop: '0.25rem'
                      }}>
                        (₹{getDAIPriceInINR(selectedPayment.daiAmount).toFixed(0)} DAI + ₹{getETHPriceInINR(selectedPayment.payerFee).toFixed(0)} ETH)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ 
                borderTop: '1px solid #dee2e6',
                paddingTop: '1rem'
              }}>
                <div>
                  <strong>👤 Requester:</strong>
                  <span style={{ 
                    fontFamily: 'monospace',
                    backgroundColor: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    marginLeft: '0.5rem',
                    border: '1px solid #e9ecef'
                  }}>
                    {selectedPayment.requester.slice(0, 6)}...{selectedPayment.requester.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <img 
                src={qrCodeDataURL} 
                alt="UPI Payment QR Code"
                style={{
                  maxWidth: '300px',
                  width: '100%',
                  height: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div style={{ 
              backgroundColor: '#e7f3ff',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              color: '#0066cc'
            }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>Instructions:</strong>
              </p>
              <p style={{ margin: '0' }}>
                1. Scan this QR code with any UPI app<br/>
                2. Complete the payment<br/>
                3. Enter the 12-digit transaction number below<br/>
                4. Click "I've Paid" to get your crypto
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="transactionNumber" style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                UPI Transaction Number (12 digits):
              </label>
              <input
                type="text"
                id="transactionNumber"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="Enter 12-digit UPI transaction number"
                maxLength={12}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              />
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                marginTop: '0.5rem' 
              }}>
                Find this number in your UPI app after successful payment
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleCloseQR}
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
                Cancel
              </button>
              
              <button
                onClick={handleFulfillPayment}
                disabled={fulfilling || !/^\d{12}$/.test(transactionNumber.trim())}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: (fulfilling || !/^\d{12}$/.test(transactionNumber.trim())) ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (fulfilling || !/^\d{12}$/.test(transactionNumber.trim())) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {fulfilling ? '⏳ Fulfilling...' : '✅ I\'ve Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingPayments;