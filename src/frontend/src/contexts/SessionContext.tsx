import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const SESSION_KEY = "tradego_session_token";
const USER_KEY = "tradego_user";
const ADMIN_KEY = "tradego_is_admin";

export interface SessionContextValue {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  cachedUser: { name?: string; email?: string } | null;
  setCachedUser: (user: { name?: string; email?: string } | null) => void;
  cachedIsAdmin: boolean;
  setCachedIsAdmin: (val: boolean) => void;
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

  const [cachedUser, setCachedUserState] = useState<{
    name?: string;
    email?: string;
  } | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [cachedIsAdmin, setCachedIsAdminState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_KEY) === "true";
    } catch {
      return false;
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

  const setCachedUser = useCallback(
    (user: { name?: string; email?: string } | null) => {
      try {
        if (user) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(USER_KEY);
        }
      } catch {
        // ignore
      }
      setCachedUserState(user);
    },
    [],
  );

  const setCachedIsAdmin = useCallback((val: boolean) => {
    try {
      localStorage.setItem(ADMIN_KEY, val ? "true" : "false");
    } catch {
      // ignore
    }
    setCachedIsAdminState(val);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ADMIN_KEY);
    } catch {
      // ignore
    }
    setTokenState(null);
    setCachedUserState(null);
    setCachedIsAdminState(false);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        token,
        setToken,
        logout,
        cachedUser,
        setCachedUser,
        cachedIsAdmin,
        setCachedIsAdmin,
      }}
    >
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
