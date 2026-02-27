import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Star, StarOff, Eye, Zap } from "lucide-react";
import {
  useGetPortfolioSummary,
  useGetWatchlist,
  useGetAllInstruments,
  useRemoveFromWatchlist,
} from "../hooks/useQueries";
import { LivePriceMap } from "../hooks/useLivePrices";
import { Instrument } from "../backend.d";
import { PriceCell } from "../components/PriceCell";
import { TradeDialog } from "../components/TradeDialog";
import { formatBalance, formatPnL } from "../utils/format";

interface DashboardProps {
  liveprices: LivePriceMap;
  instruments: Instrument[];
  onNavigate: (tab: string, instrument?: Instrument) => void;
}

export function Dashboard({ liveprices, instruments, onNavigate }: DashboardProps) {
  const { data: portfolio, isLoading: portfolioLoading } = useGetPortfolioSummary();
  const { data: watchlist = [] } = useGetWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const [tradeInstrument, setTradeInstrument] = useState<Instrument | null>(null);

  const watchlistInstruments = instruments.filter((i) => watchlist.includes(i.symbol));

  const portfolioCards = [
    {
      label: "Total Balance",
      value: portfolio ? formatBalance(portfolio.currentValue + portfolio.availableBalance) : null,
      icon: TrendingUp,
      colorClass: "text-gain",
      bgClass: "bg-gain-muted",
    },
    {
      label: "Available Margin",
      value: portfolio ? formatBalance(portfolio.marginAvailable) : null,
      icon: Zap,
      colorClass: "text-gold",
      bgClass: "bg-gold-muted",
    },
    {
      label: "Total P&L",
      value: portfolio ? formatPnL(portfolio.totalPnL) : null,
      icon: portfolio && portfolio.totalPnL >= 0 ? TrendingUp : TrendingDown,
      colorClass: portfolio && portfolio.totalPnL >= 0 ? "text-gain" : "text-loss",
      bgClass: portfolio && portfolio.totalPnL >= 0 ? "bg-gain-muted" : "bg-loss-muted",
    },
    {
      label: "Margin Used",
      value: portfolio ? formatBalance(portfolio.marginUsed) : null,
      icon: Eye,
      colorClass: "text-muted-foreground",
      bgClass: "bg-secondary",
    },
  ];

  return (
    <div className="p-4 space-y-5 max-w-5xl mx-auto">
      {/* Portfolio Summary Cards */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Portfolio Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {portfolioCards.map(({ label, value, icon: Icon, colorClass, bgClass }, idx) => (
            <Card
              key={label}
              className={`bg-card border-border shadow-card animate-fade-in-up stagger-${idx + 1}`}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-muted-foreground leading-tight">{label}</span>
                  <div className={`w-7 h-7 rounded-md ${bgClass} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                  </div>
                </div>
                {portfolioLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className={`text-base font-bold font-mono ${colorClass}`}>{value ?? "—"}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Watchlist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Star className="w-3 h-3 text-gold" />
            Watchlist
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("markets")}
            className="text-xs text-gain hover:text-gain h-6 px-2"
          >
            + Add Instruments
          </Button>
        </div>

        {watchlistInstruments.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <StarOff className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">Your watchlist is empty</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Add instruments from the Markets tab to track them here</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate("markets")}
                className="border-gain text-gain hover:bg-gain-muted text-xs"
              >
                Browse Markets →
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border shadow-card overflow-hidden">
            <div className="divide-y divide-border">
              {watchlistInstruments.map((instrument) => {
                const lp = liveprices[instrument.symbol];
                const price = lp?.price ?? instrument.currentPrice;
                const changeFromClose = ((price - instrument.previousClose) / instrument.previousClose) * 100;
                const isPositive = changeFromClose >= 0;

                return (
                  <div
                    key={instrument.symbol}
                    className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors group"
                  >
                    {/* Left: Symbol + Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold font-mono text-foreground">{instrument.symbol}</span>
                          <Badge variant="outline" className="text-[9px] border-border text-muted-foreground capitalize px-1 py-0 h-4">
                            {instrument.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{instrument.name}</p>
                      </div>
                    </div>

                    {/* Center: Price */}
                    <div className="flex-1 flex justify-center">
                      <PriceCell instrument={instrument} livePrice={lp} showChange />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        onClick={() => setTradeInstrument(instrument)}
                        className="h-7 px-3 text-xs bg-gain text-background hover:opacity-80 font-semibold"
                      >
                        Trade
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromWatchlist.mutate(instrument.symbol)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-loss"
                        title="Remove from watchlist"
                      >
                        <StarOff className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Mobile: show trade button always */}
                    <div className="sm:hidden flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        onClick={() => setTradeInstrument(instrument)}
                        className={`h-6 px-2 text-xs font-semibold ${isPositive ? "bg-gain text-background" : "bg-loss text-foreground"}`}
                      >
                        Trade
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Quick stats for active markets */}
      {instruments.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Top Movers</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {instruments
              .map((i) => {
                const lp = liveprices[i.symbol];
                const price = lp?.price ?? i.currentPrice;
                const pct = ((price - i.previousClose) / i.previousClose) * 100;
                return { ...i, pct, lp };
              })
              .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
              .slice(0, 6)
              .map((instrument) => (
                <button
                  key={instrument.symbol}
                  type="button"
                  onClick={() => setTradeInstrument(instrument)}
                  className="bg-card border border-border rounded-md p-3 text-left hover:border-gain/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-mono font-semibold text-foreground">{instrument.symbol}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">{instrument.name}</p>
                    </div>
                    <span className={`text-xs font-mono font-bold ${instrument.pct >= 0 ? "text-gain" : "text-loss"}`}>
                      {instrument.pct >= 0 ? "+" : ""}{instrument.pct.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      <TradeDialog
        instrument={tradeInstrument}
        livePrice={tradeInstrument ? liveprices[tradeInstrument.symbol] : undefined}
        open={!!tradeInstrument}
        onClose={() => setTradeInstrument(null)}
      />
    </div>
  );
}
