import { Category } from "../backend.d";

export interface SeedInstrument {
  symbol: string;
  name: string;
  category: Category;
  currentPrice: number;
  previousClose: number;
}

export const SEED_INSTRUMENTS: SeedInstrument[] = [
  // ── Existing Stocks (NSE) ──────────────────────────────────────────────
  { symbol: "RELIANCE", name: "Reliance Industries", category: Category.stock, currentPrice: 2847.50, previousClose: 2820.00 },
  { symbol: "TCS", name: "Tata Consultancy Services", category: Category.stock, currentPrice: 3912.00, previousClose: 3880.00 },
  { symbol: "INFY", name: "Infosys", category: Category.stock, currentPrice: 1743.25, previousClose: 1728.00 },
  { symbol: "HDFCBANK", name: "HDFC Bank", category: Category.stock, currentPrice: 1621.75, previousClose: 1598.00 },
  { symbol: "ICICIBANK", name: "ICICI Bank", category: Category.stock, currentPrice: 1089.50, previousClose: 1075.00 },
  { symbol: "SBIN", name: "State Bank of India", category: Category.stock, currentPrice: 812.30, previousClose: 805.00 },
  { symbol: "WIPRO", name: "Wipro", category: Category.stock, currentPrice: 487.60, previousClose: 480.00 },
  { symbol: "TATAMOTORS", name: "Tata Motors", category: Category.stock, currentPrice: 1023.45, previousClose: 1008.00 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", category: Category.stock, currentPrice: 7234.00, previousClose: 7180.00 },
  { symbol: "NIFTY50", name: "Nifty 50 Index", category: Category.stock, currentPrice: 22456.00, previousClose: 22300.00 },

  // ── Banking & Financial Services ───────────────────────────────────────
  { symbol: "AXISBANK", name: "Axis Bank", category: Category.stock, currentPrice: 1182.40, previousClose: 1165.00 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", category: Category.stock, currentPrice: 1876.30, previousClose: 1852.00 },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", category: Category.stock, currentPrice: 1654.80, previousClose: 1635.00 },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", category: Category.stock, currentPrice: 1534.20, previousClose: 1512.00 },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance", category: Category.stock, currentPrice: 1823.50, previousClose: 1798.00 },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", category: Category.stock, currentPrice: 689.75, previousClose: 678.00 },
  { symbol: "SBILIFE", name: "SBI Life Insurance", category: Category.stock, currentPrice: 1456.80, previousClose: 1438.00 },
  { symbol: "ICICIPRU", name: "ICICI Prudential Life", category: Category.stock, currentPrice: 678.45, previousClose: 665.00 },

  // ── IT & Technology ────────────────────────────────────────────────────
  { symbol: "HCLTECH", name: "HCL Technologies", category: Category.stock, currentPrice: 1678.90, previousClose: 1654.00 },
  { symbol: "TECHM", name: "Tech Mahindra", category: Category.stock, currentPrice: 1534.60, previousClose: 1512.00 },
  { symbol: "PERSISTENT", name: "Persistent Systems", category: Category.stock, currentPrice: 4823.00, previousClose: 4765.00 },
  { symbol: "COFORGE", name: "Coforge", category: Category.stock, currentPrice: 6234.50, previousClose: 6145.00 },
  { symbol: "MPHASIS", name: "Mphasis", category: Category.stock, currentPrice: 2478.30, previousClose: 2445.00 },
  { symbol: "KPITTECH", name: "KPIT Technologies", category: Category.stock, currentPrice: 1876.40, previousClose: 1845.00 },
  { symbol: "MASTEK", name: "Mastek", category: Category.stock, currentPrice: 2134.70, previousClose: 2098.00 },
  { symbol: "INTELLECT", name: "Intellect Design Arena", category: Category.stock, currentPrice: 987.60, previousClose: 968.00 },
  { symbol: "TANLA", name: "Tanla Platforms", category: Category.stock, currentPrice: 1045.80, previousClose: 1023.00 },
  { symbol: "BIRLASOFT", name: "Birlasoft", category: Category.stock, currentPrice: 634.20, previousClose: 618.00 },
  { symbol: "LATENTVIEW", name: "LatentView Analytics", category: Category.stock, currentPrice: 478.90, previousClose: 465.00 },
  { symbol: "HAPPSTMNDS", name: "Happiest Minds Technologies", category: Category.stock, currentPrice: 845.30, previousClose: 828.00 },
  { symbol: "ROUTE", name: "Route Mobile", category: Category.stock, currentPrice: 1567.40, previousClose: 1543.00 },
  { symbol: "RATEGAIN", name: "RateGain Travel", category: Category.stock, currentPrice: 723.80, previousClose: 710.00 },

  // ── FMCG & Consumer ───────────────────────────────────────────────────
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", category: Category.stock, currentPrice: 2435.60, previousClose: 2412.00 },
  { symbol: "ITC", name: "ITC Limited", category: Category.stock, currentPrice: 456.80, previousClose: 451.00 },
  { symbol: "NESTLE", name: "Nestle India", category: Category.stock, currentPrice: 24378.00, previousClose: 24120.00 },
  { symbol: "DABUR", name: "Dabur India", category: Category.stock, currentPrice: 589.40, previousClose: 580.00 },
  { symbol: "GODREJCP", name: "Godrej Consumer Products", category: Category.stock, currentPrice: 1234.70, previousClose: 1214.00 },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", category: Category.stock, currentPrice: 1089.30, previousClose: 1072.00 },
  { symbol: "MARICO", name: "Marico", category: Category.stock, currentPrice: 623.50, previousClose: 615.00 },
  { symbol: "EMAMILTD", name: "Emami", category: Category.stock, currentPrice: 756.80, previousClose: 743.00 },

  // ── Pharma & Healthcare ───────────────────────────────────────────────
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", category: Category.stock, currentPrice: 1678.90, previousClose: 1652.00 },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories", category: Category.stock, currentPrice: 5678.40, previousClose: 5598.00 },
  { symbol: "CIPLA", name: "Cipla", category: Category.stock, currentPrice: 1456.70, previousClose: 1432.00 },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", category: Category.stock, currentPrice: 3892.60, previousClose: 3845.00 },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", category: Category.stock, currentPrice: 6234.80, previousClose: 6145.00 },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma", category: Category.stock, currentPrice: 1234.50, previousClose: 1212.00 },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals", category: Category.stock, currentPrice: 2876.40, previousClose: 2834.00 },

  // ── Auto & Engineering ────────────────────────────────────────────────
  { symbol: "MARUTI", name: "Maruti Suzuki India", category: Category.stock, currentPrice: 10234.00, previousClose: 10120.00 },
  { symbol: "EICHERMOT", name: "Eicher Motors", category: Category.stock, currentPrice: 4567.80, previousClose: 4498.00 },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", category: Category.stock, currentPrice: 4823.50, previousClose: 4756.00 },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", category: Category.stock, currentPrice: 9234.70, previousClose: 9120.00 },
  { symbol: "LT", name: "Larsen & Toubro", category: Category.stock, currentPrice: 3456.80, previousClose: 3412.00 },
  { symbol: "SIEMENS", name: "Siemens India", category: Category.stock, currentPrice: 6789.40, previousClose: 6698.00 },
  { symbol: "ABB", name: "ABB India", category: Category.stock, currentPrice: 7234.60, previousClose: 7134.00 },
  { symbol: "HAVELLS", name: "Havells India", category: Category.stock, currentPrice: 1678.90, previousClose: 1654.00 },
  { symbol: "VOLTAS", name: "Voltas", category: Category.stock, currentPrice: 1234.50, previousClose: 1212.00 },

  // ── Infrastructure & Energy ───────────────────────────────────────────
  { symbol: "NTPC", name: "NTPC", category: Category.stock, currentPrice: 378.40, previousClose: 372.00 },
  { symbol: "POWERGRID", name: "Power Grid Corp", category: Category.stock, currentPrice: 298.70, previousClose: 294.00 },
  { symbol: "BPCL", name: "BPCL", category: Category.stock, currentPrice: 612.80, previousClose: 604.00 },
  { symbol: "IOC", name: "Indian Oil Corp", category: Category.stock, currentPrice: 178.90, previousClose: 175.00 },
  { symbol: "COALINDIA", name: "Coal India", category: Category.stock, currentPrice: 489.70, previousClose: 483.00 },
  { symbol: "ONGC", name: "ONGC", category: Category.stock, currentPrice: 287.60, previousClose: 283.00 },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ", category: Category.stock, currentPrice: 1456.80, previousClose: 1432.00 },
  { symbol: "ADANIENT", name: "Adani Enterprises", category: Category.stock, currentPrice: 2987.50, previousClose: 2945.00 },
  { symbol: "BEL", name: "Bharat Electronics", category: Category.stock, currentPrice: 234.70, previousClose: 230.00 },
  { symbol: "HAL", name: "Hindustan Aeronautics", category: Category.stock, currentPrice: 3456.80, previousClose: 3412.00 },

  // ── Materials & Chemicals ─────────────────────────────────────────────
  { symbol: "ASIANPAINT", name: "Asian Paints", category: Category.stock, currentPrice: 2987.60, previousClose: 2945.00 },
  { symbol: "BERGEPAINT", name: "Berger Paints India", category: Category.stock, currentPrice: 623.80, previousClose: 614.00 },
  { symbol: "PIDILITIND", name: "Pidilite Industries", category: Category.stock, currentPrice: 2678.40, previousClose: 2634.00 },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", category: Category.stock, currentPrice: 9876.50, previousClose: 9756.00 },
  { symbol: "SHREECEM", name: "Shree Cement", category: Category.stock, currentPrice: 23456.00, previousClose: 23145.00 },
  { symbol: "GRASIM", name: "Grasim Industries", category: Category.stock, currentPrice: 1987.60, previousClose: 1956.00 },
  { symbol: "HINDALCO", name: "Hindalco Industries", category: Category.stock, currentPrice: 678.40, previousClose: 668.00 },

  // ── New Age / Digital ──────────────────────────────────────────────────
  { symbol: "ZOMATO", name: "Zomato", category: Category.stock, currentPrice: 234.80, previousClose: 229.00 },
  { symbol: "NYKAA", name: "Nykaa (FSN E-Commerce)", category: Category.stock, currentPrice: 189.40, previousClose: 185.00 },
  { symbol: "PAYTM", name: "One97 Communications (Paytm)", category: Category.stock, currentPrice: 456.70, previousClose: 448.00 },
  { symbol: "POLICYBZR", name: "PB Fintech (Policybazaar)", category: Category.stock, currentPrice: 1234.80, previousClose: 1212.00 },
  { symbol: "DELHIVERY", name: "Delhivery", category: Category.stock, currentPrice: 456.30, previousClose: 448.00 },
  { symbol: "IRCTC", name: "IRCTC", category: Category.stock, currentPrice: 876.40, previousClose: 862.00 },
  { symbol: "MAPMYINDIA", name: "MapMyIndia (C.E. Info Systems)", category: Category.stock, currentPrice: 1789.50, previousClose: 1762.00 },
  { symbol: "NAZARA", name: "Nazara Technologies", category: Category.stock, currentPrice: 987.60, previousClose: 968.00 },
  { symbol: "SYRMA", name: "Syrma SGS Technology", category: Category.stock, currentPrice: 567.80, previousClose: 556.00 },

  // ── Telecom & Media ───────────────────────────────────────────────────
  { symbol: "BHARTIARTL", name: "Bharti Airtel", category: Category.stock, currentPrice: 1234.50, previousClose: 1212.00 },

  // ── Lifestyle & Retail ────────────────────────────────────────────────
  { symbol: "TITAN", name: "Titan Company", category: Category.stock, currentPrice: 3456.80, previousClose: 3412.00 },

  // ── Crypto ────────────────────────────────────────────────────────────
  { symbol: "BTCUSDT", name: "Bitcoin/USDT", category: Category.crypto, currentPrice: 6821543.00, previousClose: 6750000.00 },
  { symbol: "ETHUSDT", name: "Ethereum/USDT", category: Category.crypto, currentPrice: 358924.00, previousClose: 352000.00 },
  { symbol: "BNBUSDT", name: "BNB/USDT", category: Category.crypto, currentPrice: 47832.00, previousClose: 46500.00 },
  { symbol: "SOLUSDT", name: "Solana/USDT", category: Category.crypto, currentPrice: 19234.00, previousClose: 18800.00 },
  { symbol: "XRPUSDT", name: "XRP/USDT", category: Category.crypto, currentPrice: 54.32, previousClose: 52.00 },

  // ── Forex ─────────────────────────────────────────────────────────────
  { symbol: "USDINR", name: "USD/INR", category: Category.forex, currentPrice: 83.42, previousClose: 83.35 },
  { symbol: "EURINR", name: "EUR/INR", category: Category.forex, currentPrice: 90.15, previousClose: 89.95 },
  { symbol: "GBPINR", name: "GBP/INR", category: Category.forex, currentPrice: 105.78, previousClose: 105.20 },
  { symbol: "JPYINR", name: "JPY/INR", category: Category.forex, currentPrice: 0.5632, previousClose: 0.5598 },
  { symbol: "AUDINR", name: "AUD/INR", category: Category.forex, currentPrice: 54.23, previousClose: 53.98 },

  // ── Commodities ───────────────────────────────────────────────────────
  { symbol: "GOLD", name: "Gold (MCX)", category: Category.commodity, currentPrice: 71245.00, previousClose: 70800.00 },
  { symbol: "SILVER", name: "Silver (MCX)", category: Category.commodity, currentPrice: 89340.00, previousClose: 88500.00 },
  { symbol: "CRUDEOIL", name: "Crude Oil (MCX)", category: Category.commodity, currentPrice: 6823.00, previousClose: 6745.00 },
  { symbol: "NATURALGAS", name: "Natural Gas (MCX)", category: Category.commodity, currentPrice: 198.45, previousClose: 195.00 },
  { symbol: "COPPER", name: "Copper (MCX)", category: Category.commodity, currentPrice: 812.30, previousClose: 808.00 },
];
