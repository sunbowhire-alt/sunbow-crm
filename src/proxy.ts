import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  if (process.env.SUNBOW_PREVIEW_MODE === "true" && process.env.VERCEL_ENV === "preview") {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    login.searchParams.set("error", "Staff sign-in is not configured");
    return NextResponse.redirect(login);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.redirect(login);
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
