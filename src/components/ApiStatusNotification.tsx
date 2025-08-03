import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';

const ApiStatusNotification: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const checkBackendStatus = async () => {
      const isAvailable = await userService.isBackendAvailable();
      setBackendStatus(isAvailable ? 'available' : 'unavailable');
      
      // Show notification if backend is unavailable
      if (!isAvailable && process.env.NODE_ENV === 'development') {
        setShowNotification(true);
      }
    };

    checkBackendStatus();
  }, []);

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || backendStatus !== 'unavailable') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '1rem',
      maxWidth: '600px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>
            Backend API Not Available
          </h4>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#856404' }}>
            The MongoDB API at <code>localhost:3001</code> is not running. 
            QR codes will use mock UPI IDs for testing.
          </p>
          <p style={{ margin: '0', fontSize: '0.8rem', color: '#6c757d' }}>
            To fix: Start your backend server or the app will use fallback platform UPI ID.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#856404'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ApiStatusNotification;