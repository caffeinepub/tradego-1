import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { OrderType, Side, TradeType } from "../backend.d";
import { useSession } from "../contexts/SessionContext";
import { usePlaceOrder } from "../hooks/useQueries";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OptionData {
  strike: number;
  ce: {
    oi: number;
    changeOi: number;
    volume: number;
    iv: number;
    ltp: number;
    bid: number;
    ask: number;
    changePct: number;
  };
  pe: {
    ltp: number;
    bid: number;
    ask: number;
    changePct: number;
    iv: number;
    volume: number;
    changeOi: number;
    oi: number;
  };
}

interface IndexConfig {
  label: string;
  spotPrice: number;
  strikeStep: number;
  atmStrike: number;
  strikeCount: number;
}

// ─── March 2026 Index configurations ────────────────────────────────────────

const INDEX_CONFIGS: Record<string, IndexConfig> = {
  NIFTY: {
    label: "NIFTY 50",
    spotPrice: 22124.7,
    strikeStep: 50,
    atmStrike: 22100,
    strikeCount: 10,
  },
  SENSEX: {
    label: "SENSEX",
    spotPrice: 73218.4,
    strikeStep: 200,
    atmStrike: 73200,
    strikeCount: 10,
  },
  BANKNIFTY: {
    label: "BANK NIFTY",
    spotPrice: 47386.5,
    strikeStep: 100,
    atmStrike: 47400,
    strikeCount: 10,
  },
};

// ─── Simulated Option Chain Generator with bid/ask ──────────────────────────

