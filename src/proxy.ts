import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.next({ request })

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    let user = null
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.warn("[proxy] getUser:", error.message)
      } else {
        user = data?.user ?? null
      }
    } catch (err) {
      console.warn("[proxy] getUser failed:", err instanceof Error ? err.message : err)
    }

    const isLoginPage = request.nextUrl.pathname.startsWith("/login")

    if (!user && !isLoginPage) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      return NextResponse.redirect(redirectUrl)
    }

    if (user && isLoginPage) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/"
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  } catch (err) {
    console.error("[proxy] unhandled:", err instanceof Error ? err.message : err)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
