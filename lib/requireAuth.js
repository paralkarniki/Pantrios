import { useEffect, useState } from 'react'
import { subscribeToAuth } from './auth'
import { useRouter } from 'next/router'

function getRedirectPath(defaultPath = '/generate') {
  if (typeof window === 'undefined') return defaultPath
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect')
  if (redirect && typeof redirect === 'string') return redirect
  return defaultPath
}

export function RequireAuth({ children, redirectTo = '/login', fallbackPath = '/generate' }) {
  const router = useRouter()
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (user === undefined) return
    if (user) return

    const target = getRedirectPath(fallbackPath)
    router.replace(`${redirectTo}?redirect=${encodeURIComponent(target)}`)
  }, [user, router, redirectTo, fallbackPath])

  if (user === undefined) {
    return (
      <div className="app-container" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#444' }}>
          Checking authentication…
        </div>
      </div>
    )
  }

  if (user === null) {
    return (
      <div className="app-container" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#444' }}>
          Redirecting to login…
        </div>
      </div>
    )
  }

  return children
}

