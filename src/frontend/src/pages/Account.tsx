import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Zap,
  TrendingUp,
  Shield,
  LogOut,
  Wallet,
  BarChart3,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  QrCode,
  Building2,
  Smartphone,
} from "lucide-react";
import {
  useGetUserProfile,
  useGetPortfolioSummary,
  useDeposit,
  useRequestWithdrawal,
  useGetWithdrawalRequests,
  useGetPaymentSettings,
} from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatBalance, formatPnL } from "../utils/format";
import { toast } from "sonner";
import { WithdrawalStatus, WithdrawalMethod } from "../backend.d";

// ─── Countdown Timer Hook ──────────────────────────────────────────────────

const THIRTY_MINUTES_NS = BigInt(30 * 60 * 1_000_000_000); // 30 min in nanoseconds

function useCountdown(requestTimeNs: bigint, status: WithdrawalStatus) {
  const [remaining, setRemaining] = useState<number>(0); // seconds

  useEffect(() => {
    if (status !== WithdrawalStatus.pending) return;

    const computeRemaining = () => {
      const nowNs = BigInt(Date.now()) * 1_000_000n;
      const elapsedNs = nowNs - requestTimeNs;
      const remainingNs = THIRTY_MINUTES_NS - elapsedNs;
      return Math.max(0, Number(remainingNs / 1_000_000_000n));
    };

    setRemaining(computeRemaining());
    const id = setInterval(() => {
      const r = computeRemaining();
      setRemaining(r);
    }, 1000);
    return () => clearInterval(id);
  }, [requestTimeNs, status]);

  return remaining;
}

// ─── Withdrawal Row with Countdown ────────────────────────────────────────

interface WithdrawalRowProps {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  requestTime: bigint;
}

function WithdrawalRow({ amount, status, requestTime }: WithdrawalRowProps) {
  const remaining = useCountdown(requestTime, status);

  const requestMs = Number(requestTime / 1_000_000n);
  const requestDate = new Date(requestMs);
  const timeStr = isNaN(requestDate.getTime())
    ? "—"
    : requestDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) +
      " · " +
      requestDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return "Processing...";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-semibold text-foreground">
            ₹{amount.toLocaleString("en-IN")}
          </span>
          {status === WithdrawalStatus.pending && (
            <Badge className="bg-gold-muted text-gold border border-gold/20 text-xs">Pending</Badge>
          )}
          {status === WithdrawalStatus.approved && (
            <Badge className="bg-gain-muted text-gain border border-gain/20 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Approved
            </Badge>
          )}
          {status === WithdrawalStatus.rejected && (
            <Badge className="bg-loss-muted text-loss border border-loss/20 text-xs flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Rejected
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{timeStr}</p>
      </div>
      {status === WithdrawalStatus.pending && (
        <div className="flex items-center gap-1.5 text-gold text-xs font-mono ml-3 shrink-0">
          <Clock className="w-3 h-3" />
          {formatCountdown(remaining)}
        </div>
      )}
    </div>
  );
}

// ─── Copy Button ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-gain" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Deposit Dialog ────────────────────────────────────────────────────────

