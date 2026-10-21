import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeEmail } from "@/lib/auth/validation";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  userType: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
  userType: string;
};

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "User",
    userType: user.user_metadata.user_type ?? "Founder",
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await getSupabaseBrowserClient().auth.getUser();
  if (error) return null;
  return data.user ? toAuthUser(data.user) : null;
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toAuthUser(session.user) : null);
  }).data.subscription;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email: normalizeEmail(email), password });
  if (error) throw error;
  if (!data.user) throw new Error("Sign in did not return a user.");
  return toAuthUser(data.user);
}

export async function signUp(data: SignUpInput): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.signUp({
    email: normalizeEmail(data.email),
    password: data.password,
    options: { data: { full_name: data.fullName, user_type: data.userType } },
  });
  if (error) throw error;
}

export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.resend({
    type: "signup",
    email: normalizeEmail(email),
  });
  if (error) throw error;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(normalizeEmail(email));
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut(scope?: "global" | "local"): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.signOut(scope ? { scope } : undefined);
  if (error) throw error;
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  return data.session?.access_token ?? null;
}
