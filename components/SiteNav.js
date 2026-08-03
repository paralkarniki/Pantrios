import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { subscribeToAuth, logout } from '../lib/auth'

export default function SiteNav() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const homeHref = user ? '/generate' : '/'
  const protectedItems = [
    { href: '/generate', label: 'Home' },
    { href: '/family-recipes', label: 'Family' },
    { href: '/cuisines', label: 'Cuisines' },
  ]

  const toolsItems = [{ href: '/planner', label: 'Planner' }]

  const accountItems = user
    ? [
        { href: '/profile', label: 'Profile' },
        ...(user?.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
        { href: '/logout', label: 'Logout', action: 'logout' },
      ]
    : [{ href: '/login', label: 'Login' }]

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  function closeOtherGroups(current) {
    if (typeof document === 'undefined') return
    const groups = Array.from(document.querySelectorAll('.nav-group'))
    groups.forEach((g) => {
      if (g !== current) g.open = false
    })
  }

  function getDisplayName(u) {
    if (!u) return 'Chef'
    const fn = String(u.firstname || '').trim()
    if (fn && !['chef', 'guest', 'user'].includes(fn.toLowerCase())) return fn
    if (u.email) {
      const local = String(u.email).split('@')[0]
      const parts = local.split(/[\.\+\-_]/).filter(Boolean)
      const candidate = (parts[0] || local || '').replace(/[^a-zA-Z]/g, '')
      if (candidate) return candidate.charAt(0).toUpperCase() + candidate.slice(1)
    }
    return 'Chef'
  }

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <div className="site-brand">
          <Link href={homeHref} className="brand-link">Pantrio</Link>
        </div>

        <div className="site-links compact" role="navigation" aria-label="Primary">
          <details className="nav-group" onToggle={(e) => { if (e.currentTarget.open) closeOtherGroups(e.currentTarget) }}>
            <summary className="nav-group-label">Recipes</summary>
            <div className="nav-group-items">
              {protectedItems.map((it) => (
                <Link key={it.href} href={it.href} className={"nav-link " + (router.pathname === it.href ? 'active' : '')}>
                  {it.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="nav-group" onToggle={(e) => { if (e.currentTarget.open) closeOtherGroups(e.currentTarget) }}>
            <summary className="nav-group-label">Tools</summary>
            <div className="nav-group-items">
              {toolsItems.map((it) => (
                <Link key={it.href} href={it.href} className={"nav-link " + (router.pathname === it.href ? 'active' : '')}>
                  {it.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="nav-group" onToggle={(e) => { if (e.currentTarget.open) closeOtherGroups(e.currentTarget) }}>
            <summary className="nav-group-label">Account</summary>
            <div className="nav-group-items">
              <span className="nav-link" style={{ cursor: 'default', padding: '6px 10px' }}>Hi, {getDisplayName(user)}</span>
              {accountItems.map((it) => {
                if (it.action === 'logout') {
                  return (
                    <a
                      key={it.label}
                      role="button"
                      className="nav-link"
                      style={{ cursor: 'pointer' }}
                      onClick={async (e) => {
                        e.preventDefault()
                        try { await logout() } catch (err) {}
                        router.replace('/')
                      }}
                    >
                      {it.label}
                    </a>
                  )
                }

                return (
                  <Link key={it.href} href={it.href} className={"nav-link " + (router.pathname === it.href ? 'active' : '')}>
                    {it.label}
                  </Link>
                )
              })}
            </div>
          </details>
        </div>

        <button
          className="nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden>{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <div className="site-mobile-menu" role="dialog" aria-modal="true">
          <div className="mobile-backdrop" onClick={() => setOpen(false)} />
          <div className="mobile-panel">
            <div className="mobile-panel-inner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>Pantrio</div>
                <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {navItems.map((it) => (
                  <Link key={it.href} href={it.href} className={"nav-link mobile-link " + (router.pathname === it.href ? 'active' : '')} onClick={() => setOpen(false)}>
                    {it.label}
                  </Link>
                ))}

                {user ? (
                  <a
                    className={"nav-link mobile-link " + (router.pathname === '/logout' ? 'active' : '')}
                    onClick={async () => {
                      setOpen(false)
                      try { await logout() } catch (e) {}
                      router.replace('/')
                    }}
                  >
                    Logout
                  </a>
                ) : (
                  <Link href="/login" className={"nav-link mobile-link " + (router.pathname === '/login' ? 'active' : '')} onClick={() => setOpen(false)}>Login</Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