function DepositDialog() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "payment">("amount");
  const deposit = useDeposit();
  const { data: paymentSettings } = useGetPaymentSettings();

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setStep("amount");
      setAmount("");
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 500) {
      toast.error("Minimum deposit is ₹500");
      return;
    }
    setStep("payment");
  };

  const handleConfirmPayment = async () => {
    const val = parseFloat(amount);
    try {
      await deposit.mutateAsync(val);
      toast.success("Deposit confirmed! Balance updated instantly.");
      handleClose(false);
    } catch {
      toast.error("Deposit failed. Please try again.");
    }
  };

  const isQrUrl = paymentSettings?.qrCodeData?.startsWith("http");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-gain text-background hover:opacity-90 font-semibold glow-gain flex items-center gap-2">
          <ArrowDownToLine className="w-4 h-4" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        {step === "amount" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-gain" />
                Deposit Funds
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Funds are credited <span className="text-gain font-semibold">instantly</span> to your trading account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleNext} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="deposit-amount" className="text-xs text-muted-foreground uppercase tracking-wide">
                  Amount (INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                    ₹
                  </span>
                  <Input
                    id="deposit-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    min="500"
                    step="100"
                    className="pl-7 bg-input border-border focus:border-gain text-foreground font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum: ₹500</p>
              </div>
              <div className="bg-gain-muted/40 border border-gain/20 rounded-md px-3 py-2 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-gain shrink-0" />
                <span className="text-xs text-gain font-medium">Instant credit — no waiting time</span>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)} className="border-border text-muted-foreground">
                  Cancel
                </Button>
                <Button type="submit" className="bg-gain text-background hover:opacity-90 font-semibold">
                  Next: Payment Details
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <QrCode className="w-4 h-4 text-gain" />
                Complete Payment
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Pay <span className="text-foreground font-bold font-mono">₹{parseFloat(amount).toLocaleString("en-IN")}</span> via UPI to complete your deposit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {paymentSettings ? (
                <>
                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3 bg-white rounded-xl p-4 border border-border">
                    {isQrUrl ? (
                      <img
                        src={paymentSettings.qrCodeData}
                        alt="Payment QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
                        <div className="text-center p-3">
                          <QrCode className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-[10px] font-mono text-muted-foreground break-all leading-tight">
                            {paymentSettings.qrCodeData}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* UPI ID */}
                  <div className="bg-muted/50 border border-border rounded-md px-3 py-2.5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">UPI ID</p>
                    <div className="flex items-center">
                      <span className="font-mono text-sm font-semibold text-foreground flex-1">
                        {paymentSettings.upiId}
                      </span>
                      <CopyButton text={paymentSettings.upiId} />
                    </div>
                  </div>

                  {/* Amount reminder */}
                  <div className="bg-gain-muted/30 border border-gain/20 rounded-md px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-gain font-medium">Amount to pay</span>
                    <span className="font-mono font-bold text-gain">₹{parseFloat(amount).toLocaleString("en-IN")}</span>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Scan QR or use UPI ID to pay, then click <span className="text-gain font-semibold">"I have paid"</span>
                  </p>
                </>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <QrCode className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">Payment instructions not configured yet.</p>
                  <p className="text-xs text-muted-foreground/60">Please contact support to complete your deposit.</p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("amount")} className="border-border text-muted-foreground">
                Back
              </Button>
              {paymentSettings && (
                <Button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={deposit.isPending}
                  className="bg-gain text-background hover:opacity-90 font-semibold"
                >
                  {deposit.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    "I have paid"
                  )}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Withdraw Dialog ──────────────────────────────────────────────────────

function WithdrawDialog() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>(WithdrawalMethod.upi);
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const requestWithdrawal = useRequestWithdrawal();

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setAmount("");
      setUpiId("");
      setBankName("");
      setAccountNumber("");
      setIfscCode("");
      setMethod(WithdrawalMethod.upi);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 500) {
      toast.error("Minimum withdrawal is ₹500");
      return;
    }
    if (method === WithdrawalMethod.upi) {
      if (!upiId.trim()) {
        toast.error("Please enter your UPI ID");
        return;
      }
    } else {
      if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        toast.error("Please fill all bank transfer details");
        return;
      }
    }
    try {
      await requestWithdrawal.mutateAsync({
        amount: val,
        withdrawalMethod: method,
        upiId: method === WithdrawalMethod.upi ? upiId.trim() : undefined,
        bankName: method === WithdrawalMethod.bank ? bankName.trim() : undefined,
        accountNumber: method === WithdrawalMethod.bank ? accountNumber.trim() : undefined,
        ifscCode: method === WithdrawalMethod.bank ? ifscCode.trim() : undefined,
      });
      toast.success("Withdrawal requested. Processing in 30 min.");
      handleClose(false);
    } catch {
      toast.error("Withdrawal request failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-border text-muted-foreground hover:text-foreground hover:border-foreground flex items-center gap-2"
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4 text-muted-foreground" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit a withdrawal request. Processing takes up to 30 minutes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="withdraw-amount" className="text-xs text-muted-foreground uppercase tracking-wide">
              Amount (INR)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                ₹
              </span>
              <Input
                id="withdraw-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                min="500"
                step="100"
                className="pl-7 bg-input border-border focus:border-foreground text-foreground font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">Minimum: ₹500</p>
          </div>

          {/* Method selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Withdrawal Method</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as WithdrawalMethod)}
              className="grid grid-cols-2 gap-2"
            >
              <label
                htmlFor="method-upi"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  method === WithdrawalMethod.upi
                    ? "border-gain bg-gain-muted/30 text-gain"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <RadioGroupItem id="method-upi" value={WithdrawalMethod.upi} className="sr-only" />
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">UPI Transfer</span>
              </label>
              <label
                htmlFor="method-bank"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  method === WithdrawalMethod.bank
                    ? "border-gain bg-gain-muted/30 text-gain"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <RadioGroupItem id="method-bank" value={WithdrawalMethod.bank} className="sr-only" />
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Bank Transfer</span>
              </label>
            </RadioGroup>
          </div>

          {/* UPI fields */}
          {method === WithdrawalMethod.upi && (
            <div className="space-y-1.5">
              <Label htmlFor="upi-id" className="text-xs text-muted-foreground uppercase tracking-wide">
                Your UPI ID
              </Label>
              <Input
                id="upi-id"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="bg-input border-border focus:border-gain text-foreground font-mono"
              />
            </div>
          )}

          {/* Bank fields */}
          {method === WithdrawalMethod.bank && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="bank-name" className="text-xs text-muted-foreground uppercase tracking-wide">
                  Bank Name
                </Label>
                <Input
                  id="bank-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="State Bank of India"
                  className="bg-input border-border focus:border-gain text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-number" className="text-xs text-muted-foreground uppercase tracking-wide">
                  Account Number
                </Label>
                <Input
                  id="account-number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234567890123"
                  className="bg-input border-border focus:border-gain text-foreground font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ifsc-code" className="text-xs text-muted-foreground uppercase tracking-wide">
                  IFSC Code
                </Label>
                <Input
                  id="ifsc-code"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  className="bg-input border-border focus:border-gain text-foreground font-mono"
                />
              </div>
            </div>
          )}

          <div className="bg-gold-muted/40 border border-gold/20 rounded-md px-3 py-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="text-xs text-gold font-medium">Processing time: 30 minutes</span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="border-border text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={requestWithdrawal.isPending}
              className="bg-foreground text-background hover:opacity-90 font-semibold"
            >
              {requestWithdrawal.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                "Request Withdrawal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Account Page ─────────────────────────────────────────────────────────

export function Account() {
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const { data: portfolio, isLoading: portfolioLoading } = useGetPortfolioSummary();
  const { data: withdrawals = [], isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useGetWithdrawalRequests();
  const { clear, identity } = useInternetIdentity();

  const principal = identity?.getPrincipal().toString();

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Profile card */}
      <Card className="bg-card border-border shadow-card animate-fade-in-up stagger-1">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gain-muted flex items-center justify-center shrink-0 border-2 border-gain/30">
              <User className="w-7 h-7 text-gain" />
            </div>
            <div className="min-w-0 flex-1">
              {profileLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ) : profile ? (
                <>
                  <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
                  {profile.email && (
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                  )}
                  {principal && (
                    <p
                      className="text-xs text-muted-foreground/60 font-mono truncate"
                      title={principal}
                    >
                      {principal.slice(0, 20)}...{principal.slice(-6)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Not logged in</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="border-border text-muted-foreground hover:text-loss hover:border-loss flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Logout</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Funds section */}
      <Card className="bg-card border-border shadow-card animate-fade-in-up stagger-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available balance */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Available Balance</p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold font-mono text-foreground">
                  {portfolio ? formatBalance(portfolio.availableBalance) : "₹0.00"}
                </p>
              )}
            </div>
          </div>

          {/* Deposit / Withdraw buttons */}
          <div className="flex gap-3">
            <DepositDialog />
            <WithdrawDialog />
          </div>

          {/* Timing info */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-gain-muted/30 border border-gain/20 rounded-md p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-gain" />
                <span className="text-xs font-semibold text-gain">Deposit</span>
              </div>
              <p className="text-xs text-muted-foreground">Credited <span className="text-gain font-medium">instantly</span></p>
            </div>
            <div className="bg-gold-muted/30 border border-gold/20 rounded-md p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-semibold text-gold">Withdrawal</span>
              </div>
              <p className="text-xs text-muted-foreground">Processed in <span className="text-gold font-medium">30 min</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance breakdown */}
      <Card className="bg-card border-border shadow-card animate-fade-in-up stagger-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Balance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {portfolioLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : portfolio ? (
            <>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
                <span className="font-mono font-bold text-foreground">
                  {formatBalance(portfolio.currentValue + portfolio.availableBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Available Balance</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatBalance(portfolio.availableBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Available Margin</span>
                <span className="font-mono font-semibold text-gold">
                  {formatBalance(portfolio.marginAvailable)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Margin Used</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatBalance(portfolio.marginUsed)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Total P&L</span>
                <span
                  className={`font-mono font-bold text-lg ${portfolio.totalPnL >= 0 ? "text-gain" : "text-loss"}`}
                >
                  {formatPnL(portfolio.totalPnL)}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No portfolio data</p>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-card border-border shadow-card animate-fade-in-up stagger-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Withdrawal History
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => refetchWithdrawals()}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <ArrowUpFromLine className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No withdrawal requests yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Your withdrawal history will appear here
              </p>
            </div>
          ) : (
            <div>
              {withdrawals.map((wr) => (
                <WithdrawalRow
                  key={wr.id}
                  id={wr.id}
                  amount={wr.amount}
                  status={wr.status}
                  requestTime={wr.requestTime}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Margin info */}
      <Card className="bg-card border-border shadow-card animate-fade-in-up stagger-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Margin & Leverage Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gain-muted/50 rounded-lg p-4 border border-gain/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-gain" />
                <span className="text-xs font-semibold text-gain uppercase tracking-wide">Intraday</span>
              </div>
              <p className="text-2xl font-bold font-mono text-gain">500x</p>
              <p className="text-xs text-muted-foreground mt-1">Leverage</p>
              <Separator className="my-2 bg-border" />
              <p className="text-xs text-muted-foreground">
                Margin required: <span className="text-gain font-mono">0.2%</span>
              </p>
              <p className="text-xs text-muted-foreground">Positions auto-close at day end</p>
            </div>

            <div className="bg-gold-muted/50 rounded-lg p-4 border border-gold/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span className="text-xs font-semibold text-gold uppercase tracking-wide">
                  Carry Forward
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-gold">100x</p>
              <p className="text-xs text-muted-foreground mt-1">Leverage</p>
              <Separator className="my-2 bg-border" />
              <p className="text-xs text-muted-foreground">
                Margin required: <span className="text-gold font-mono">1%</span>
              </p>
              <p className="text-xs text-muted-foreground">Hold positions overnight</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zero Brokerage banner */}
      <Card className="bg-card border-border shadow-card animate-fade-in-up overflow-hidden">
        <CardContent className="p-5 relative">
          <div className="absolute inset-0 bg-gain-muted/10 pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gain/20 flex items-center justify-center shrink-0 glow-gain">
              <Shield className="w-6 h-6 text-gain" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-gain text-background text-xs font-bold px-2 py-0.5 border-0">
                  ZERO BROKERAGE
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Trade stocks, crypto, forex, and commodities with{" "}
                <span className="text-gain font-semibold">absolutely zero brokerage</span> on all
                orders.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No hidden charges · No per-trade fees · No account maintenance fees
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported markets */}
      <Card className="bg-card border-border shadow-card animate-fade-in-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Supported Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "NSE Stocks", desc: "Indian equities", icon: "📈" },
              { label: "Crypto", desc: "BTC, ETH & more", icon: "₿" },
              { label: "Forex", desc: "INR pairs", icon: "💱" },
              { label: "MCX Commodities", desc: "Gold, Oil & more", icon: "🥇" },
            ].map(({ label, desc, icon }) => (
              <div key={label} className="bg-secondary/50 rounded-md p-3 text-center">
                <p className="text-lg mb-1">{icon}</p>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-2">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gain hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
