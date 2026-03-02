import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Download,
  HelpCircle,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  TrendingUp,
  WifiOff,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";

interface RegistrationProps {
  onLogin: (
    email: string,
    password: string,
  ) => Promise<{ user: User; isAdmin: boolean }>;
  onRegister: (
    name: string,
    email: string,
    mobile: string,
    password: string,
  ) => Promise<void>;
  isActorLoading?: boolean;
  actorFailed?: boolean;
  onRetryActor?: () => void;
}

export function Registration({
  onLogin,
  onRegister,
  isActorLoading = false,
  actorFailed = false,
  onRetryActor,
}: RegistrationProps) {
  // Sign Up state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Loading + error states
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Forgot Password dialog
  const [forgotOpen, setForgotOpen] = useState(false);

  // PWA install prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredPromptRef = useRef<any>(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDownloadApp = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      if (outcome === "accepted") {
        toast.success("App installed successfully!");
      }
      deferredPromptRef.current = null;
    } else {
      // Fallback: show install instructions dialog
      setInstallDialogOpen(true);
    }
  };

  // ─── Sign Up validation & submit ─────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsRegistering(true);
    toast.loading("Creating your account...", { id: "register" });
    try {
      await onRegister(
        name.trim(),
        email.trim().toLowerCase(),
        mobile.trim(),
        password,
      );
      toast.dismiss("register");
      // Success — App.tsx will handle state transition
    } catch (err) {
      toast.dismiss("register");
      const message = err instanceof Error ? err.message : String(err);
      const lowerMsg = message.toLowerCase();
      if (
        lowerMsg.includes("connection failed") ||
        lowerMsg.includes("retry connection")
      ) {
        toast.error(
          "Server is starting up. Please wait 10 seconds and try again.",
        );
      } else if (
        lowerMsg.includes("already registered") ||
        lowerMsg.includes("already exists")
      ) {
        toast.error("This email is already registered. Please sign in.");
      } else if (
        lowerMsg.includes("unable to connect") ||
        lowerMsg.includes("server") ||
        lowerMsg.includes("loading")
      ) {
        toast.error("Server is starting. Please wait a moment and try again.");
      } else if (lowerMsg.includes("empty") || lowerMsg.includes("invalid")) {
        toast.error(message);
      } else {
        toast.error(message || "Registration failed. Please try again.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // ─── Sign In submit ───────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    if (!signInEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!signInPassword.trim()) {
      toast.error("Please enter your password");
      return;
    }
    setIsSigningIn(true);
    toast.loading("Signing in...", { id: "signin" });
    try {
      await onLogin(signInEmail.trim().toLowerCase(), signInPassword);
      toast.dismiss("signin");
      // Success — App.tsx handles state transition
    } catch (err) {
      toast.dismiss("signin");
      const message = err instanceof Error ? err.message : String(err);
      const lowerMsg = message.toLowerCase();
      if (
        lowerMsg.includes("connection failed") ||
        lowerMsg.includes("retry connection")
      ) {
        setSignInError(
          "Server is starting up. Please wait 10 seconds and try again.",
        );
      } else if (
        lowerMsg.includes("invalid") ||
        lowerMsg.includes("not found") ||
        lowerMsg.includes("wrong") ||
        lowerMsg.includes("incorrect")
      ) {
        setSignInError("Invalid email or password. Please try again.");
      } else if (lowerMsg.includes("not registered")) {
        setSignInError("No account found with this email. Please sign up.");
      } else if (
        lowerMsg.includes("unable to connect") ||
        lowerMsg.includes("server") ||
        lowerMsg.includes("loading")
      ) {
        setSignInError(
          "Server is starting up. Please wait a moment and try again.",
        );
      } else if (lowerMsg.includes("stopped") || lowerMsg.includes("ic0508")) {
        setSignInError(
          "Server is restarting. Please wait 30 seconds and try again.",
        );
      } else {
        setSignInError(
          message ||
            "Sign in failed. Please check your credentials and try again.",
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 terminal-grid opacity-30 pointer-events-none" />

      {/* Gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.74 0.16 175), transparent)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.16 72), transparent)",
        }}
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Server connection failure banner */}
        {actorFailed && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
            <WifiOff className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive leading-snug">
                Server connection failed
              </p>
              <p className="text-xs text-destructive/80 mt-0.5">
                Please check your internet connection and try again.
              </p>
            </div>
            {onRetryActor && (
              <button
                type="button"
                onClick={onRetryActor}
                className="flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/40 rounded-md px-2.5 py-1.5 hover:bg-destructive/20 transition-colors shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* TradeGo.1 Logo Banner */}
        <div className="flex justify-center mb-6">
          <img
            src="/assets/generated/tradego-logo.dim_400x100.png"
            alt="TradeGo.1"
            className="h-16 object-contain"
          />
        </div>

        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src="/assets/generated/tradego-logo-transparent.dim_80x80.png"
              alt="TradeGo.1"
              className="w-12 h-12"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight gradient-brand">
                TradeGo.1
              </h1>
              <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">
                Zero Brokerage Trading
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="pb-2">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/60 mb-4">
                <TabsTrigger
                  value="signin"
                  className="text-sm font-semibold data-[state=active]:bg-gain data-[state=active]:text-background"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="text-sm font-semibold data-[state=active]:bg-gain data-[state=active]:text-background"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* ── Sign In Tab ─────────────────────────────────────────────── */}
              <TabsContent value="signin">
                <CardContent className="px-0 pb-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your email and password to access your account.
                  </p>
                  <form onSubmit={handleSignIn} className="space-y-3">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="signin-email"
                        className="text-xs text-muted-foreground uppercase tracking-wide"
                      >
                        Email ID
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        className="bg-input border-border focus:border-gain text-foreground"
                        autoComplete="email"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="signin-password"
                          className="text-xs text-muted-foreground uppercase tracking-wide"
                        >
                          Password
                        </Label>
                        <button
                          type="button"
                          onClick={() => setForgotOpen(true)}
                          className="text-xs text-muted-foreground hover:text-gain hover:underline transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Your password"
                        className="bg-input border-border focus:border-gain text-foreground"
                        autoComplete="current-password"
                      />
                    </div>

                    {/* Error message */}
                    {signInError && (
                      <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-2.5">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                        <p className="text-xs text-destructive">
                          {signInError}
                        </p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSigningIn}
                      className="w-full bg-gain text-background hover:opacity-90 font-semibold glow-gain mt-2 disabled:opacity-50"
                    >
                      {isSigningIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In →"
                      )}
                    </Button>

                    {/* Server starting indicator */}
                    {isActorLoading && !actorFailed && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                        <span className="text-xs text-amber-500/80">
                          Server starting... you can sign in now
                        </span>
                      </div>
                    )}
                  </form>

                  {/* Security note */}
                  <div className="mt-4 pt-3 border-t border-border flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Your account is secured on the{" "}
                      <span className="text-foreground font-medium">
                        Internet Computer
                      </span>{" "}
                      blockchain. Fully decentralized, no central server.
                    </p>
                  </div>
                </CardContent>
              </TabsContent>

              {/* ── Sign Up Tab ─────────────────────────────────────────────── */}
              <TabsContent value="signup">
                <CardContent className="px-0 pb-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your account. Balance starts at{" "}
                    <span className="text-gain font-semibold">₹0</span> —
                    deposit to start trading.
                  </p>
                  <form onSubmit={handleSignUp} className="space-y-3">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="name"
                        className="text-xs text-muted-foreground uppercase tracking-wide"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rahul Sharma"
                        className="bg-input border-border focus:border-gain text-foreground"
                        autoComplete="name"
                      />
                    </div>

                    {/* Email ID */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="email"
                        className="text-xs text-muted-foreground uppercase tracking-wide"
                      >
                        Email ID
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        className="bg-input border-border focus:border-gain text-foreground"
                        autoComplete="email"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="mobile"
                        className="text-xs text-muted-foreground uppercase tracking-wide"
                      >
                        Mobile Number
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                          +91
                        </span>
                        <Input
                          id="mobile"
                          type="tel"
                          value={mobile}
                          onChange={(e) =>
                            setMobile(
                              e.target.value.replace(/\D/g, "").slice(0, 10),
                            )
                          }
                          placeholder="9876543210"
                          maxLength={10}
                          className="pl-11 bg-input border-border focus:border-gain text-foreground font-mono"
                          autoComplete="tel"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        10-digit mobile number
                      </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-xs text-muted-foreground uppercase tracking-wide"
                      >
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="bg-input border-border focus:border-gain text-foreground"
                        autoComplete="new-password"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-xs text-muted-foreground uppercase tracking-wide"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="bg-input border-border focus:border-gain text-foreground"
                        autoComplete="new-password"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full bg-gain text-background hover:opacity-90 font-semibold glow-gain mt-2 disabled:opacity-50"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account →"
                      )}
                    </Button>

                    {/* Server starting indicator */}
                    {isActorLoading && !actorFailed && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                        <span className="text-xs text-amber-500/80">
                          Server starting... you can sign up now
                        </span>
                      </div>
                    )}
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </CardHeader>

          {/* Feature highlights */}
          <CardContent className="pt-0">
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3">
              {[
                { icon: Zap, label: "500x Margin", sub: "Intraday" },
                { icon: TrendingUp, label: "100x Margin", sub: "Carry Fwd" },
                { icon: Shield, label: "₹0", sub: "Brokerage" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-gain-muted flex items-center justify-center mx-auto mb-1">
                    <Icon className="w-4 h-4 text-gain" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Download App Button */}
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10 gap-2 font-semibold"
            onClick={handleDownloadApp}
          >
            <Download className="w-4 h-4" />
            Download App
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()}. Built with love using{" "}
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

      {/* ── Forgot Password Dialog ────────────────────────────────────────── */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gain-muted flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-gain" />
              </div>
              <DialogTitle className="text-foreground text-base">
                Forgot Password?
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you've forgotten your password, please contact our support team
              and we'll help you regain access to your account.
            </p>
            <div className="rounded-md bg-gain-muted/30 border border-gain/20 p-3">
              <p className="text-xs font-semibold text-foreground mb-1">
                Contact Support
              </p>
              <p className="text-xs text-muted-foreground">
                Reach out to our support team with your registered email address
                and mobile number for verification.
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium text-foreground">
                The admin will reset your password from the admin panel.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setForgotOpen(false)}
              className="w-full bg-secondary hover:bg-secondary/80 text-foreground border border-border"
              variant="outline"
            >
              Got it, Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Install App Dialog ────────────────────────────────────────────── */}
      <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="text-foreground text-base">
                Install TradeGo.1 App
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="rounded-md bg-muted/40 border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Android (Chrome)
              </p>
              <p className="text-xs text-muted-foreground">
                Tap the menu (⋮) →{" "}
                <span className="font-medium text-foreground">
                  Add to Home Screen
                </span>{" "}
                → Install
              </p>
            </div>
            <div className="rounded-md bg-muted/40 border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">
                iPhone / iPad (Safari)
              </p>
              <p className="text-xs text-muted-foreground">
                Tap the Share icon (⬆) →{" "}
                <span className="font-medium text-foreground">
                  Add to Home Screen
                </span>{" "}
                → Add
              </p>
            </div>
            <div className="rounded-md bg-muted/40 border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Desktop (Chrome / Edge)
              </p>
              <p className="text-xs text-muted-foreground">
                Click the install icon (⊕) in the address bar →{" "}
                <span className="font-medium text-foreground">Install</span>
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("App link copied!");
              }}
            >
              Copy App Link
            </Button>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setInstallDialogOpen(false)}
              className="w-full bg-secondary hover:bg-secondary/80 text-foreground border border-border"
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
