import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, StarOff, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Category, type Instrument } from "../backend.d";
import { PriceCell } from "../components/PriceCell";
import { TradeDialog } from "../components/TradeDialog";
import type { LivePriceMap } from "../hooks/useLivePrices";
import {
  useAddToWatchlist,
  useGetWatchlist,
  useRemoveFromWatchlist,
} from "../hooks/useQueries";
import { categoryLabel } from "../utils/format";
import {
  getMarketHoursText,
  getMarketLabel,
  getMarketStatus,
} from "../utils/marketHours";

interface MarketsProps {
  instruments: Instrument[];
  liveprices: LivePriceMap;
  isLoading: boolean;
}

const CATEGORY_FILTERS = [
  { value: "all", label: "ALL" },
  { value: Category.stock, label: "STOCKS" },
  { value: Category.crypto, label: "CRYPTO" },
  { value: Category.forex, label: "FOREX" },
  { value: Category.commodity, label: "COMMODITIES" },
] as const;

export function Markets({ instruments, liveprices, isLoading }: MarketsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tradeInstrument, setTradeInstrument] = useState<Instrument | null>(
    null,
  );

  const { data: watchlist = [] } = useGetWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const filtered = useMemo(() => {
    return instruments.filter((inst) => {
      const matchesCategory =
        activeCategory === "all" || inst.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [instruments, activeCategory, searchQuery]);

  const handleWatchlist = async (symbol: string, isInWatchlist: boolean) => {
    try {
      if (isInWatchlist) {
        await removeFromWatchlist.mutateAsync(symbol);
        toast.success(`${symbol} removed from watchlist`);
      } else {
        await addToWatchlist.mutateAsync(symbol);
        toast.success(`${symbol} added to watchlist`);
      }
    } catch {
      toast.error("Failed to update watchlist");
    }
  };

  const MARKET_CATEGORIES = ["stock", "commodity", "crypto", "forex"] as const;

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      {/* Market Status Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MARKET_CATEGORIES.map((cat) => {
          const status = getMarketStatus(cat);
          const label = getMarketLabel(cat);
          const hours = getMarketHoursText(cat);
          return (
            <div
              key={cat}
              className="bg-card border border-border rounded-lg p-3 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-foreground truncate">
                  {label}
                </span>
                {status === "always_open" && (
                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-blue-500/15 text-blue-400 border border-blue-400/20 shrink-0">
                    24/7
                  </Badge>
                )}
                {status === "open" && (
                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-gain-muted text-gain border border-gain/20 shrink-0">
                    Open
                  </Badge>
                )}
                {status === "closed" && (
                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border border-border shrink-0">
                    Closed
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {hours}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Category tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORY_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveCategory(value)}
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors font-mono",
                activeCategory === value
                  ? "bg-gain text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-input border-border font-mono"
          />
        </div>

        <span className="text-xs text-muted-foreground font-mono ml-auto">
          {filtered.length} instruments
        </span>
      </div>

      {/* Instruments table */}
      <Card className="bg-card border-border shadow-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_80px] gap-2 px-4 py-2 border-b border-border bg-secondary/30">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Symbol / Name
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">
            Price
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right hidden sm:block">
            Change
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">
            Actions
          </span>
        </div>

        <div className="divide-y divide-border/50">
          {isLoading ? (
            Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
              <div
                key={key}
                className="grid grid-cols-[2fr_1.5fr_1fr_80px] gap-2 px-4 py-3 items-center"
              >
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-24 ml-auto" />
                <Skeleton className="h-4 w-16 ml-auto hidden sm:block" />
                <Skeleton className="h-7 w-16 ml-auto" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">
                No instruments found
              </p>
            </div>
          ) : (
            filtered.map((instrument) => {
              const lp = liveprices[instrument.symbol];
              const price = lp?.price ?? instrument.currentPrice;
              const changeFromClose =
                ((price - instrument.previousClose) /
                  instrument.previousClose) *
                100;
              const isPositive = changeFromClose >= 0;
              const isInWatchlist = watchlist.includes(instrument.symbol);

              return (
                <div
                  key={instrument.symbol}
                  className="grid grid-cols-[2fr_1.5fr_1fr_80px] gap-2 px-4 py-3 items-center hover:bg-accent/20 transition-colors group"
                >
                  {/* Symbol + Name + Category */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-mono font-semibold text-foreground">
                        {instrument.symbol}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] border-border text-muted-foreground capitalize px-1 py-0 h-4 hidden sm:inline-flex"
                      >
                        {instrument.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {instrument.name}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <PriceCell
                      instrument={instrument}
                      livePrice={lp}
                      showChange={false}
                    />
                  </div>

                  {/* Change */}
                  <div className="text-right hidden sm:block">
                    <span
                      className={`text-xs font-mono font-semibold flex items-center justify-end gap-0.5 ${isPositive ? "text-gain" : "text-loss"}`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {changeFromClose.toFixed(2)}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleWatchlist(instrument.symbol, isInWatchlist)
                      }
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary transition-colors"
                      title={
                        isInWatchlist
                          ? "Remove from watchlist"
                          : "Add to watchlist"
                      }
                    >
                      {isInWatchlist ? (
                        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                      ) : (
                        <StarOff className="w-3.5 h-3.5 text-muted-foreground hover:text-gold" />
                      )}
                    </button>
                    <Button
                      size="sm"
                      onClick={() => setTradeInstrument(instrument)}
                      className="h-7 px-2.5 text-xs bg-gain text-background hover:opacity-80 font-semibold"
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <TradeDialog
        instrument={tradeInstrument}
        livePrice={
          tradeInstrument ? liveprices[tradeInstrument.symbol] : undefined
        }
        open={!!tradeInstrument}
        onClose={() => setTradeInstrument(null)}
      />
    </div>
  );
}
