import { useEffect, useState } from 'react'
import Link from 'next/link'
import { subscribeToAuth } from '../lib/auth'
import { useRouter } from 'next/router'

const FEATURES = [
  { icon: '🥕', title: 'Pantry-first', desc: 'Enter what you have, get a recipe instantly.' },
  { icon: '🌍', title: 'Any cuisine', desc: 'Indian, Italian, Thai, Mexican and more.' },
  { icon: '📅', title: 'Meal planner', desc: 'Plan your whole week and build a shopping list.' },
  { icon: '👨‍👩‍👧', title: 'Family cookbook', desc: 'Save and organise the recipes everyone loves.' },
]

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u)
      setLoaded(true)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (loaded && user) router.replace('/generate')
  }, [loaded, user, router])

  if (loaded && user) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>Redirecting…</div>
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #fffbf2 0%, #fff7e6 50%, #f0fdf4 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
    }}>
      {/* Hero */}
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
    </div>
  )
}

