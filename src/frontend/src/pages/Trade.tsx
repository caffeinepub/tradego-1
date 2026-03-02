import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Loader2,
  Search,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Instrument, OrderType, Side, TradeType } from "../backend.d";
import { PriceCell } from "../components/PriceCell";
import type { LivePriceMap } from "../hooks/useLivePrices";
import { usePlaceOrder } from "../hooks/useQueries";
import {
  calculateMargin,
  formatBalance,
  formatPrice,
  getLeverage,
} from "../utils/format";
import {
  getMarketHoursText,
  getMarketLabel,
  getMarketStatus,
} from "../utils/marketHours";

interface TradeProps {
  instruments: Instrument[];
  liveprices: LivePriceMap;
  isLoading: boolean;
  initialInstrument?: Instrument | null;
}

export function Trade({
  instruments,
  liveprices,
  isLoading,
  initialInstrument,
}: TradeProps) {
  const [selected, setSelected] = useState<Instrument | null>(
    initialInstrument ?? null,
  );
  const [search, setSearch] = useState("");
  const [side, setSide] = useState<Side>(Side.buy);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.intraday);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.market);
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");

  const placeOrder = usePlaceOrder();

  const filteredInstruments = instruments.filter(
    (i) =>
      !search ||
      i.symbol.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (inst: Instrument) => {
    setSelected(inst);
    setQuantity("1");
    setLimitPrice("");
  };

  const lp = selected ? liveprices[selected.symbol] : undefined;
  const currentPrice = lp?.price ?? selected?.currentPrice ?? 0;
  const marketStatus = selected ? getMarketStatus(selected.category) : null;
  const execPrice =
    orderType === OrderType.market
      ? currentPrice
      : Number.parseFloat(limitPrice) || currentPrice;
  const qty = Number.parseFloat(quantity) || 0;
  const orderValue = execPrice * qty;
  const margin = selected ? calculateMargin(execPrice, qty, tradeType) : 0;
  const leverage = getLeverage(tradeType);
  const isBuy = side === Side.buy;

  const handlePlaceOrder = async () => {
    if (!selected) {
      toast.error("Select an instrument first");
      return;
    }
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (
      orderType !== OrderType.market &&
      (!limitPrice || Number.parseFloat(limitPrice) <= 0)
    ) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      const orderId = await placeOrder.mutateAsync({
        symbol: selected.symbol,
        quantity: qty,
        price: execPrice,
        orderType,
        tradeType,
        side,
      });
      toast.success(`Order placed! ID: ${String(orderId).slice(0, 8)}...`);
      setQuantity("1");
      setLimitPrice("");
    } catch {
      toast.error("Failed to place order. Check your margin balance.");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Left: Instrument selector */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search instruments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-input border-border font-mono"
            />
          </div>

          <Card className="bg-card border-border shadow-card overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr] gap-2 px-4 py-2 border-b border-border bg-secondary/30">
              {["Instrument", "Price", "Change"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right first:text-left"
                >
                  {h}
                </span>
              ))}
            </div>
            <div className="divide-y divide-border/50 max-h-[calc(100vh-300px)] overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 6 }, (_, i) => `tr-skel-${i}`).map(
                  (key) => (
                    <div
                      key={key}
                      className="grid grid-cols-[2fr_1.5fr_1fr] gap-2 px-4 py-3 items-center"
                    >
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-4 w-20 ml-auto" />
                      <Skeleton className="h-4 w-14 ml-auto" />
                    </div>
                  ),
                )
              ) : filteredInstruments.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No instruments found
                </div>
              ) : (
                filteredInstruments.map((inst) => {
                  const ilp = liveprices[inst.symbol];
                  const iprice = ilp?.price ?? inst.currentPrice;
                  const pct =
                    ((iprice - inst.previousClose) / inst.previousClose) * 100;
                  const isPositive = pct >= 0;
                  const isActive = selected?.symbol === inst.symbol;

                  return (
                    <button
                      key={inst.symbol}
                      type="button"
                      onClick={() => handleSelect(inst)}
                      className={[
                        "w-full grid grid-cols-[2fr_1.5fr_1fr] gap-2 px-4 py-2.5 items-center text-left transition-colors",
                        isActive
                          ? "bg-gain-muted/30 border-l-2 border-gain"
                          : "hover:bg-accent/20 border-l-2 border-transparent",
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono font-semibold text-foreground">
                            {inst.symbol}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] border-border text-muted-foreground capitalize px-1 py-0 h-4 hidden sm:inline-flex"
                          >
                            {inst.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {inst.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <PriceCell
                          instrument={inst}
                          livePrice={ilp}
                          showChange={false}
                          compact
                        />
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-semibold flex items-center justify-end gap-0.5 ${isPositive ? "text-gain" : "text-loss"}`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-2.5 h-2.5" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5" />
                          )}
                          {isPositive ? "+" : ""}
                          {pct.toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right: Order form */}
        <div className="space-y-3">
          {selected ? (
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4 space-y-4">
                {/* Instrument header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xl text-foreground">
                        {selected.symbol}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] border-border text-muted-foreground capitalize px-1.5"
                      >
                        {selected.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selected.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg text-foreground">
                      {formatPrice(currentPrice, selected.category)}
                    </p>
                    <p
                      className={`text-xs font-mono ${((currentPrice - selected.previousClose) / selected.previousClose) >= 0 ? "text-gain" : "text-loss"}`}
                    >
                      {(
                        ((currentPrice - selected.previousClose) /
                          selected.previousClose) *
                        100
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                </div>

                {/* Market Closed Warning */}
                {marketStatus === "closed" && (
                  <div className="bg-gold-muted/40 border border-gold/30 rounded-md px-3 py-2.5 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gold">
                        Market Closed —{" "}
                        {getMarketLabel(selected?.category ?? "")}
                      </p>
                      <p className="text-[11px] text-gold/80 mt-0.5">
                        Trading hours:{" "}
                        {getMarketHoursText(selected?.category ?? "")}. Orders
                        can still be placed and will execute when market opens.
                      </p>
                    </div>
                  </div>
                )}

                {/* BUY / SELL toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-secondary/50 rounded-md">
                  <button
                    type="button"
                    onClick={() => setSide(Side.buy)}
                    className={[
                      "py-2 rounded text-sm font-bold transition-all",
                      isBuy
                        ? "bg-gain text-background glow-gain"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide(Side.sell)}
                    className={[
                      "py-2 rounded text-sm font-bold transition-all",
                      !isBuy
                        ? "bg-loss text-foreground glow-loss"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    SELL
                  </button>
                </div>

                {/* Trade type */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Trade Type
                  </Label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-secondary/50 rounded-md">
                    <button
                      type="button"
                      onClick={() => setTradeType(TradeType.intraday)}
                      className={[
                        "py-1.5 rounded text-xs font-semibold transition-all",
                        tradeType === TradeType.intraday
                          ? "bg-gain-muted text-gain border border-gain/30"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      <Zap className="inline w-2.5 h-2.5 mr-0.5" />
                      INTRADAY
                      <span className="block text-[10px] opacity-70">
                        500x leverage
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeType(TradeType.carryForward)}
                      className={[
                        "py-1.5 rounded text-xs font-semibold transition-all",
                        tradeType === TradeType.carryForward
                          ? "bg-gold-muted text-gold border border-gold/30"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      CARRY FWD
                      <span className="block text-[10px] opacity-70">
                        100x leverage
                      </span>
                    </button>
                  </div>
                </div>

                {/* Order type */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Order Type
                  </Label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/50 rounded-md">
                    {(
                      [
                        { value: OrderType.market, label: "MARKET" },
                        { value: OrderType.limit, label: "LIMIT" },
                        { value: OrderType.stopLoss, label: "STOP LOSS" },
                      ] as const
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOrderType(value)}
                        className={[
                          "py-1.5 rounded text-[10px] font-semibold transition-all",
                          orderType === value
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <Label
                    htmlFor="trade-qty"
                    className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block"
                  >
                    Quantity (Lots)
                  </Label>
                  <Input
                    id="trade-qty"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="font-mono bg-input border-border text-foreground h-9"
                  />
                </div>

                {/* Price (limit/SL) */}
                {orderType !== OrderType.market && (
                  <div>
                    <Label
                      htmlFor="trade-price"
                      className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block"
                    >
                      {orderType === OrderType.limit
                        ? "Limit Price"
                        : "Stop-Loss Price"}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                        ₹
                      </span>
                      <Input
                        id="trade-price"
                        type="number"
                        step="0.01"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={currentPrice.toFixed(2)}
                        className="pl-7 font-mono bg-input border-border text-foreground h-9"
                      />
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-secondary/30 rounded-md p-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Order Value</span>
                    <span className="text-foreground">
                      {formatBalance(orderValue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Margin ({leverage}x)</span>
                    <span className="text-gold font-semibold">
                      {formatBalance(margin)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Leverage</span>
                    <span className="text-gain font-bold">{leverage}x</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5">
                    <span className="text-muted-foreground">Brokerage</span>
                    <span className="text-gain font-bold">₹0.00</span>
                  </div>
                </div>

                {/* Place order button */}
                <Button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placeOrder.isPending}
                  className={[
                    "w-full font-bold text-sm h-11",
                    isBuy
                      ? "bg-gain text-background hover:opacity-90 glow-gain"
                      : "bg-loss text-foreground hover:opacity-90 glow-loss",
                  ].join(" ")}
                >
                  {placeOrder.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `PLACE ${isBuy ? "BUY" : "SELL"} ORDER`
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">
                  Select an instrument to trade
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click any row on the left to open the order form
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
