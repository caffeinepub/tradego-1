import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const SESSION_KEY = "tradego_session_token";

export interface SessionContextValue {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });

  const setToken = useCallback((newToken: string) => {
    try {
      localStorage.setItem(SESSION_KEY, newToken);
    } catch {
      // ignore
    }
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setTokenState(null);
  }, []);

  return (
    <SessionContext.Provider value={{ token, setToken, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return ctx;
}
