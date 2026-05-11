import { useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../utils/api.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const data = await api("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        setToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await api("/api/auth/register", { method: "POST", body: { name, email, password, role } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      if (getToken()) {
        await api("/api/auth/logout", { method: "POST" });
      }
    } catch {
      // Local logout should still complete if the API is unreachable.
    }
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      setUser,
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
