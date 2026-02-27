import { useState, useEffect, useRef, useCallback } from "react";
import { Instrument } from "../backend.d";
import { fluctuatePrice } from "../utils/format";

export interface LivePrice {
  price: number;
  prevPrice: number;
  direction: "up" | "down" | "neutral";
}

export type LivePriceMap = Record<string, LivePrice>;

/**
 * Simulates live price fluctuations on top of fetched instrument data.
 * Updates every 2-3 seconds with ±0.1-0.5% variation.
 */
export function useLivePrices(instruments: Instrument[]): LivePriceMap {
  const [prices, setPrices] = useState<LivePriceMap>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize prices from instruments
  useEffect(() => {
    if (!instruments.length) return;
    setPrices((prev) => {
      const next: LivePriceMap = { ...prev };
      for (const inst of instruments) {
        if (!next[inst.symbol]) {
          next[inst.symbol] = {
            price: inst.currentPrice,
            prevPrice: inst.previousClose,
            direction: "neutral",
          };
        }
      }
      return next;
    });
  }, [instruments]);

  const tick = useCallback(() => {
    if (!instruments.length) return;
    setPrices((prev) => {
      const next: LivePriceMap = {};
      for (const inst of instruments) {
        const current = prev[inst.symbol]?.price ?? inst.currentPrice;
        const newPrice = fluctuatePrice(current);
        next[inst.symbol] = {
          price: newPrice,
          prevPrice: current,
          direction: newPrice > current ? "up" : newPrice < current ? "down" : "neutral",
        };
      }
      return next;
    });
  }, [instruments]);

  // Start interval with random jitter per tick
  useEffect(() => {
    if (!instruments.length) return;

    const schedule = () => {
      const delay = 2000 + Math.random() * 1000; // 2-3 seconds
      intervalRef.current = setTimeout(() => {
        tick();
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [instruments, tick]);

  return prices;
}
