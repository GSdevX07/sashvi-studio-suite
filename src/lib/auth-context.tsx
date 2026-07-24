import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { AUTH_STORAGE_KEY, clearAuthTokens } from "./backend";

interface AuthContextValue {
  isLoggedIn: boolean;
  userId: string | null;
  login: (userId?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  userId: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedUserId = localStorage.getItem("user_id");
    setIsLoggedIn(!!token);
    setUserId(storedUserId);
  }, []);

  const login = useCallback((id?: string) => {
    setIsLoggedIn(true);
    if (id) {
      setUserId(id);
      localStorage.setItem("user_id", id);
    }
  }, []);
  
  const logout = useCallback(() => {
    clearAuthTokens();
    setIsLoggedIn(false);
    setUserId(null);
    localStorage.removeItem("user_id");
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, login, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
