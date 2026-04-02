const store = new Map()

// Simple fixed-window rate limiter per id (IP)
// limit: max requests per windowMs
module.exports = function checkRateLimit(id, limit = 20, windowMs = 60_000) {
  const now = Date.now()
  const entry = store.get(id) || { count: 0, start: now }

  if (now - entry.start > windowMs) {
    // reset window
    entry.count = 1
    entry.start = now
    store.set(id, entry)
    return true
  }

  entry.count += 1
  store.set(id, entry)

  return entry.count <= limit
}
