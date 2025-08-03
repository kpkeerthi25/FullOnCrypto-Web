// Platform configuration for FullOnCrypto
export const PLATFORM_CONFIG = {
  // UPI ID for receiving fiat payments on behalf of crypto requesters
  UPI_ID: 'test',
  
  // Platform name shown in UPI payments
  PLATFORM_NAME: 'FullOnCrypto Platform',
  
  // Platform merchant code (if applicable)
  MERCHANT_CODE: undefined, // Set if you have a merchant code
  
  // Contact information
  SUPPORT_EMAIL: 'kpkeerthi34@gmail.com',
  SUPPORT_PHONE: '+91-XXXXXXXXXX'
} as const;

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Use production UPI ID when available
  // PLATFORM_CONFIG.UPI_ID = process.env.REACT_APP_PRODUCTION_UPI_ID || PLATFORM_CONFIG.UPI_ID;
}