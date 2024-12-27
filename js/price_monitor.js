// Binance API Endpoint
const BASE_URL = 'https://api.binance.com/api/v3';

// Function to fetch all trading pairs containing USDC
async function fetchUSDCTradingPairs() {
  const response = await fetch(`${BASE_URL}/exchangeInfo`);
  const data = await response.json();
  const symbols = data.symbols.filter((symbol) => symbol.symbol.toLowerCase().includes('usdc'));
  return symbols.map((symbol) => symbol.symbol.toLowerCase());
}

// Function to fetch daily kline data for a symbol
async function fetchDailyKline(symbol) {
  const response = await fetch(`${BASE_URL}/klines?symbol=${symbol.toUpperCase()}&interval=1d&limit=1`);
  const data = await response.json();
  const kline = data[0];
  return {
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    time: kline[0]
  };
}

// Function to monitor daily price growth
async function monitorDailyGrowth() {
  const symbols = await fetchUSDCTradingPairs();

  for (const symbol of symbols) {
    try {
      const kline = await fetchDailyKline(symbol);
      const { open, close } = kline;

      // Check for 10% daily increase
      if (close >= open * 1.10) {
        console.log(`DAILY ALERT: ${symbol.toUpperCase()} price increased by 10% since start of day! ${open} -> ${close}`);
      }
    } catch (error) {
      console.error(`Error fetching kline for ${symbol}:`, error);
    }
  }
}