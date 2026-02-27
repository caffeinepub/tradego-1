import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard,
  BarChart2,
  Users,
  ClipboardList,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowUpFromLine,
  CreditCard,
  QrCode,
  Copy,
} from "lucide-react";

import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  Category,
  OrderStatus,
  OrderType,
  Side,
  TradeType,
  Instrument,
  WithdrawalStatus,
  WithdrawalMethod,
} from "../backend.d";
import {
  useGetAllWithdrawalRequests,
  useApproveWithdrawal,
  useRejectWithdrawal,
  useGetPaymentSettings,
  useSetPaymentSettings,
} from "../hooks/useQueries";

type AdminTab = "dashboard" | "instruments" | "users" | "orders" | "withdrawals" | "payments";

// ─── Admin Queries & Mutations ─────────────────────────────────────────────

function useAdminStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAdminStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

function useAdminUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

function useAdminOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["adminOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

function useAdminInstruments() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["adminInstruments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInstruments();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

function useDeleteInstrument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteInstrument(symbol);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminInstruments"] });
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success("Instrument deleted successfully");
    },
    onError: () => toast.error("Failed to delete instrument"),
  });
}

function useAdminCreateInstrument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      name,
      category,
      currentPrice,
      previousClose,
    }: {
      symbol: string;
      name: string;
      category: Category;
      currentPrice: number;
      previousClose: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createInstrument(symbol, name, category, currentPrice, previousClose);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminInstruments"] });
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success("Instrument created successfully");
    },
    onError: () => toast.error("Failed to create instrument"),
  });
}

function useUpdateInstrumentPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      currentPrice,
      previousClose,
    }: {
      symbol: string;
      currentPrice: number;
      previousClose: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateInstrumentPrice({ symbol, currentPrice, previousClose });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminInstruments"] });
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
      toast.success("Price updated successfully");
    },
    onError: () => toast.error("Failed to update price"),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function truncatePrincipal(principal: { toString(): string }): string {
  const str = principal.toString();
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}…${str.slice(-6)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTimestamp(ts: bigint): string {
  // Motoko timestamps are in nanoseconds
  const ms = Number(ts / 1_000_000n);
  const date = new Date(ms);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getCategoryLabel(cat: Category): string {
  const map: Record<Category, string> = {
    [Category.stock]: "Stock",
    [Category.crypto]: "Crypto",
    [Category.forex]: "Forex",
    [Category.commodity]: "Commodity",
  };
  return map[cat] ?? cat;
}

function getOrderTypelabel(ot: OrderType): string {
  const map: Record<OrderType, string> = {
    [OrderType.market]: "Market",
    [OrderType.limit]: "Limit",
    [OrderType.stopLoss]: "Stop-Loss",
  };
  return map[ot] ?? ot;
}

function getTradeTypeLabel(tt: TradeType): string {
  return tt === TradeType.intraday ? "Intraday" : "Carry Fwd";
}

// ─── Stats Cards ──────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: bigint | number | null | undefined;
  accent: "blue" | "green" | "purple";
  icon: React.ReactNode;
}

function StatCard({ title, value, accent, icon }: StatCardProps) {
  const accentClasses = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    green: "text-gain bg-gain-muted border-gain/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };
  const valueStr = value == null ? "—" : value.toString();

  return (
    <Card className="bg-card border-border shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
              {title}
            </p>
            <p className="text-3xl font-bold font-mono text-foreground">{valueStr}</p>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center border ${accentClasses[accent]}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────

function DashboardTab() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: orders = [], isLoading: ordersLoading } = useAdminOrders();

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers}
              accent="blue"
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Instruments"
              value={stats?.totalInstruments}
              accent="green"
              icon={<BarChart2 className="w-5 h-5" />}
            />
            <StatCard
              title="Total Orders"
              value={stats?.totalOrders}
              accent="purple"
              icon={<ClipboardList className="w-5 h-5" />}
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h2>
        <Card className="bg-card border-border shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Symbol</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Side</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Qty</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Price</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order, idx) => (
                    <TableRow key={order.id} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                      <TableCell className="font-mono text-sm font-medium text-foreground">{order.symbol}</TableCell>
                      <TableCell>
                        <SideBadge side={order.side} />
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground">{order.quantity}</TableCell>
                      <TableCell className="font-mono text-sm text-foreground">{formatCurrency(order.price)}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatTimestamp(order.timestamp)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────

function SideBadge({ side }: { side: Side }) {
  if (side === Side.buy) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-gain-muted text-gain border border-gain/20">
        <TrendingUp className="w-3 h-3" /> Buy
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-loss-muted text-loss border border-loss/20">
      <TrendingDown className="w-3 h-3" /> Sell
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<OrderStatus, { label: string; cls: string }> = {
    [OrderStatus.executed]: { label: "Executed", cls: "bg-gain-muted text-gain border-gain/20" },
    [OrderStatus.pending]: { label: "Pending", cls: "bg-gold-muted text-gold border-gold/20" },
    [OrderStatus.cancelled]: { label: "Cancelled", cls: "bg-muted text-muted-foreground border-border" },
    [OrderStatus.rejected]: { label: "Rejected", cls: "bg-loss-muted text-loss border-loss/20" },
  };
  const v = variants[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${v.cls}`}>
      {v.label}
    </span>
  );
}

// ─── Add Instrument Form ──────────────────────────────────────────────────

interface AddInstrumentFormProps {
  onClose: () => void;
}

function AddInstrumentForm({ onClose }: AddInstrumentFormProps) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>(Category.stock);
  const [currentPrice, setCurrentPrice] = useState("");
  const [previousClose, setPreviousClose] = useState("");

  const createInstrument = useAdminCreateInstrument();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !name || !currentPrice || !previousClose) {
      toast.error("Please fill all fields");
      return;
    }
    createInstrument.mutate(
      {
        symbol: symbol.toUpperCase().trim(),
        name: name.trim(),
        category,
        currentPrice: parseFloat(currentPrice),
        previousClose: parseFloat(previousClose),
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 mb-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Add New Instrument</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Symbol</Label>
            <Input
              placeholder="e.g. AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="h-8 text-sm font-mono bg-input border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              placeholder="e.g. Apple Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm bg-input border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="h-8 text-sm bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Category.stock}>Stock</SelectItem>
                <SelectItem value={Category.crypto}>Crypto</SelectItem>
                <SelectItem value={Category.forex}>Forex</SelectItem>
                <SelectItem value={Category.commodity}>Commodity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Current Price (₹)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="h-8 text-sm font-mono bg-input border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prev Close (₹)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={previousClose}
              onChange={(e) => setPreviousClose(e.target.value)}
              className="h-8 text-sm font-mono bg-input border-border"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={createInstrument.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {createInstrument.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 mr-1.5" />
            )}
            {createInstrument.isPending ? "Creating…" : "Create Instrument"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Edit Price Inline ────────────────────────────────────────────────────

interface EditPriceRowProps {
  instrument: Instrument;
  onClose: () => void;
}

function EditPriceRow({ instrument, onClose }: EditPriceRowProps) {
  const [currentPrice, setCurrentPrice] = useState(instrument.currentPrice.toString());
  const [previousClose, setPreviousClose] = useState(instrument.previousClose.toString());
  const updatePrice = useUpdateInstrumentPrice();

  const handleSave = () => {
    const cp = parseFloat(currentPrice);
    const pc = parseFloat(previousClose);
    if (isNaN(cp) || isNaN(pc)) {
      toast.error("Invalid price values");
      return;
    }
    updatePrice.mutate(
      { symbol: instrument.symbol, currentPrice: cp, previousClose: pc },
      { onSuccess: onClose }
    );
  };

  return (
    <>
      <TableCell className="font-mono text-sm font-medium text-foreground">{instrument.symbol}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{instrument.name}</TableCell>
      <TableCell>
        <span className="px-1.5 py-0.5 rounded text-xs bg-accent text-accent-foreground">
          {getCategoryLabel(instrument.category)}
        </span>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={currentPrice}
          onChange={(e) => setCurrentPrice(e.target.value)}
          className="h-7 w-28 text-xs font-mono bg-input border-border"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={previousClose}
          onChange={(e) => setPreviousClose(e.target.value)}
          className="h-7 w-28 text-xs font-mono bg-input border-border"
        />
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">
        —
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-gain hover:text-gain hover:bg-gain-muted"
            onClick={handleSave}
            disabled={updatePrice.isPending}
          >
            {updatePrice.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </>
  );
}

// ─── Instruments Tab ──────────────────────────────────────────────────────

function InstrumentsTab() {
  const { data: instruments = [], isLoading } = useAdminInstruments();
  const deleteInstrument = useDeleteInstrument();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);

  const handleDelete = (symbol: string) => {
    if (!window.confirm(`Delete instrument "${symbol}"? This cannot be undone.`)) return;
    deleteInstrument.mutate(symbol);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Instruments</h2>
        <Button
          size="sm"
          onClick={() => setShowAddForm((v) => !v)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Instrument
        </Button>
      </div>

      {showAddForm && <AddInstrumentForm onClose={() => setShowAddForm(false)} />}

      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider w-24">Symbol</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Current Price</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Prev Close</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Change %</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : instruments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    No instruments found
                  </TableCell>
                </TableRow>
              ) : (
                instruments.map((inst, idx) => (
                  <TableRow key={inst.symbol} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                    {editingSymbol === inst.symbol ? (
                      <EditPriceRow
                        instrument={inst}
                        onClose={() => setEditingSymbol(null)}
                      />
                    ) : (
                      <>
                        <TableCell className="font-mono text-sm font-semibold text-foreground">{inst.symbol}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{inst.name}</TableCell>
                        <TableCell>
                          <span className="px-1.5 py-0.5 rounded text-xs bg-accent text-accent-foreground">
                            {getCategoryLabel(inst.category)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-foreground">{formatCurrency(inst.currentPrice)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{formatCurrency(inst.previousClose)}</TableCell>
                        <TableCell
                          className={`font-mono text-sm font-medium ${
                            inst.priceChangePercent >= 0 ? "text-gain" : "text-loss"
                          }`}
                        >
                          {inst.priceChangePercent >= 0 ? "+" : ""}
                          {inst.priceChangePercent.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => setEditingSymbol(inst.symbol)}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Edit Price
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-loss hover:text-loss hover:bg-loss-muted"
                              onClick={() => handleDelete(inst.symbol)}
                              disabled={deleteInstrument.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: users = [], isLoading } = useAdminUsers();

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h2 className="text-lg font-semibold text-foreground">Users</h2>
      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Principal</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                    No registered users
                  </TableCell>
                </TableRow>
              ) : (
                users.map(([principal, user], idx) => (
                  <TableRow key={principal.toString()} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-mono text-xs text-muted-foreground" title={principal.toString()}>
                      {truncatePrincipal(principal)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{user.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="font-mono text-sm text-right text-foreground">
                      {formatCurrency(user.balance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────

function OrdersTab() {
  const { data: orders = [], isLoading } = useAdminOrders();

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h2 className="text-lg font-semibold text-foreground">All Orders</h2>
      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Symbol</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Side</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Trade</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Qty</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Price</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Margin</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, idx) => (
                  <TableRow key={order.id} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-mono text-sm font-semibold text-foreground">{order.symbol}</TableCell>
                    <TableCell>
                      <SideBadge side={order.side} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{getOrderTypelabel(order.orderType)}</TableCell>
                    <TableCell>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                        {getTradeTypeLabel(order.tradeType)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-right text-foreground">{order.quantity}</TableCell>
                    <TableCell className="font-mono text-sm text-right text-foreground">{formatCurrency(order.price)}</TableCell>
                    <TableCell className="font-mono text-sm text-right text-muted-foreground">{formatCurrency(order.marginUsed)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(order.timestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ─── Withdrawals Tab ──────────────────────────────────────────────────────

function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const variants: Record<WithdrawalStatus, { label: string; cls: string }> = {
    [WithdrawalStatus.pending]: { label: "Pending", cls: "bg-gold-muted text-gold border-gold/20" },
    [WithdrawalStatus.approved]: { label: "Approved", cls: "bg-gain-muted text-gain border-gain/20" },
    [WithdrawalStatus.rejected]: { label: "Rejected", cls: "bg-loss-muted text-loss border-loss/20" },
  };
  const v = variants[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${v.cls}`}>
      {v.label}
    </span>
  );
}

