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

    // Token exists but actor not ready yet — keep verifying state (spinner shows)
    if (!actor || actorFetching) return;

    setSessionVerifying(true);
    actor
      .getSessionFull(token)
      .then((result) => {
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
        // Token invalid or expired
        logout();
        setCurrentUser(null);
        setIsAdmin(false);
        setSessionVerified(false);
        setSessionVerifying(false);
      });
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
    // Poll up to 10 seconds for the actor to become available
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (actorRef.current) return actorRef.current;
    }
    throw new Error(
      "Unable to connect to the server. Please refresh and try again.",
    );
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const a = await waitForActor();
      const [newToken, user, adminStatus] = await a.loginFull(email, password);
      setToken(newToken);
      setCurrentUser(user);
      setIsAdmin(adminStatus);
      setSessionVerified(true);
      return { user, isAdmin: adminStatus };
    },
    [waitForActor, setToken],
  );

  const handleRegister = useCallback(
    async (name: string, email: string, mobile: string, password: string) => {
      const a = await waitForActor();
      await a.registerUserWithPassword(name, email, mobile, password);
      // Auto-login after registration using single call
      const [newToken, user, adminStatus] = await a.loginFull(email, password);
      setToken(newToken);
      setCurrentUser(user);
      setIsAdmin(adminStatus);
      setSessionVerified(true);
      toast.success("Account created! Welcome to TradeGo.1");
    },
    [waitForActor, setToken],
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
          isActorLoading={!actor || actorFetching}
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
