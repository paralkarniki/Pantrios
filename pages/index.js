import { useEffect, useState } from 'react'
import Link from 'next/link'
import { subscribeToAuth } from '../lib/auth'
import { useRouter } from 'next/router'

const FEATURES = [
  { icon: '🥕', title: 'Use what you have', desc: 'Type in any ingredients from your fridge or pantry and get a real recipe instantly.' },
  { icon: '🌍', title: 'Every cuisine', desc: 'Indian, Italian, Thai, Mexican, Japanese and more — all in one place.' },
  { icon: '📅', title: 'Weekly meal planner', desc: 'Plan your whole week, auto-generate a shopping list with costs.' },
  { icon: '👨‍👩‍👧', title: 'Family cookbook', desc: 'Save and revisit the recipes your family always comes back to.' },
]

const STEPS = [
  { n: '1', label: 'Add ingredients', sub: 'Type what\'s in your kitchen.' },
  { n: '2', label: 'Generate recipe', sub: 'Pantrio builds a full recipe in seconds.' },
  { n: '3', label: 'Cook & enjoy', sub: 'Follow the steps and eat well.' },
]

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const unsub = subscribeToAuth((u) => { setUser(u); setLoaded(true) })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (loaded && user) router.replace('/generate')
  }, [loaded, user, router])

  if (loaded && user) return <div style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>Redirecting…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#fffbf2', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Nav bar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255,251,242,0.9)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1c1917', fontFamily: 'Fredoka, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
          🍳 Pantrio
        </span>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/login" style={{ padding: '0.5rem 1.2rem', borderRadius: 50, color: '#44403c', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff' }}>
            Sign in
          </Link>
          <Link href="/login?mode=signup" style={{ padding: '0.5rem 1.2rem', borderRadius: 50, color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 2px 8px rgba(217,119,6,0.25)' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center', padding: 'clamp(3rem,8vw,6rem) 1.5rem 3rem', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '1px solid rgba(217,119,6,0.18)',
          fontSize: '2rem', marginBottom: '1.5rem',
          boxShadow: '0 4px 16px rgba(217,119,6,0.14)',
        }}>🍳</div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: '0 0 1rem',
          color: '#1c1917',
          fontFamily: 'Fredoka, system-ui, sans-serif',
        }}>
          Turn your pantry into<br />a great meal.
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: '#78716c',
          lineHeight: 1.7,
          margin: '0 0 2rem',
          maxWidth: 440,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Tell Pantrio what ingredients you have. Get a recipe in seconds — no subscription, no ads.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login?mode=signup" style={{
            padding: '0.75rem 2rem',
            borderRadius: 50,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 14px rgba(217,119,6,0.28)',
            transition: 'opacity 0.15s',
          }}>
            Get started free
          </Link>
          <Link href="/login" style={{
            padding: '0.75rem 2rem',
            borderRadius: 50,
            background: 'rgba(255,255,255,0.85)',
            color: '#44403c',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '1rem',
            border: '1.5px solid rgba(0,0,0,0.09)',
          }}>
            Sign in
          </Link>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#a8a29e' }}>
          Free forever · No credit card needed
        </p>
      </div>

      {/* Feature grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '3.5rem',
        width: '100%',
        maxWidth: 780,
      }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{
            background: 'rgba(255,255,255,0.72)',
            borderRadius: 18,
            padding: '1.2rem 1.1rem',
            border: '1px solid rgba(0,0,0,0.06)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.97rem', color: '#1c1917', marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: '0.86rem', color: '#78716c', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p style={{ marginTop: '3rem', fontSize: '0.8rem', color: '#c4b9b0' }}>
        Powered by Next.js · Firebase · Built with ❤️
      </p>
      </section>
    </div>
  )
}

