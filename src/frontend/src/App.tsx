import { Toaster } from "@/components/ui/sonner";
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
  const {
    token,
    setToken,
    logout,
    cachedUser,
    setCachedUser,
    cachedIsAdmin,
    setCachedIsAdmin,
  } = useSession();
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

  // Auth state — if no token is stored, skip verification immediately
  // If we have a cached user, consider session verified immediately (optimistic restore)
  const [sessionVerified, setSessionVerified] = useState(() => {
    try {
      const hasToken = !!localStorage.getItem("tradego_session_token");
      const hasUser = !!localStorage.getItem("tradego_user");
      return hasToken && hasUser;
    } catch {
      return false;
    }
  });
  const [_sessionVerifying, setSessionVerifying] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(
    cachedUser as User | null,
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(cachedIsAdmin);

  const { data: instruments = [], isLoading: instrumentsLoading } =
    useGetAllInstruments();

  const createInstrument = useCreateInstrument();

  // Live simulated prices
  const liveprices = useLivePrices(instruments);

  // On mount / token change: verify session via backend
  // If there's no token, resolve immediately without waiting for actor
  // IMPORTANT: On network errors or timeouts, keep the user logged in (don't logout)
  // Only logout if the backend explicitly says the token is invalid (returns null/false)
  useEffect(() => {
    if (!token) {
      setSessionVerified(false);
      setSessionVerifying(false);
      setCurrentUser(null);
      setIsAdmin(false);
      return;
    }

    // Token exists but actor not ready yet — if we have cached user, stay logged in
    // Don't logout on connection issues
    if (!actor && actorFetching) {
      // If we have cached data, show the app immediately; verify in background
      if (cachedUser) {
        setSessionVerified(true);
        setSessionVerifying(false);
      }
      return;
    }

    // Actor not available and not fetching — if we have cached user, stay logged in
    if (!actor && !actorFetching) {
      if (cachedUser) {
        setSessionVerified(true);
        setSessionVerifying(false);
      }
      return;
    }

    // TypeScript: at this point actor must be non-null (checked above)
    if (!actor) return;

    // Background session verification — don't block UI, don't logout on failure
    const timeoutId = setTimeout(() => {
      // Timeout: keep user logged in with cached data, just stop the spinner
      setSessionVerifying(false);
    }, 5_000);

    actor
      .getSessionFull(token)
      .then((result) => {
        clearTimeout(timeoutId);
        if (!result) {
          // Backend explicitly says token is invalid — logout
          logout();
          setCurrentUser(null);
          setIsAdmin(false);
          setSessionVerified(false);
        } else {
          const [user, adminStatus] = result;
          setCurrentUser(user);
          setIsAdmin(adminStatus);
          setCachedUser({ name: user.name, email: user.email });
          setCachedIsAdmin(adminStatus);
          setSessionVerified(true);
        }
        setSessionVerifying(false);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        // Network/canister error: keep user logged in with cached data
        // Only clear session if we have no cached user either
        if (!cachedUser) {
          logout();
          setCurrentUser(null);
          setIsAdmin(false);
          setSessionVerified(false);
        }
        setSessionVerifying(false);
      });
    return () => clearTimeout(timeoutId);
  }, [
    token,
    actor,
    actorFetching,
    logout,
    cachedUser,
    setCachedUser,
    setCachedIsAdmin,
  ]);

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
    // Poll up to 15 seconds (30 × 500ms) for the actor to become available
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (actorRef.current) return actorRef.current;
    }
    // Auto-reload page to reconnect instead of surfacing an error
    window.location.reload();
    // This line is unreachable but TypeScript needs a return
    throw new Error("Reconnecting...");
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
      return "Connecting to server... Please try again.";
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
        setCachedUser({ name: user.name, email: user.email });
        setCachedIsAdmin(adminStatus);
        setSessionVerified(true);
        return { user, isAdmin: adminStatus };
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    [
      waitForActor,
      setToken,
      setCachedUser,
      setCachedIsAdmin,
      extractErrorMessage,
    ],
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
        setCachedUser({ name: user.name, email: user.email });
        setCachedIsAdmin(adminStatus);
        setSessionVerified(true);
        toast.success("Account created! Welcome to TradeGo.1");
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    [
      waitForActor,
      setToken,
      setCachedUser,
      setCachedIsAdmin,
      extractErrorMessage,
    ],
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

  // Not logged in — show registration/login page immediately (actor may still be loading)
  if (!sessionVerified || !token) {
    return (
      <>
        <Registration onLogin={handleLogin} onRegister={handleRegister} />
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
