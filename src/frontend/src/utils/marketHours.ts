export type MarketStatus = "open" | "closed" | "always_open";

export function getMarketStatus(category: string): MarketStatus {
  if (category === "crypto") return "always_open";

  // Get current IST time
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
  const istTime = new Date(
    now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000,
  );

  const day = istTime.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const timeMinutes = hours * 60 + minutes;

  if (category === "forex") {
    // Forex: Mon 5:00 AM IST to Sat 5:00 AM IST (Mon–Fri open, Sat/Sun closed based on 5AM boundary)
    // Closed: Sunday all day, Saturday after 5:00 AM
    if (day === 0) return "closed"; // Sunday fully closed
    if (day === 6 && timeMinutes >= 5 * 60) return "closed"; // Sat after 5 AM closed
    if (day === 1 && timeMinutes < 5 * 60) return "closed"; // Mon before 5 AM closed
    return "open";
  }

  // Weekend check (Sat=6, Sun=0) for stock and commodity
  if (day === 0 || day === 6) return "closed";

  if (category === "stock") {
    // NSE: 9:00 AM – 3:30 PM IST
    const open = 9 * 60;
    const close = 15 * 60 + 30;
    return timeMinutes >= open && timeMinutes < close ? "open" : "closed";
  }

  if (category === "commodity") {
    // MCX: 9:00 AM – 11:55 PM IST
    const open = 9 * 60;
    const close = 23 * 60 + 55;
    return timeMinutes >= open && timeMinutes < close ? "open" : "closed";
  }

  return "open";
}

export function getMarketHoursText(category: string): string {
  if (category === "crypto") return "24/7 Open · No Holidays";
  if (category === "forex") return "Mon 5:00 AM – Sat 5:00 AM IST";
  if (category === "stock") return "Mon–Fri · 9:00 AM – 3:30 PM IST";
  if (category === "commodity") return "Mon–Fri · 9:00 AM – 11:55 PM IST";
  return "";
}

export function getMarketLabel(category: string): string {
  if (category === "stock") return "NSE Stocks";
  if (category === "commodity") return "MCX Commodities";
  if (category === "crypto") return "Crypto";
  if (category === "forex") return "Forex";
  return category;
}
