import { useEffect, useRef, useState } from "react";

interface TradingViewWidgetProps {
  symbol: string; // TradingView ticker e.g. "NSE:RELIANCE"
  height?: number;
  theme?: "dark" | "light";
}

export function TradingViewWidget({
  symbol,
  height = 400,
  theme = "dark",
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Defer mount by 300ms to prevent blocking the Trade page initial render
  // biome-ignore lint/correctness/useExhaustiveDependencies: symbol change should reset the ready state
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, [symbol]);

  useEffect(() => {
    if (!ready) return;
    if (!containerRef.current) return;

    // Clean up previous widget
    containerRef.current.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(container);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Asia/Kolkata",
      theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [ready, symbol, theme]);

  if (!ready) {
    return (
      <div
        className="rounded-lg overflow-hidden border border-border bg-card animate-pulse"
        style={{ height: `${height}px`, width: "100%" }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="space-y-3 w-full px-8">
            <div className="h-2 rounded bg-muted/60 w-3/4 mx-auto" />
            <div className="h-2 rounded bg-muted/40 w-1/2 mx-auto" />
            <div className="h-2 rounded bg-muted/30 w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="tradingview-widget-container rounded-lg overflow-hidden border border-border"
      ref={containerRef}
      style={{ height: `${height}px`, width: "100%" }}
    />
  );
}