function WithdrawalsTab() {
  const { data: withdrawals = [], isLoading, refetch } = useGetAllWithdrawalRequests();
  const approveWithdrawal = useApproveWithdrawal();
  const rejectWithdrawal = useRejectWithdrawal();

  const handleApprove = (id: string) => {
    approveWithdrawal.mutate(id, {
      onSuccess: () => toast.success("Withdrawal approved"),
      onError: () => toast.error("Failed to approve withdrawal"),
    });
  };

  const handleReject = (id: string) => {
    rejectWithdrawal.mutate(id, {
      onSuccess: () => toast.success("Withdrawal rejected"),
      onError: () => toast.error("Failed to reject withdrawal"),
    });
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Withdrawal Requests</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
          <ArrowUpFromLine className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>
      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">User</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Method</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Details</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Time</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    No withdrawal requests yet
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((wr, idx) => (
                  <TableRow key={wr.id} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-mono text-xs text-muted-foreground" title={wr.user.toString()}>
                      {truncatePrincipal(wr.user)}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      {formatCurrency(wr.amount)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                        wr.withdrawalMethod === WithdrawalMethod.upi
                          ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                          : "bg-purple-400/10 text-purple-400 border-purple-400/20"
                      }`}>
                        {wr.withdrawalMethod === WithdrawalMethod.upi ? "UPI" : "Bank"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                      {wr.withdrawalMethod === WithdrawalMethod.upi ? (
                        <span className="font-mono">{wr.upiId ?? "—"}</span>
                      ) : (
                        <div className="space-y-0.5">
                          <p>{wr.bankName ?? "—"}</p>
                          <p className="font-mono">{wr.accountNumber ?? "—"}</p>
                          <p className="font-mono text-muted-foreground/60">{wr.ifscCode ?? "—"}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <WithdrawalStatusBadge status={wr.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(wr.requestTime)}
                    </TableCell>
                    <TableCell>
                      {wr.status === WithdrawalStatus.pending && (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-gain text-background hover:bg-gain/90 px-2.5"
                            onClick={() => handleApprove(wr.id)}
                            disabled={approveWithdrawal.isPending}
                          >
                            {approveWithdrawal.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-loss text-loss hover:bg-loss-muted px-2.5"
                            onClick={() => handleReject(wr.id)}
                            disabled={rejectWithdrawal.isPending}
                          >
                            {rejectWithdrawal.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Reject"
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────

function PaymentsTab() {
  const { data: settings, isLoading: settingsLoading } = useGetPaymentSettings();
  const setPaymentSettings = useSetPaymentSettings();
  const [upiId, setUpiId] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim() || !qrCodeData.trim()) {
      toast.error("Please fill both UPI ID and QR Code Data");
      return;
    }
    try {
      await setPaymentSettings.mutateAsync({ upiId: upiId.trim(), qrCodeData: qrCodeData.trim() });
      toast.success("Payment settings saved successfully");
    } catch {
      toast.error("Failed to save payment settings");
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const currentQrIsUrl = settings?.qrCodeData?.startsWith("http");

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground">Payment Settings</h2>

      {/* Set settings form */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Configure Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-upi-id" className="text-xs text-muted-foreground uppercase tracking-wide">
                UPI ID
              </Label>
              <Input
                id="admin-upi-id"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi or yourname@paytm"
                className="bg-input border-border focus:border-primary font-mono"
              />
              <p className="text-xs text-muted-foreground">This UPI ID will be shown to clients when they deposit.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-qr-data" className="text-xs text-muted-foreground uppercase tracking-wide">
                QR Code Data
              </Label>
              <Textarea
                id="admin-qr-data"
                value={qrCodeData}
                onChange={(e) => setQrCodeData(e.target.value)}
                placeholder="upi://pay?pa=yourname@upi&pn=TradeGo1 or https://example.com/qr.png"
                className="bg-input border-border focus:border-primary font-mono text-sm resize-none h-24"
              />
              <p className="text-xs text-muted-foreground">
                Enter a UPI QR string (starts with <code className="bg-muted px-1 py-0.5 rounded text-xs">upi://</code>) or an image URL (starts with <code className="bg-muted px-1 py-0.5 rounded text-xs">https://</code>).
              </p>
            </div>
            <Button
              type="submit"
              disabled={setPaymentSettings.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {setPaymentSettings.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Payment Settings
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current settings preview */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Current Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="space-y-3">
              <div className="h-10 rounded bg-muted animate-pulse" />
              <div className="h-20 rounded bg-muted animate-pulse" />
            </div>
          ) : settings ? (
            <div className="space-y-4">
              {/* UPI ID */}
              <div className="bg-muted/50 border border-border rounded-md px-3 py-2.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">UPI ID</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground flex-1">{settings.upiId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.upiId)}
                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy UPI ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-gain" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* QR Preview */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">QR Code Preview</p>
                {currentQrIsUrl ? (
                  <div className="bg-white rounded-xl p-4 inline-flex border border-border">
                    <img src={settings.qrCodeData} alt="QR Code" className="w-40 h-40 object-contain" />
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1.5">QR String (UPI deep link)</p>
                    <pre className="font-mono text-xs text-foreground break-all whitespace-pre-wrap">{settings.qrCodeData}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No payment settings configured yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Fill the form above to set payment details.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-primary/15 text-primary border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <span className={`${active ? "text-primary" : "text-muted-foreground"}`}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Admin Panel Root ─────────────────────────────────────────────────────

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const { clear, identity } = useInternetIdentity();

  const principalStr = identity?.getPrincipal().toString() ?? "";

  const navItems: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard" },
    { id: "instruments", icon: <BarChart2 className="w-4 h-4" />, label: "Instruments" },
    { id: "users", icon: <Users className="w-4 h-4" />, label: "Users" },
    { id: "orders", icon: <ClipboardList className="w-4 h-4" />, label: "Orders" },
    { id: "withdrawals", icon: <ArrowUpFromLine className="w-4 h-4" />, label: "Withdrawals" },
    { id: "payments", icon: <CreditCard className="w-4 h-4" />, label: "Payments" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-sidebar/95 backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/tradego-logo-transparent.dim_80x80.png"
              alt="TradeGo.1"
              className="w-8 h-8"
            />
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold gradient-brand">TradeGo.1</span>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <span className="text-sm font-semibold text-foreground">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {principalStr && (
              <span className="hidden md:block text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border" title={principalStr}>
                {truncatePrincipal({ toString: () => principalStr })}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clear()}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-sidebar px-3 py-5 gap-1">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sidebar border-t border-border flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "instruments" && <InstrumentsTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "withdrawals" && <WithdrawalsTab />}
          {activeTab === "payments" && <PaymentsTab />}
        </main>
      </div>
    </div>
  );
}
