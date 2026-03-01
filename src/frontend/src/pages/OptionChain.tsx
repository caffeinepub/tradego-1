import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Activity, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OptionData {
  strike: number;
  ce: {
    oi: number;
    changeOi: number;
    volume: number;
    iv: number;
    ltp: number;
    changePct: number;
  };
  pe: {
    ltp: number;
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
  strikeCount: number; // how many above/below ATM
}

// ─── Index configurations ───────────────────────────────────────────────────

const INDEX_CONFIGS: Record<string, IndexConfig> = {
  NIFTY: {
    label: "NIFTY 50",
    spotPrice: 22456.35,
    strikeStep: 50,
    atmStrike: 22450,
    strikeCount: 10,
  },
  SENSEX: {
    label: "SENSEX",
    spotPrice: 73847.15,
    strikeStep: 100,
    atmStrike: 73800,
    strikeCount: 10,
  },
  BANKNIFTY: {
    label: "BANK NIFTY",
    spotPrice: 48234.7,
    strikeStep: 100,
    atmStrike: 48200,
    strikeCount: 10,
  },
};

// ─── Simulated Option Chain Generator ───────────────────────────────────────

function generateOptionChain(config: IndexConfig): OptionData[] {
  const { atmStrike, strikeStep, strikeCount, spotPrice } = config;
  const chain: OptionData[] = [];

  for (let i = -strikeCount; i <= strikeCount; i++) {
    const strike = atmStrike + i * strikeStep;
    const moneyness = (spotPrice - strike) / spotPrice;
    const isITM_CE = spotPrice > strike;
    const isITM_PE = spotPrice < strike;

    // Simulate CE (Call option) values
    const intrinsicCE = Math.max(0, spotPrice - strike);
    const timePremiumCE =
      Math.abs(moneyness) < 0.02
        ? 120 + Math.random() * 80
        : 40 + Math.random() * 60;
    const ceLtp = Math.max(
      0.05,
      intrinsicCE + timePremiumCE * Math.exp(-2 * Math.abs(moneyness)),
    );
    const ceIV = 12 + Math.abs(i) * 0.8 + Math.random() * 3;
    const ceOI = Math.round(
      (isITM_CE ? 1.2 : 0.8) *
        (800000 - Math.abs(i) * 50000) *
        (1 + Math.random() * 0.3),
    );
    const ceChangeOI = Math.round((Math.random() - 0.4) * ceOI * 0.1);
    const ceVolume = Math.round(ceOI * 0.15 * (1 + Math.random()));
    const ceChangePct = (Math.random() - 0.4) * 8;

    // Simulate PE (Put option) values
    const intrinsicPE = Math.max(0, strike - spotPrice);
    const timePremiumPE =
      Math.abs(moneyness) < 0.02
        ? 120 + Math.random() * 80
        : 40 + Math.random() * 60;
    const peLtp = Math.max(
      0.05,
      intrinsicPE + timePremiumPE * Math.exp(-2 * Math.abs(moneyness)),
    );
    const peIV = 12 + Math.abs(i) * 0.8 + Math.random() * 3;
    const peOI = Math.round(
      (isITM_PE ? 1.2 : 0.8) *
        (750000 - Math.abs(i) * 45000) *
        (1 + Math.random() * 0.3),
    );
    const peChangeOI = Math.round((Math.random() - 0.4) * peOI * 0.1);
    const peVolume = Math.round(peOI * 0.15 * (1 + Math.random()));
    const peChangePct = (Math.random() - 0.4) * 8;

    chain.push({
      strike,
      ce: {
        oi: Math.max(10000, ceOI),
        changeOi: ceChangeOI,
        volume: Math.max(100, ceVolume),
        iv: Number(ceIV.toFixed(1)),
        ltp: Number(ceLtp.toFixed(2)),
        changePct: Number(ceChangePct.toFixed(2)),
      },
      pe: {
        ltp: Number(peLtp.toFixed(2)),
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

function ChangeOICell({ value }: { value: number }) {
  const isPos = value >= 0;
  return (
    <span className={`font-mono text-xs ${isPos ? "text-gain" : "text-loss"}`}>
      {isPos ? "+" : ""}
      {formatOI(value)}
    </span>
  );
}

// ─── Option Chain Component ──────────────────────────────────────────────────

export function OptionChain() {
  const [selectedIndex, setSelectedIndex] = useState<string>("NIFTY");
  const [expiry, setExpiry] = useState<string>("weekly");
  const [chainData, setChainData] = useState<OptionData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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

  // Expiry options
  const expiryOptions = [
    { value: "weekly", label: "Weekly (27 Feb 2025)" },
    { value: "monthly", label: "Monthly (27 Mar 2025)" },
    { value: "quarterly", label: "Quarterly (26 Jun 2025)" },
  ];

  // Compute max OI for bar visualization
  const maxCeOI = Math.max(...chainData.map((d) => d.ce.oi));
  const maxPeOI = Math.max(...chainData.map((d) => d.pe.oi));
  const maxOI = Math.max(maxCeOI, maxPeOI);

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
            Live options data · Auto-refreshes every 5 seconds
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
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Index Selector */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(INDEX_CONFIGS).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
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
                  <SelectTrigger className="h-8 text-xs bg-input border-border w-44">
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
            <span className="text-gain">CALLS</span>
            <span className="flex-1 text-center text-foreground">STRIKE</span>
            <span className="text-loss">PUTS</span>
            <TrendingDown className="w-4 h-4 text-loss" />
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {/* CE columns */}
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right">
                  OI
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right hidden xl:table-cell">
                  Chg OI
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right hidden lg:table-cell">
                  Vol
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right hidden lg:table-cell">
                  IV
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right">
                  CE LTP
                </TableHead>
                <TableHead className="text-gain text-[10px] font-semibold uppercase tracking-wider text-right">
                  Chg%
                </TableHead>
                {/* Strike */}
                <TableHead className="text-foreground text-[10px] font-bold uppercase tracking-wider text-center bg-muted/30">
                  STRIKE
                </TableHead>
                {/* PE columns */}
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider">
                  PE LTP
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider hidden lg:table-cell">
                  Chg%
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider hidden lg:table-cell">
                  IV
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider hidden lg:table-cell">
                  Vol
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider hidden xl:table-cell">
                  Chg OI
                </TableHead>
                <TableHead className="text-loss text-[10px] font-semibold uppercase tracking-wider">
                  OI
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chainData.map((row) => {
                const isATM = row.strike === atmStrike;
                const ceBarWidth = `${Math.round((row.ce.oi / maxOI) * 60)}%`;
                const peBarWidth = `${Math.round((row.pe.oi / maxOI) * 60)}%`;

                return (
                  <TableRow
                    key={row.strike}
                    className={`border-border transition-colors ${
                      isATM
                        ? "bg-primary/10 hover:bg-primary/15 border-y border-primary/30"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    {/* CE OI with bar */}
                    <TableCell className="text-right py-2">
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
                    <TableCell className="text-right py-2 hidden xl:table-cell">
                      <ChangeOICell value={row.ce.changeOi} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground text-right py-2 hidden lg:table-cell">
                      {formatOI(row.ce.volume)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground text-right py-2 hidden lg:table-cell">
                      {row.ce.iv}%
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-foreground text-right py-2">
                      {formatPrice(row.ce.ltp)}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <ChangeCell value={row.ce.changePct} />
                    </TableCell>

                    {/* Strike Price — center column */}
                    <TableCell className="text-center py-2 bg-muted/20">
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

                    {/* PE columns */}
                    <TableCell className="font-mono text-sm font-semibold text-foreground py-2">
                      {formatPrice(row.pe.ltp)}
                    </TableCell>
                    <TableCell className="py-2 hidden lg:table-cell">
                      <ChangeCell value={row.pe.changePct} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground py-2 hidden lg:table-cell">
                      {row.pe.iv}%
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground py-2 hidden lg:table-cell">
                      {formatOI(row.pe.volume)}
                    </TableCell>
                    <TableCell className="py-2 hidden xl:table-cell">
                      <ChangeOICell value={row.pe.changeOi} />
                    </TableCell>

                    {/* PE OI with bar */}
                    <TableCell className="py-2">
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
          <span className="text-foreground font-semibold">LTP</span> = Last
          Traded Price
        </span>
        <span>
          <span className="bg-primary text-primary-foreground font-bold px-1 rounded text-[9px]">
            ATM
          </span>{" "}
          = At-the-Money Strike
        </span>
      </div>
    </div>
  );
}