function generateOptionChain(config: IndexConfig): OptionData[] {
  const { atmStrike, strikeStep, strikeCount, spotPrice } = config;
  const chain: OptionData[] = [];

  for (let i = -strikeCount; i <= strikeCount; i++) {
    const strike = atmStrike + i * strikeStep;
    const moneyness = (spotPrice - strike) / spotPrice;
    const isITM_CE = spotPrice > strike;
    const isITM_PE = spotPrice < strike;

    // CE (Call option) values
    const intrinsicCE = Math.max(0, spotPrice - strike);
    const timePremiumCE =
      Math.abs(moneyness) < 0.02
        ? 150 + Math.random() * 100
        : 50 + Math.random() * 80;
    const ceLtp = Math.max(
      0.05,
      intrinsicCE + timePremiumCE * Math.exp(-2 * Math.abs(moneyness)),
    );
    const ceIV = 14 + Math.abs(i) * 0.9 + Math.random() * 3;
    const ceOI = Math.round(
      (isITM_CE ? 1.3 : 0.7) *
        (1200000 - Math.abs(i) * 70000) *
        (1 + Math.random() * 0.3),
    );
    const ceChangeOI = Math.round((Math.random() - 0.4) * ceOI * 0.1);
    const ceVolume = Math.round(ceOI * 0.18 * (1 + Math.random()));
    const ceChangePct = (Math.random() - 0.4) * 10;
    // Realistic bid/ask spread: tighter ATM, wider OTM
    const ceBidAskSpread = Math.max(0.05, ceLtp * 0.008 + Math.abs(i) * 0.3);
    const ceBid = Math.max(0.05, ceLtp - ceBidAskSpread / 2);
    const ceAsk = ceLtp + ceBidAskSpread / 2;

    // PE (Put option) values
    const intrinsicPE = Math.max(0, strike - spotPrice);
    const timePremiumPE =
      Math.abs(moneyness) < 0.02
        ? 150 + Math.random() * 100
        : 50 + Math.random() * 80;
    const peLtp = Math.max(
      0.05,
      intrinsicPE + timePremiumPE * Math.exp(-2 * Math.abs(moneyness)),
    );
    const peIV = 14 + Math.abs(i) * 0.9 + Math.random() * 3;
    const peOI = Math.round(
      (isITM_PE ? 1.3 : 0.7) *
        (1100000 - Math.abs(i) * 65000) *
        (1 + Math.random() * 0.3),
    );
    const peChangeOI = Math.round((Math.random() - 0.4) * peOI * 0.1);
    const peVolume = Math.round(peOI * 0.18 * (1 + Math.random()));
    const peChangePct = (Math.random() - 0.4) * 10;
    const peBidAskSpread = Math.max(0.05, peLtp * 0.008 + Math.abs(i) * 0.3);
    const peBid = Math.max(0.05, peLtp - peBidAskSpread / 2);
    const peAsk = peLtp + peBidAskSpread / 2;

    chain.push({
      strike,
      ce: {
        oi: Math.max(10000, ceOI),
        changeOi: ceChangeOI,
        volume: Math.max(100, ceVolume),
        iv: Number(ceIV.toFixed(1)),
        ltp: Number(ceLtp.toFixed(2)),
        bid: Number(ceBid.toFixed(2)),
        ask: Number(ceAsk.toFixed(2)),
        changePct: Number(ceChangePct.toFixed(2)),
      },
      pe: {
        ltp: Number(peLtp.toFixed(2)),
        bid: Number(peBid.toFixed(2)),
        ask: Number(peAsk.toFixed(2)),
        changePct: Number(peChangePct.toFixed(2)),
        iv: Number(peIV.toFixed(1)),
        volume: Math.max(100, peVolume),
        changeOi: peChangeOI,
        oi: Math.max(10000, peOI),
      },
    });
  }

  return chain;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatOI(oi: number): string {
  if (oi >= 1_000_000) return `${(oi / 1_000_000).toFixed(1)}M`;
  if (oi >= 1_000) return `${(oi / 1_000).toFixed(0)}K`;
  return oi.toString();
}

function formatPrice(v: number): string {
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ChangeCell({ value }: { value: number }) {
  const isPos = value >= 0;
  return (
    <span
      className={`font-mono text-xs font-medium ${isPos ? "text-gain" : "text-loss"}`}
    >
      {isPos ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

// ─── Option Trade Dialog ─────────────────────────────────────────────────────

interface OptionTradeDialogProps {
  open: boolean;
  onClose: () => void;
  strike: number;
  optionType: "CE" | "PE";
  side: "BUY" | "SELL";
  ltp: number;
  bid: number;
  ask: number;
  indexLabel: string;
}

function OptionTradeDialog({
  open,
  onClose,
  strike,
  optionType,
  side,
  ltp,
  bid,
  ask,
  indexLabel,
}: OptionTradeDialogProps) {
  const { token } = useSession();
  const placeOrder = usePlaceOrder();
  const [quantity, setQuantity] = useState("1");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");

  const execPrice = side === "BUY" ? ask : bid;
  const qty = Number.parseFloat(quantity) || 0;
  const orderValue = execPrice * qty * 75; // standard lot size
  const _margin = orderValue / 500; // 500x leverage for options

  const isBuy = side === "BUY";

  const handlePlaceOrder = async () => {
    if (!token) {
      toast.error("Login karein order place karne ke liye");
      return;
    }
    if (!qty || qty <= 0) {
      toast.error("Valid quantity enter karein");
      return;
    }
    const symbol = `${indexLabel.replace(" ", "")}${strike}${optionType}`;
    try {
      await placeOrder.mutateAsync({
        symbol,
        quantity: qty * 75,
        price: execPrice,
        orderType: OrderType.market,
        tradeType: TradeType.intraday,
        side: isBuy ? Side.buy : Side.sell,
      });
      toast.success(
        `${side} ${qty} lot(s) ${indexLabel} ${strike} ${optionType} @ ₹${execPrice.toFixed(2)}`,
      );
      onClose();
    } catch {
      toast.error("Order place karne mein error. Balance check karein.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-xs"
        data-ocid="option_trade.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Badge
              className={
                isBuy ? "bg-gain text-background" : "bg-loss text-foreground"
              }
            >
              {side}
            </Badge>
            <span className="font-mono font-bold">
              {indexLabel} {strike} {optionType}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Bid / Ask / LTP */}
          <div className="grid grid-cols-3 gap-1 text-center bg-secondary/40 rounded-md p-2">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Bid</p>
              <p className="font-mono text-xs text-loss font-semibold">
                ₹{bid.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">LTP</p>
              <p className="font-mono text-xs text-foreground font-bold">
                ₹{ltp.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Ask</p>
              <p className="font-mono text-xs text-gain font-semibold">
                ₹{ask.toFixed(2)}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Lots (1 lot = 75 qty)
            </Label>
            <Input
              data-ocid="option_trade.quantity.input"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="font-mono bg-input border-border text-foreground h-8 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-loss mb-1 block flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Stop Loss
              </Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                  ₹
                </span>
                <Input
                  data-ocid="option_trade.stop_loss.input"
                  type="number"
                  step="0.01"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder={
                    isBuy
                      ? (execPrice * 0.8).toFixed(2)
                      : (execPrice * 1.2).toFixed(2)
                  }
                  className="pl-6 font-mono bg-input border-border text-foreground h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-gain mb-1 block flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Target
              </Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                  ₹
                </span>
                <Input
                  data-ocid="option_trade.target.input"
                  type="number"
                  step="0.01"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={
                    isBuy
                      ? (execPrice * 1.2).toFixed(2)
                      : (execPrice * 0.8).toFixed(2)
                  }
                  className="pl-6 font-mono bg-input border-border text-foreground h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-secondary/30 rounded p-2 text-[10px] font-mono space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Exec Price ({isBuy ? "Ask" : "Bid"})</span>
              <span className="text-foreground">₹{execPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Order Value (approx)</span>
              <span className="text-foreground">₹{orderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground border-t border-border pt-1">
              <span>Brokerage</span>
              <span className="text-gain font-bold">₹0.00</span>
            </div>
          </div>

          <Button
            type="button"
            data-ocid="option_trade.submit_button"
            onClick={handlePlaceOrder}
            disabled={placeOrder.isPending}
            className={[
              "w-full font-bold text-sm h-10",
              isBuy
                ? "bg-gain text-background hover:opacity-90"
                : "bg-loss text-foreground hover:opacity-90",
            ].join(" ")}
          >
            {placeOrder.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing...
              </>
            ) : (
              `${side} ${optionType} @ ₹${execPrice.toFixed(2)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Option Chain Component ──────────────────────────────────────────────────

export function OptionChain() {
  const [selectedIndex, setSelectedIndex] = useState<string>("NIFTY");
  const [expiry, setExpiry] = useState<string>("weekly");
  const [chainData, setChainData] = useState<OptionData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Trade dialog state
  const [tradeDialog, setTradeDialog] = useState<{
    open: boolean;
    strike: number;
    optionType: "CE" | "PE";
    side: "BUY" | "SELL";
    ltp: number;
    bid: number;
    ask: number;
  } | null>(null);

  const config = INDEX_CONFIGS[selectedIndex];

  const refreshData = useCallback(() => {
    setChainData(generateOptionChain(config));
    setLastUpdated(new Date());
  }, [config]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Simulate live updates every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      refreshData();
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshData]);

  const atmStrike = config.atmStrike;

  // 2026 expiry options
  const expiryOptions = [
    { value: "weekly", label: "Weekly (06 Mar 2026)" },
    { value: "monthly", label: "Monthly (26 Mar 2026)" },
    { value: "quarterly", label: "Quarterly (25 Jun 2026)" },
  ];

  // Compute max OI for bar visualization
  const maxCeOI = Math.max(...chainData.map((d) => d.ce.oi));
  const maxPeOI = Math.max(...chainData.map((d) => d.pe.oi));
  const maxOI = Math.max(maxCeOI, maxPeOI);

  const openTrade = (
    row: OptionData,
    optionType: "CE" | "PE",
    side: "BUY" | "SELL",
  ) => {
    const opt = optionType === "CE" ? row.ce : row.pe;
    setTradeDialog({
      open: true,
      strike: row.strike,
      optionType,
      side,
      ltp: opt.ltp,
      bid: opt.bid,
      ask: opt.ask,
    });
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Option Chain
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            2026 options data · Auto-refreshes every 5 seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            Updated: {lastUpdated.toLocaleTimeString("en-IN")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            data-ocid="option_chain.refresh_button"
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Index Selector */}
      <div
        className="flex flex-wrap gap-2"
        data-ocid="option_chain.index.toggle"
      >
        {Object.entries(INDEX_CONFIGS).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            data-ocid={`option_chain.index_${key.toLowerCase()}_button`}
            onClick={() => setSelectedIndex(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
              selectedIndex === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Spot Price + Expiry */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {config.label} Spot
                </p>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {formatPrice(config.spotPrice)}
                </p>
              </div>
              <Badge className="bg-gain-muted text-gain border-gain/20 border">
                <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse mr-1.5 inline-block" />
                LIVE
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Expiry
                </p>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger
                    className="h-8 text-xs bg-input border-border w-48"
                    data-ocid="option_chain.expiry.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expiryOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PCR & Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total CE OI",
            value: formatOI(chainData.reduce((s, d) => s + d.ce.oi, 0)),
            color: "text-gain",
          },
          {
            label: "Total PE OI",
            value: formatOI(chainData.reduce((s, d) => s + d.pe.oi, 0)),
            color: "text-loss",
          },
          {
            label: "PCR (OI)",
            value: chainData.length
              ? (
                  chainData.reduce((s, d) => s + d.pe.oi, 0) /
                  Math.max(
                    1,
                    chainData.reduce((s, d) => s + d.ce.oi, 0),
                  )
                ).toFixed(2)
              : "—",
            color: "text-foreground",
          },
          {
            label: "ATM IV (CE)",
            value: chainData.find((d) => d.strike === atmStrike)
              ? `${chainData.find((d) => d.strike === atmStrike)!.ce.iv}%`
              : "—",
            color: "text-gold",
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className={`text-xl font-bold font-mono ${stat.color}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Option Chain Table */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gain" />
            <span className="text-gain">CALLS (CE)</span>
            <span className="flex-1 text-center text-foreground">STRIKE</span>
            <span className="text-loss">PUTS (PE)</span>
            <TrendingDown className="w-4 h-4 text-loss" />
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {/* CE columns */}
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right hidden xl:table-cell">
                  OI
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right hidden lg:table-cell">
                  IV
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right hidden md:table-cell">
                  Bid
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right">
                  CE LTP
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right hidden md:table-cell">
                  Ask
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-center">
                  CE Action
                </TableHead>
                {/* Strike */}
                <TableHead className="text-foreground text-[10px] font-bold uppercase tracking-wider text-center bg-muted/30 min-w-[90px]">
                  STRIKE
                </TableHead>
                {/* PE columns */}
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider text-center">
                  PE Action
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider hidden md:table-cell">
                  Bid
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider">
                  PE LTP
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider hidden md:table-cell">
                  Ask
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider hidden lg:table-cell">
                  IV
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider hidden xl:table-cell">
                  OI
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chainData.map((row, idx) => {
                const isATM = row.strike === atmStrike;
                const ceBarWidth = `${Math.round((row.ce.oi / maxOI) * 50)}%`;
                const peBarWidth = `${Math.round((row.pe.oi / maxOI) * 50)}%`;

                return (
                  <TableRow
                    key={row.strike}
                    data-ocid={`option_chain.row.item.${idx + 1}`}
                    className={`border-border transition-colors ${
                      isATM
                        ? "bg-primary/10 hover:bg-primary/15 border-y border-primary/30"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    {/* CE OI with bar */}
                    <TableCell className="text-right py-1.5 hidden xl:table-cell">
                      <div className="relative flex items-center justify-end gap-1">
                        <div
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-4 bg-gain/10 rounded-sm"
                          style={{ width: ceBarWidth }}
                        />
                        <span className="relative font-mono text-xs text-muted-foreground">
                          {formatOI(row.ce.oi)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground text-right py-1.5 hidden lg:table-cell">
                      {row.ce.iv}%
                    </TableCell>
                    {/* CE Bid */}
                    <TableCell className="font-mono text-xs text-loss text-right py-1.5 hidden md:table-cell">
                      {formatPrice(row.ce.bid)}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-foreground text-right py-1.5">
                      {formatPrice(row.ce.ltp)}
                      <span className="block text-[9px]">
                        <ChangeCell value={row.ce.changePct} />
                      </span>
                    </TableCell>
                    {/* CE Ask */}
                    <TableCell className="font-mono text-xs text-gain text-right py-1.5 hidden md:table-cell">
                      {formatPrice(row.ce.ask)}
                    </TableCell>
                    {/* CE Buy/Sell Buttons */}
                    <TableCell className="py-1.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          data-ocid={`option_chain.ce_buy_button.${idx + 1}`}
                          onClick={() => openTrade(row, "CE", "BUY")}
                          className="h-6 px-2 text-[10px] font-bold bg-gain text-background hover:opacity-80"
                        >
                          B
                        </Button>
                        <Button
                          size="sm"
                          data-ocid={`option_chain.ce_sell_button.${idx + 1}`}
                          onClick={() => openTrade(row, "CE", "SELL")}
                          className="h-6 px-2 text-[10px] font-bold bg-loss text-foreground hover:opacity-80"
                        >
                          S
                        </Button>
                      </div>
                    </TableCell>

                    {/* Strike Price — center column */}
                    <TableCell className="text-center py-1.5 bg-muted/20">
                      <span
                        className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${
                          isATM
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {row.strike.toLocaleString("en-IN")}
                      </span>
                      {isATM && (
                        <p className="text-[9px] text-primary font-semibold uppercase mt-0.5">
                          ATM
                        </p>
                      )}
                    </TableCell>

                    {/* PE Buy/Sell Buttons */}
                    <TableCell className="py-1.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          data-ocid={`option_chain.pe_buy_button.${idx + 1}`}
                          onClick={() => openTrade(row, "PE", "BUY")}
                          className="h-6 px-2 text-[10px] font-bold bg-gain text-background hover:opacity-80"
                        >
                          B
                        </Button>
                        <Button
                          size="sm"
                          data-ocid={`option_chain.pe_sell_button.${idx + 1}`}
                          onClick={() => openTrade(row, "PE", "SELL")}
                          className="h-6 px-2 text-[10px] font-bold bg-loss text-foreground hover:opacity-80"
                        >
                          S
                        </Button>
                      </div>
                    </TableCell>

                    {/* PE Bid */}
                    <TableCell className="font-mono text-xs text-loss py-1.5 hidden md:table-cell">
                      {formatPrice(row.pe.bid)}
                    </TableCell>
                    {/* PE LTP */}
                    <TableCell className="font-mono text-sm font-semibold text-foreground py-1.5">
                      {formatPrice(row.pe.ltp)}
                      <span className="block text-[9px]">
                        <ChangeCell value={row.pe.changePct} />
                      </span>
                    </TableCell>
                    {/* PE Ask */}
                    <TableCell className="font-mono text-xs text-gain py-1.5 hidden md:table-cell">
                      {formatPrice(row.pe.ask)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground py-1.5 hidden lg:table-cell">
                      {row.pe.iv}%
                    </TableCell>

                    {/* PE OI with bar */}
                    <TableCell className="py-1.5 hidden xl:table-cell">
                      <div className="relative flex items-center gap-1">
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 bg-loss/10 rounded-sm"
                          style={{ width: peBarWidth }}
                        />
                        <span className="relative font-mono text-xs text-muted-foreground">
                          {formatOI(row.pe.oi)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pb-4">
        <span>
          <span className="text-foreground font-semibold">CE</span> = Call
          Options
        </span>
        <span>
          <span className="text-foreground font-semibold">PE</span> = Put
          Options
        </span>
        <span>
          <span className="text-foreground font-semibold">OI</span> = Open
          Interest
        </span>
        <span>
          <span className="text-foreground font-semibold">IV</span> = Implied
          Volatility
        </span>
        <span>
          <span className="text-foreground font-semibold">B</span> = Buy &nbsp;
          <span className="text-foreground font-semibold">S</span> = Sell
        </span>
        <span>
          <span className="bg-primary text-primary-foreground font-bold px-1 rounded text-[9px]">
            ATM
          </span>{" "}
          = At-the-Money Strike
        </span>
      </div>

      {/* Option Trade Dialog */}
      {tradeDialog && (
        <OptionTradeDialog
          open={tradeDialog.open}
          onClose={() => setTradeDialog(null)}
          strike={tradeDialog.strike}
          optionType={tradeDialog.optionType}
          side={tradeDialog.side}
          ltp={tradeDialog.ltp}
          bid={tradeDialog.bid}
          ask={tradeDialog.ask}
          indexLabel={config.label}
        />
      )}
    </div>
  );
}
