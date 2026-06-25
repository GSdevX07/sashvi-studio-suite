import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { AUTH_STORAGE_KEY, clearAuthTokens } from "./backend";

interface AuthContextValue {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem(AUTH_STORAGE_KEY));
  }, []);

  const login = useCallback(() => setIsLoggedIn(true), []);
  const logout = useCallback(() => {
    clearAuthTokens();
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
