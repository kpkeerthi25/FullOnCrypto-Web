import { User } from '../types';

export interface CreateUserData {
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export class UserService {
  private readonly baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      return data.user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async loginUser(loginData: LoginData): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      return data.user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async updateUserWallet(ethAddress: string, username?: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/update-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ethAddress, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update wallet');
      }

      return data.user;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  async loginWithWallet(ethAddress: string, signature: string): Promise<User> {
    try {
      console.log('Making wallet login request to:', `${this.baseURL}/login-wallet`);
      const response = await fetch(`${this.baseURL}/login-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ethAddress, signature }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Server returned invalid JSON response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login with wallet');
      }

      return data.user;
    } catch (error) {
      console.error('Error logging in with wallet:', error);
      throw error;
    }
  }

  async registerWithWallet(ethAddress: string, signature: string, username: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/register-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ethAddress, signature, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register with wallet');
      }

      return data.user;
    } catch (error) {
      console.error('Error registering with wallet:', error);
      throw error;
    }
  }
}

export const userService = new UserService();