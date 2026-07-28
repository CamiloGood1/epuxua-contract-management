import type { CleanResult } from "./types"

// Boilerplate detection: short lines that repeat many times are headers/footers
const BOILERPLATE_MAX_LENGTH = 60
const REPEAT_THRESHOLD = 3
// Generous cap: ~40 pages × ~600 chars/page = 24k chars ≈ 6k tokens for gpt-4o-mini
const MAX_CHARS = 25_000

export function cleanDocumentText(rawText: string): CleanResult {
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Remove isolated numeric-only lines (page numbers)
  text = text.replace(/^\s*\d{1,4}\s*$/gm, "")

  // Count line frequency to detect boilerplate (repeated headers/footers)
  const lines = text.split("\n")
  const freq = new Map<string, number>()
  for (const line of lines) {
    const key = line.trim().toLowerCase()
    if (key.length >= 5 && key.length <= BOILERPLATE_MAX_LENGTH) {
      freq.set(key, (freq.get(key) ?? 0) + 1)
    }
  }

  // Remove lines identified as boilerplate (short + repeated)
  const filtered = lines.filter((line) => {
    const key = line.trim().toLowerCase()
    if (key.length < 5 || key.length > BOILERPLATE_MAX_LENGTH) return true
    return (freq.get(key) ?? 0) < REPEAT_THRESHOLD
  })

  text = filtered.join("\n")

  // Collapse 3+ consecutive blank lines into one
  text = text.replace(/\n{3,}/g, "\n\n").trim()

  // Soft-cap: cut at paragraph boundary to avoid truncating mid-sentence
  if (text.length > MAX_CHARS) {
    const cutAt = text.lastIndexOf("\n\n", MAX_CHARS)
    text = cutAt > MAX_CHARS * 0.8 ? text.slice(0, cutAt) : text.slice(0, MAX_CHARS)
  }

  return { text, charCount: text.length }
}
