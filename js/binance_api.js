// Binance API Endpoint
const BASE_URL = 'https://api.binance.com/api/v3';

// Function to fetch all trading pairs containing USDC
async function fetchUSDCTradingPairs() {
  const response = await fetch(`${BASE_URL}/exchangeInfo`);
  const data = await response.json();
  const symbols = data.symbols.filter((symbol) => symbol.symbol.toLowerCase().endsWith('usdc') && symbol.isSpotTradingAllowed === true && symbol.isMarginTradingAllowed === true);
  return symbols.map((symbol) => ({
    symbol: symbol.symbol.toUpperCase(), 
    asset: symbol.baseAsset, 
    precision: symbol.quoteAssetPrecision
  }));
}

// Function to fetch daily kline data for a specific symbol with a specified limit of days
async function fetchDailyKlines(symbol, limit = 1) {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=${limit}`);
    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error(`No data available for symbol: ${symbol}`);
    }

    // Convert the data to an array of objects with open and close prices for each day
    return data.map(kline => ({
      open: parseFloat(kline[1]), // Open price
      close: parseFloat(kline[4]), // Close price
      high: parseFloat(kline[2]), // High price
      low: parseFloat(kline[3]),  // Low price
      volume: parseFloat(kline[5]), // Volume
      time: new Date(kline[0]) // Open time as a Date object
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    throw error;
  }
}