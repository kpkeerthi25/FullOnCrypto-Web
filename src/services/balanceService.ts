import { NetworkService } from './networkConfig';
import { priceService } from './priceService';

export interface TokenBalance {
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  tokenAddress: string;
  price?: number;
  valueINR?: number;
  logoURI?: string;
}

export interface BalanceResponse {
  [tokenAddress: string]: string; // The response is just address: balance
}

export class BalanceService {
  private readonly baseURL = 'https://1inch-vercel-proxy-pink.vercel.app';

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      const networkConfig = NetworkService.getCurrentNetwork();
      const chainId = networkConfig.oneInchChainId || networkConfig.chainId;
      
      console.log(`Fetching balances for wallet: ${walletAddress} on ${networkConfig.name} (using 1inch chain ${chainId})`);
      
      // For local networks, return mock data since 1inch doesn't support them
      if (!networkConfig.oneInchChainId) {
        return this.getMockBalances(walletAddress, networkConfig);
      }
      
      // Fetch balances using direct API call
      const balanceResponse = await fetch(`${this.baseURL}/balance/v1.2/${chainId}/balances/${walletAddress}`);
      
      if (!balanceResponse.ok) {
        throw new Error(`Failed to fetch balances: ${balanceResponse.status} ${balanceResponse.statusText}`);
      }

      const balanceData: BalanceResponse = await balanceResponse.json();
      console.log('1inch balance response:', balanceData);

      // Convert the response to a more usable format and filter out zero balances first
      const balances: TokenBalance[] = Object.entries(balanceData)
        .map(([tokenAddress, balance]) => {
          // Handle special case for ETH (native token on Base)
          const isNativeToken = tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
          
          const decimals = isNativeToken ? 18 : 18; // Default to 18 decimals
          const symbol = isNativeToken ? 'ETH' : 'UNKNOWN';
          const name = isNativeToken ? 'Ethereum' : 'Unknown Token';
          
          const balanceFormatted = this.formatBalance(balance, decimals);
          
          return {
            tokenAddress,
            symbol,
            name,
            decimals,
            balance,
            balanceFormatted,
          };
        })
        .filter(token => parseFloat(token.balanceFormatted) > 0); // Filter out zero balances first

      // Fetch all token prices in INR using the shared price service
      let tokenPrices: any = {};
      try {
        tokenPrices = await priceService.getTokenPrices(chainId);
        console.log('Token prices fetched for all tokens:', Object.keys(tokenPrices).length);
      } catch (error) {
        console.warn('Failed to fetch token prices in INR:', error);
      }

      // Add INR values and logos to the filtered balances
      const enrichedBalances = await Promise.all(
        balances.map(async (token) => {
          const price = tokenPrices[token.tokenAddress];
          const balanceNum = parseFloat(token.balanceFormatted);
          const valueINR = price && balanceNum > 0 ? balanceNum * price : undefined;
          
          // Fetch token info (including logo) for ETH and DAI only
          let logoURI = token.logoURI;
          let updatedSymbol = token.symbol;
          let updatedName = token.name;
          
          const isETH = token.tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
          const isDAI = token.tokenAddress.toLowerCase() === '0x50c5725949a6f0c72e6c4a641f24049a917db0cb';
          
          if (isETH || isDAI) {
            try {
              const tokenInfo = await priceService.getTokenInfo(token.tokenAddress, chainId);
              if (tokenInfo) {
                logoURI = tokenInfo.logoURI || logoURI;
                updatedSymbol = tokenInfo.symbol || updatedSymbol;
                updatedName = tokenInfo.name || updatedName;
              }
            } catch (error) {
              console.warn(`Failed to fetch token info for ${token.symbol}:`, error);
            }
          }
          
          return {
            ...token,
            symbol: updatedSymbol,
            name: updatedName,
            logoURI,
            price,
            valueINR,
          };
        })
      );

      const filteredBalances = enrichedBalances;

      return filteredBalances.sort((a, b) => {
        // Sort by INR value if both have it, otherwise by token amount
        if (a.valueINR && b.valueINR) {
          return b.valueINR - a.valueINR;
        } else if (a.valueINR) {
          return -1; // a has INR value, b doesn't - a comes first
        } else if (b.valueINR) {
          return 1; // b has INR value, a doesn't - b comes first
        } else {
          return parseFloat(b.balanceFormatted) - parseFloat(a.balanceFormatted);
        }
      });

    } catch (error) {
      console.error('Error fetching token balances:', error);
      throw error;
    }
  }

  private formatBalance(balance: string, decimals: number): string {
    try {
      // Use BigInt for large numbers to avoid precision loss
      const balanceBigInt = BigInt(balance);
      const divisorBigInt = BigInt(10 ** decimals);
      
      // Convert to number for decimal division
      const balanceNum = Number(balanceBigInt) / Number(divisorBigInt);
      
      if (balanceNum === 0) return '0';
      if (balanceNum < 0.0001) return balanceNum.toExponential(2);
      if (balanceNum < 1) return balanceNum.toFixed(6);
      if (balanceNum < 1000) return balanceNum.toFixed(4);
      return balanceNum.toFixed(2);
    } catch (error) {
      console.error('Error formatting balance:', error, { balance, decimals });
      return '0';
    }
  }

  async getETHBalance(walletAddress: string): Promise<TokenBalance | null> {
    try {
      const balances = await this.getTokenBalances(walletAddress);
      
      // Look for ETH token on Base
      const ethBalance = balances.find(token => 
        token.symbol.toUpperCase() === 'ETH' || 
        token.tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      );

      return ethBalance || null;
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      return null;
    }
  }

  private async getMockBalances(_walletAddress: string, networkConfig: any): Promise<TokenBalance[]> {
    // Mock balances for local development
    return [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: '10000000000000000000', // 10 ETH
        balanceFormatted: '10.0000',
        tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        price: 200000, // Mock INR price
        valueINR: 2000000, // 10 ETH * 200,000 INR
      },
      {
        symbol: 'DAI',
        name: 'Mock DAI',
        decimals: 18,
        balance: '1000000000000000000000', // 1000 DAI
        balanceFormatted: '1000.0000',
        tokenAddress: networkConfig.contracts.daiToken,
        price: 83, // Mock INR price (~1 USD)
        valueINR: 83000, // 1000 DAI * 83 INR
      }
    ];
  }
}

export const balanceService = new BalanceService();