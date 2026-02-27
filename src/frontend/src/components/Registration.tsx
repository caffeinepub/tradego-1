import { useState } from "react";
import { useRegisterUser } from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, TrendingUp, Zap, Shield, Lock } from "lucide-react";

interface RegistrationProps {
  onRegistered: () => void;
}

export function Registration({ onRegistered }: RegistrationProps) {
  // Sign Up state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const registerUser = useRegisterUser();
  const { login, isLoggingIn } = useInternetIdentity();

  // ─── Sign Up validation & submit ────────────────────────────────────────
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

    try {
      await registerUser.mutateAsync({ name: name.trim(), email: email.trim().toLowerCase(), mobile: mobile.trim() });
      toast.success("Account created successfully! Balance starts at ₹0.");
      onRegistered();
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  // ─── Sign In submit ──────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      toast.error("Please enter your email and password");
      return;
    }
    // ICP uses Internet Identity for actual auth — trigger II login
    try {
      await login();
    } catch {
      toast.error("Sign in failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 terminal-grid opacity-30 pointer-events-none" />

      {/* Gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.74 0.16 175), transparent)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.16 72), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src="/assets/generated/tradego-logo-transparent.dim_80x80.png"
              alt="TradeGo.1"
              className="w-12 h-12"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight gradient-brand">TradeGo.1</h1>
              <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">
                Zero Brokerage Trading
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="pb-2">
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/60 mb-4">
                <TabsTrigger value="signup" className="text-sm font-semibold data-[state=active]:bg-gain data-[state=active]:text-background">
                  Sign Up
                </TabsTrigger>
                <TabsTrigger value="signin" className="text-sm font-semibold data-[state=active]:bg-gain data-[state=active]:text-background">
                  Sign In
                </TabsTrigger>
              </TabsList>

              {/* ── Sign Up Tab ───────────────────────────────────────────── */}
              <TabsContent value="signup">
                <CardContent className="px-0 pb-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your account. Balance starts at <span className="text-gain font-semibold">₹0</span> — deposit to start trading.
                  </p>
                  <form onSubmit={handleSignUp} className="space-y-3">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wide">
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
                      <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wide">
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
                      <Label htmlFor="mobile" className="text-xs text-muted-foreground uppercase tracking-wide">
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
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="9876543210"
                          maxLength={10}
                          className="pl-11 bg-input border-border focus:border-gain text-foreground font-mono"
                          autoComplete="tel"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">10-digit mobile number</p>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wide">
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
                      <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground uppercase tracking-wide">
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
                      disabled={registerUser.isPending}
                      className="w-full bg-gain text-background hover:opacity-90 font-semibold glow-gain mt-2"
                    >
                      {registerUser.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account →"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              {/* ── Sign In Tab ───────────────────────────────────────────── */}
              <TabsContent value="signin">
                <CardContent className="px-0 pb-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to your trading account.
                  </p>
                  <form onSubmit={handleSignIn} className="space-y-3">
                    {/* Email ID */}
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email" className="text-xs text-muted-foreground uppercase tracking-wide">
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
                      <Label htmlFor="signin-password" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Password
                      </Label>
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

                    <Button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-gain text-background hover:opacity-90 font-semibold glow-gain mt-2"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In →"
                      )}
                    </Button>
                  </form>

                  {/* ICP auth notice */}
                  <div className="mt-4 pt-3 border-t border-border flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Secured by{" "}
                      <span className="text-foreground font-medium">Internet Identity</span>
                      {" "}— ICP's passwordless authentication system. Your keys, your account.
                    </p>
                  </div>
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
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
}
