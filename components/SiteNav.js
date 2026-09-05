import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { subscribeToAuth, logout } from '../lib/auth'

export default function SiteNav() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const homeHref = user ? '/generate' : '/'
  const mobileMenuId = 'mobile-navigation-menu'
  const protectedItems = [
    { href: '/generate', label: 'Home' },
    { href: '/family-recipes', label: 'Family' },
    { href: '/cuisines', label: 'Cuisines' },
  ]

  const toolsItems = [{ href: '/planner', label: 'Planner' }]

  const exploreItems = [
    { href: '/kitchen-tools', label: 'Kitchen Tools' },
    { href: '/planning', label: 'Planning Hub' },
    { href: '/cooking-assist', label: 'Cooking Assist' },
  ]

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

  useEffect(() => {
    setOpen(false)
  }, [router.pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

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

        <div className="site-links compact desktop-links" role="navigation" aria-label="Primary">
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
            <summary className="nav-group-label">Explore</summary>
            <div className="nav-group-items">
              {exploreItems.map((it) => (
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
          aria-controls={mobileMenuId}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden className="nav-toggle-icon">{open ? '✕' : '☰'}</span>
          <span className="nav-toggle-text">{open ? 'Close' : 'Menu'}</span>
        </button>
      </div>

      {open && (
        <div className="site-mobile-menu" role="dialog" aria-modal="true" id={mobileMenuId}>
          <div className="mobile-backdrop" onClick={() => setOpen(false)} />
          <div className="mobile-panel">
            <div className="mobile-panel-inner">
              <div className="mobile-panel-header">
                <div>
                  <div style={{ fontWeight: 800, fontFamily: 'Fredoka, system-ui, sans-serif' }}>Pantrio</div>
                  <div className="small-muted" style={{ marginTop: 2 }}>Menu</div>
                </div>
                <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
              </div>
              <nav className="mobile-menu-content">
                <details className="mobile-section" open>
                  <summary className="mobile-section-title">Recipes</summary>
                  <div className="mobile-section-links">
                    {protectedItems.map((it) => (
                      <Link key={it.href} href={it.href} className={"nav-link mobile-link " + (router.pathname === it.href ? 'active' : '')} onClick={() => setOpen(false)}>
                        {it.label}
                      </Link>
                    ))}
                  </div>
                </details>

                <details className="mobile-section">
                  <summary className="mobile-section-title">Tools</summary>
                  <div className="mobile-section-links">
                    {toolsItems.map((it) => (
                      <Link key={it.href} href={it.href} className={"nav-link mobile-link " + (router.pathname === it.href ? 'active' : '')} onClick={() => setOpen(false)}>
                        {it.label}
                      </Link>
                    ))}
                  </div>
                </details>

                <details className="mobile-section">
                  <summary className="mobile-section-title">Explore</summary>
                  <div className="mobile-section-links">
                    {exploreItems.map((it) => (
                      <Link key={it.href} href={it.href} className={"nav-link mobile-link " + (router.pathname === it.href ? 'active' : '')} onClick={() => setOpen(false)}>
                        {it.label}
                      </Link>
                    ))}
                  </div>
                </details>

                <details className="mobile-section" open>
                  <summary className="mobile-section-title">Account</summary>
                  <div className="mobile-section-links">
                    <span className="nav-link mobile-link" style={{ cursor: 'default' }}>Hi, {getDisplayName(user)}</span>
                    {accountItems.map((it) => {
                      if (it.action === 'logout') {
                        return (
                          <a
                            key={it.label}
                            role="button"
                            className={"nav-link mobile-link " + (router.pathname === '/logout' ? 'active' : '')}
                            style={{ cursor: 'pointer' }}
                            onClick={async (e) => {
                              e.preventDefault()
                              setOpen(false)
                              try { await logout() } catch (err) {}
                              router.replace('/')
                            }}
                          >
                            {it.label}
                          </a>
                        )
                      }

                      return (
                        <Link key={it.href} href={it.href} className={"nav-link mobile-link " + (router.pathname === it.href ? 'active' : '')} onClick={() => setOpen(false)}>
                          {it.label}
                        </Link>
                      )
                    })}
                  </div>
                </details>
              </nav>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
