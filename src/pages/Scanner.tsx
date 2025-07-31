import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQRScanner } from '../hooks/useQRScanner';
import { parseUPIQR, isValidUPI, UPIData } from '../utils/upiParser';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../hooks/AuthContext';

const Scanner: React.FC = () => {
  const [scannedData, setScannedData] = useState<UPIData | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { isScanning, error: scanError, startScanning, stopScanning, videoRef } = useQRScanner();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleStartScan = () => {
    setError('');
    setSuccess('');
    setScannedData(null);
    
    startScanning((result) => {
      const upiData = parseUPIQR(result);
      if (upiData && isValidUPI(upiData)) {
        setScannedData(upiData);
        if (upiData.amount) {
          setAmount(upiData.amount);
        }
      } else {
        setError('Invalid UPI QR Code. Please scan a valid UPI payment QR code.');
      }
    });
  };

  const handleSubmitPayment = async () => {
    if (!scannedData || !amount || !user) {
      setError('Please ensure all fields are filled');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await paymentService.createPaymentRequest({
        upiId: scannedData.upiId!,
        amount: amountNum,
        payeeName: scannedData.payeeName,
        note: scannedData.note
      });

      setSuccess('Payment request created successfully! It has been published for others to fulfill.');
      setScannedData(null);
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to create payment request');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setAmount('');
    setError('');
    setSuccess('');
    stopScanning();
  };

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>QR Code Scanner</h1>
      <p>Scan a UPI QR code to create a payment request</p>

      {!scannedData && !success && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                backgroundColor: '#000',
                borderRadius: '8px',
                display: isScanning ? 'block' : 'none'
              }}
              playsInline
              muted
            />
          </div>
          
          {!isScanning && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <button
                onClick={handleStartScan}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                📱 Start Scanning
              </button>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                Hold a QR code steady in front of your camera
              </p>
            </div>
          )}

          {isScanning && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ marginBottom: '1rem', color: '#28a745', fontWeight: 'bold' }}>
                📷 Camera is active - Point at a QR code
              </p>
              <button
                onClick={stopScanning}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Stop Scanning
              </button>
            </div>
          )}
        </div>
      )}

      {scanError && (
        <div style={{ color: 'red', marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          Camera Error: {scanError}
        </div>
      )}

      {scannedData && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h3>📱 Scanned UPI Details</h3>
          <div style={{ marginBottom: '1rem' }}>
            <strong>UPI ID:</strong> {scannedData.upiId}
          </div>
          {scannedData.payeeName && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Payee Name:</strong> {scannedData.payeeName}
            </div>
          )}
          {scannedData.note && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Note:</strong> {scannedData.note}
            </div>
          )}
          
          <div style={{ marginTop: '1.5rem' }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Amount (₹):
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in rupees"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              step="0.01"
              min="0.01"
            />
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleSubmitPayment}
              disabled={loading || !amount}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Request...' : '✅ Create Payment Request'}
            </button>
            
            <button
              onClick={handleReset}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Scan Again
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: 'white', backgroundColor: '#dc3545', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'white', backgroundColor: '#28a745', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {success}
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Scan Another QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;