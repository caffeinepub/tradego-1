import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Activity } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface HeaderProps {
  userName?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "markets", label: "Markets" },
  { id: "trade", label: "Trade" },
  { id: "positions", label: "Positions" },
  { id: "account", label: "Account" },
];

export function Header({ userName, activeTab, onTabChange }: HeaderProps) {
  const { clear } = useInternetIdentity();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Logo + Brand */}
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/generated/tradego-logo-transparent.dim_80x80.png"
            alt="TradeGo.1"
            className="w-8 h-8 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight gradient-brand tracking-tight">TradeGo.1</span>
            <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase leading-tight hidden sm:block">
              Zero Brokerage
            </span>
          </div>

          {/* Badges */}
          <div className="hidden md:flex items-center gap-1.5 ml-2">
            <Badge className="bg-gain-muted text-gain border-0 text-[10px] px-2 py-0.5 font-mono font-semibold">
              <Zap className="w-2.5 h-2.5 mr-1" />
              500x INTRADAY
            </Badge>
            <Badge className="bg-gold-muted text-gold border-0 text-[10px] px-2 py-0.5 font-mono font-semibold">
              ZERO BROKERAGE
            </Badge>
            <Badge className="bg-secondary text-muted-foreground border-0 text-[10px] px-2 py-0.5 font-mono">
              100x CARRY FWD
            </Badge>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse-dot" />
            <span className="font-mono text-[10px]">LIVE</span>
          </div>

          {userName && (
            <span className="hidden md:block text-sm text-muted-foreground truncate max-w-[120px]">
              {userName}
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-0 px-2 overflow-x-auto scrollbar-none border-t border-border/50">
        {NAV_TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={[
              "relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              "border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-gain border-gain"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
            ].join(" ")}
          >
            {tab.id === "trade" && (
              <Activity className="inline w-3 h-3 mr-1 opacity-70" />
            )}
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
