import { User } from '../types';

export class UserService {
  // Keep for potential future server-side user management
  // Currently using wallet-only authentication without server dependency
  
  async validateWalletSignature(ethAddress: string, signature: string): Promise<boolean> {
    // Placeholder for future server-side signature validation
    // For now, we trust the wallet signature from MetaMask
    console.log('Validating wallet signature for:', ethAddress);
    return true;
  }
}

export const userService = new UserService();