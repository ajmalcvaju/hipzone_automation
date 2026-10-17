"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserSession } from "@/types";
import { toast } from "sonner";

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_STORAGE_KEY = "hipzone_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check client-side stored session
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserSession;
        if (parsed && parsed.username) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const expectedUsername = "quotation@hipzoneautomation";
      const expectedPassword = "admin.hipzonequotation";

      const normalizedInputUsername = String(username).trim().toLowerCase();
      const normalizedInputPassword = String(password).trim();

      if (
        normalizedInputUsername === expectedUsername.toLowerCase() &&
        normalizedInputPassword === expectedPassword
      ) {
        const sessionUser: UserSession = {
          username: expectedUsername,
          role: "admin",
          displayName: "Hipzone Admin",
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
        setUser(sessionUser);
        toast.success("Welcome back, Hipzone Admin!");
        return { success: true };
      }

      return {
        success: false,
        error: "Invalid username or password. Please check your credentials.",
      };
    } catch {
      return { success: false, error: "An unexpected error occurred during login." };
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      toast.info("Logged out successfully");
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
