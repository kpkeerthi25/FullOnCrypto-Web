import { ethers, BrowserProvider, Contract, formatUnits, formatEther, ContractTransactionResponse } from 'ethers';
import { NetworkService } from './networkConfig';

// PaymentEscrow contract ABI (functions we need)
const PAYMENT_ESCROW_ABI = [
  // View functions
  {
    "inputs": [],
    "name": "getAvailableRequests",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "requestId", "type": "uint256"},
          {"internalType": "address", "name": "requester", "type": "address"},
          {"internalType": "address", "name": "payer", "type": "address"},
          {"internalType": "uint256", "name": "amountINR", "type": "uint256"},
          {"internalType": "address", "name": "tokenAddress", "type": "address"},
          {"internalType": "uint256", "name": "daiAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "payerFee", "type": "uint256"},
          {"internalType": "uint8", "name": "status", "type": "uint8"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "committedAt", "type": "uint256"},
          {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
          {"internalType": "string", "name": "transactionNumber", "type": "string"}
        ],
        "internalType": "struct PaymentEscrow.PaymentRequest[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_requestId", "type": "uint256"}],
    "name": "getPaymentRequest",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "requestId", "type": "uint256"},
          {"internalType": "address", "name": "requester", "type": "address"},
          {"internalType": "address", "name": "payer", "type": "address"},
          {"internalType": "uint256", "name": "amountINR", "type": "uint256"},
          {"internalType": "address", "name": "tokenAddress", "type": "address"},
          {"internalType": "uint256", "name": "daiAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "payerFee", "type": "uint256"},
          {"internalType": "uint8", "name": "status", "type": "uint8"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "committedAt", "type": "uint256"},
          {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
          {"internalType": "string", "name": "transactionNumber", "type": "string"}
        ],
        "internalType": "struct PaymentEscrow.PaymentRequest",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Transaction functions
  {
    "inputs": [
      {"internalType": "uint256", "name": "_amountINR", "type": "uint256"},
      {"internalType": "uint256", "name": "_daiAmount", "type": "uint256"}
    ],
    "name": "createPaymentRequest",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_requestId", "type": "uint256"}],
    "name": "commitToPay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_requestId", "type": "uint256"},
      {"internalType": "string", "name": "_transactionNumber", "type": "string"}
    ],
    "name": "fulfillPayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_payer", "type": "address"}],
    "name": "getPayerCommittedRequests",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "requestId", "type": "uint256"},
          {"internalType": "address", "name": "requester", "type": "address"},
          {"internalType": "address", "name": "payer", "type": "address"},
          {"internalType": "uint256", "name": "amountINR", "type": "uint256"},
          {"internalType": "address", "name": "tokenAddress", "type": "address"},
          {"internalType": "uint256", "name": "daiAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "payerFee", "type": "uint256"},
          {"internalType": "uint8", "name": "status", "type": "uint8"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "committedAt", "type": "uint256"},
          {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
          {"internalType": "string", "name": "transactionNumber", "type": "string"}
        ],
        "internalType": "struct PaymentEscrow.PaymentRequest[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNextRequestId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlatformFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "pure",
    "type": "function"
  }
];

// Contract addresses are now managed in networkConfig.ts

// Payment status enum mapping
export enum PaymentStatus {
  PENDING = 0,
  COMMITTED = 1,
  FULFILLED = 2,
  CANCELLED = 3,
  EXPIRED = 4
}

export interface ContractPaymentRequest {
  requestId: string;
  requester: string;
  payer: string;
  amountINR: string;
  tokenAddress: string;
  daiAmount: string;
  payerFee: string;
  status: PaymentStatus;
  createdAt: string;
  committedAt: string;
  expiresAt: string;
  transactionNumber: string;
}

export interface FormattedPaymentRequest {
  id: string;
  upiId: string; // We'll need to map this from MongoDB or another source
  amount: number;
  payeeName?: string; // We'll need to map this from MongoDB or another source
  note?: string; // We'll need to map this from MongoDB or another source
  requesterId: string;
  status: 'pending' | 'acknowledged' | 'settled';
  createdAt: string;
  committedAt: string;
  requester: string;
  daiAmount: number;
  payerFee: number;
  transactionNumber?: string;
}

