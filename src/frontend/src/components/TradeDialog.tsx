import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Target, TrendingDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Instrument, OrderType, Side, TradeType } from "../backend.d";
import type { LivePrice } from "../hooks/useLivePrices";
import { useGetPortfolioSummary, usePlaceOrder } from "../hooks/useQueries";
import {
  calculateMargin,
  formatBalance,
  formatPrice,
  getLeverage,
} from "../utils/format";
import { getMarketStatus, getTimeUntilOpen } from "../utils/marketHours";

interface TradeDialogProps {
  instrument: Instrument | null;
  livePrice?: LivePrice;
  open: boolean;
  onClose: () => void;
  defaultSide?: Side;
}

export function TradeDialog({
  instrument,
  livePrice,
  open,
  onClose,
  defaultSide,
}: TradeDialogProps) {
  const [side, setSide] = useState<Side>(defaultSide ?? Side.buy);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.intraday);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.market);
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");

  const placeOrder = usePlaceOrder();
  const { data: portfolio } = useGetPortfolioSummary();

  if (!instrument) return null;

  const marketStatus = getMarketStatus(instrument.category);
  const isMarketClosed = marketStatus === "closed";
  const timeUntilOpen = getTimeUntilOpen(instrument.category);

  const currentPrice = livePrice?.price ?? instrument.currentPrice;
  const execPrice =
    orderType === OrderType.market
      ? currentPrice
      : Number.parseFloat(limitPrice) || currentPrice;
  const qty = Number.parseFloat(quantity) || 0;
  const orderValue = execPrice * qty;
  const margin = calculateMargin(execPrice, qty, tradeType);
  const leverage = getLeverage(tradeType);

  const slPrice = Number.parseFloat(stopLossPrice);
  const tpPrice = Number.parseFloat(targetPrice);

  const handlePlaceOrder = async () => {
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (
      orderType !== OrderType.market &&
      (!limitPrice || Number.parseFloat(limitPrice) <= 0)
    ) {
      toast.error("Enter a valid price for limit/stop-loss order");
      return;
    }
    if (stopLossPrice && slPrice > 0) {
      if (side === Side.buy && slPrice >= execPrice) {
        toast.error("Stop Loss must be below entry price for buy orders");
        return;
      }
      if (side === Side.sell && slPrice <= execPrice) {
        toast.error("Stop Loss must be above entry price for sell orders");
        return;
      }
    }
    if (targetPrice && tpPrice > 0) {
      if (side === Side.buy && tpPrice <= execPrice) {
        toast.error("Target Price must be above entry price for buy orders");
        return;
      }
      if (side === Side.sell && tpPrice >= execPrice) {
        toast.error("Target Price must be below entry price for sell orders");
        return;
      }
    }

    try {
      const orderId = await placeOrder.mutateAsync({
        symbol: instrument.symbol,
        quantity: qty,
        price: execPrice,
        orderType,
        tradeType,
        side,
      });

      let successMsg = `Order placed! ID: ${String(orderId).slice(0, 8)}...`;
      if (stopLossPrice && slPrice > 0)
        successMsg += ` | SL: ₹${slPrice.toFixed(2)}`;
      if (targetPrice && tpPrice > 0)
        successMsg += ` | TP: ₹${tpPrice.toFixed(2)}`;
      toast.success(successMsg);
      onClose();
    } catch (_err) {
      toast.error("Failed to place order. Check your margin balance.");
    }
  };

  const isBuy = side === Side.buy;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-foreground">
              {instrument.symbol}
            </span>
            <Badge
              variant="outline"
              className="text-muted-foreground border-border text-xs capitalize"
            >
              {instrument.category}
            </Badge>
            {isMarketClosed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gold-muted text-gold border border-gold/30">
                <AlertTriangle className="w-2.5 h-2.5" />
                MARKET CLOSED
              </span>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{instrument.name}</p>
        </DialogHeader>

        {/* Current price */}
        <div className="bg-secondary/50 rounded-md p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Market Price
          </span>
          <span className="font-mono font-bold text-lg text-foreground">
            {formatPrice(currentPrice, instrument.category)}
          </span>
        </div>

        <div className="space-y-4">
          {/* BUY / SELL toggle */}
          <div
            className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/50 rounded-md"
            data-ocid="trade_dialog.side.toggle"
          >
            <button
              type="button"
              data-ocid="trade_dialog.buy_button"
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
              data-ocid="trade_dialog.sell_button"
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

          {/* INTRADAY / CARRY FORWARD */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Trade Type
            </Label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/50 rounded-md">
              <button
                type="button"
                onClick={() => setTradeType(TradeType.intraday)}
                data-ocid="trade_dialog.intraday_button"
                className={[
                  "py-1.5 rounded text-xs font-semibold transition-all",
                  tradeType === TradeType.intraday
                    ? "bg-gain-muted text-gain border border-gain/30"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                INTRADAY
                <span className="block text-[10px] opacity-70">500x</span>
              </button>
              <button
                type="button"
                onClick={() => setTradeType(TradeType.carryForward)}
                data-ocid="trade_dialog.carry_forward_button"
                className={[
                  "py-1.5 rounded text-xs font-semibold transition-all",
                  tradeType === TradeType.carryForward
                    ? "bg-gold-muted text-gold border border-gold/30"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                CARRY FWD
                <span className="block text-[10px] opacity-70">100x</span>
              </button>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Order Type
            </Label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/50 rounded-md">
              {(
                [
                  { value: OrderType.market, label: "MKT" },
                  { value: OrderType.limit, label: "LMT" },
                  { value: OrderType.stopLoss, label: "SL" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  data-ocid={`trade_dialog.order_type_${value}_button`}
                  onClick={() => setOrderType(value)}
                  className={[
                    "py-1.5 rounded text-xs font-semibold transition-all",
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
              htmlFor="quantity"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block"
            >
              Quantity (Lots)
            </Label>
            <Input
              id="quantity"
              data-ocid="trade_dialog.quantity.input"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="font-mono bg-input border-border text-foreground"
            />
          </div>

          {/* Price (for limit/stop-loss) */}
          {orderType !== OrderType.market && (
            <div>
              <Label
                htmlFor="limitPrice"
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
                  id="limitPrice"
                  data-ocid="trade_dialog.limit_price.input"
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={currentPrice.toFixed(2)}
                  className="pl-7 font-mono bg-input border-border text-foreground"
                />
              </div>
            </div>
          )}

          {/* ── Risk Management: Stop Loss + Target Price ── */}
          <div className="rounded-md border border-border/60 bg-secondary/20 p-3 space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Risk Management (Optional)
            </p>

            {/* Stop Loss */}
            <div>
              <Label
                htmlFor="stopLossPrice"
                className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"
              >
                <TrendingDown className="w-3 h-3 text-loss" />
                Stop Loss Price
                {slPrice > 0 && (
                  <span className="text-loss font-mono ml-auto text-[10px]">
                    ₹{slPrice.toFixed(2)}
                  </span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                  ₹
                </span>
                <Input
                  id="stopLossPrice"
                  data-ocid="trade_dialog.stop_loss.input"
                  type="number"
                  step="0.01"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  placeholder={
                    isBuy
                      ? (currentPrice * 0.97).toFixed(2)
                      : (currentPrice * 1.03).toFixed(2)
                  }
                  className="pl-7 font-mono bg-input border-border text-foreground text-sm h-9"
                />
              </div>
              {slPrice > 0 && execPrice > 0 && (
                <p className="text-[10px] text-loss mt-0.5 font-mono">
                  Risk:{" "}
                  {isBuy
                    ? `₹${Math.abs((execPrice - slPrice) * qty).toFixed(2)} (${(Math.abs((execPrice - slPrice) / execPrice) * 100).toFixed(2)}%)`
                    : `₹${Math.abs((slPrice - execPrice) * qty).toFixed(2)} (${(Math.abs((slPrice - execPrice) / execPrice) * 100).toFixed(2)}%)`}
                </p>
              )}
            </div>

            {/* Target Price */}
            <div>
              <Label
                htmlFor="targetPrice"
                className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"
              >
                <Target className="w-3 h-3 text-gain" />
                Target Price
                {tpPrice > 0 && (
                  <span className="text-gain font-mono ml-auto text-[10px]">
                    ₹{tpPrice.toFixed(2)}
                  </span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                  ₹
                </span>
                <Input
                  id="targetPrice"
                  data-ocid="trade_dialog.target_price.input"
                  type="number"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={
                    isBuy
                      ? (currentPrice * 1.03).toFixed(2)
                      : (currentPrice * 0.97).toFixed(2)
                  }
                  className="pl-7 font-mono bg-input border-border text-foreground text-sm h-9"
                />
              </div>
              {tpPrice > 0 && execPrice > 0 && (
                <p className="text-[10px] text-gain mt-0.5 font-mono">
                  Profit:{" "}
                  {isBuy
                    ? `₹${Math.abs((tpPrice - execPrice) * qty).toFixed(2)} (${(Math.abs((tpPrice - execPrice) / execPrice) * 100).toFixed(2)}%)`
                    : `₹${Math.abs((execPrice - tpPrice) * qty).toFixed(2)} (${(Math.abs((execPrice - tpPrice) / execPrice) * 100).toFixed(2)}%)`}
                </p>
              )}
            </div>

            {/* Risk/Reward ratio */}
            {slPrice > 0 && tpPrice > 0 && execPrice > 0 && (
              <div className="bg-card/60 rounded p-2 text-[10px] font-mono border border-border/50">
                <span className="text-muted-foreground">Risk:Reward = </span>
                <span className="text-foreground font-bold">
                  1 :{" "}
                  {isBuy
                    ? (
                        Math.abs(tpPrice - execPrice) /
                        Math.max(0.01, Math.abs(execPrice - slPrice))
                      ).toFixed(2)
                    : (
                        Math.abs(execPrice - tpPrice) /
                        Math.max(0.01, Math.abs(slPrice - execPrice))
                      ).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Calculated summary */}
          <div className="bg-secondary/30 rounded-md p-3 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Order Value</span>
              <span className="text-foreground">
                {formatBalance(orderValue)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Required Margin ({leverage}x)</span>
              <span className="text-gold font-semibold">
                {formatBalance(margin)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Leverage</span>
              <span className="text-gain font-semibold">{leverage}x</span>
            </div>
            <div className="flex justify-between text-muted-foreground border-t border-border pt-1.5">
              <span>Brokerage</span>
              <span className="text-gain font-bold">₹0.00</span>
            </div>
            {portfolio && margin > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground border-t border-border pt-1.5">
                  <span>Current Balance</span>
                  <span className="text-foreground">
                    {formatBalance(portfolio.availableBalance)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">
                    Balance After Trade
                  </span>
                  <span className={isBuy ? "text-loss" : "text-gain"}>
                    {isBuy ? "−" : "+"}
                    {formatBalance(margin)}{" "}
                    <span className="text-muted-foreground font-normal">
                      →{" "}
                      {formatBalance(
                        Math.max(
                          0,
                          portfolio.availableBalance +
                            (isBuy ? -margin : margin),
                        ),
                      )}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Place Order */}
          <Button
            type="button"
            data-ocid="trade_dialog.place_order.submit_button"
            onClick={handlePlaceOrder}
            disabled={placeOrder.isPending || isMarketClosed}
            className={[
              "w-full font-bold text-sm h-11",
              isMarketClosed
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : isBuy
                  ? "bg-gain text-background hover:opacity-90 glow-gain"
                  : "bg-loss text-foreground hover:opacity-90 glow-loss",
            ].join(" ")}
          >
            {placeOrder.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : isMarketClosed ? (
              "MARKET CLOSED"
            ) : (
              `PLACE ${isBuy ? "BUY" : "SELL"} ORDER`
            )}
          </Button>
          {isMarketClosed && timeUntilOpen && (
            <p className="text-[11px] text-center text-gold/80 mt-1">
              {timeUntilOpen}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
