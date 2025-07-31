export interface CreatePaymentRequestData {
  upiId: string;
  amount: number;
  payeeName?: string;
  note?: string;
}

export interface PaymentRequest {
  id: string;
  upiId: string;
  amount: number;
  payeeName?: string;
  note?: string;
  requesterId: string;
  status: 'pending' | 'acknowledged' | 'settled';
  createdAt: string;
}

export class PaymentService {
  private readonly baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  async createPaymentRequest(paymentData: CreatePaymentRequestData): Promise<PaymentRequest> {
    try {
      const response = await fetch(`${this.baseURL}/payment-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment request');
      }

      return data.paymentRequest;
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
  }

  async getPaymentRequests(): Promise<PaymentRequest[]> {
    try {
      const response = await fetch(`${this.baseURL}/payment-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment requests');
      }

      return data.paymentRequests;
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();