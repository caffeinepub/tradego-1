import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart2,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  MinusCircle,
  Palette,
  Pencil,
  Plus,
  PlusCircle,
  QrCode,
  RefreshCw,
  Settings,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "../contexts/SessionContext";
import { useActor } from "../hooks/useActor";

import {
  Category,
  CreditCodeStatus,
  DepositStatus,
  type Instrument,
  OrderStatus,
  OrderType,
  Side,
  TradeType,
  WithdrawalMethod,
} from "../backend.d";

// WithdrawalStatus is used in the backend but not yet exported as enum — define locally
enum WithdrawalStatus {
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
}
import {
  useApproveDeposit,
  useApproveWithdrawal,
  useCreateCreditCode,
  useDeleteCreditCode,
  useGetAllCreditCodes,
  useGetAllDepositRequests,
  useGetAllWithdrawalRequests,
  useGetPaymentSettings,
  useRejectDeposit,
  useRejectWithdrawal,
  useSetPaymentSettings,
} from "../hooks/useQueries";

type AdminTab =
  | "dashboard"
  | "instruments"
  | "users"
  | "positions"
  | "orders"
  | "withdrawals"
  | "deposits"
  | "payments"
  | "creditCodes"
  | "settings";

// ─── Admin Queries & Mutations ─────────────────────────────────────────────

function useAdminStats() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor || !token) return null;
      return actor.getAdminStats(token);
    },
    enabled: !!actor && !isFetching && !!token,
    refetchInterval: 30_000,
  });
}

function useAdminUsers() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      if (!actor || !token)
        return [] as [string, import("../backend.d").User][];
      return actor.getAllUsers(token) as Promise<
        [string, import("../backend.d").User][]
      >;
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 30_000,
  });
}

