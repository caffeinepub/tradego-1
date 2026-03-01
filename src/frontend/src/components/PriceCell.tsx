import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Instrument } from "../backend.d";
import type { LivePrice } from "../hooks/useLivePrices";
import { formatPercent, formatPrice } from "../utils/format";

interface PriceCellProps {
  instrument: Instrument;
  livePrice?: LivePrice;
  showChange?: boolean;
  compact?: boolean;
}

export function PriceCell({
  instrument,
  livePrice,
  showChange = true,
  compact = false,
}: PriceCellProps) {
  const price = livePrice?.price ?? instrument.currentPrice;
  const _prevPrice = livePrice?.prevPrice ?? instrument.previousClose;
  const direction = livePrice?.direction ?? "neutral";

  // Calculate change from previous close
  const changeFromClose =
    ((price - instrument.previousClose) / instrument.previousClose) * 100;
  const isPositive = changeFromClose >= 0;

  const [flashClass, setFlashClass] = useState("");
  const prevRef = useRef(price);

  useEffect(() => {
    if (price !== prevRef.current) {
      const isUp = price > prevRef.current;
      setFlashClass(isUp ? "price-blink-up" : "price-blink-down");
      prevRef.current = price;
      const timer = setTimeout(() => setFlashClass(""), 800);
      return () => clearTimeout(timer);
    }
  }, [price]);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`font-mono text-sm font-semibold ${flashClass} rounded px-0.5 transition-colors`}
        >
          {formatPrice(price, instrument.category)}
        </span>
        {showChange && (
          <span
            className={`text-xs font-mono ${isPositive ? "text-gain" : "text-loss"}`}
          >
            {formatPercent(changeFromClose)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="text-right">
      <div
        className={`font-mono text-sm font-semibold ${flashClass} rounded px-0.5 transition-colors ${direction === "up" ? "text-gain" : direction === "down" ? "text-loss" : "text-foreground"}`}
      >
        {formatPrice(price, instrument.category)}
      </div>
      {showChange && (
        <div
          className={`flex items-center justify-end gap-0.5 text-xs font-mono ${isPositive ? "text-gain" : "text-loss"}`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {formatPercent(changeFromClose)}
        </div>
      )}
    </div>
  );
}
