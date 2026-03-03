import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useActor } from "./hooks/useActor";
import { useLivePrices } from "./hooks/useLivePrices";
import { useCreateInstrument, useGetAllInstruments } from "./hooks/useQueries";

import { Header } from "./components/Header";
import { Registration } from "./components/Registration";
import { Account } from "./pages/Account";
import { AdminPanel } from "./pages/AdminPanel";
import { Dashboard } from "./pages/Dashboard";
import { Markets } from "./pages/Markets";
import { OptionChain } from "./pages/OptionChain";
import { Positions } from "./pages/Positions";
import { Trade } from "./pages/Trade";

import type { Instrument, User } from "./backend.d";
import { SessionProvider, useSession } from "./contexts/SessionContext";
import { SEED_INSTRUMENTS } from "./utils/seedData";

type Tab =
  | "dashboard"
  | "markets"
  | "trade"
  | "positions"
  | "optionchain"
  | "account";

function AppContent() {
  const { token, setToken, logout } = useSession();
  const { actor, isFetching: actorFetching } = useActor();
  // Keep a ref so polling closures always see the latest actor value
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [tradeInstrument, setTradeInstrument] = useState<Instrument | null>(
    null,
  );
  const [seedAttempted, setSeedAttempted] = useState(false);

  // Actor failure detection — if actor stays null after 8 seconds of not fetching
  const [actorFailed, setActorFailed] = useState(false);
  const actorFailedRef = useRef(false);

  useEffect(() => {
    // Reset failure state when actor becomes available
    if (actor) {
      setActorFailed(false);
      actorFailedRef.current = false;
      return;
    }
    // If actor is null and not fetching, start a failure timer (8s)
    if (!actor && !actorFetching) {
      const timer = setTimeout(() => {
        if (!actorRef.current) {
          setActorFailed(true);
          actorFailedRef.current = true;
        }
      }, 8_000);
      return () => clearTimeout(timer);
    }
  }, [actor, actorFetching]);

  const handleRetryActor = useCallback(() => {
    window.location.reload();
  }, []);

  // Auth state — if no token is stored, skip verification immediately
  const [sessionVerified, setSessionVerified] = useState(false);
  const [sessionVerifying, setSessionVerifying] = useState(() => {
    try {
      return !!localStorage.getItem("tradego_session_token");
    } catch {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const { data: instruments = [], isLoading: instrumentsLoading } =
    useGetAllInstruments();

  const createInstrument = useCreateInstrument();

  // Live simulated prices
  const liveprices = useLivePrices(instruments);

  // On mount / token change: verify session via backend
  // If there's no token, resolve immediately without waiting for actor
  useEffect(() => {
    if (!token) {
      setSessionVerified(false);
      setSessionVerifying(false);
      setCurrentUser(null);
      setIsAdmin(false);
      return;
    }

    // Token exists but actor not ready yet — wait up to 3s then drop to login
    if (!actor && actorFetching) {
      const timeout = setTimeout(() => {
        logout();
        setSessionVerifying(false);
        setSessionVerified(false);
      }, 3_000);
      return () => clearTimeout(timeout);
    }

    // Actor not available and not fetching — drop to login after short grace
    if (!actor && !actorFetching) {
      const timeout = setTimeout(() => {
        if (!actorRef.current) {
          logout();
          setSessionVerifying(false);
          setSessionVerified(false);
        }
      }, 2_000);
      return () => clearTimeout(timeout);
    }

    // TypeScript: at this point actor must be non-null (checked above)
    if (!actor) return;

    setSessionVerifying(true);
    // 3-second timeout on the actual session check
    const timeoutId = setTimeout(() => {
      logout();
      setCurrentUser(null);
      setIsAdmin(false);
      setSessionVerified(false);
      setSessionVerifying(false);
    }, 3_000);

    actor
      .getSessionFull(token)
      .then((result) => {
        clearTimeout(timeoutId);
        if (!result) {
          // Token invalid or expired
          logout();
          setCurrentUser(null);
          setIsAdmin(false);
          setSessionVerified(false);
        } else {
          const [user, adminStatus] = result;
          setCurrentUser(user);
          setIsAdmin(adminStatus);
          setSessionVerified(true);
        }
        setSessionVerifying(false);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        // Token invalid or expired
        logout();
        setCurrentUser(null);
        setIsAdmin(false);
        setSessionVerified(false);
        setSessionVerifying(false);
      });
    return () => clearTimeout(timeoutId);
  }, [token, actor, actorFetching, logout]);

  // Seed instruments if empty
  const seedInstruments = useCallback(async () => {
    if (!actor || seedAttempted || instruments.length > 0 || actorFetching)
      return;
    setSeedAttempted(true);
    try {
      await Promise.all(
        SEED_INSTRUMENTS.map((inst) =>
          createInstrument
            .mutateAsync({
              symbol: inst.symbol,
              name: inst.name,
              category: inst.category,
              currentPrice: inst.currentPrice,
              previousClose: inst.previousClose,
            })
            .catch(() => {
              /* ignore duplicate errors */
            }),
        ),
      );
    } catch {
      // Silently ignore seeding errors
    }
  }, [
    actor,
    seedAttempted,
    instruments.length,
    actorFetching,
    createInstrument,
  ]);

  useEffect(() => {
    if (instruments.length === 0 && actor && !actorFetching && !seedAttempted) {
      seedInstruments();
    }
  }, [
    instruments.length,
    actor,
    actorFetching,
    seedAttempted,
    seedInstruments,
  ]);

  const waitForActor = useCallback(async (): Promise<
    NonNullable<typeof actor>
  > => {
    if (actorRef.current) return actorRef.current;
    // If actor already failed, throw immediately with a helpful message
    if (actorFailedRef.current) {
      throw new Error(
        "Server connection failed. Please tap 'Retry Connection' below.",
      );
    }
    // Poll up to 6 seconds (12 × 500ms) for the actor to become available
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (actorRef.current) return actorRef.current;
      if (actorFailedRef.current) {
        throw new Error(
          "Server connection failed. Please check your internet connection and try again.",
        );
      }
    }
    throw new Error(
      "Server is starting up. Please wait a few seconds and try again.",
    );
  }, []);

  // Strip IC canister trap message prefixes so users see clean error text
  const extractErrorMessage = useCallback((err: unknown): string => {
    const raw = err instanceof Error ? err.message : String(err);
    const lower = raw.toLowerCase();

    // Detect stopped/wasm/no-module canister errors first — before any string slicing
    if (
      lower.includes("stopped") ||
      lower.includes("ic0508") ||
      lower.includes("no wasm") ||
      lower.includes("no module") ||
      lower.includes("wasm module")
    ) {
      return "Server is temporarily unavailable. Please try again in 30 seconds.";
    }

    // IC canister errors look like: "Call failed: ... Canister ... trapped: <actual message>"
    const trapIdx = raw.lastIndexOf("trapped: ");
    if (trapIdx !== -1) return raw.slice(trapIdx + "trapped: ".length).trim();
    // Another common pattern: "Error: ... <actual message>"
    const colonIdx = raw.lastIndexOf(": ");
    if (colonIdx !== -1 && colonIdx > 20) return raw.slice(colonIdx + 2).trim();
    return raw;
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const a = await waitForActor();
      try {
        const [newToken, user, adminStatus] = await a.loginFull(
          email,
          password,
        );
        setToken(newToken);
        setCurrentUser(user);
        setIsAdmin(adminStatus);
        setSessionVerified(true);
        return { user, isAdmin: adminStatus };
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    [waitForActor, setToken, extractErrorMessage],
  );

  const handleRegister = useCallback(
    async (name: string, email: string, mobile: string, password: string) => {
      const a = await waitForActor();
      try {
        await a.registerUserWithPassword(name, email, mobile, password);
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
      // Auto-login after registration using single call
      try {
        const [newToken, user, adminStatus] = await a.loginFull(
          email,
          password,
        );
        setToken(newToken);
        setCurrentUser(user);
        setIsAdmin(adminStatus);
        setSessionVerified(true);
        toast.success("Account created! Welcome to TradeGo.1");
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    [waitForActor, setToken, extractErrorMessage],
  );

  const handleLogout = useCallback(async () => {
    if (actor && token) {
      try {
        await actor.logoutByToken(token);
      } catch {
        // Ignore logout errors
      }
    }
    logout();
    setCurrentUser(null);
    setIsAdmin(false);
    setSessionVerified(false);
  }, [actor, token, logout]);

  const handleTabChange = (tab: string, instrument?: Instrument) => {
    setActiveTab(tab as Tab);
    if (instrument) {
      setTradeInstrument(instrument);
    }
  };

  // Verifying stored session token — show spinner only when we have a token
  // and are waiting for the actor to check it (avoids showing login form briefly)
  if (sessionVerifying && token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gain-muted flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 text-gain animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show registration/login page immediately (actor may still be loading)
  if (!sessionVerified || !token) {
    return (
      <>
        <Registration
          onLogin={handleLogin}
          onRegister={handleRegister}
          actorFailed={actorFailed}
          onRetryActor={handleRetryActor}
        />
        <Toaster richColors theme="dark" position="top-right" />
      </>
    );
  }

  // Admin view
  if (isAdmin) {
    return (
      <>
        <AdminPanel onLogout={handleLogout} />
        <Toaster richColors theme="dark" position="top-right" />
      </>
    );
  }

  // Main trading app
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        userName={currentUser?.name}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-auto">
        {activeTab === "dashboard" && (
          <Dashboard
            liveprices={liveprices}
            instruments={instruments}
            onNavigate={(tab, instrument) => handleTabChange(tab, instrument)}
          />
        )}
        {activeTab === "markets" && (
          <Markets
            instruments={instruments}
            liveprices={liveprices}
            isLoading={instrumentsLoading}
          />
        )}
        {activeTab === "trade" && (
          <Trade
            instruments={instruments}
            liveprices={liveprices}
            isLoading={instrumentsLoading}
            initialInstrument={tradeInstrument}
          />
        )}
        {activeTab === "positions" && (
          <Positions instruments={instruments} liveprices={liveprices} />
        )}
        {activeTab === "optionchain" && <OptionChain />}
        {activeTab === "account" && (
          <Account onLogout={handleLogout} userName={currentUser?.name} />
        )}
      </main>

      <Toaster richColors theme="dark" position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
