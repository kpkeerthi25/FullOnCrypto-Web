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
  private readonly BASE_CHAIN_ID = 8453;

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      console.log(`Fetching balances for wallet: ${walletAddress} on Base L2`);
      
      // Fetch balances using direct API call
      const balanceResponse = await fetch(`${this.baseURL}/balance/v1.2/${this.BASE_CHAIN_ID}/balances/${walletAddress}`);
      
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

      // Fetch all token prices in INR
      let tokenPrices: any = {};
      try {
        const priceResponse = await fetch(`${this.baseURL}/price/v1.1/${this.BASE_CHAIN_ID}?currency=INR`);
        if (priceResponse.ok) {
          tokenPrices = await priceResponse.json();
          console.log('1inch token prices (INR) fetched for all tokens:', Object.keys(tokenPrices).length);
        }
      } catch (error) {
        console.warn('Failed to fetch token prices in INR:', error);
      }

      // Add INR values to the filtered balances
      const filteredBalances = balances.map(token => {
        const price = tokenPrices[token.tokenAddress];
        const balanceNum = parseFloat(token.balanceFormatted);
        const valueINR = price && balanceNum > 0 ? balanceNum * price : undefined;
        
        return {
          ...token,
          price,
          valueINR,
        };
      });

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
}

export const balanceService = new BalanceService();