import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService, PaymentRequest } from '../services/paymentService';
import { useAuth } from '../hooks/AuthContext';
import { generateUPIQRCode } from '../utils/qrGenerator';

const OpenPayments: React.FC = () => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchPaymentRequests = async () => {
    try {
      setError('');
      const requests = await paymentService.getPaymentRequests();
      setPaymentRequests(requests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentRequests();
    }
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPaymentRequests();
  };

  const handleAcknowledge = async (payment: PaymentRequest) => {
    try {
      setGeneratingQR(true);
      setError('');
      
      // Generate QR code for this payment
      const qrCode = await generateUPIQRCode({
        upiId: payment.upiId,
        payeeName: payment.payeeName,
        amount: payment.amount,
        note: payment.note
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
  };

  const handleMarkAsPaid = () => {
    // TODO: Implement mark as paid functionality
    alert('Payment confirmation will be implemented next!');
    handleCloseQR();
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

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>💸 Open Payment Requests</h1>
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
        These are pending payment requests from other users. You can acknowledge and fulfill them with crypto.
      </p>

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
          <p>Loading payment requests...</p>
        </div>
      ) : paymentRequests.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3>No Open Payment Requests</h3>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            There are currently no pending payment requests to fulfill.
          </p>
          <button
            onClick={handleRefresh}
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
            🔄 Check Again
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {paymentRequests.map((request) => (
            <div
              key={request.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #dee2e6',
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
                    Requested {formatDate(request.createdAt)}
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#ffc107',
                  color: '#000',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  PENDING
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>🆔 UPI ID:</strong>
                  <span style={{ 
                    marginLeft: '0.5rem', 
                    fontFamily: 'monospace', 
                    backgroundColor: '#f8f9fa',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    {request.upiId}
                  </span>
                </div>
                
                {request.payeeName && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>👤 Payee:</strong> {request.payeeName}
                  </div>
                )}
                
                {request.note && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>📝 Note:</strong> {request.note}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  onClick={() => handleAcknowledge(request)}
                  disabled={generatingQR}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: generatingQR ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    cursor: generatingQR ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {generatingQR ? '⏳ Generating QR...' : '✅ I\'ll Pay This'}
                </button>
                
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  Pay with rupees → Get crypto
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {paymentRequests.length > 0 && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem', 
          padding: '1rem',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          border: '1px solid #b3d9ff'
        }}>
          <p style={{ margin: '0', fontSize: '0.9rem', color: '#0066cc' }}>
            💡 <strong>How it works:</strong> Acknowledge a payment → Pay the UPI → 
            Get reimbursed in crypto from the requester
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

            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Amount:</strong> {formatAmount(selectedPayment.amount)}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>UPI ID:</strong> 
                <span style={{ 
                  fontFamily: 'monospace',
                  backgroundColor: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  marginLeft: '0.5rem'
                }}>
                  {selectedPayment.upiId}
                </span>
              </div>
              {selectedPayment.payeeName && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Payee:</strong> {selectedPayment.payeeName}
                </div>
              )}
              {selectedPayment.note && (
                <div>
                  <strong>Note:</strong> {selectedPayment.note}
                </div>
              )}
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
                3. Click "I've Paid" below to confirm
              </p>
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
                onClick={handleMarkAsPaid}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✅ I've Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenPayments;