import { User } from '../types';

export class UserService {
  private readonly baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  
  async validateWalletSignature(ethAddress: string, signature: string): Promise<boolean> {
    // Placeholder for future server-side signature validation
    // For now, we trust the wallet signature from MetaMask
    console.log('Validating wallet signature for:', ethAddress);
    return true;
  }

  /**
   * Get user data from MongoDB including UPI ID
   */
  async getUserByWalletAddress(ethAddress: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseURL}/user/${ethAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // User not found in database
        console.log(`User ${ethAddress} not found in database`);
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user data');
      }

      return {
        ethAddress: data.user.ethAddress,
        upiId: data.user.upiId,
        createdAt: new Date(data.user.createdAt)
      };
    } catch (error: any) {
      // Check if it's a network error (backend not running)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('Backend API not available - using fallback mode');
        return null;
      }
      
      console.error('Error fetching user data:', error);
      return null; // Return null if user not found or error
    }
  }

  /**
   * Create or update user in MongoDB
   */
  async createOrUpdateUser(userData: { ethAddress: string; upiId?: string }): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create/update user');
      }

      return {
        ethAddress: data.user.ethAddress,
        upiId: data.user.upiId,
        createdAt: new Date(data.user.createdAt)
      };
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  /**
   * Get UPI ID for a specific wallet address (used for QR generation)
   */
  async getUpiIdByWalletAddress(ethAddress: string): Promise<string | null> {
    const user = await this.getUserByWalletAddress(ethAddress);
    
    // If no UPI ID found and in development mode, provide mock data for testing
    if (!user?.upiId && this.isDevelopment) {
      console.log(`Using mock UPI ID for development: ${ethAddress}`);
      // Generate a mock UPI ID based on wallet address for testing
      const shortAddress = ethAddress.slice(2, 8).toLowerCase();
      return `user${shortAddress}@paytm`;
    }
    
    return user?.upiId || null;
  }

  /**
   * Check if backend API is available
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const userService = new UserService();