class ContractService {
  private provider: BrowserProvider | null = null;
  private contract: Contract | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask to continue.');
    }

    this.provider = new BrowserProvider(window.ethereum);
    await this.provider.send('eth_requestAccounts', []);
    this.signer = await this.provider.getSigner();

    const network = await this.provider.getNetwork();
    const networkConfig = NetworkService.getNetworkConfig(Number(network.chainId));
    
    if (networkConfig.contracts.paymentEscrow === 'UPDATE_AFTER_DEPLOYMENT' || 
        networkConfig.contracts.paymentEscrow === 'NOT_DEPLOYED_YET') {
      throw new Error(`PaymentEscrow contract not deployed to ${networkConfig.name} yet. Please deploy first.`);
    }
    
    this.contract = new Contract(networkConfig.contracts.paymentEscrow, PAYMENT_ESCROW_ABI, this.signer);
  }


  async getAvailablePaymentRequests(currentUserAddress?: string): Promise<FormattedPaymentRequest[]> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const contractRequests: ContractPaymentRequest[] = await this.contract!.getAvailableRequests();
      
      // Filter out requests created by current user if address is provided
      const filteredRequests = currentUserAddress 
        ? contractRequests.filter(req => req.requester.toLowerCase() !== currentUserAddress.toLowerCase())
        : contractRequests;

      // Convert contract data to frontend format
      return filteredRequests.map(this.formatContractRequest);
    } catch (error) {
      console.error('Error fetching payment requests from contract:', error);
      throw new Error('Failed to fetch payment requests from blockchain');
    }
  }

  async getPaymentRequest(requestId: string): Promise<FormattedPaymentRequest> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const contractRequest: ContractPaymentRequest = await this.contract!.getPaymentRequest(requestId);
      return this.formatContractRequest(contractRequest);
    } catch (error) {
      console.error('Error fetching payment request from contract:', error);
      throw new Error('Failed to fetch payment request from blockchain');
    }
  }

  async commitToPayment(requestId: string): Promise<ContractTransactionResponse> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const tx = await this.contract!.commitToPay(requestId);
      return tx;
    } catch (error) {
      console.error('Error committing to payment:', error);
      throw new Error('Failed to commit to payment on blockchain');
    }
  }

  async fulfillPayment(requestId: string, transactionNumber: string): Promise<ContractTransactionResponse> {
    if (!this.contract) {
      await this.initialize();
    }

    // Validate transaction number
    if (!transactionNumber || transactionNumber.length !== 12 || !/^\d{12}$/.test(transactionNumber)) {
      throw new Error('Transaction number must be exactly 12 digits');
    }

    try {
      const tx = await this.contract!.fulfillPayment(requestId, transactionNumber);
      return tx;
    } catch (error) {
      console.error('Error fulfilling payment:', error);
      throw new Error('Failed to fulfill payment on blockchain');
    }
  }

  async getCurrentUserAddress(): Promise<string> {
    if (!this.signer) {
      await this.initialize();
    }

    return await this.signer!.getAddress();
  }

  async createPaymentRequest(amountINR: number, daiAmount: string, ethFee: string): Promise<{ tx: ContractTransactionResponse; requestId: string }> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      // Convert amounts to proper format
      const amountINRWei = Math.floor(amountINR); // INR is stored as regular number
      const daiAmountWei = ethers.parseUnits(daiAmount, 18); // DAI has 18 decimals
      const ethFeeWei = ethers.parseEther(ethFee); // ETH fee

      const tx = await this.contract!.createPaymentRequest(amountINRWei, daiAmountWei, { value: ethFeeWei });
      
      // Wait for transaction and get the receipt to extract the request ID
      const receipt = await tx.wait();
      
      // Find the PaymentRequestCreated event to get the request ID
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === 'PaymentRequestCreated';
        } catch {
          return false;
        }
      });
      
      let requestId = '0';
      if (event) {
        const parsed = this.contract!.interface.parseLog(event as any);
        requestId = parsed?.args[0].toString();
      }

      return { tx, requestId };
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw new Error('Failed to create payment request on blockchain');
    }
  }

  async getNextRequestId(): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const nextId = await this.contract!.getNextRequestId();
      return nextId.toString();
    } catch (error) {
      console.error('Error getting next request ID:', error);
      throw new Error('Failed to get next request ID from blockchain');
    }
  }

  async getPlatformFee(): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const fee = await this.contract!.getPlatformFee();
      return fee.toString();
    } catch (error) {
      console.error('Error getting platform fee:', error);
      throw new Error('Failed to get platform fee from blockchain');
    }
  }

  async getPayerCommittedRequests(payerAddress: string): Promise<FormattedPaymentRequest[]> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const contractRequests: ContractPaymentRequest[] = await this.contract!.getPayerCommittedRequests(payerAddress);
      
      // Convert contract data to frontend format
      return contractRequests.map(this.formatContractRequest);
    } catch (error) {
      console.error('Error fetching payer committed requests from contract:', error);
      throw new Error('Failed to fetch payer committed requests from blockchain');
    }
  }

  private formatContractRequest(contractRequest: ContractPaymentRequest): FormattedPaymentRequest {
    // Convert wei amounts to readable format
    // Note: amountINR is stored as a regular number (not wei), so no conversion needed
    const amountINR = parseFloat(contractRequest.amountINR);
    const daiAmount = parseFloat(formatUnits(contractRequest.daiAmount, 18));
    const payerFee = parseFloat(formatEther(contractRequest.payerFee));

    // Map contract status to frontend status
    let status: 'pending' | 'acknowledged' | 'settled';
    switch (contractRequest.status) {
      case PaymentStatus.PENDING:
        status = 'pending';
        break;
      case PaymentStatus.COMMITTED:
        status = 'acknowledged';
        break;
      case PaymentStatus.FULFILLED:
        status = 'settled';
        break;
      default:
        status = 'pending';
    }

    return {
      id: contractRequest.requestId,
      upiId: `crypto@${contractRequest.requester.slice(0, 6)}...${contractRequest.requester.slice(-4)}`, // Placeholder UPI ID
      amount: amountINR,
      payeeName: `User ${contractRequest.requester.slice(0, 6)}`, // Placeholder name
      note: `Payment request for ₹${amountINR.toFixed(2)}`, // Placeholder note
      requesterId: contractRequest.requester,
      status,
      createdAt: new Date(parseInt(contractRequest.createdAt) * 1000).toISOString(),
      committedAt: parseInt(contractRequest.committedAt) === 0 ? '' : new Date(parseInt(contractRequest.committedAt) * 1000).toISOString(),
      requester: contractRequest.requester,
      daiAmount,
      payerFee,
      transactionNumber: contractRequest.transactionNumber || undefined
    };
  }
}

export const contractService = new ContractService();