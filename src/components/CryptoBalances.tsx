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
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {/* Token Logo */}
                <div style={{ flexShrink: 0 }}>
                  {token.logoURI ? (
                    <img 
                      src={token.logoURI} 
                      alt={`${token.symbol} logo`}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        border: '1px solid #e9ecef'
                      }}
                      onError={(e) => {
                        // Fallback to default icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        const fallbackElement = e.currentTarget.nextElementSibling as HTMLDivElement;
                        if (fallbackElement) {
                          fallbackElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#e9ecef',
                    display: token.logoURI ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#666'
                  }}>
                    {token.symbol.charAt(0)}
                  </div>
                </div>
                
                {/* Token Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#333' }}>{token.symbol}</strong>
                    <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                      {token.name}
                    </span>
                  </div>
                  <div style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>
                    {token.balanceFormatted} {token.symbol}
                  </div>
                  {token.valueINR && (
                    <div style={{ fontSize: '0.9rem', color: '#28a745', fontWeight: '500' }}>
                      ₹{token.valueINR.toFixed(2)}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                    {token.tokenAddress.slice(0, 8)}...{token.tokenAddress.slice(-6)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoBalances;