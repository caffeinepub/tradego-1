import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Clock,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type Instrument, OrderStatus, Side } from "../backend.d";
import type { LivePriceMap } from "../hooks/useLivePrices";
import {
  useClosePosition,
  useGetOpenPositions,
  useGetOrders,
} from "../hooks/useQueries";
import { formatPnL, formatPrice, formatTimestamp } from "../utils/format";

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

  const getLTP = (symbol: string, fallbackPrice: number): number => {
    const lp = liveprices[symbol];
    if (lp?.price) return lp.price;
    const inst = getInstrument(symbol);
    return inst?.currentPrice ?? fallbackPrice;
  };

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

  // ── Trade History P&L calculations ───────────────────────────────────────

  const tradeStats = useMemo(() => {
    const executedOrders = orders.filter(
      (o) => o.status === OrderStatus.executed,
    );
    const totalTrades = executedOrders.length;

    let totalPnL = 0;
    let realizedPnL = 0;
    let winCount = 0;

    for (const order of executedOrders) {
      const lp = liveprices[order.symbol];
      const inst = instruments.find((i) => i.symbol === order.symbol);
      const ltp = lp?.price ?? inst?.currentPrice ?? order.price;
      const isBuy = order.side === Side.buy;
      let pnl = 0;

      if (isBuy) {
        // Unrealized: based on current live price
        pnl = (ltp - order.price) * order.quantity;
      } else {
        // Approximated realized: sell price vs current price
        pnl = (order.price - ltp) * order.quantity;
        realizedPnL += pnl;
      }
      totalPnL += pnl;
      if (pnl > 0) winCount++;
    }

    const winRate =
      totalTrades > 0 ? Math.round((winCount / totalTrades) * 100) : 0;

    return { totalTrades, totalPnL, realizedPnL, winRate };
  }, [orders, liveprices, instruments]);

  const sortedOrders = useMemo(() => orders.slice().reverse(), [orders]);

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
            label: "Trade History",
            count: orders.length,
          },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            data-ocid={`positions.${id}_tab`}
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

      {/* ── Open Positions ─────────────────────────────────────────────── */}
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
          <Card
            className="bg-card border-border"
            data-ocid="positions.open.empty_state"
          >
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
              {positions.map((pos, idx) => {
                const inst = getInstrument(pos.symbol);
                const lp = liveprices[pos.symbol];
                const ltp = lp?.price ?? inst?.currentPrice ?? pos.avgBuyPrice;
                const unrealizedPnL = (ltp - pos.avgBuyPrice) * pos.quantity;
                const pnlIsPositive = unrealizedPnL >= 0;

                return (
                  <div
                    key={pos.symbol}
                    className="p-4"
                    data-ocid={`positions.open.item.${idx + 1}`}
                  >
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
                        data-ocid={`positions.open.delete_button.${idx + 1}`}
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
                          data-ocid={`positions.open.delete_button.${idx + 1}`}
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

      {/* ── Trade History ──────────────────────────────────────────────── */}
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
          <Card
            className="bg-card border-border"
            data-ocid="positions.history.empty_state"
          >
            <div className="py-16 text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No trade history</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your completed trades will appear here
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Total Trades
                  </p>
                  <p className="text-xl font-bold font-mono text-foreground">
                    {tradeStats.totalTrades}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Total P&L
                  </p>
                  <p
                    className={`text-xl font-bold font-mono ${tradeStats.totalPnL >= 0 ? "text-gain" : "text-loss"}`}
                  >
                    {formatPnL(tradeStats.totalPnL)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Realized P&L
                  </p>
                  <p
                    className={`text-xl font-bold font-mono ${tradeStats.realizedPnL >= 0 ? "text-gain" : "text-loss"}`}
                  >
                    {formatPnL(tradeStats.realizedPnL)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Win Rate
                  </p>
                  <p
                    className={`text-xl font-bold font-mono ${tradeStats.winRate >= 50 ? "text-gain" : "text-loss"}`}
                  >
                    {tradeStats.winRate}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ── Desktop Table ── */}
            <Card className="bg-card border-border shadow-card overflow-hidden hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent bg-secondary/30">
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2">
                      Date/Time
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2">
                      Symbol
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2 text-center">
                      Side
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2 text-center">
                      Type
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2 text-right">
                      Entry Price
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2 text-right">
                      Exit/Current
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2 text-right">
                      Qty
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2 text-right">
                      P&L (₹)
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2 text-right">
                      P&L %
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2 text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.map((order, idx) => {
                    const inst = getInstrument(order.symbol);
                    const isBuy = order.side === Side.buy;
                    const isExecuted = order.status === OrderStatus.executed;

                    const ltp = getLTP(order.symbol, order.price);

                    // Exit/current price display
                    const exitPrice = isBuy ? ltp : order.price;

                    // P&L calculation
                    let pnl: number | null = null;
                    let pnlPct: number | null = null;
                    if (isExecuted) {
                      if (isBuy) {
                        // Unrealized: current LTP vs entry
                        pnl = (ltp - order.price) * order.quantity;
                        pnlPct =
                          order.price > 0
                            ? ((ltp - order.price) / order.price) * 100
                            : 0;
                      } else {
                        // Approximated realized: sell price vs current
                        pnl = (order.price - ltp) * order.quantity;
                        pnlPct =
                          ltp > 0 ? ((order.price - ltp) / ltp) * 100 : 0;
                      }
                    }

                    const pnlIsPos = pnl !== null && pnl >= 0;

                    return (
                      <TableRow
                        key={order.id}
                        data-ocid={`positions.history.item.${idx + 1}`}
                        className="border-border hover:bg-accent/10"
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono py-2.5 whitespace-nowrap">
                          {formatTimestamp(order.timestamp)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono font-semibold text-sm text-foreground">
                            {order.symbol}
                          </span>
                          {inst && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {inst.name}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge
                            className={`text-[9px] px-1.5 border-0 ${isBuy ? "bg-gain-muted text-gain" : "bg-loss-muted text-loss"}`}
                          >
                            {order.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {order.tradeType === "intraday" ? "INTRADAY" : "CF"}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-sm text-foreground">
                          {inst
                            ? formatPrice(order.price, inst.category)
                            : `₹${order.price.toFixed(2)}`}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-sm">
                          {isExecuted ? (
                            <span
                              className={
                                isBuy
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {inst
                                ? formatPrice(exitPrice, inst.category)
                                : `₹${exitPrice.toFixed(2)}`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-sm text-foreground">
                          {order.quantity}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-sm font-semibold">
                          {pnl !== null ? (
                            <span
                              className={`flex items-center justify-end gap-0.5 ${pnlIsPos ? "text-gain" : "text-loss"}`}
                            >
                              {pnlIsPos ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {formatPnL(pnl)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs">
                          {pnlPct !== null ? (
                            <span
                              className={pnlIsPos ? "text-gain" : "text-loss"}
                            >
                              {pnlPct >= 0 ? "+" : ""}
                              {pnlPct.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge
                            className={`text-[9px] px-1.5 border-0 ${statusBg[order.status]} ${statusColor[order.status]}`}
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {/* ── Mobile Cards ── */}
            <div className="md:hidden space-y-2">
              {sortedOrders.map((order, idx) => {
                const inst = getInstrument(order.symbol);
                const isBuy = order.side === Side.buy;
                const isExecuted = order.status === OrderStatus.executed;
                const ltp = getLTP(order.symbol, order.price);
                const exitPrice = isBuy ? ltp : order.price;

                let pnl: number | null = null;
                let pnlPct: number | null = null;
                if (isExecuted) {
                  if (isBuy) {
                    pnl = (ltp - order.price) * order.quantity;
                    pnlPct =
                      order.price > 0
                        ? ((ltp - order.price) / order.price) * 100
                        : 0;
                  } else {
                    pnl = (order.price - ltp) * order.quantity;
                    pnlPct = ltp > 0 ? ((order.price - ltp) / ltp) * 100 : 0;
                  }
                }
                const pnlIsPos = pnl !== null && pnl >= 0;

                return (
                  <Card
                    key={order.id}
                    className="bg-card border-border px-4 py-3"
                    data-ocid={`positions.history.item.${idx + 1}`}
                  >
                    {/* Row 1: Symbol + Side + Status */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-sm text-foreground">
                          {order.symbol}
                        </span>
                        <Badge
                          className={`text-[9px] px-1.5 border-0 ${isBuy ? "bg-gain-muted text-gain" : "bg-loss-muted text-loss"}`}
                        >
                          {order.side.toUpperCase()}
                        </Badge>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">
                          {order.tradeType === "intraday" ? "INTRA" : "CF"}
                        </span>
                      </div>
                      <Badge
                        className={`text-[9px] px-1.5 border-0 ${statusBg[order.status]} ${statusColor[order.status]}`}
                      >
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Row 2: Prices */}
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        Entry:{" "}
                        <span className="text-foreground font-mono">
                          {inst
                            ? formatPrice(order.price, inst.category)
                            : `₹${order.price.toFixed(2)}`}
                        </span>
                      </span>
                      {isExecuted && (
                        <span className="text-muted-foreground">
                          Exit:{" "}
                          <span className="text-foreground font-mono">
                            {inst
                              ? formatPrice(exitPrice, inst.category)
                              : `₹${exitPrice.toFixed(2)}`}
                          </span>
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Qty:{" "}
                        <span className="text-foreground font-mono">
                          {order.quantity}
                        </span>
                      </span>
                    </div>

                    {/* Row 3: P&L + Date */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-mono">
                        {formatTimestamp(order.timestamp)}
                      </span>
                      {pnl !== null ? (
                        <span
                          className={`font-mono font-semibold flex items-center gap-0.5 ${pnlIsPos ? "text-gain" : "text-loss"}`}
                        >
                          {pnlIsPos ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatPnL(pnl)}
                          {pnlPct !== null && (
                            <span className="text-[10px] ml-0.5 opacity-80">
                              ({pnlPct >= 0 ? "+" : ""}
                              {pnlPct.toFixed(2)}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">P&L: —</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
