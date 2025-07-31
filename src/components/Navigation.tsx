import React from 'react';
import { Link } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
      <Link to="/scanner" style={{ marginRight: '1rem' }}>Scanner</Link>
      <Link to="/profile" style={{ marginRight: '1rem' }}>Profile</Link>
      <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
      <Link to="/signup">Sign Up</Link>
    </nav>
  );
};

export default Navigation;