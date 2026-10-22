import { NextResponse, type NextRequest } from "next/server";
import { safeRedirect } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LinkType = "signup" | "recovery";

function isLinkType(value: string | null): value is LinkType {
  return value === "signup" || value === "recovery";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (!tokenHash || !isLinkType(type)) {
    return redirectTo("/auth/error?type=signup");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    return redirectTo(`/auth/error?type=${type}`);
  }

  // Recovery deliberately bypasses safeRedirect, which maps every /auth* path to "/".
  return redirectTo(type === "recovery" ? "/auth/reset-password" : safeRedirect(next));
}
