// Maps TradeGo instrument symbols to TradingView ticker symbols
export function toTVSymbol(symbol: string, category?: string): string {
  // Indices
  const indexMap: Record<string, string> = {
    NIFTY50: "NSE:NIFTY",
    SENSEX: "BSE:SENSEX",
    BANKNIFTY: "NSE:BANKNIFTY",
    NIFTY: "NSE:NIFTY",
  };
  if (indexMap[symbol]) return indexMap[symbol];

  // Crypto — map to Binance USDT pairs
  const cryptoMap: Record<string, string> = {
    BTC: "BINANCE:BTCUSDT",
    ETH: "BINANCE:ETHUSDT",
    BNB: "BINANCE:BNBUSDT",
    SOL: "BINANCE:SOLUSDT",
    XRP: "BINANCE:XRPUSDT",
    ADA: "BINANCE:ADAUSDT",
    DOGE: "BINANCE:DOGEUSDT",
    AVAX: "BINANCE:AVAXUSDT",
    DOT: "BINANCE:DOTUSDT",
    MATIC: "BINANCE:MATICUSDT",
  };
  if (cryptoMap[symbol]) return cryptoMap[symbol];

  // Forex pairs (e.g. USD/INR)
  const forexMap: Record<string, string> = {
    "USD/INR": "FX_IDC:USDINR",
    "EUR/INR": "FX_IDC:EURINR",
    "GBP/INR": "FX_IDC:GBPINR",
    "JPY/INR": "FX_IDC:JPYINR",
    "AUD/INR": "FX_IDC:AUDINR",
  };
  if (forexMap[symbol]) return forexMap[symbol];

  // Commodities
  const commodityMap: Record<string, string> = {
    GOLD: "MCX:GOLDM1!",
    SILVER: "MCX:SILVERM1!",
    CRUDEOIL: "MCX:CRUDEOIL1!",
    NATURALGAS: "MCX:NATURALGAS1!",
    COPPER: "MCX:COPPER1!",
    "CRUDE OIL": "MCX:CRUDEOIL1!",
    "NATURAL GAS": "MCX:NATURALGAS1!",
  };
  if (commodityMap[symbol]) return commodityMap[symbol];

  // Default: treat as NSE stock
  if (category === "crypto") return `BINANCE:${symbol}USDT`;
  if (category === "forex") return `FX_IDC:${symbol.replace("/", "")}`;
  if (category === "commodity") return `MCX:${symbol}1!`;
  return `NSE:${symbol}`;
}
