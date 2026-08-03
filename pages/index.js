import { useEffect, useState } from 'react'
import Link from 'next/link'
import { subscribeToAuth } from '../lib/auth'
import { useRouter } from 'next/router'

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

  // Redirect authenticated users to generate page
  useEffect(() => {
    if (loaded && user) {
      router.replace('/generate')
    }
  }, [loaded, user, router])

  if (loaded && user) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Redirecting...</div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 800 }}>Pantrio</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.7 }}>
          Generate delicious recipes based on your available ingredients
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" className="button" style={{ padding: '0.75rem 2rem', textDecoration: 'none', display: 'inline-block' }}>
            Sign In
          </Link>
          <Link href="/login?mode=signup" className="button" style={{ padding: '0.75rem 2rem', textDecoration: 'none', display: 'inline-block', opacity: 0.7 }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
