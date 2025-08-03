import { ethers, BrowserProvider, Contract, formatUnits, formatEther, ContractTransactionResponse } from 'ethers';
import { NetworkService } from './networkConfig';
import { PLATFORM_CONFIG } from '../config/platform';
import { paymentService } from './paymentService';

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
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getUserRequests",
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
    
    console.log('Network details:', {
      chainId: Number(network.chainId),
      networkName: networkConfig.name,
      contractAddress: networkConfig.contracts.paymentEscrow
    });
    
    if (networkConfig.contracts.paymentEscrow === 'UPDATE_AFTER_DEPLOYMENT' || 
        networkConfig.contracts.paymentEscrow === 'NOT_DEPLOYED_YET') {
      throw new Error(`PaymentEscrow contract not deployed to ${networkConfig.name} yet. Please deploy first.`);
    }
    
    this.contract = new Contract(networkConfig.contracts.paymentEscrow, PAYMENT_ESCROW_ABI, this.signer);
    
    // Test contract connection
    try {
      const nextRequestId = await this.contract.getNextRequestId();
      console.log('Contract connection successful. Next request ID:', nextRequestId.toString());
    } catch (error) {
      console.error('Contract connection test failed:', error);
      throw new Error('Failed to connect to smart contract. Please check your network and contract deployment.');
    }
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
      return Promise.all(filteredRequests.map(req => this.formatContractRequest(req)));
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
      return await this.formatContractRequest(contractRequest);
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
      // Get current user address for debugging
      const currentUser = await this.getCurrentUserAddress();
      console.log(`Attempting to commit to payment request ${requestId} from address ${currentUser}`);
      
      // Get request details for debugging
      const request = await this.getPaymentRequest(requestId);
      console.log('Request details:', {
        id: request.id,
        status: request.status,
        requester: request.requesterId,
        currentUser
      });
      
      const tx = await this.contract!.commitToPay(requestId);
      return tx;
    } catch (error: any) {
      console.error('Error committing to payment:', error);
      
      // Parse common error messages to provide better user feedback
      const errorMessage = error.message || error.toString();
      
      if (errorMessage.includes('Request does not exist')) {
        throw new Error('Payment request not found. It may have been deleted or expired.');
      } else if (errorMessage.includes('Request expired')) {
        throw new Error('Payment request has expired. Please find another request.');
      } else if (errorMessage.includes('Cannot commit to own request')) {
        throw new Error('You cannot commit to your own payment request.');
      } else if (errorMessage.includes('Commitment still active')) {
        throw new Error('Someone else is already committed to this request. Please wait or find another request.');
      } else if (errorMessage.includes('Already committed by this payer')) {
        throw new Error('You have already committed to this request.');
      } else if (errorMessage.includes('Request not available for commitment')) {
        throw new Error('This request is not available for commitment (may be fulfilled or cancelled).');
      } else if (errorMessage.includes('user rejected transaction')) {
        throw new Error('Transaction was rejected. Please try again.');
      } else if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient ETH for gas fees. Please add ETH to your wallet.');
      } else {
        throw new Error(`Failed to commit to payment: ${errorMessage}`);
      }
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
      
      // Get the next request ID that would have been assigned (since contract increments it)
      let requestId = '0';
      
      try {
        // Method 1: Try to parse events from receipt
        if (receipt?.logs) {
          for (const log of receipt.logs) {
            try {
              const parsed = this.contract!.interface.parseLog(log);
              if (parsed?.name === 'PaymentRequestCreated') {
                requestId = parsed.args[0].toString();
                console.log('Found request ID from event:', requestId);
                break;
              }
            } catch (e) {
              // Continue to next log
            }
          }
        }
        
        // Method 2: If event parsing failed, get the current next ID and subtract 1
        if (requestId === '0') {
          const nextId = await this.contract!.getNextRequestId();
          requestId = (parseInt(nextId.toString()) - 1).toString();
          console.log('Calculated request ID from nextRequestId:', requestId);
        }
      } catch (error) {
        console.warn('Failed to extract request ID, using fallback method');
        // Method 3: Fallback - get current next ID and subtract 1
        try {
          const nextId = await this.contract!.getNextRequestId();
          requestId = (parseInt(nextId.toString()) - 1).toString();
        } catch (e) {
          console.error('All methods failed to get request ID');
          requestId = '0';
        }
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
      return Promise.all(contractRequests.map(req => this.formatContractRequest(req)));
    } catch (error) {
      console.error('Error fetching payer committed requests from contract:', error);
      throw new Error('Failed to fetch payer committed requests from blockchain');
    }
  }

  async getUserRequests(userAddress: string): Promise<FormattedPaymentRequest[]> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const contractRequests: ContractPaymentRequest[] = await this.contract!.getUserRequests(userAddress);
      
      // Convert contract data to frontend format
      return Promise.all(contractRequests.map(req => this.formatContractRequest(req)));
    } catch (error) {
      console.error('Error fetching user requests from contract:', error);
      throw new Error('Failed to fetch user requests from blockchain');
    }
  }

  private async formatContractRequest(contractRequest: ContractPaymentRequest): Promise<FormattedPaymentRequest> {
    // Convert wei amounts to readable format
    // Note: amountINR is stored as a regular number (not wei), so no conversion needed
    const amountINR = parseFloat(contractRequest.amountINR);
    const daiAmount = parseFloat(formatUnits(contractRequest.daiAmount, 18));
    const payerFee = parseFloat(formatEther(contractRequest.payerFee));

    // Map contract status to frontend status
    let status: 'pending' | 'acknowledged' | 'settled';
    switch (Number(contractRequest.status)) {
      case 0: // PENDING
        status = 'pending';
        break;
      case 1: // COMMITTED
        status = 'acknowledged';
        break;
      case 2: // FULFILLED
        status = 'settled';
        break;
      default:
        status = 'pending';
    }

    // Fetch the actual UPI ID from MongoDB using the contract request ID
    let actualUpiId: string = PLATFORM_CONFIG.UPI_ID; // Fallback to platform UPI ID
    let payeeName: string | undefined = PLATFORM_CONFIG.PLATFORM_NAME; // Fallback to platform name
    
    try {
      // Get payment request from MongoDB by contract request ID
      const mongoRequest = await paymentService.getPaymentRequestByContractId(contractRequest.requestId);
      if (mongoRequest && mongoRequest.upiId) {
        actualUpiId = mongoRequest.upiId;
        payeeName = mongoRequest.payeeName || undefined; // Use requester's name if available
      }
    } catch (error) {
      console.warn(`Failed to fetch UPI ID from MongoDB for request ${contractRequest.requestId}:`, error);
      // Will use fallback values
    }

    return {
      id: contractRequest.requestId,
      upiId: actualUpiId, // Use actual UPI ID from MongoDB or fallback
      amount: amountINR,
      payeeName: payeeName, // Use requester's name or platform name
      note: `Crypto Payment Request #${contractRequest.requestId} - ₹${amountINR.toFixed(2)}`,
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