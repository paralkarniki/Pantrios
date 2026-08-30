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
        <div style={{ display: 'inline-block', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 50, padding: '0.35rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: '#b45309', marginBottom: '1.4rem', letterSpacing: '0.02em' }}>
          ✨ Free forever · No credit card
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 1.2rem', color: '#1c1917', fontFamily: 'Fredoka, system-ui, sans-serif' }}>
          What's in your kitchen?<br />
          <span style={{ color: '#d97706' }}>We'll make it a meal.</span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: '#78716c', lineHeight: 1.75, margin: '0 0 2.2rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Pantrio turns your leftover ingredients into delicious step-by-step recipes. No waste, no stress.
        </p>

        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login?mode=signup" style={{
            padding: '0.85rem 2.2rem', borderRadius: 50,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
            fontWeight: 700, textDecoration: 'none', fontSize: '1.05rem',
            boxShadow: '0 6px 20px rgba(217,119,6,0.3)',
          }}>
            Start cooking free →
          </Link>
          <Link href="/generate" style={{
            padding: '0.85rem 2.2rem', borderRadius: 50,
            background: '#fff', color: '#44403c',
            fontWeight: 600, textDecoration: 'none', fontSize: '1.05rem',
            border: '1.5px solid rgba(0,0,0,0.1)',
          }}>
            Try without signing up
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1c1917', margin: '0 0 2.2rem', fontFamily: 'Fredoka, system-ui, sans-serif' }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1.5px solid rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: '#b45309' }}>
                  {s.n}
                </div>
                <div style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.97rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.85rem', color: '#78716c', lineHeight: 1.5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '3.5rem 1.5rem', maxWidth: 860, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#1c1917', margin: '0 0 2rem', fontFamily: 'Fredoka, system-ui, sans-serif' }}>
          Everything you need
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 20, padding: '1.4rem 1.2rem', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: '#1c1917', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: '0.84rem', color: '#78716c', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ textAlign: 'center', padding: '3.5rem 1.5rem 5rem', background: 'linear-gradient(180deg, #fffbf2, #fff7e0)' }}>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#1c1917', margin: '0 0 0.8rem', fontFamily: 'Fredoka, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
          Ready to cook something great?
        </h2>
        <p style={{ color: '#78716c', fontSize: '1rem', margin: '0 0 1.8rem' }}>
          Join thousands of home cooks using Pantrio every week.
        </p>
        <Link href="/login?mode=signup" style={{
          padding: '0.9rem 2.6rem', borderRadius: 50,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
          fontWeight: 700, textDecoration: 'none', fontSize: '1.05rem',
          boxShadow: '0 6px 20px rgba(217,119,6,0.3)',
          display: 'inline-block',
        }}>
          Create free account →
        </Link>
        <p style={{ marginTop: '1.2rem', fontSize: '0.8rem', color: '#c4b9b0' }}>
          Powered by Next.js · Firebase · No ads · No tracking
        </p>
      </section>
    </div>
  )
}


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

