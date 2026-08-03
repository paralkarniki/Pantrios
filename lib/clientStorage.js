function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function userStorageScope(userOrUid) {
  if (!userOrUid) return 'guest'
  if (typeof userOrUid === 'string') return userOrUid
  if (typeof userOrUid === 'object' && userOrUid.uid) return String(userOrUid.uid)
  return 'guest'
}

export function scopedStorageKey(baseKey, userOrUid) {
  return `${baseKey}:${userStorageScope(userOrUid)}`
}

export function readScopedJSON(baseKey, userOrUid, fallback, options = {}) {
  if (typeof window === 'undefined') return fallback

  const legacyKey = options?.legacyKey || baseKey
  const migrateLegacy = options?.migrateLegacy !== false
  const scopedKey = scopedStorageKey(baseKey, userOrUid)

  const scopedRaw = window.localStorage.getItem(scopedKey)
  if (scopedRaw != null) {
    return safeParse(scopedRaw, fallback)
  }

  const legacyRaw = window.localStorage.getItem(legacyKey)
  if (legacyRaw == null) return fallback

  const parsed = safeParse(legacyRaw, fallback)

  if (migrateLegacy) {
    try {
      window.localStorage.setItem(scopedKey, JSON.stringify(parsed))
    } catch {}
  }

  return parsed
}

export function writeScopedJSON(baseKey, userOrUid, value) {
  if (typeof window === 'undefined') return
  try {
    const scopedKey = scopedStorageKey(baseKey, userOrUid)
    window.localStorage.setItem(scopedKey, JSON.stringify(value))
  } catch {}
}

export function removeScoped(baseKey, userOrUid) {
  if (typeof window === 'undefined') return
  try {
    const scopedKey = scopedStorageKey(baseKey, userOrUid)
    window.localStorage.removeItem(scopedKey)
  } catch {}
}

export function listScopedKeys(prefix, userOrUid) {
  if (typeof window === 'undefined') return []
  const scope = userStorageScope(userOrUid)
  const suffix = `:${scope}`
  const out = []

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key) continue
    if (key.startsWith(prefix) && key.endsWith(suffix)) out.push(key)
  }

  return out
}
