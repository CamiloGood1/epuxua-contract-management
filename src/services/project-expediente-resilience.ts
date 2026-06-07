export async function safeExpedienteLoad<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
  warnings: string[]
): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[expediente] ${label}:`, msg)
    warnings.push(label)
    return fallback
  }
}
