import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQRScanner } from '../hooks/useQRScanner';
import { parseUPIQR, isValidUPI, UPIData } from '../utils/upiParser';
import { paymentService } from '../services/paymentService';
import { contractService } from '../services/contractService';
import { priceService } from '../services/priceService';
import { useAuth } from '../hooks/AuthContext';

const Scanner: React.FC = () => {
  const [scannedData, setScannedData] = useState<UPIData | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentUserAddress, setCurrentUserAddress] = useState<string>('');
  const [daiAmount, setDaiAmount] = useState('');
  const [ethFee, setEthFee] = useState('');
  const [payerReward, setPayerReward] = useState('0.001'); // Default 0.001 ETH reward
  const [daiPrice, setDaiPrice] = useState<number>(83); // Default fallback
  const [platformFee, setPlatformFee] = useState<string>('');
  
  const { isScanning, error: scanError, startScanning, stopScanning, videoRef } = useQRScanner();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Initialize wallet connection
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        await contractService.initialize();
        const address = await contractService.getCurrentUserAddress();
        setCurrentUserAddress(address);
        setWalletConnected(true);
        
        // Get platform fee and DAI price
        const fee = await contractService.getPlatformFee();
        setPlatformFee(fee);
        
        const daiPriceINR = await priceService.getDAIPriceInINR();
        setDaiPrice(daiPriceINR);
      } catch (err: any) {
        setError(err.message || 'Failed to connect wallet');
        setWalletConnected(false);
      }
    };

    if (isAuthenticated) {
      initializeWallet();
    }
  }, [isAuthenticated]);

  // Calculate crypto amounts when amount or payer reward changes
  useEffect(() => {
    if (amount && walletConnected && payerReward) {
      const amountNum = parseFloat(amount);
      const payerRewardNum = parseFloat(payerReward);
      
      if (!isNaN(amountNum) && amountNum > 0 && !isNaN(payerRewardNum) && payerRewardNum >= 0) {
        // Calculate DAI amount (amount in INR / DAI price in INR)
        const daiAmountNum = amountNum / daiPrice;
        setDaiAmount(daiAmountNum.toFixed(6));
        
        // Calculate total ETH fee (platform fee + user-defined payer reward)
        const platformFeeETH = parseFloat(platformFee || '10000') / 1e18; // Convert wei to ETH
        const totalETHFee = platformFeeETH + payerRewardNum;
        setEthFee(totalETHFee.toFixed(6));
      }
    }
  }, [amount, payerReward, walletConnected, daiPrice, platformFee]);

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
    if (!scannedData || !amount || !user || !walletConnected) {
      setError('Please ensure wallet is connected and all fields are filled');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!daiAmount || !ethFee || !payerReward) {
      setError('Failed to calculate crypto amounts');
      return;
    }

    const payerRewardNum = parseFloat(payerReward);
    if (isNaN(payerRewardNum) || payerRewardNum < 0) {
      setError('Please enter a valid payer reward (must be 0 or greater)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create payment request on smart contract first
      console.log('Creating payment request on smart contract...');
      const contractResult = await contractService.createPaymentRequest(
        amountNum, // INR amount
        daiAmount, // DAI amount string
        ethFee     // ETH fee string
      );

      console.log('Contract transaction created:', contractResult.tx.hash);
      console.log('Generated request ID:', contractResult.requestId);

      // Step 2: Wait for contract transaction to be mined
      console.log('Waiting for transaction confirmation...');
      await contractResult.tx.wait();
      console.log('Transaction confirmed!');

      // Step 3: Store additional details in MongoDB with the contract request ID
      console.log('Storing additional details in MongoDB...');
      await paymentService.createPaymentRequest({
        upiId: scannedData.upiId!,
        amount: amountNum,
        payeeName: scannedData.payeeName,
        note: scannedData.note,
        contractRequestId: contractResult.requestId, // Link to smart contract
        walletAddress: currentUserAddress,
        daiAmount: parseFloat(daiAmount),
        ethFee: parseFloat(ethFee)
      });

      setSuccess(`Payment request created successfully! 

Contract Request ID: ${contractResult.requestId}
Transaction Hash: ${contractResult.tx.hash}

Your request has been published on the blockchain for others to fulfill.`);
      setScannedData(null);
      setAmount('');
      setDaiAmount('');
      setEthFee('');
      setPayerReward('0.001'); // Reset to default
    } catch (err: any) {
      console.error('Error creating payment request:', err);
      setError(err.message || 'Failed to create payment request');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setAmount('');
    setDaiAmount('');
    setEthFee('');
    setPayerReward('0.001'); // Reset to default
    setError('');
    setSuccess('');
    stopScanning();
  };

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  if (!walletConnected) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <h1>🔗 Connect Your Wallet</h1>
        <p>Please connect your MetaMask wallet to create payment requests.</p>
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
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>QR Code Scanner</h1>
      <p>Scan a UPI QR code to create a payment request</p>
      
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

          <div style={{ marginTop: '1.5rem' }}>
            <label htmlFor="payerReward" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Payer Reward (ETH):
            </label>
            <input
              type="number"
              id="payerReward"
              value={payerReward}
              onChange={(e) => setPayerReward(e.target.value)}
              placeholder="Enter ETH reward for payers"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              step="0.0001"
              min="0"
            />
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
              Higher rewards attract payers faster. Default: 0.001 ETH
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>Quick select:</span>
              {['0.001', '0.002', '0.005', '0.01'].map(reward => (
                <button
                  key={reward}
                  type="button"
                  onClick={() => setPayerReward(reward)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem',
                    backgroundColor: payerReward === reward ? '#007bff' : '#f8f9fa',
                    color: payerReward === reward ? 'white' : '#666',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {reward} ETH
                </button>
              ))}
            </div>
          </div>
            
          {amount && daiAmount && ethFee && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: '#f0f8ff', 
              borderRadius: '4px',
              border: '1px solid #b3d9ff'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0066cc' }}>💰 Crypto Requirements:</h4>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <strong>DAI to Deposit:</strong> {parseFloat(daiAmount).toFixed(4)} DAI
              </div>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <strong>Total ETH Fee:</strong> {parseFloat(ethFee).toFixed(6)} ETH
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                <strong>Breakdown:</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1rem', marginBottom: '0.25rem' }}>
                • Platform Fee: {platformFee ? (parseFloat(platformFee) / 1e18).toFixed(6) : '0.00001'} ETH
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1rem' }}>
                • Payer Reward: {parseFloat(payerReward).toFixed(6)} ETH
              </div>
              <div style={{ fontSize: '0.75rem', color: '#28a745', marginTop: '0.5rem', fontStyle: 'italic' }}>
                💡 The payer reward incentivizes others to fulfill your payment request quickly
              </div>
            </div>
          )}

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