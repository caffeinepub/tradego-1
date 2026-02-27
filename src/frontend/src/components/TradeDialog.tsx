import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Instrument, OrderType, TradeType, Side } from "../backend.d";
import { LivePrice } from "../hooks/useLivePrices";
import { formatPrice, formatBalance, calculateMargin, getLeverage } from "../utils/format";
import { usePlaceOrder } from "../hooks/useQueries";

interface TradeDialogProps {
  instrument: Instrument | null;
  livePrice?: LivePrice;
  open: boolean;
  onClose: () => void;
}

export function TradeDialog({ instrument, livePrice, open, onClose }: TradeDialogProps) {
  const [side, setSide] = useState<Side>(Side.buy);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.intraday);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.market);
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");

  const placeOrder = usePlaceOrder();

  if (!instrument) return null;

  const currentPrice = livePrice?.price ?? instrument.currentPrice;
  const execPrice = orderType === OrderType.market ? currentPrice : (parseFloat(limitPrice) || currentPrice);
  const qty = parseFloat(quantity) || 0;
  const orderValue = execPrice * qty;
  const margin = calculateMargin(execPrice, qty, tradeType);
  const leverage = getLeverage(tradeType);

  const handlePlaceOrder = async () => {
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (orderType !== OrderType.market && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error("Enter a valid price for limit/stop-loss order");
      return;
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
      toast.success(`Order placed! ID: ${String(orderId).slice(0, 8)}...`);
      onClose();
    } catch (err) {
      toast.error("Failed to place order. Check your margin balance.");
    }
  };

  const isBuy = side === Side.buy;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground">{instrument.symbol}</span>
            <Badge variant="outline" className="text-muted-foreground border-border text-xs capitalize">
              {instrument.category}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{instrument.name}</p>
        </DialogHeader>

        {/* Current price */}
        <div className="bg-secondary/50 rounded-md p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Market Price</span>
          <span className="font-mono font-bold text-lg text-foreground">
            {formatPrice(currentPrice, instrument.category)}
          </span>
        </div>

        <div className="space-y-4">
          {/* BUY / SELL toggle */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/50 rounded-md">
            <button
              type="button"
              onClick={() => setSide(Side.buy)}
              className={[
                "py-2 rounded text-sm font-bold transition-all",
                isBuy ? "bg-gain text-background glow-gain" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => setSide(Side.sell)}
              className={[
                "py-2 rounded text-sm font-bold transition-all",
                !isBuy ? "bg-loss text-foreground glow-loss" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              SELL
            </button>
          </div>

          {/* INTRADAY / CARRY FORWARD */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Trade Type</Label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/50 rounded-md">
              <button
                type="button"
                onClick={() => setTradeType(TradeType.intraday)}
                className={[
                  "py-1.5 rounded text-xs font-semibold transition-all",
                  tradeType === TradeType.intraday ? "bg-gain-muted text-gain border border-gain/30" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                INTRADAY
                <span className="block text-[10px] opacity-70">500x</span>
              </button>
              <button
                type="button"
                onClick={() => setTradeType(TradeType.carryForward)}
                className={[
                  "py-1.5 rounded text-xs font-semibold transition-all",
                  tradeType === TradeType.carryForward ? "bg-gold-muted text-gold border border-gold/30" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                CARRY FWD
                <span className="block text-[10px] opacity-70">100x</span>
              </button>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Order Type</Label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/50 rounded-md">
              {([
                { value: OrderType.market, label: "MKT" },
                { value: OrderType.limit, label: "LMT" },
                { value: OrderType.stopLoss, label: "SL" },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrderType(value)}
                  className={[
                    "py-1.5 rounded text-xs font-semibold transition-all",
                    orderType === value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity" className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Quantity (Lots)
            </Label>
            <Input
              id="quantity"
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
              <Label htmlFor="limitPrice" className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                {orderType === OrderType.limit ? "Limit Price" : "Stop-Loss Price"}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">₹</span>
                <Input
                  id="limitPrice"
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

          {/* Calculated summary */}
          <div className="bg-secondary/30 rounded-md p-3 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Order Value</span>
              <span className="text-foreground">{formatBalance(orderValue)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Required Margin ({leverage}x)</span>
              <span className="text-gold font-semibold">{formatBalance(margin)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Leverage</span>
              <span className="text-gain font-semibold">{leverage}x</span>
            </div>
            <div className="flex justify-between text-muted-foreground border-t border-border pt-1.5">
              <span>Brokerage</span>
              <span className="text-gain font-bold">₹0.00</span>
            </div>
          </div>

          {/* Place Order */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
