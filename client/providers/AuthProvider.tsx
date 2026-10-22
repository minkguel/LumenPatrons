"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser, SignUpInput } from "@/lib/auth";
import * as authApi from "@/lib/auth";
import { ensureProfile } from "@/lib/profile";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    let active = true;

    authApi.getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => console.error("Failed to restore auth session", error))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    try {
      subscription = authApi.onAuthStateChange((event, currentUser, rawUser) => {
        if (!active) return;
        setUser(currentUser);
        if (rawUser) void ensureProfile(rawUser);
        if (event === "SIGNED_OUT") {
          router.replace("/auth");
          router.refresh();
        }
      });
    } catch (error) {
      console.error("Failed to subscribe to auth changes", error);
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  const signIn = useCallback(async (email: string, password: string) => {
    const authUser = await authApi.signIn(email, password);
    setUser(authUser);
  }, []);

  const signUp = useCallback(async (data: SignUpInput) => {
    await authApi.signUp(data);
  }, []);

  const signOut = useCallback(async () => {
    await authApi.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut }),
    [user, isLoading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
