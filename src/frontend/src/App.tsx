import { useEffect, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useActor } from "./hooks/useActor";
import {
  useGetUserProfile,
  useGetAllInstruments,
  useCreateInstrument,
} from "./hooks/useQueries";
import { useLivePrices } from "./hooks/useLivePrices";

import { Registration } from "./components/Registration";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { Markets } from "./pages/Markets";
import { Trade } from "./pages/Trade";
import { Positions } from "./pages/Positions";
import { Account } from "./pages/Account";
import { AdminPanel } from "./pages/AdminPanel";

import { SEED_INSTRUMENTS } from "./utils/seedData";
import { Instrument } from "./backend.d";

type Tab = "dashboard" | "markets" | "trade" | "positions" | "account";

function AppContent() {
  const { identity, isInitializing, login, loginStatus } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [tradeInstrument, setTradeInstrument] = useState<Instrument | null>(null);
  const [seedAttempted, setSeedAttempted] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Queries
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetUserProfile();

  const {
    data: instruments = [],
    isLoading: instrumentsLoading,
  } = useGetAllInstruments();

  const createInstrument = useCreateInstrument();

  // Live simulated prices
  const liveprices = useLivePrices(instruments);

  // Check admin status once identity + actor are ready
  useEffect(() => {
    if (!actor || actorFetching || !identity) return;
    const principal = identity.getPrincipal();
    actor.isAdminUser(principal).then((result) => {
      setIsAdmin(result);
    }).catch(() => {
      setIsAdmin(false);
    });
  }, [actor, actorFetching, identity]);

  // Determine registration status
  useEffect(() => {
    if (!profileFetched) return;
    setIsRegistered(!!userProfile);
  }, [userProfile, profileFetched]);

  // Seed instruments if empty
  const seedInstruments = useCallback(async () => {
    if (!actor || seedAttempted || instruments.length > 0 || actorFetching) return;
    setSeedAttempted(true);
    try {
      await Promise.all(
        SEED_INSTRUMENTS.map((inst) =>
          createInstrument.mutateAsync({
            symbol: inst.symbol,
            name: inst.name,
            category: inst.category,
            currentPrice: inst.currentPrice,
            previousClose: inst.previousClose,
          }).catch(() => {/* ignore duplicate errors */})
        )
      );
    } catch {
      // Silently ignore seeding errors
    }
  }, [actor, seedAttempted, instruments.length, actorFetching, createInstrument]);

  useEffect(() => {
    if (instruments.length === 0 && actor && !actorFetching && !seedAttempted) {
      seedInstruments();
    }
  }, [instruments.length, actor, actorFetching, seedAttempted, seedInstruments]);

  // Handle login if no identity
  useEffect(() => {
    if (!isInitializing && !identity) {
      login();
    }
  }, [isInitializing, identity, login]);

  const handleTabChange = (tab: string, instrument?: Instrument) => {
    setActiveTab(tab as Tab);
    if (instrument) {
      setTradeInstrument(instrument);
    }
  };

  // Loading states
  if (isInitializing || loginStatus === "logging-in") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gain-muted flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 text-gain animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Connecting to Internet Identity...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center gap-3 justify-center mb-6">
            <img src="/assets/generated/tradego-logo-transparent.dim_80x80.png" alt="TradeGo.1" className="w-12 h-12" />
            <h1 className="text-2xl font-bold gradient-brand">TradeGo.1</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Please sign in to start trading</p>
          <button
            type="button"
            onClick={login}
            className="bg-gain text-background px-6 py-2.5 rounded-md font-semibold hover:opacity-90 transition-opacity glow-gain"
          >
            Sign In with Internet Identity
          </button>
        </div>
      </div>
    );
  }

  // Loading admin check
  if (isAdmin === null && identity && !actorFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gain-muted flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 text-gain animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Verifying account...</p>
        </div>
      </div>
    );
  }

  // Admin view
  if (isAdmin === true) {
    return (
      <>
        <AdminPanel />
        <Toaster richColors theme="dark" position="top-right" />
      </>
    );
  }

  if (profileLoading || isRegistered === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gain-muted flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 text-gain animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Show registration if not registered
  if (!isRegistered) {
    return (
      <>
        <Registration onRegistered={() => setIsRegistered(true)} />
        <Toaster richColors theme="dark" position="top-right" />
      </>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        userName={userProfile ? userProfile.name : undefined}
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
          <Positions
            instruments={instruments}
            liveprices={liveprices}
          />
        )}
        {activeTab === "account" && <Account />}
      </main>

      <Toaster richColors theme="dark" position="top-right" />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
