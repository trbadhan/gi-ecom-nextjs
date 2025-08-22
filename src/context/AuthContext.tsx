"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { login as apiLogin, logout as apiLogout, me } from "@/lib/auth";

type Admin = {
  id: number;
  username: string;
  email?: string;
};

type AuthContextType = {
  token: string | null;
  admin: Admin | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on first mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAdmin = localStorage.getItem("admin");

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        setAdmin(null);
      }
    }
    setLoading(false);
  }, []);

  async function login(username: string, password: string) {
    try {
      const res = await apiLogin(username, password);
      if (res?.token) {
        localStorage.setItem("token", res.token);
        setToken(res.token);
      }

      if (res?.admin) {
        localStorage.setItem("admin", JSON.stringify(res.admin));
        setAdmin(res.admin);
      }
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  }

  async function logout() {
    try {
      await apiLogout();
    } catch (err) {
      console.warn("Logout API failed, clearing anyway");
    }
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setToken(null);
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ token, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
