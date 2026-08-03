const store = new Map()

// Fixed-window rate limiter per id (IP or key)
// Returns detailed metadata for security handling and headers.
function checkRateLimit(id, limit = 20, windowMs = 60_000) {
  const now = Date.now()
  const entry = store.get(id) || { count: 0, start: now }

  if (now - entry.start > windowMs) {
    entry.count = 1
    entry.start = now
    store.set(id, entry)
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.start + windowMs,
      retryAfterMs: 0,
    }
  }

  entry.count += 1
  store.set(id, entry)

  const allowed = entry.count <= limit
  const retryAfterMs = allowed ? 0 : Math.max(0, entry.start + windowMs - now)

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.start + windowMs,
    retryAfterMs,
  }
}

module.exports = checkRateLimit
