export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  isTestnet: boolean;
  contracts: {
    paymentEscrow: string;
    daiToken: string;
  };
  oneInchChainId?: number; // For balance service
}

export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  // Base Sepolia Testnet
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    isTestnet: true,
    contracts: {
      paymentEscrow: '0x0C446A3e9c245E255D7d9cE994cd5321BA4E52A4', // Replace with deployed PaymentEscrow address
      daiToken: '0x20E6a989977427FEA78FD82Ce837AF0E636702b5', // Replace with deployed MockDAI address
    },
    oneInchChainId: 8453, // Use mainnet for price data (testnet tokens won't have prices)
  },
  
  // Base Mainnet
  8453: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    isTestnet: false,
    contracts: {
      paymentEscrow: '0x7e7E2bBB58C1F7C710005797C48705747877C647',
      daiToken: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Real DAI on Base
    },
    oneInchChainId: 8453,
  },
  
  // Hardhat Local
  1337: {
    chainId: 1337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    isTestnet: true,
    contracts: {
      paymentEscrow: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      daiToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    },
    // No 1inch support for local networks
  },
};

export const DEFAULT_NETWORK = 84532; // Base Sepolia for development

export class NetworkService {
  static getCurrentNetwork(): NetworkConfig {
    const chainId = this.getCurrentChainId();
    return this.getNetworkConfig(chainId);
  }
  
  static getCurrentChainId(): number {
    // Try to get from window.ethereum first
    if (typeof window !== 'undefined' && window.ethereum) {
      const chainId = window.ethereum.chainId;
      if (chainId) {
        return parseInt(chainId, 16);
      }
    }
    
    // Fallback to default
    return DEFAULT_NETWORK;
  }
  
  static getNetworkConfig(chainId: number): NetworkConfig {
    const config = NETWORK_CONFIGS[chainId];
    if (!config) {
      throw new Error(`Unsupported network. Chain ID: ${chainId}. Please connect to Base Sepolia (84532), Base Mainnet (8453), or Hardhat Local (1337).`);
    }
    return config;
  }
  
  static isNetworkSupported(chainId: number): boolean {
    return chainId in NETWORK_CONFIGS;
  }
  
  static getSupportedNetworks(): NetworkConfig[] {
    return Object.values(NETWORK_CONFIGS);
  }
  
  static isTestnet(chainId: number): boolean {
    const config = NETWORK_CONFIGS[chainId];
    return config?.isTestnet ?? false;
  }
}