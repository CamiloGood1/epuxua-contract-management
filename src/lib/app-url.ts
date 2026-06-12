/** URL pública de la app (invitaciones, redirects de Auth). */
export function getAppSiteUrl(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (configured) return configured

  const vercel = process.env.VERCEL_URL
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`

  return undefined
}

export function getLoginRedirectUrl(): string | undefined {
  const base = getAppSiteUrl()
  return base ? `${base}/login` : undefined
}
