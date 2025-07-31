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
}

export const userService = new UserService();