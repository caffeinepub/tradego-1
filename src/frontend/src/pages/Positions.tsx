import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Clock,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Instrument, OrderStatus } from "../backend.d";
import type { LivePriceMap } from "../hooks/useLivePrices";
import {
  useClosePosition,
  useGetOpenPositions,
  useGetOrders,
} from "../hooks/useQueries";
import {
  formatBalance,
  formatPnL,
  formatPrice,
  formatTimestamp,
} from "../utils/format";

interface PositionsProps {
  instruments: Instrument[];
  liveprices: LivePriceMap;
}

export function Positions({ instruments, liveprices }: PositionsProps) {
  const [activeTab, setActiveTab] = useState<"open" | "history">("open");
  const { data: positions = [], isLoading: positionsLoading } =
    useGetOpenPositions();
  const { data: orders = [], isLoading: ordersLoading } = useGetOrders();
  const closePosition = useClosePosition();

  const getInstrument = (symbol: string) =>
    instruments.find((i) => i.symbol === symbol);

  const handleClose = async (symbol: string, quantity: number) => {
    try {
      await closePosition.mutateAsync({ symbol, quantity });
      toast.success(`Position in ${symbol} closed`);
    } catch {
      toast.error("Failed to close position");
    }
  };

  const statusColor: Record<OrderStatus, string> = {
    [OrderStatus.executed]: "text-gain",
    [OrderStatus.pending]: "text-gold",
    [OrderStatus.cancelled]: "text-muted-foreground",
    [OrderStatus.rejected]: "text-loss",
  };

  const statusBg: Record<OrderStatus, string> = {
    [OrderStatus.executed]: "bg-gain-muted",
    [OrderStatus.pending]: "bg-gold-muted",
    [OrderStatus.cancelled]: "bg-secondary",
    [OrderStatus.rejected]: "bg-loss-muted",
  };

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      {/* Sub-tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {[
          {
            id: "open" as const,
            label: "Open Positions",
            count: positions.length,
          },
          {
            id: "history" as const,
            label: "Order History",
            count: orders.length,
          },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={[
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              activeTab === id
                ? "text-gain border-gain"
                : "text-muted-foreground border-transparent hover:text-foreground",
            ].join(" ")}
          >
            {label}
            {count > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${activeTab === id ? "bg-gain-muted text-gain" : "bg-secondary text-muted-foreground"}`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Open Positions */}
      {activeTab === "open" &&
        (positionsLoading ? (
          <Card className="bg-card border-border">
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }, (_, i) => `pos-skel-${i}`).map(
                (key) => (
                  <Skeleton key={key} className="h-16 w-full" />
                ),
              )}
            </div>
          </Card>
        ) : positions.length === 0 ? (
          <Card className="bg-card border-border">
            <div className="py-16 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No open positions</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start trading to see your positions here
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-card border-border shadow-card overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-2 px-4 py-2 border-b border-border bg-secondary/30">
              {[
                "Symbol",
                "Qty",
                "Avg Price",
                "LTP",
                "P&L",
                "Trade Type",
                "Action",
              ].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right first:text-left"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="divide-y divide-border/50">
              {positions.map((pos) => {
                const inst = getInstrument(pos.symbol);
                const lp = liveprices[pos.symbol];
                const ltp = lp?.price ?? inst?.currentPrice ?? pos.avgBuyPrice;
                const unrealizedPnL = (ltp - pos.avgBuyPrice) * pos.quantity;
                const pnlIsPositive = unrealizedPnL >= 0;

                return (
                  <div key={pos.symbol} className="p-4">
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground">
                              {pos.symbol}
                            </span>
                            <Badge
                              className={`text-[9px] px-1.5 py-0 h-4 border-0 ${pos.tradeType === "intraday" ? "bg-gain-muted text-gain" : "bg-gold-muted text-gold"}`}
                            >
                              {pos.tradeType === "intraday" ? "INTRA" : "CF"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Qty:{" "}
                            <span className="font-mono text-foreground">
                              {pos.quantity}
                            </span>
                            {" · "}Avg:{" "}
                            <span className="font-mono text-foreground">
                              {inst
                                ? formatPrice(pos.avgBuyPrice, inst.category)
                                : pos.avgBuyPrice.toFixed(2)}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-mono font-bold ${pnlIsPositive ? "text-gain" : "text-loss"}`}
                          >
                            {formatPnL(unrealizedPnL)}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            LTP:{" "}
                            {inst
                              ? formatPrice(ltp, inst.category)
                              : ltp.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClose(pos.symbol, pos.quantity)}
                        disabled={closePosition.isPending}
                        className="w-full h-7 text-xs border-loss text-loss hover:bg-loss-muted"
                      >
                        {closePosition.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Close Position"
                        )}
                      </Button>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-2 items-center">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-foreground text-sm">
                            {pos.symbol}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {inst?.name}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-foreground text-right">
                        {pos.quantity}
                      </span>
                      <span className="font-mono text-sm text-foreground text-right">
                        {inst
                          ? formatPrice(pos.avgBuyPrice, inst.category)
                          : pos.avgBuyPrice.toFixed(2)}
                      </span>
                      <span className="font-mono text-sm text-foreground text-right">
                        {inst
                          ? formatPrice(ltp, inst.category)
                          : ltp.toFixed(2)}
                      </span>
                      <span
                        className={`font-mono text-sm font-semibold text-right flex items-center justify-end gap-1 ${pnlIsPositive ? "text-gain" : "text-loss"}`}
                      >
                        {pnlIsPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {formatPnL(unrealizedPnL)}
                      </span>
                      <div className="text-right">
                        <Badge
                          className={`text-[9px] px-1.5 border-0 ${pos.tradeType === "intraday" ? "bg-gain-muted text-gain" : "bg-gold-muted text-gold"}`}
                        >
                          {pos.tradeType === "intraday"
                            ? "INTRADAY"
                            : "CARRY FWD"}
                        </Badge>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClose(pos.symbol, pos.quantity)}
                          disabled={closePosition.isPending}
                          className="h-7 px-2.5 text-xs border-loss text-loss hover:bg-loss-muted"
                        >
                          {closePosition.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Close"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

      {/* Order History */}
      {activeTab === "history" &&
        (ordersLoading ? (
          <Card className="bg-card border-border">
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }, (_, i) => `ord-skel-${i}`).map(
                (key) => (
                  <Skeleton key={key} className="h-12 w-full" />
                ),
              )}
            </div>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="bg-card border-border">
            <div className="py-16 text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No order history</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your past orders will appear here
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-card border-border shadow-card overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[1.5fr_1fr_80px_80px_1fr_1fr_80px] gap-2 px-4 py-2 border-b border-border bg-secondary/30">
              {["Time", "Symbol", "Side", "Type", "Price", "Qty", "Status"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right first:text-left"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>
            <div className="divide-y divide-border/50">
              {orders
                .slice()
                .reverse()
                .map((order) => {
                  const inst = getInstrument(order.symbol);
                  const isBuy = order.side === "buy";
                  return (
                    <div key={order.id} className="px-4 py-3">
                      {/* Mobile */}
                      <div className="md:hidden flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-sm text-foreground">
                              {order.symbol}
                            </span>
                            <Badge
                              className={`text-[9px] px-1.5 border-0 ${isBuy ? "bg-gain-muted text-gain" : "bg-loss-muted text-loss"}`}
                            >
                              {order.side.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTimestamp(order.timestamp)} ·{" "}
                            {order.quantity} units
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-foreground">
                            {inst
                              ? formatPrice(order.price, inst.category)
                              : `₹${order.price.toFixed(2)}`}
                          </p>
                          <Badge
                            className={`text-[9px] px-1.5 border-0 ${statusBg[order.status]} ${statusColor[order.status]}`}
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden md:grid md:grid-cols-[1.5fr_1fr_80px_80px_1fr_1fr_80px] gap-2 items-center">
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTimestamp(order.timestamp)}
                        </span>
                        <span className="font-mono font-semibold text-sm text-foreground">
                          {order.symbol}
                        </span>
                        <div className="text-right">
                          <Badge
                            className={`text-[9px] px-1.5 border-0 ${isBuy ? "bg-gain-muted text-gain" : "bg-loss-muted text-loss"}`}
                          >
                            {order.side.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground uppercase text-right font-mono">
                          {order.orderType}
                        </span>
                        <span className="font-mono text-sm text-foreground text-right">
                          {inst
                            ? formatPrice(order.price, inst.category)
                            : `₹${order.price.toFixed(2)}`}
                        </span>
                        <span className="font-mono text-sm text-foreground text-right">
                          {order.quantity}
                        </span>
                        <div className="text-right">
                          <Badge
                            className={`text-[9px] px-1.5 border-0 ${statusBg[order.status]} ${statusColor[order.status]}`}
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        ))}
    </div>
  );
}
