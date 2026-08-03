import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import theme from '../lib/theme'
import PageHeader from '../components/PageHeader'
import { RequireAuth } from '../lib/requireAuth'

const CUISINE_EMOJI = {
  Indian: '🍛',
  Italian: '🍝',
  Mexican: '🌮',
  Chinese: '🥡',
  Japanese: '🍣',
  Thai: '🍜',
  Mediterranean: '🥗',
  'Middle Eastern': '🧆',
  French: '🥖',
  American: '🍔',
  Korean: '🍲',
  Spanish: '🥘'
}

export default function CuisinesPage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('All')

  const grouped = useMemo(() => {
    const groups = { All: [...theme.cuisineOptions], Spicy: [], Mild: [], Herby: [], Comfort: [] }
    theme.cuisineOptions.forEach((c) => {
      const flavor = (theme.cuisineGuides?.[c]?.flavor || '').toLowerCase()
      if (/spicy|zesty|smoky|tangy/.test(flavor)) groups.Spicy.push(c)
      if (/subtle|clean|mild|balanced/.test(flavor)) groups.Mild.push(c)
      if (/herb|fresh|citrus|aromatic/.test(flavor)) groups.Herby.push(c)
      if (/rich|hearty|comfort|warming/.test(flavor)) groups.Comfort.push(c)
    })
    return groups
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = grouped[selected] || theme.cuisineOptions
    if (!q) return source
    return source.filter((c) => c.toLowerCase().includes(q))
  }, [query, grouped, selected])

  const [featuredCuisine, setFeaturedCuisine] = useState(() => {
    const source = filtered.length ? filtered : theme.cuisineOptions
    return source[0]
  })

  // Pick a random featured cuisine on the client only to avoid SSR/CSR mismatch
  useEffect(() => {
    const source = filtered.length ? filtered : theme.cuisineOptions
    if (source.length) {
      const idx = Math.floor(Math.random() * source.length)
      setFeaturedCuisine(source[idx])
    }
  }, [filtered])

  return (
    <RequireAuth fallbackPath="/cuisines">
      <div className="min-h-screen py-10">
        <div className="app-container">
          <div className="card">
          <PageHeader
            title="Cuisine Explorer"
            subtitle="Browse cuisine types and jump back to recipe generation with one click."
            actions={(
              <>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setSelected('All')}
                  style={{ background: 'linear-gradient(135deg,#0ea5e9,#0369a1)' }}
                >
                  Reset Filters
                </button>
              </>
            )}
          />

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="card" style={{ padding: '.7rem .8rem', marginBottom: '.75rem' }}>
                <img
                  src="/img/barbeque.svg"
                  alt="Cuisine visual"
                  style={{ width: '100%', height: 140, objectFit: 'contain', background: 'rgba(255,255,255,0.75)', borderRadius: 10, padding: '.35rem' }}
                />
              </div>
              <input
                className="form-control"
                style={{ width: '100%', maxWidth: 420 }}
                placeholder="Search cuisine type"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {Object.keys(grouped).map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelected(group)}
                    style={{
                      border: '1px solid rgba(217,119,6,0.22)',
                      borderRadius: 999,
                      padding: '.24rem .7rem',
                      background: selected === group ? 'rgba(217,119,6,0.18)' : 'white',
                      color: '#92400e',
                      fontSize: '.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '.8rem 1rem', background: 'linear-gradient(135deg, rgba(217,119,6,0.12), rgba(245,158,11,0.06))' }}>
              <div className="small-muted">Featured today</div>
              <div className="mt-1 text-lg font-semibold">{CUISINE_EMOJI[featuredCuisine]} {featuredCuisine}</div>
              <div className="small-muted mt-1">{theme.cuisineGuides?.[featuredCuisine]?.flavor}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(theme.cuisineGuides?.[featuredCuisine]?.staples || []).map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 small-muted">
            Showing <strong>{filtered.length}</strong> cuisine type{filtered.length === 1 ? '' : 's'} • Filter: <strong>{selected}</strong>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((cuisine) => {
              const guide = theme.cuisineGuides?.[cuisine]
              return (
                <div key={cuisine} className="card" style={{ padding: '1rem 1.1rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: 10, top: 6, fontSize: '2rem', opacity: .18 }}>{CUISINE_EMOJI[cuisine] || '🍽️'}</div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{CUISINE_EMOJI[cuisine]} {cuisine}</h3>
                    <Link href={`/generate?cuisine=${encodeURIComponent(cuisine)}`} className="small-muted">Use this →</Link>
                  </div>
                  <p className="small-muted mt-2">{guide?.flavor || 'Balanced and versatile flavor profile.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(guide?.staples || []).map((s) => (
                      <span key={s} className="chip">{s}</span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/generate?cuisine=${encodeURIComponent(cuisine)}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                      Generate with this cuisine
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(cuisine)}
                      style={{
                        border: '1px solid rgba(217,119,6,0.24)',
                        borderRadius: 10,
                        padding: '.45rem .7rem',
                        background: 'rgba(255,251,235,0.8)',
                        color: '#92400e',
                        fontSize: '.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      Copy name
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="mt-5 card" style={{ padding: '1rem 1.1rem' }}>
              <div className="font-medium">No cuisines found</div>
              <div className="small-muted mt-1">Try a different search query or reset filters.</div>
            </div>
          )}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
