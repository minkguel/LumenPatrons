import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

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
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) return null;
  return data.user ? toAuthUser(data.user) : null;
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toAuthUser(session.user) : null);
  }).data.subscription;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Sign in did not return a user.");
  return toAuthUser(data.user);
}

export async function signUp(data: SignUpInput): Promise<AuthUser | null> {
  const { data: result, error } = await getSupabaseClient().auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { full_name: data.fullName, user_type: data.userType } },
  });
  if (error) throw error;
  if (!result.user) throw new Error("Account creation did not return a user.");
  // With email confirmation enabled, Supabase returns a user but no authenticated session.
  return result.session ? toAuthUser(result.user) : null;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session?.access_token ?? null;
}
