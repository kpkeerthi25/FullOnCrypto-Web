import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ 
      padding: '1rem', 
      borderBottom: '1px solid #ccc',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
        {isAuthenticated && (
          <>
            <Link to="/scanner" style={{ marginRight: '1rem' }}>Scanner</Link>
            <Link to="/profile" style={{ marginRight: '1rem' }}>Profile</Link>
          </>
        )}
      </div>
      
      <div>
        {isAuthenticated ? (
          <>
            <span style={{ marginRight: '1rem' }}>Welcome, {user?.username}!</span>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#007bff', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;