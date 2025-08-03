import { NetworkService } from './networkConfig';

export interface TokenPrice {
  [tokenAddress: string]: number;
}

class PriceService {
  private readonly baseURL = 'https://1inch-vercel-proxy-pink.vercel.app';
  private priceCache: { [chainId: number]: { prices: TokenPrice; timestamp: number } } = {};
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  async getTokenPrices(chainId?: number): Promise<TokenPrice> {
    const networkConfig = NetworkService.getCurrentNetwork();
    const targetChainId = chainId || networkConfig.oneInchChainId || networkConfig.chainId;

    // Return empty object if no 1inch support
    if (!networkConfig.oneInchChainId && !chainId) {
      return {};
    }

    // Check cache first
    const cached = this.priceCache[targetChainId];
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.prices;
    }

    try {
      console.log(`Fetching token prices for chain ${targetChainId} in INR`);
      const response = await fetch(`${this.baseURL}/price/v1.1/${targetChainId}?currency=INR`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status} ${response.statusText}`);
      }

      const prices: TokenPrice = await response.json();
      
      // Cache the prices
      this.priceCache[targetChainId] = {
        prices,
        timestamp: Date.now()
      };

      console.log(`Fetched ${Object.keys(prices).length} token prices for chain ${targetChainId}`);
      return prices;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      // Return cached data if available, even if expired
      if (cached) {
        console.log('Using expired cache due to API error');
        return cached.prices;
      }
      return {};
    }
  }

  async getETHPriceInINR(chainId?: number): Promise<number> {
    try {
      const prices = await this.getTokenPrices(chainId);
      
      // ETH is represented as 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee on 1inch
      const ethAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      const ethPrice = prices[ethAddress];
      
      if (ethPrice && ethPrice > 0) {
        console.log(`ETH price: ₹${ethPrice.toLocaleString()}`);
        return ethPrice;
      } else {
        console.warn('ETH price not found in 1inch response, using fallback');
        return 200000; // Fallback price
      }
    } catch (error) {
      console.error('Error getting ETH price:', error);
      return 200000; // Fallback price
    }
  }

  async getDAIPriceInINR(chainId?: number): Promise<number> {
    try {
      // Use specific DAI price endpoint for Base mainnet
      const targetChainId = chainId || 8453; // Default to Base mainnet
      const daiTokenAddress = '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'; // Base DAI address
      
      console.log(`Fetching DAI price from dedicated endpoint for chain ${targetChainId}`);
      const response = await fetch(`${this.baseURL}/price/v1.1/${targetChainId}/${daiTokenAddress}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch DAI price: ${response.status} ${response.statusText}`);
      }

      const priceData = await response.json();
      const daiPrice = priceData[daiTokenAddress];
      
      if (daiPrice && daiPrice > 0) {
        console.log(`DAI price: ₹${daiPrice.toFixed(2)}`);
        return daiPrice;
      } else {
        console.warn('DAI price not found in response, using fallback');
        return 83; // Fallback price (~1 USD)
      }
    } catch (error) {
      console.error('Error getting DAI price:', error);
      return 83; // Fallback price
    }
  }

  calculateETHValueInINR(ethAmount: number, ethPriceINR: number): number {
    return ethAmount * ethPriceINR;
  }

  calculateDAIValueInINR(daiAmount: number, daiPriceINR: number): number {
    return daiAmount * daiPriceINR;
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.priceCache = {};
    console.log('Price cache cleared');
  }

  async getGasPrice(chainId?: number): Promise<{ standard: number; fast: number; instant: number } | null> {
    const targetChainId = chainId || 8453; // Default to Base mainnet
    
    try {
      console.log(`Fetching gas price for chain ${targetChainId}`);
      const response = await fetch(`${this.baseURL}/gas-price/v1.6/${targetChainId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch gas price: ${response.status} ${response.statusText}`);
      }

      const gasData = await response.json();
      console.log('Raw gas data:', gasData);
      
      // Parse the actual response structure
      // Convert from wei to gwei for display (keep decimals for low gas chains like Base)
      const standard = parseFloat((parseInt(gasData.low?.maxFeePerGas || '0') / 1e9).toFixed(3));
      const fast = parseFloat((parseInt(gasData.medium?.maxFeePerGas || '0') / 1e9).toFixed(3));
      const instant = parseFloat((parseInt(gasData.instant?.maxFeePerGas || '0') / 1e9).toFixed(3));
      
      console.log(`Gas prices (gwei): Standard=${standard}, Fast=${fast}, Instant=${instant}`);
      return { standard, fast, instant };
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return null;
    }
  }

  // Get cache status for debugging
  getCacheInfo(): { [chainId: number]: { age: number; count: number } } {
    const info: { [chainId: number]: { age: number; count: number } } = {};
    
    for (const [chainId, cache] of Object.entries(this.priceCache)) {
      info[parseInt(chainId)] = {
        age: Date.now() - cache.timestamp,
        count: Object.keys(cache.prices).length
      };
    }
    
    return info;
  }
}

export const priceService = new PriceService();