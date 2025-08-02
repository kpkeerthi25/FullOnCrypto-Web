import React from 'react';
import { useTokenBalances } from '../hooks/useTokenBalances';

interface CryptoBalancesProps {
  walletAddress: string | null;
}

const CryptoBalances: React.FC<CryptoBalancesProps> = ({ walletAddress }) => {
  const { balances, loading, error, refreshBalances } = useTokenBalances(walletAddress);

  if (!walletAddress) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        Connect your wallet to view balances
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '1.5rem',
      borderRadius: '8px',
      marginBottom: '2rem',
      border: '1px solid #dee2e6'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Base L2 Balances</h2>
        <button
          onClick={refreshBalances}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          Error: {error}
        </div>
      )}

      {loading && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          Loading balances...
        </div>
      )}

      {!loading && balances.length === 0 && !error && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          No tokens found
        </div>
      )}

      {!loading && balances.length > 0 && (
        <div>
          <p>Found {balances.length} tokens:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {balances.map((token, index) => (
              <div key={token.tokenAddress} style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>{token.symbol}</strong> - {token.name}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  Balance: {token.balanceFormatted}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  Address: {token.tokenAddress}
                </div>
                {token.valueINR && (
                  <div style={{ fontSize: '0.8rem', color: '#28a745', marginTop: '0.5rem' }}>
                    INR Value: ₹{token.valueINR.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoBalances;