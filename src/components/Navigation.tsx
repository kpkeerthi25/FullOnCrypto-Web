import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { useMetaMask } from '../hooks/useMetaMask';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated, loginWithWallet } = useAuth();
  const { connect, signMessage, isMetaMaskInstalled, isConnecting } = useMetaMask();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string>('');

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleWalletConnect = async () => {
    if (!isMetaMaskInstalled) {
      alert('Please install MetaMask to connect your wallet');
      return;
    }

    try {
      // Connect wallet
      const account = await connect();
      if (!account) {
        throw new Error('Failed to connect wallet');
      }

      // Generate message to sign
      const timestamp = Date.now();
      const message = `Welcome to FullOnCrypto!\n\nPlease sign this message to authenticate your wallet.\n\nWallet: ${account}\nTimestamp: ${timestamp}`;
      
      // Sign message for verification
      await signMessage(message);

      // Login with wallet address
      loginWithWallet(account);
      navigate('/');
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      alert(error.message || 'Failed to connect wallet');
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navLinkStyle = (path: string) => ({
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: isActiveRoute(path) ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
    color: isActiveRoute(path) ? '#00d4ff' : '#e2e8f0',
    border: isActiveRoute(path) ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    position: 'relative' as const,
    overflow: 'hidden' as const
  });

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    position: 'relative' as const,
    overflow: 'hidden' as const
  };

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '80px'
      }}>
        {/* Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link 
            to="/" 
            style={{
              textDecoration: 'none',
              fontSize: '1.8rem',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #00d4ff, #5a67d8, #667eea)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginRight: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '-0.5px'
            }}
          >
            💎 FullOnCrypto
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        {!isMobile && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem'
        }}>
          {isAuthenticated && (
            <>
              <Link 
                to="/scanner" 
                style={navLinkStyle('/scanner')}
              >
                🔍 Scanner
              </Link>
              <Link 
                to="/open-payments" 
                style={navLinkStyle('/open-payments')}
              >
                🌟 Open Payments
              </Link>
              <Link 
                to="/pending-payments" 
                style={navLinkStyle('/pending-payments')}
              >
                ⚡ My Pending
              </Link>
              <Link 
                to="/profile" 
                style={navLinkStyle('/profile')}
              >
                👤 Profile
              </Link>
            </>
          )}
        </div>
        )}

        {/* Right Side - User Actions */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem'
        }}>
          {isAuthenticated && !isMobile && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.25rem',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: '1.1rem' }}>🦊</span>
                <span style={{
                  color: '#00d4ff',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  fontFamily: 'monospace'
                }}>
                  {user?.ethAddress ? `${user.ethAddress.slice(0, 6)}...${user.ethAddress.slice(-4)}` : 'Not Connected'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#00d4ff', opacity: 0.8 }}>✓</span>
              </div>
              
              <button 
                onClick={handleLogout}
                style={{
                  ...buttonStyle,
                  backgroundColor: hoveredButton === 'logout' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)',
                  color: hoveredButton === 'logout' ? '#ff3b30' : '#ff6b6b',
                  border: '1px solid rgba(255, 59, 48, 0.3)',
                  transform: hoveredButton === 'logout' ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: hoveredButton === 'logout' ? '0 4px 12px rgba(255, 59, 48, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={() => setHoveredButton('logout')}
                onMouseLeave={() => setHoveredButton('')}
              >
                🚪 Disconnect
              </button>
            </div>
          )}
          
          {!isAuthenticated && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleWalletConnect}
                disabled={isConnecting}
                style={{
                  ...buttonStyle,
                  background: isConnecting ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #00d4ff, #5a67d8)',
                  color: 'white',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  fontWeight: '700',
                  boxShadow: isConnecting ? 'none' : '0 4px 15px rgba(0, 212, 255, 0.3)',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  opacity: isConnecting ? 0.7 : 1
                }}
              >
                {isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              color: '#00d4ff',
              padding: '0.75rem',
              borderRadius: '12px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontSize: '1.2rem'
            }}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && isMobile && (
        <div style={{
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0, 212, 255, 0.2)',
          padding: '1.5rem',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          {isAuthenticated && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link 
                to="/scanner" 
                style={{ 
                  color: '#e2e8f0', 
                  textDecoration: 'none', 
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🔍 Scanner
              </Link>
              <Link 
                to="/open-payments" 
                style={{ 
                  color: '#e2e8f0', 
                  textDecoration: 'none', 
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🌟 Open Payments
              </Link>
              <Link 
                to="/pending-payments" 
                style={{ 
                  color: '#e2e8f0', 
                  textDecoration: 'none', 
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ⚡ My Pending
              </Link>
              <Link 
                to="/profile" 
                style={{ 
                  color: '#e2e8f0', 
                  textDecoration: 'none', 
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                👤 Profile
              </Link>
              <div style={{ 
                padding: '1rem', 
                borderTop: '1px solid rgba(0, 212, 255, 0.2)', 
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 212, 255, 0.2)'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🦊</span>
                  <span style={{
                    color: '#00d4ff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    fontFamily: 'monospace'
                  }}>
                    {user?.ethAddress ? `${user.ethAddress.slice(0, 6)}...${user.ethAddress.slice(-4)}` : 'Not Connected'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#00d4ff', opacity: 0.8 }}>✓</span>
                </div>
                
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                    color: '#ff6b6b',
                    border: '1px solid rgba(255, 59, 48, 0.3)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  🚪 Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;