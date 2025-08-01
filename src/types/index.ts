export interface User {
  id: string;
  username: string;
  email: string;
  ethAddress?: string;
  createdAt: Date;
}

export interface UserWithPassword {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface PaymentRequest {
  id: string;
  upiId: string;
  amount: number;
  requesterId: string;
  status: 'pending' | 'acknowledged' | 'settled';
  createdAt: Date;
}

export interface CryptoSettlement {
  id: string;
  paymentRequestId: string;
  payerId: string;
  cryptoAmount: number;
  cryptoType: string;
  settlementHash?: string;
  settledAt?: Date;
}