function useAdminOrders() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["adminOrders"],
    queryFn: async () => {
      if (!actor || !token) return [];
      return actor.getAllOrders(token);
    },
    enabled: !!actor && !isFetching && !!token,
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
      return actor.createInstrument(
        symbol,
        name,
        category,
        currentPrice,
        previousClose,
      );
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
      return actor.updateInstrumentPrice({
        symbol,
        currentPrice,
        previousClose,
      });
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
  if (Number.isNaN(date.getTime())) return "—";
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
            <p className="text-3xl font-bold font-mono text-foreground">
              {valueStr}
            </p>
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
              <div
                key={i}
                className="h-24 rounded-lg bg-card border border-border animate-pulse"
              />
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
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Orders
        </h2>
        <Card className="bg-card border-border shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Symbol
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Side
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Qty
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Price
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Time
                  </TableHead>
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
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order, idx) => (
                    <TableRow
                      key={order.id}
                      className={idx % 2 === 0 ? "bg-muted/20" : ""}
                    >
                      <TableCell className="font-mono text-sm font-medium text-foreground">
                        {order.symbol}
                      </TableCell>
                      <TableCell>
                        <SideBadge side={order.side} />
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground">
                        {order.quantity}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground">
                        {formatCurrency(order.price)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(order.timestamp)}
                      </TableCell>
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
    [OrderStatus.executed]: {
      label: "Executed",
      cls: "bg-gain-muted text-gain border-gain/20",
    },
    [OrderStatus.pending]: {
      label: "Pending",
      cls: "bg-gold-muted text-gold border-gold/20",
    },
    [OrderStatus.cancelled]: {
      label: "Cancelled",
      cls: "bg-muted text-muted-foreground border-border",
    },
    [OrderStatus.rejected]: {
      label: "Rejected",
      cls: "bg-loss-muted text-loss border-loss/20",
    },
  };
  const v = variants[status] ?? {
    label: status,
    cls: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${v.cls}`}
    >
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
        currentPrice: Number.parseFloat(currentPrice),
        previousClose: Number.parseFloat(previousClose),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 mb-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Add New Instrument
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
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
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
            >
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
            <Label className="text-xs text-muted-foreground">
              Current Price (₹)
            </Label>
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
            <Label className="text-xs text-muted-foreground">
              Prev Close (₹)
            </Label>
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
  const [currentPrice, setCurrentPrice] = useState(
    instrument.currentPrice.toString(),
  );
  const [previousClose, setPreviousClose] = useState(
    instrument.previousClose.toString(),
  );
  const updatePrice = useUpdateInstrumentPrice();

  const handleSave = () => {
    const cp = Number.parseFloat(currentPrice);
    const pc = Number.parseFloat(previousClose);
    if (Number.isNaN(cp) || Number.isNaN(pc)) {
      toast.error("Invalid price values");
      return;
    }
    updatePrice.mutate(
      { symbol: instrument.symbol, currentPrice: cp, previousClose: pc },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      <TableCell className="font-mono text-sm font-medium text-foreground">
        {instrument.symbol}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {instrument.name}
      </TableCell>
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
    if (
      !window.confirm(`Delete instrument "${symbol}"? This cannot be undone.`)
    )
      return;
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

      {showAddForm && (
        <AddInstrumentForm onClose={() => setShowAddForm(false)} />
      )}

      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider w-24">
                  Symbol
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Category
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Current Price
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Prev Close
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Change %
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Actions
                </TableHead>
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
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No instruments found
                  </TableCell>
                </TableRow>
              ) : (
                instruments.map((inst, idx) => (
                  <TableRow
                    key={inst.symbol}
                    className={idx % 2 === 0 ? "bg-muted/20" : ""}
                  >
                    {editingSymbol === inst.symbol ? (
                      <EditPriceRow
                        instrument={inst}
                        onClose={() => setEditingSymbol(null)}
                      />
                    ) : (
                      <>
                        <TableCell className="font-mono text-sm font-semibold text-foreground">
                          {inst.symbol}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inst.name}
                        </TableCell>
                        <TableCell>
                          <span className="px-1.5 py-0.5 rounded text-xs bg-accent text-accent-foreground">
                            {getCategoryLabel(inst.category)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-foreground">
                          {formatCurrency(inst.currentPrice)}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {formatCurrency(inst.previousClose)}
                        </TableCell>
                        <TableCell
                          className={`font-mono text-sm font-medium ${
                            inst.priceChangePercent >= 0
                              ? "text-gain"
                              : "text-loss"
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

// ─── Admin User Action Mutations ──────────────────────────────────────────

function useAdjustUserBalance() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      amount,
      isDeduct,
    }: { email: string; amount: number; isDeduct: boolean }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.adjustUserBalance(token, email, amount, isDeduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useAdminResetPassword() {
  const { actor } = useActor();
  const { token } = useSession();
  return useMutation({
    mutationFn: async ({
      email,
      newPassword,
    }: { email: string; newPassword: string }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.adminResetPassword(token, email, newPassword);
    },
  });
}

// ─── Users Tab ────────────────────────────────────────────────────────────

type UserActionDialog =
  | { type: "addBalance"; email: string }
  | { type: "deductBalance"; email: string }
  | { type: "resetPassword"; email: string }
  | null;

function UsersTab() {
  const { data: users = [], isLoading, refetch } = useAdminUsers();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<UserActionDialog>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const adjustBalance = useAdjustUserBalance();
  const resetPassword = useAdminResetPassword();

  const handleCopyPrincipal = async (principalStr: string) => {
    try {
      await navigator.clipboard.writeText(principalStr);
      setCopiedId(principalStr);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleBalanceAction = async () => {
    if (!actionDialog || actionDialog.type === "resetPassword") return;
    const amount = Number.parseFloat(actionAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    const isDeduct = actionDialog.type === "deductBalance";
    try {
      await adjustBalance.mutateAsync({
        email: actionDialog.email,
        amount,
        isDeduct,
      });
      toast.success(
        isDeduct
          ? `Deducted ₹${amount} from account`
          : `Added ₹${amount} to account`,
      );
      setActionDialog(null);
      setActionAmount("");
    } catch {
      toast.error("Failed to update balance");
    }
  };

  const handleResetPassword = async () => {
    if (!actionDialog || actionDialog.type !== "resetPassword") return;
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    try {
      await resetPassword.mutateAsync({
        email: actionDialog.email,
        newPassword,
      });
      toast.success("Password reset successfully");
      setActionDialog(null);
      setNewPassword("");
    } catch {
      toast.error("Failed to reset password");
    }
  };

  const closeDialog = () => {
    setActionDialog(null);
    setActionAmount("");
    setNewPassword("");
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Users</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Email / User ID
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Email
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Mobile
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Balance
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No registered users
                  </TableCell>
                </TableRow>
              ) : (
                users.map(([emailKey, user], idx) => {
                  // emailKey is now the user's email string (not Principal)
                  const isExpanded = expandedId === emailKey;
                  return (
                    <TableRow
                      key={emailKey}
                      className={idx % 2 === 0 ? "bg-muted/20" : ""}
                    >
                      {/* Email ID with expand/copy */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : emailKey)
                            }
                            className="text-muted-foreground hover:text-foreground"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span
                            className={`font-mono text-xs ${isExpanded ? "text-foreground break-all" : "text-muted-foreground"}`}
                          >
                            {isExpanded
                              ? emailKey
                              : emailKey.length > 20
                                ? `${emailKey.slice(0, 12)}…${emailKey.slice(-6)}`
                                : emailKey}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPrincipal(emailKey)}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                            title="Copy email"
                          >
                            {copiedId === emailKey ? (
                              <Check className="w-3.5 h-3.5 text-gain" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {user.mobile ? `+91 ${user.mobile}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-right font-semibold text-foreground">
                        {formatCurrency(user.balance)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-gain/80 text-background hover:bg-gain px-2"
                            onClick={() =>
                              setActionDialog({
                                type: "addBalance",
                                email: user.email,
                              })
                            }
                            title="Add Balance"
                          >
                            <PlusCircle className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-loss text-loss hover:bg-loss-muted px-2"
                            onClick={() =>
                              setActionDialog({
                                type: "deductBalance",
                                email: user.email,
                              })
                            }
                            title="Deduct Balance"
                          >
                            <MinusCircle className="w-3 h-3 mr-1" />
                            Deduct
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-border text-muted-foreground hover:text-foreground px-2"
                            onClick={() =>
                              setActionDialog({
                                type: "resetPassword",
                                email: user.email,
                              })
                            }
                            title="Reset Password"
                          >
                            <KeyRound className="w-3 h-3 mr-1" />
                            Reset PW
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {actionDialog?.type === "addBalance" && (
                <>
                  <PlusCircle className="w-4 h-4 text-gain" />
                  Add Balance
                </>
              )}
              {actionDialog?.type === "deductBalance" && (
                <>
                  <MinusCircle className="w-4 h-4 text-loss" />
                  Deduct Balance
                </>
              )}
              {actionDialog?.type === "resetPassword" && (
                <>
                  <KeyRound className="w-4 h-4 text-primary" />
                  Reset Password
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {actionDialog && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Account:{" "}
                <span className="text-foreground font-semibold font-mono">
                  {actionDialog.email}
                </span>
              </p>

              {(actionDialog.type === "addBalance" ||
                actionDialog.type === "deductBalance") && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Amount (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter amount"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      className="pl-7 bg-input border-border font-mono"
                    />
                  </div>
                </div>
              )}

              {actionDialog.type === "resetPassword" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters required
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeDialog}
                >
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${
                    actionDialog.type === "addBalance"
                      ? "bg-gain text-background hover:bg-gain/90"
                      : actionDialog.type === "deductBalance"
                        ? "bg-loss text-background hover:bg-loss/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  onClick={
                    actionDialog.type === "resetPassword"
                      ? handleResetPassword
                      : handleBalanceAction
                  }
                  disabled={adjustBalance.isPending || resetPassword.isPending}
                >
                  {adjustBalance.isPending || resetPassword.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {actionDialog.type === "addBalance"
                    ? "Add Balance"
                    : actionDialog.type === "deductBalance"
                      ? "Deduct Balance"
                      : "Reset Password"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Symbol
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Side
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Type
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Trade
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Qty
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Price
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Margin
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Time
                </TableHead>
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
                  <TableCell
                    colSpan={9}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, idx) => (
                  <TableRow
                    key={order.id}
                    className={idx % 2 === 0 ? "bg-muted/20" : ""}
                  >
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      {order.symbol}
                    </TableCell>
                    <TableCell>
                      <SideBadge side={order.side} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {getOrderTypelabel(order.orderType)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                        {getTradeTypeLabel(order.tradeType)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-right text-foreground">
                      {order.quantity}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-right text-foreground">
                      {formatCurrency(order.price)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-right text-muted-foreground">
                      {formatCurrency(order.marginUsed)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(order.timestamp)}
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

// ─── Admin Positions Mutations ────────────────────────────────────────────

function useGetAllPositions() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["adminPositions"],
    queryFn: async () => {
      if (!actor || !token)
        return [] as [string, import("../backend.d").PositionSummary[]][];
      return actor.getAllPositions(token) as Promise<
        [string, import("../backend.d").PositionSummary[]][]
      >;
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

function useAdminClosePosition() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetEmail,
      symbol,
    }: { targetEmail: string; symbol: string }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.adminClosePosition(token, targetEmail, symbol);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPositions"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useAdminEditPosition() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetEmail,
      symbol,
      newQuantity,
      newAvgPrice,
    }: {
      targetEmail: string;
      symbol: string;
      newQuantity: number;
      newAvgPrice: number;
    }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.adminEditPosition(
        token,
        targetEmail,
        symbol,
        newQuantity,
        newAvgPrice,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPositions"] });
    },
  });
}

// ─── Positions Tab ────────────────────────────────────────────────────────

interface EditPositionState {
  email: string;
  symbol: string;
  quantity: string;
  avgPrice: string;
}

function AdminPositionsTab() {
  const { data: allPositions = [], isLoading, refetch } = useGetAllPositions();
  const closePosition = useAdminClosePosition();
  const editPosition = useAdminEditPosition();
  const [editState, setEditState] = useState<EditPositionState | null>(null);

  // Flatten [string(email), PositionSummary[]][] into rows
  const rows = allPositions.flatMap(([email, positions]) =>
    positions.map((pos) => ({ email, pos })),
  );

  const handleClose = (email: string, symbol: string) => {
    if (!window.confirm(`Close position ${symbol} for this user?`)) return;
    closePosition.mutate(
      { targetEmail: email, symbol },
      {
        onSuccess: () => toast.success(`Position ${symbol} closed`),
        onError: () => toast.error("Failed to close position"),
      },
    );
  };

  const handleEditSave = () => {
    if (!editState) return;
    const qty = Number.parseFloat(editState.quantity);
    const price = Number.parseFloat(editState.avgPrice);
    if (Number.isNaN(qty) || Number.isNaN(price) || qty <= 0 || price <= 0) {
      toast.error("Invalid quantity or price values");
      return;
    }
    editPosition.mutate(
      {
        targetEmail: editState.email,
        symbol: editState.symbol,
        newQuantity: qty,
        newAvgPrice: price,
      },
      {
        onSuccess: () => {
          toast.success(`Position ${editState.symbol} updated`);
          setEditState(null);
        },
        onError: () => toast.error("Failed to edit position"),
      },
    );
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          All Open Positions
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>
      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Symbol
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Qty
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Avg Buy Price
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Type
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Margin Used
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Unreal. PnL
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No open positions
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ email, pos }, idx) => {
                  const isEditing =
                    editState?.symbol === pos.symbol &&
                    editState?.email === email;

                  return (
                    <TableRow
                      key={`${email}-${pos.symbol}`}
                      className={idx % 2 === 0 ? "bg-muted/20" : ""}
                    >
                      <TableCell
                        className="font-mono text-xs text-muted-foreground"
                        title={email}
                      >
                        {email.length > 16
                          ? `${email.slice(0, 10)}…${email.slice(-5)}`
                          : email}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-foreground">
                        {pos.symbol}
                      </TableCell>

                      {isEditing ? (
                        <>
                          <TableCell>
                            <Input
                              type="number"
                              step="1"
                              value={editState.quantity}
                              onChange={(e) =>
                                setEditState((s) =>
                                  s ? { ...s, quantity: e.target.value } : s,
                                )
                              }
                              className="h-7 w-24 text-xs font-mono bg-input border-border"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={editState.avgPrice}
                              onChange={(e) =>
                                setEditState((s) =>
                                  s ? { ...s, avgPrice: e.target.value } : s,
                                )
                              }
                              className="h-7 w-28 text-xs font-mono bg-input border-border"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                              {getTradeTypeLabel(pos.tradeType)}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-right text-muted-foreground">
                            {formatCurrency(pos.marginUsed)}
                          </TableCell>
                          <TableCell
                            className={`font-mono text-xs text-right font-medium ${pos.unrealizedPnL >= 0 ? "text-gain" : "text-loss"}`}
                          >
                            {pos.unrealizedPnL >= 0 ? "+" : ""}
                            {formatCurrency(pos.unrealizedPnL)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-gain hover:bg-gain-muted"
                                onClick={handleEditSave}
                                disabled={editPosition.isPending}
                              >
                                {editPosition.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditState(null)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-mono text-sm text-right text-foreground">
                            {pos.quantity}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-right text-foreground">
                            {formatCurrency(pos.avgBuyPrice)}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                              {getTradeTypeLabel(pos.tradeType)}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-right text-muted-foreground">
                            {formatCurrency(pos.marginUsed)}
                          </TableCell>
                          <TableCell
                            className={`font-mono text-sm text-right font-medium ${pos.unrealizedPnL >= 0 ? "text-gain" : "text-loss"}`}
                          >
                            {pos.unrealizedPnL >= 0 ? "+" : ""}
                            {formatCurrency(pos.unrealizedPnL)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  setEditState({
                                    email,
                                    symbol: pos.symbol,
                                    quantity: pos.quantity.toString(),
                                    avgPrice: pos.avgBuyPrice.toString(),
                                  })
                                }
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-loss hover:bg-loss-muted"
                                onClick={() => handleClose(email, pos.symbol)}
                                disabled={closePosition.isPending}
                              >
                                {closePosition.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : (
                                  <X className="w-3.5 h-3.5 mr-1" />
                                )}
                                Close
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ─── App Settings Queries ─────────────────────────────────────────────────

function useGetAppSettings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["appSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAppSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

function useUpdateAppSettings() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      termsText,
      privacyText,
      stockGainColor,
      stockLossColor,
    }: {
      termsText: string;
      privacyText: string;
      stockGainColor: string;
      stockLossColor: string;
    }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.updateAppSettings(
        token,
        termsText,
        privacyText,
        stockGainColor,
        stockLossColor,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appSettings"] });
    },
  });
}

// ─── Settings Tab ─────────────────────────────────────────────────────────

type ThemePreset = "green-red" | "blue-orange" | "cyan-pink";

const THEME_PRESETS: Record<
  ThemePreset,
  {
    label: string;
    gainColor: string;
    lossColor: string;
    gainCls: string;
    lossCls: string;
  }
> = {
  "green-red": {
    label: "Green / Red (Default)",
    gainColor: "green",
    lossColor: "red",
    gainCls: "bg-green-500",
    lossCls: "bg-red-500",
  },
  "blue-orange": {
    label: "Blue / Orange",
    gainColor: "blue",
    lossColor: "orange",
    gainCls: "bg-blue-500",
    lossCls: "bg-orange-500",
  },
  "cyan-pink": {
    label: "Cyan / Pink",
    gainColor: "cyan",
    lossColor: "pink",
    gainCls: "bg-cyan-500",
    lossCls: "bg-pink-500",
  },
};

function SettingsTab() {
  const { data: settings, isLoading } = useGetAppSettings();
  const updateSettings = useUpdateAppSettings();

  const [termsText, setTermsText] = useState("");
  const [privacyText, setPrivacyText] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>("green-red");

  // Populate from backend when loaded
  const [initialized, setInitialized] = useState(false);
  if (settings && !initialized) {
    setTermsText(settings.termsText || "");
    setPrivacyText(settings.privacyText || "");
    // Map color back to preset
    if (settings.stockGainColor === "blue") setSelectedTheme("blue-orange");
    else if (settings.stockGainColor === "cyan") setSelectedTheme("cyan-pink");
    else setSelectedTheme("green-red");
    setInitialized(true);
  }

  const getCurrentSettings = () => ({
    termsText,
    privacyText,
    stockGainColor: THEME_PRESETS[selectedTheme].gainColor,
    stockLossColor: THEME_PRESETS[selectedTheme].lossColor,
  });

  const handleSaveTerms = async () => {
    try {
      const current = getCurrentSettings();
      await updateSettings.mutateAsync(current);
      toast.success("Terms & Conditions saved");
    } catch {
      toast.error("Failed to save Terms & Conditions");
    }
  };

  const handleSavePrivacy = async () => {
    try {
      const current = getCurrentSettings();
      await updateSettings.mutateAsync(current);
      toast.success("Privacy & Security saved");
    } catch {
      toast.error("Failed to save Privacy & Security");
    }
  };

  const handleSaveTheme = async () => {
    try {
      const current = getCurrentSettings();
      await updateSettings.mutateAsync(current);
      toast.success("Stock theme updated");
    } catch {
      toast.error("Failed to update theme");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Settings className="w-5 h-5 text-muted-foreground" />
        App Settings
      </h2>

      {/* Terms & Conditions */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            placeholder="Enter your Terms & Conditions text here..."
            className="bg-input border-border min-h-[200px] text-sm resize-y"
          />
          <Button
            size="sm"
            onClick={handleSaveTerms}
            disabled={updateSettings.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Terms & Conditions
          </Button>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={privacyText}
            onChange={(e) => setPrivacyText(e.target.value)}
            placeholder="Enter your Privacy & Security policy here..."
            className="bg-input border-border min-h-[200px] text-sm resize-y"
          />
          <Button
            size="sm"
            onClick={handleSavePrivacy}
            disabled={updateSettings.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Privacy & Security
          </Button>
        </CardContent>
      </Card>

      {/* Stock Theme */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Stock Color Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Choose colors for gain (up) and loss (down) price movements across
            the app.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {(
              Object.entries(THEME_PRESETS) as [
                ThemePreset,
                (typeof THEME_PRESETS)[ThemePreset],
              ][]
            ).map(([key, preset]) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTheme === key
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={key}
                  checked={selectedTheme === key}
                  onChange={() => setSelectedTheme(key)}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded ${preset.gainCls}`} />
                  <span className="text-sm text-muted-foreground">↑ Gain</span>
                  <div className={`w-5 h-5 rounded ${preset.lossCls}`} />
                  <span className="text-sm text-muted-foreground">↓ Loss</span>
                </div>
                <span className="text-sm font-medium text-foreground ml-2">
                  {preset.label}
                </span>
                {selectedTheme === key && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </label>
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleSaveTheme}
            disabled={updateSettings.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Theme
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Withdrawals Tab ──────────────────────────────────────────────────────

function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const variants: Record<WithdrawalStatus, { label: string; cls: string }> = {
    [WithdrawalStatus.pending]: {
      label: "Pending",
      cls: "bg-gold-muted text-gold border-gold/20",
    },
    [WithdrawalStatus.approved]: {
      label: "Approved",
      cls: "bg-gain-muted text-gain border-gain/20",
    },
    [WithdrawalStatus.rejected]: {
      label: "Rejected",
      cls: "bg-loss-muted text-loss border-loss/20",
    },
  };
  const v = variants[status] ?? {
    label: status,
    cls: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${v.cls}`}
    >
      {v.label}
    </span>
  );
}

function WithdrawalsTab() {
  const {
    data: withdrawals = [],
    isLoading,
    refetch,
  } = useGetAllWithdrawalRequests();
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
        <h2 className="text-lg font-semibold text-foreground">
          Withdrawal Requests
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 text-xs"
        >
          <ArrowUpFromLine className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>
      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Amount
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Method
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Details
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Time
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Actions
                </TableHead>
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
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No withdrawal requests yet
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((wr, idx) => (
                  <TableRow
                    key={wr.id}
                    className={idx % 2 === 0 ? "bg-muted/20" : ""}
                  >
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
                      title={
                        (
                          wr as {
                            userEmail?: string;
                            user?: { toString(): string };
                          }
                        ).userEmail ??
                        (
                          wr as { user?: { toString(): string } }
                        ).user?.toString() ??
                        ""
                      }
                    >
                      {(() => {
                        const email =
                          (
                            wr as {
                              userEmail?: string;
                              user?: { toString(): string };
                            }
                          ).userEmail ??
                          (
                            wr as { user?: { toString(): string } }
                          ).user?.toString() ??
                          "";
                        return email.length > 16
                          ? `${email.slice(0, 10)}…${email.slice(-5)}`
                          : email;
                      })()}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      {formatCurrency(wr.amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          wr.withdrawalMethod === WithdrawalMethod.upi
                            ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                            : "bg-purple-400/10 text-purple-400 border-purple-400/20"
                        }`}
                      >
                        {wr.withdrawalMethod === WithdrawalMethod.upi
                          ? "UPI"
                          : "Bank"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                      {wr.withdrawalMethod === WithdrawalMethod.upi ? (
                        <span className="font-mono">{wr.upiId ?? "—"}</span>
                      ) : (
                        <div className="space-y-0.5">
                          <p>{wr.bankName ?? "—"}</p>
                          <p className="font-mono">{wr.accountNumber ?? "—"}</p>
                          <p className="font-mono text-muted-foreground/60">
                            {wr.ifscCode ?? "—"}
                          </p>
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

// ─── Deposits Tab ─────────────────────────────────────────────────────────

function DepositStatusBadge({ status }: { status: DepositStatus }) {
  const variants: Record<DepositStatus, { label: string; cls: string }> = {
    [DepositStatus.pending]: {
      label: "Pending",
      cls: "bg-gold-muted text-gold border-gold/20",
    },
    [DepositStatus.approved]: {
      label: "Approved",
      cls: "bg-gain-muted text-gain border-gain/20",
    },
    [DepositStatus.rejected]: {
      label: "Rejected",
      cls: "bg-loss-muted text-loss border-loss/20",
    },
  };
  const v = variants[status] ?? {
    label: status,
    cls: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${v.cls}`}
    >
      {v.label}
    </span>
  );
}

function DepositsTab() {
  const {
    data: deposits = [],
    isLoading,
    refetch,
  } = useGetAllDepositRequests();
  const approveDeposit = useApproveDeposit();
  const rejectDeposit = useRejectDeposit();

  const handleApprove = (id: string) => {
    approveDeposit.mutate(id, {
      onSuccess: () => toast.success("Deposit approved — balance credited"),
      onError: () => toast.error("Failed to approve deposit"),
    });
  };

  const handleReject = (id: string) => {
    rejectDeposit.mutate(id, {
      onSuccess: () => toast.success("Deposit rejected"),
      onError: () => toast.error("Failed to reject deposit"),
    });
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Deposit Requests
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>
      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Amount
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  UTR Number
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Time
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : deposits.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No deposit requests yet
                  </TableCell>
                </TableRow>
              ) : (
                deposits.map((dr, idx) => (
                  <TableRow
                    key={dr.id}
                    className={idx % 2 === 0 ? "bg-muted/20" : ""}
                  >
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
                      title={
                        (
                          dr as {
                            userEmail?: string;
                            user?: { toString(): string };
                          }
                        ).userEmail ??
                        (
                          dr as { user?: { toString(): string } }
                        ).user?.toString() ??
                        ""
                      }
                    >
                      {(() => {
                        const email =
                          (
                            dr as {
                              userEmail?: string;
                              user?: { toString(): string };
                            }
                          ).userEmail ??
                          (
                            dr as { user?: { toString(): string } }
                          ).user?.toString() ??
                          "";
                        return email.length > 16
                          ? `${email.slice(0, 10)}…${email.slice(-5)}`
                          : email;
                      })()}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      {formatCurrency(dr.amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {dr.utrNumber ? (
                        <span className="font-mono text-foreground">
                          {dr.utrNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 italic">
                          — (not yet submitted)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DepositStatusBadge status={dr.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(dr.requestTime)}
                    </TableCell>
                    <TableCell>
                      {dr.status === DepositStatus.pending && (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-gain text-background hover:bg-gain/90 px-2.5"
                            onClick={() => handleApprove(dr.id)}
                            disabled={approveDeposit.isPending}
                          >
                            {approveDeposit.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-loss text-loss hover:bg-loss-muted px-2.5"
                            onClick={() => handleReject(dr.id)}
                            disabled={rejectDeposit.isPending}
                          >
                            {rejectDeposit.isPending ? (
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

// ─── Credit Codes Tab ─────────────────────────────────────────────────────

function CreditCodeStatusBadge({ status }: { status: CreditCodeStatus }) {
  if (status === CreditCodeStatus.active) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-gain-muted text-gain border-gain/20">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-muted text-muted-foreground border-border">
      Redeemed
    </span>
  );
}

function CreditCodesTab() {
  const { data: codes = [], isLoading, refetch } = useGetAllCreditCodes();
  const createCode = useCreateCreditCode();
  const deleteCode = useDeleteCreditCode();

  const [newCode, setNewCode] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    const amount = Number.parseFloat(newAmount);
    if (!code) {
      toast.error("Please enter a credit code");
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await createCode.mutateAsync({ code, amount });
      toast.success(`Credit code "${code}" created for ₹${amount}`);
      setNewCode("");
      setNewAmount("");
    } catch {
      toast.error("Failed to create credit code");
    }
  };

  const handleDelete = (code: string) => {
    if (!window.confirm(`Delete credit code "${code}"?`)) return;
    deleteCode.mutate(code, {
      onSuccess: () => toast.success(`Credit code "${code}" deleted`),
      onError: () => toast.error("Failed to delete credit code"),
    });
  };

  const formatTimestamp = (ts: bigint): string => {
    const ms = Number(ts / 1_000_000n);
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-5 animate-fade-in-up max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Tag className="w-5 h-5 text-muted-foreground" />
          Credit Codes
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Create new code form */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Credit Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="credit-code"
                className="text-xs text-muted-foreground uppercase tracking-wide"
              >
                Code
              </Label>
              <Input
                id="credit-code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME500"
                className="bg-input border-border font-mono uppercase"
              />
            </div>
            <div className="w-full sm:w-40 space-y-1">
              <Label
                htmlFor="credit-amount"
                className="text-xs text-muted-foreground uppercase tracking-wide"
              >
                Amount (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                  ₹
                </span>
                <Input
                  id="credit-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="500"
                  className="pl-7 bg-input border-border font-mono"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={createCode.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
              >
                {createCode.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {createCode.isPending ? "Creating…" : "Create Code"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Codes table */}
      <Card className="bg-card border-border shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Code
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Amount
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Created At
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Redeemed At
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : codes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No credit codes yet — create one above
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((cc, idx) => (
                  <TableRow
                    key={cc.code}
                    className={idx % 2 === 0 ? "bg-muted/20" : ""}
                  >
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      {cc.code}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-gain text-right">
                      ₹{cc.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <CreditCodeStatusBadge status={cc.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(cc.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {cc.redeemedAt ? formatTimestamp(cc.redeemedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {cc.status === CreditCodeStatus.active && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-loss hover:text-loss hover:bg-loss-muted"
                            onClick={() => handleDelete(cc.code)}
                            disabled={deleteCode.isPending}
                            title="Delete code"
                          >
                            {deleteCode.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
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
  const { data: settings, isLoading: settingsLoading } =
    useGetPaymentSettings();
  const setPaymentSettings = useSetPaymentSettings();
  const [upiId, setUpiId] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [copied, setCopied] = useState(false);

  // QR upload from gallery
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setQrCodeData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) {
      toast.error("Please fill UPI ID");
      return;
    }
    try {
      await setPaymentSettings.mutateAsync({
        upiId: upiId.trim(),
        qrCodeData: qrCodeData.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim(),
      });
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

  const currentQrIsImage =
    settings?.qrCodeData?.startsWith("http") ||
    settings?.qrCodeData?.startsWith("data:image");

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground">
        Payment Settings
      </h2>

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
            {/* UPI Section */}
            <div className="space-y-3 pb-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                UPI Details
              </p>
              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-upi-id"
                  className="text-xs text-muted-foreground uppercase tracking-wide"
                >
                  UPI ID
                </Label>
                <Input
                  id="admin-upi-id"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi or yourname@paytm"
                  className="bg-input border-border focus:border-primary font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This UPI ID will be shown to clients when they deposit.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  QR Code (Upload from Gallery)
                </Label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-input cursor-pointer hover:border-primary transition-colors">
                      <QrCode className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">
                        {qrCodeData
                          ? qrCodeData.startsWith("data:image")
                            ? "✓ Image uploaded"
                            : `${qrCodeData.slice(0, 30)}...`
                          : "Click to upload QR image"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrFileUpload}
                      className="sr-only"
                    />
                  </label>
                  {qrCodeData && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-loss hover:bg-loss-muted shrink-0"
                      onClick={() => setQrCodeData("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Or paste an image URL below
                </p>
                <Input
                  value={qrCodeData.startsWith("data:image") ? "" : qrCodeData}
                  onChange={(e) => setQrCodeData(e.target.value)}
                  placeholder="https://example.com/qr.png"
                  className="bg-input border-border focus:border-primary font-mono text-sm"
                  disabled={qrCodeData.startsWith("data:image")}
                />
                {qrCodeData &&
                  (qrCodeData.startsWith("data:image") ||
                    qrCodeData.startsWith("http")) && (
                    <div className="mt-2 bg-white rounded-lg p-2 inline-flex border border-border">
                      <img
                        src={qrCodeData}
                        alt="QR Preview"
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                  )}
              </div>
            </div>

            {/* Bank Transfer Section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Bank Transfer Details (optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Account Holder Name
                  </Label>
                  <Input
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Aman Mishra"
                    className="bg-input border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Bank Name
                  </Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="State Bank of India"
                    className="bg-input border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Account Number
                  </Label>
                  <Input
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="1234567890123"
                    className="bg-input border-border focus:border-primary font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    IFSC Code
                  </Label>
                  <Input
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                    className="bg-input border-border focus:border-primary font-mono"
                  />
                </div>
              </div>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  UPI ID
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground flex-1">
                    {settings.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.upiId)}
                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy UPI ID"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-gain" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* QR Preview */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  QR Code Preview
                </p>
                {currentQrIsImage ? (
                  <div className="bg-white rounded-xl p-4 inline-flex border border-border">
                    <img
                      src={settings.qrCodeData}
                      alt="QR Code"
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                ) : settings.qrCodeData ? (
                  <div className="bg-muted/50 border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      QR String
                    </p>
                    <pre className="font-mono text-xs text-foreground break-all whitespace-pre-wrap">
                      {settings.qrCodeData}
                    </pre>
                  </div>
                ) : null}
              </div>

              {/* Bank Details */}
              {(settings as { bankAccountHolder?: string })
                .bankAccountHolder && (
                <div className="bg-muted/50 border border-border rounded-md px-3 py-2.5 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Bank Account
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {
                      (settings as { bankAccountHolder?: string })
                        .bankAccountHolder
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(settings as { bankName?: string }).bankName}
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {
                      (settings as { bankAccountNumber?: string })
                        .bankAccountNumber
                    }
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {(settings as { bankIfsc?: string }).bankIfsc}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No payment settings configured yet.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Fill the form above to set payment details.
              </p>
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
      <span className={`${active ? "text-primary" : "text-muted-foreground"}`}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

// ─── Admin Panel Root ─────────────────────────────────────────────────────

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const navItems: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    {
      id: "dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Dashboard",
    },
    {
      id: "instruments",
      icon: <BarChart2 className="w-4 h-4" />,
      label: "Instruments",
    },
    { id: "users", icon: <Users className="w-4 h-4" />, label: "Users" },
    {
      id: "positions",
      icon: <BriefcaseBusiness className="w-4 h-4" />,
      label: "Positions",
    },
    {
      id: "orders",
      icon: <ClipboardList className="w-4 h-4" />,
      label: "Orders",
    },
    {
      id: "withdrawals",
      icon: <ArrowUpFromLine className="w-4 h-4" />,
      label: "Withdrawals",
    },
    {
      id: "deposits",
      icon: <ArrowDownToLine className="w-4 h-4" />,
      label: "Deposits",
    },
    {
      id: "payments",
      icon: <CreditCard className="w-4 h-4" />,
      label: "Payments",
    },
    {
      id: "creditCodes",
      icon: <Tag className="w-4 h-4" />,
      label: "Credit Codes",
    },
    {
      id: "settings",
      icon: <Settings className="w-4 h-4" />,
      label: "Settings",
    },
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
              <span className="text-base font-bold gradient-brand">
                TradeGo.1
              </span>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <span className="text-sm font-semibold text-foreground">
                Admin Panel
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
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
          {activeTab === "positions" && <AdminPositionsTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "withdrawals" && <WithdrawalsTab />}
          {activeTab === "deposits" && <DepositsTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "creditCodes" && <CreditCodesTab />}
          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}
