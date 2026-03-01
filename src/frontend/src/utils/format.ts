import { Category } from "../backend.d";

/**
 * Format numbers in Indian number system (lakhs/crores)
 */
export function formatIndianNumber(num: number): string {
  if (num >= 10_000_000) {
    return `${(num / 10_000_000).toFixed(2)} Cr`;
  }
  if (num >= 100_000) {
    return `${(num / 100_000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return num.toFixed(2);
}

/**
 * Format price based on category
 */
export function formatPrice(
  price: number,
  category: Category | string,
): string {
  if (category === Category.forex) {
    if (price < 1) return `₹${price.toFixed(4)}`;
    return `₹${price.toFixed(2)}`;
  }
  if (category === Category.crypto) {
    if (price >= 100_000) return `₹${formatIndianNumber(price)}`;
    if (price < 1) return `₹${price.toFixed(4)}`;
    return `₹${price.toFixed(2)}`;
  }
  // Stock and commodity - use Indian system
  if (price >= 100_000) return `₹${formatIndianNumber(price)}`;
  if (price < 10) return `₹${price.toFixed(4)}`;
  return `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format INR balance in Indian system
 */
export function formatBalance(num: number): string {
  if (num >= 10_000_000) {
    return `₹${(num / 10_000_000).toFixed(2)} Cr`;
  }
  if (num >= 100_000) {
    return `₹${(num / 100_000).toFixed(2)} L`;
  }
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format P&L with sign
 */
export function formatPnL(num: number): string {
  const sign = num >= 0 ? "+" : "";
  if (Math.abs(num) >= 10_000_000) {
    return `${sign}₹${(num / 10_000_000).toFixed(2)} Cr`;
  }
  if (Math.abs(num) >= 100_000) {
    return `${sign}₹${(num / 100_000).toFixed(2)} L`;
  }
  return `${sign}₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage change
 */
export function formatPercent(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Format timestamp from bigint
 */
export function formatTimestamp(ts: bigint): string {
  // Backend uses nanoseconds
  const ms = Number(ts) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get leverage multiplier for trade type
 */
export function getLeverage(tradeType: string): number {
  return tradeType === "intraday" ? 500 : 100;
}

/**
 * Calculate required margin
 */
export function calculateMargin(
  price: number,
  quantity: number,
  tradeType: string,
): number {
  const leverage = getLeverage(tradeType);
  return (price * quantity) / leverage;
}

/**
 * Apply random price fluctuation (±0.1% to ±0.5%)
 */
export function fluctuatePrice(basePrice: number): number {
  const variation =
    (Math.random() * 0.004 + 0.001) * (Math.random() > 0.5 ? 1 : -1);
  return basePrice * (1 + variation);
}

/**
 * Category label
 */
export function categoryLabel(cat: Category | string): string {
  const map: Record<string, string> = {
    stock: "STOCKS",
    crypto: "CRYPTO",
    forex: "FOREX",
    commodity: "COMMODITIES",
  };
  return map[cat] ?? cat.toUpperCase();
}
