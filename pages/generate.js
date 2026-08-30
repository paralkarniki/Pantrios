import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import IngredientInput from '../components/IngredientInput'
import RecipeCard from '../components/RecipeCard'
import theme from '../lib/theme'
import AnimatedBackground from '../components/AnimatedBackground'
import PageHeader from '../components/PageHeader'
import { RequireAuth } from '../lib/requireAuth'
import { subscribeToAuth } from '../lib/auth'
import { saveUserData, subscribeUserData } from '../lib/userData'
import { readScopedJSON, writeScopedJSON } from '../lib/clientStorage'

const FAVORITES_KEY = 'pantrio:favorites'
const RECENT_KEY = 'pantrio:recent'
const PINNED_KEY = 'pantrio:pinnedFavorites'

export default function Home() {
  const router = useRouter()

  const [ingredients, setIngredients] = useState([])
  const [dietary, setDietary] = useState('')
  const [maxTime, setMaxTime] = useState('')
  const [targetCalories, setTargetCalories] = useState('')
  const [cuisine, setCuisine] = useState('')

  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [user, setUser] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [recentRecipes, setRecentRecipes] = useState([])
  const [pinnedFavorites, setPinnedFavorites] = useState([])

  const [model, setModel] = useState('gpt-4o-mini')

  const [favoriteQuery, setFavoriteQuery] = useState('')
  const [favoriteSort, setFavoriteSort] = useState('newest')

  const [deletedFavorite, setDeletedFavorite] = useState(null)
  const [deletedFavoriteIndex, setDeletedFavoriteIndex] = useState(-1)

  const [importError, setImportError] = useState('')
  const importFileRef = useRef(null)

  const safeParse = useCallback((s, fallback) => {
    try {
      return JSON.parse(s)
    } catch {
      return fallback
    }
  }, [])

  useEffect(() => {
    setImportError('')
    const unsubAuth = subscribeToAuth((u) => setUser(u))
    let unsubUserData = null

    const loadLocal = () => {
      const saved = readScopedJSON(FAVORITES_KEY, user?.uid, [], { legacyKey: FAVORITES_KEY })
      setFavorites(Array.isArray(saved) ? saved : [])

      const recent = readScopedJSON(RECENT_KEY, user?.uid, [], { legacyKey: RECENT_KEY })
      setRecentRecipes(Array.isArray(recent) ? recent : [])

      const pinned = readScopedJSON(PINNED_KEY, user?.uid, [], { legacyKey: PINNED_KEY })
      setPinnedFavorites(Array.isArray(pinned) ? pinned : [])
    }

    loadLocal()

    if (user?.uid) {
      unsubUserData = subscribeUserData(user.uid, (data) => {
        if (Array.isArray(data.favorites)) setFavorites(data.favorites)
        if (Array.isArray(data.recent)) setRecentRecipes(data.recent)
        if (Array.isArray(data.pinnedFavorites)) setPinnedFavorites(data.pinnedFavorites)
      })
    }

    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get('r')
      if (shared) {
        const decoded = decodeURIComponent(escape(atob(shared)))
        const parsed = JSON.parse(decoded)
        if (parsed?.title && Array.isArray(parsed?.ingredients) && Array.isArray(parsed?.steps)) {
          setRecipe(parsed)
          setRecentRecipes((prev) => [parsed, ...(Array.isArray(prev) ? prev : [])].slice(0, 20))
        }
      }
    } catch {}

    return () => {
      unsubAuth()
      if (unsubUserData) unsubUserData()
    }
  }, [safeParse, user?.uid])

  const persistFavorites = useCallback((next) => {
    setFavorites(next)
    writeScopedJSON(FAVORITES_KEY, user?.uid, next)
    if (user?.uid) {
      saveUserData(user.uid, { favorites: next })
    }
  }, [user?.uid])

  const persistRecent = useCallback((next) => {
    setRecentRecipes(next)
    writeScopedJSON(RECENT_KEY, user?.uid, next)
    if (user?.uid) {
      saveUserData(user.uid, { recent: next })
    }
  }, [user?.uid])

  const persistPinned = useCallback((next) => {
    setPinnedFavorites(next)
    writeScopedJSON(PINNED_KEY, user?.uid, next)
    if (user?.uid) {
      saveUserData(user.uid, { pinnedFavorites: next })
    }
  }, [user?.uid])

  const maxFavorites = 10

  const visibleFavorites = useMemo(() => {
    const q = String(favoriteQuery || '').trim().toLowerCase()

    let list = Array.isArray(favorites) ? [...favorites] : []

    if (q) {
      list = list.filter((r) => {
        const t = String(r?.title || '').toLowerCase()
        const ing = (r?.ingredients || []).join(',').toLowerCase()
        return t.includes(q) || ing.includes(q)
      })
    }

    // sort base
    if (favoriteSort === 'newest') {
      list.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0))
    } else if (favoriteSort === 'oldest') {
      list.sort((a, b) => (a?.createdAt || 0) - (b?.createdAt || 0))
    } else if (favoriteSort === 'az') {
      list.sort((a, b) => String(a?.title || '').localeCompare(String(b?.title || '')))
    } else if (favoriteSort === 'za') {
      list.sort((a, b) => String(b?.title || '').localeCompare(String(a?.title || '')))
    }

    // pinned first
    if (Array.isArray(pinnedFavorites) && pinnedFavorites.length) {
      const pinned = new Set(pinnedFavorites)
      list.sort((a, b) => {
        const ap = pinned.has(a?.title)
        const bp = pinned.has(b?.title)
        if (ap === bp) return 0
        return ap ? -1 : 1
      })
    }

    return list
  }, [favorites, favoriteQuery, favoriteSort, pinnedFavorites])

  const openFavorite = useCallback((fav) => {
    if (!fav) return
    setRecipe(fav)
    persistRecent([fav, ...recentRecipes].slice(0, 20))
  }, [persistRecent, recentRecipes])

  const togglePinnedFavorite = useCallback((title) => {
    if (!title) return
    const t = String(title)
    if (pinnedFavorites.includes(t)) {
      persistPinned(pinnedFavorites.filter((x) => x !== t))
    } else {
      persistPinned([t, ...pinnedFavorites].slice(0, maxFavorites))
    }
  }, [pinnedFavorites, persistPinned])

  const deleteFavorite = useCallback((index) => {
    setDeletedFavoriteIndex(index)
    setDeletedFavorite(favorites[index] || null)

    const next = favorites.filter((_, i) => i !== index)
    persistFavorites(next)
  }, [favorites, persistFavorites])

  const undoDeleteFavorite = useCallback(() => {
    if (deletedFavorite == null || deletedFavoriteIndex < 0) return
    const idx = Math.min(Math.max(0, deletedFavoriteIndex), favorites.length)
    const next = [...favorites]
    next.splice(idx, 0, deletedFavorite)
    persistFavorites(next)
    setDeletedFavorite(null)
    setDeletedFavoriteIndex(-1)
  }, [deletedFavorite, deletedFavoriteIndex, favorites, persistFavorites])

  const clearFavorites = useCallback(() => {
    persistFavorites([])
    persistPinned([])
    setDeletedFavorite(null)
    setDeletedFavoriteIndex(-1)
  }, [persistFavorites, persistPinned])

  const openRandomSavedRecipe = useCallback(() => {
    if (!favorites.length) return
    const i = Math.floor(Math.random() * favorites.length)
    openFavorite(favorites[i])
  }, [favorites, openFavorite])

  const exportFavorites = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      favorites,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `pantrio-favorites-${Date.now()}.json`
    a.click()

    URL.revokeObjectURL(url)
  }, [favorites])

  const importFavorites = useCallback((e) => {
    setImportError('')
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        const parsed = JSON.parse(text)
        const incoming = parsed?.favorites || parsed
        if (!Array.isArray(incoming)) throw new Error('Invalid format: expected favorites array')

        // keep max
        const merged = [...incoming].slice(0, maxFavorites)
        persistFavorites(merged)
        // recompute pins to only keep titles still present
        if (Array.isArray(pinnedFavorites) && pinnedFavorites.length) {
          const presentTitles = new Set(merged.map((r) => r?.title))
          persistPinned(pinnedFavorites.filter((t) => presentTitles.has(t)))
        }
      } catch (err) {
        setImportError(err?.message || 'Import failed')
      } finally {
        if (importFileRef.current) importFileRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }, [maxFavorites, pinnedFavorites, persistFavorites, persistPinned])

  const generate = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const ingredientsPayload = Array.isArray(ingredients) ? ingredients : []
      const payload = {
        ingredients: ingredientsPayload,
        dietary,
        maxTime,
        targetCalories,
        cuisine,
        model,
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Generation failed')

      if (!data?.title || !Array.isArray(data?.steps) || !Array.isArray(data?.ingredients)) {
        throw new Error('Invalid recipe response')
      }

      const now = Date.now()
      const withMeta = { ...data, createdAt: now }
      setRecipe(withMeta)
      persistRecent([withMeta, ...recentRecipes].slice(0, 20))
    } catch (err) {
      setErrorMessage(err?.message || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }, [cuisine, dietary, ingredients, maxTime, targetCalories, model, persistRecent, recentRecipes])

  const canSaveFavorite = !!recipe
  const isFull = favorites.length >= maxFavorites

  const onSaveFavorite = useCallback(() => {
    if (!recipe) return
    if (isFull) return

    const exists = favorites.some((f) => f?.title === recipe?.title)
    if (exists) return

    const withCreatedAt = { ...recipe, createdAt: Date.now() }
    persistFavorites([withCreatedAt, ...favorites].slice(0, maxFavorites))
  }, [favorites, isFull, persistFavorites, recipe])

  // Keyboard shortcut: Ctrl/Cmd + Enter -> generate
  useEffect(() => {
    function onKeyDown(e) {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (mod && e.key === 'Enter') {
        e.preventDefault()
        generate()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [generate])

  return (
    <RequireAuth>
      <div className="min-h-screen" style={{ paddingBottom: '3rem' }}>
        <AnimatedBackground />
        <div className="app-container">
          <header className="fade-in-up">
            <PageHeader
              title={"Turn pantry scraps into show-stopping meals"}
              subtitle={"Tell me what you have — dietary prefs, time, and calories — and I'll craft simple, delicious recipes you can make right now."}
              actions={(
                <>
                  <button
                    className="btn-primary btn-hero inline-flex items-center gap-3 px-6 py-3 text-lg"
                    onClick={() => document.getElementById('ingredient-input')?.focus()}
                  >
                    <span className="btn-icon animate-bounce">🍳</span>
                    Generate a Recipe
                  </button>

                  <a href="/planner" className="btn-secondary inline-flex items-center gap-3 px-5 py-3">
                    <span className="btn-icon">📋</span>
                    Meal Planner
                  </a>
                </>
              )}
            />

            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto lg:mx-0">
              <strong>Tip:</strong> Try adding "chicken, spinach, lemons" and set max cook time to 20 minutes.
            </div>
          </header>

          <main className="card card-accented fade-in-up" style={{ animationDelay: '.14s' }}>
            <div style={{ padding: '.6rem' }}>
              <IngredientInput value={ingredients} onChange={setIngredients} placeholder={theme.placeholders.ingredients} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.6rem', marginTop: '.9rem', paddingRight: '0.2rem' }}>
                <label>
                  <div className="small-muted">Cuisine</div>
                  <input className="form-control" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. Indian" />
                </label>
                <label>
                  <div className="small-muted">Dietary</div>
                  <input className="form-control" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="e.g. Vegan" />
                </label>
                <label>
                  <div className="small-muted">Max time (min)</div>
                  <input type="number" className="form-control" value={maxTime} onChange={(e) => setMaxTime(e.target.value)} placeholder="e.g. 20" />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginTop: '.6rem', paddingRight: '0.2rem' }}>
                <label>
                  <div className="small-muted">Target calories</div>
                  <input type="number" className="form-control" value={targetCalories} onChange={(e) => setTargetCalories(e.target.value)} placeholder="e.g. 500" />
                </label>
              </div>

              <div style={{ marginTop: '.8rem' }}>
                <button className={`btn-primary${loading ? ' loading' : ''}`} onClick={generate} disabled={loading}>
                  {loading ? '🍳 ' + theme.labels.cooking : '✨ ' + theme.labels.generate}
                </button>
              </div>

              {errorMessage && <p className="small-muted" style={{ marginTop: 10, color: '#b91c1c' }}>{errorMessage}</p>}
            </div>
          </main>

          <section style={{ marginTop: '1.2rem' }} className="fade-in-up">
            <div className="card">
              {recipe ? (
                <RecipeCard 
                  recipe={recipe} 
                  onSave={onSaveFavorite}
                  onUnsave={() => recipe?.title && deleteFavorite(favorites.findIndex(f => f?.title === recipe?.title))}
                  onPin={() => recipe?.title && togglePinnedFavorite(recipe?.title)}
                  onUnpin={() => recipe?.title && togglePinnedFavorite(recipe?.title)}
                  isFull={isFull}
                  isSaved={!!recipe && favorites.some(f => f?.title === recipe?.title)}
                  isPinned={!!recipe && pinnedFavorites.includes(recipe?.title)}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '.4rem' }}>🍲</div>
                  <div className="small-muted">Add ingredients and generate your recipe.</div>
                </div>
              )}
            </div>
          </section>

          <section style={{ marginTop: '1.5rem' }} className="fade-in-up">
            <div className="card">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1c1917' }}>Recent recipes</h3>
              {recentRecipes.length === 0 ? (
                <p className="small-muted">Generate a recipe to see history here.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.6rem', marginTop: '.7rem' }}>
                  {recentRecipes.map((r, idx) => (
                    <button key={`${r?.title}-${idx}`} type="button" onClick={() => setRecipe(r)} style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{r?.title || 'Untitled recipe'}</div>
                      <div className="small-muted">{r?.cuisine || 'General'}{r?.time ? ` • ${r.time} min` : ''}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {deletedFavorite && deletedFavoriteIndex >= 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '.8rem',
                marginBottom: '.8rem',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 10,
                background: 'rgba(59,130,246,0.08)',
                padding: '.55rem .75rem',
                marginTop: '1rem',
              }}
            >
              <span className="small-muted" style={{ color: '#1e3a8a' }}>Removed “{deletedFavorite?.title}”.</span>
              <button
                type="button"
                onClick={undoDeleteFavorite}
                style={{
                  border: '1px solid rgba(59,130,246,0.35)',
                  borderRadius: 8,
                  background: 'white',
                  color: '#1d4ed8',
                  padding: '.28rem .6rem',
                  fontSize: '.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Undo
              </button>
            </div>
          )}

          {favorites.length > 0 && (
          <section style={{ marginTop: '1.5rem' }} className="fade-in-up">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>⭐</span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1c1917' }}>{theme.labels.favoritesTitle}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <span
                    style={{
                      fontSize: '.78rem',
                      fontWeight: 700,
                      padding: '.2rem .6rem',
                      borderRadius: 50,
                      letterSpacing: '.03em',
                      background:
                        favorites.length >= maxFavorites
                          ? 'linear-gradient(135deg,#fee2e2,#fecaca)'
                          : 'linear-gradient(135deg,#fef3c7,#fde68a)',
                      color: favorites.length >= maxFavorites ? '#b91c1c' : '#92400e',
                      border:
                        favorites.length >= maxFavorites
                          ? '1px solid rgba(239,68,68,0.25)'
                          : '1px solid rgba(217,119,6,0.20)',
                    }}
                  >
                    {favorites.length}/{maxFavorites}
                  </span>
                  <span className="hero-badge">{theme.labels.savedLocally}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginBottom: '.75rem', flexWrap: 'wrap' }}>
                <input
                  className="form-control"
                  style={{ minWidth: 220 }}
                  placeholder="Search favorites"
                  value={favoriteQuery}
                  onChange={(e) => setFavoriteQuery(e.target.value)}
                />
                <select className="form-control" value={favoriteSort} onChange={(e) => setFavoriteSort(e.target.value)}>
                  <option value="newest">Sort: Newest first</option>
                  <option value="oldest">Sort: Oldest first</option>
                  <option value="az">Sort: A → Z</option>
                  <option value="za">Sort: Z → A</option>
                </select>

                <span className="small-muted" style={{ fontSize: '.82rem' }}>Click a favorite to open it in the recipe card.</span>

                <button
                  type="button"
                  onClick={openRandomSavedRecipe}
                  disabled={favorites.length === 0}
                  style={{
                    padding: '.5rem .85rem',
                    borderRadius: 10,
                    border: '1px solid rgba(217,119,6,0.3)',
                    background: 'rgba(217,119,6,0.08)',
                    color: '#b45309',
                    cursor: favorites.length ? 'pointer' : 'not-allowed'
                  }}
                >
                  Pick random
                </button>

                <button
                  type="button"
                  onClick={exportFavorites}
                  disabled={favorites.length === 0}
                  style={{
                    padding: '.5rem .85rem',
                    borderRadius: 10,
                    border: '1px solid rgba(59,130,246,0.35)',
                    background: favorites.length === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(59,130,246,0.08)',
                    color: favorites.length === 0 ? '#9ca3af' : '#1d4ed8',
                    cursor: favorites.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Export JSON
                </button>

                <button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  style={{
                    padding: '.5rem .85rem',
                    borderRadius: 10,
                    border: '1px solid rgba(16,185,129,0.35)',
                    background: 'rgba(16,185,129,0.08)',
                    color: '#047857',
                    cursor: 'pointer'
                  }}
                >
                  Import JSON
                </button>

                <input
                  ref={importFileRef}
                  type="file"
                  accept="application/json"
                  onChange={importFavorites}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  onClick={clearFavorites}
                  disabled={favorites.length === 0}
                  style={{
                    padding: '.5rem .85rem',
                    borderRadius: 10,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: favorites.length === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(239,68,68,0.08)',
                    color: favorites.length === 0 ? '#9ca3af' : '#dc2626',
                    cursor: favorites.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Clear all
                </button>
              </div>

              {importError && <p className="small-muted" style={{ color: '#b91c1c', marginTop: -2 }}>{importError}</p>}

              {favorites.length >= maxFavorites && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.5rem',
                    background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                    border: '1px solid rgba(239,68,68,0.20)',
                    borderRadius: 10,
                    padding: '.5rem .9rem',
                    fontSize: '.83rem',
                    color: '#b91c1c',
                    marginBottom: '.75rem'
                  }}
                >
                  <span>⚠️</span>
                  <span>Limit reached — delete a saved recipe to add more.</span>
                </div>
              )}

              <hr className="section-divider" />

              {favorites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#a8a29e' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🍽️</div>
                  <p style={{ margin: 0, fontSize: '.9rem' }}>{theme.labels.noFavorites}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', marginTop: '.75rem' }}>
                  {visibleFavorites.map((f, i) => (
                    <div
                      key={`${f?.title}-${i}`}
                      onClick={() => openFavorite(f)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openFavorite(f)
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.9rem',
                        background: 'linear-gradient(135deg,rgba(255,251,235,0.85),rgba(255,247,237,0.70))',
                        border: '1px solid rgba(217,119,6,0.12)',
                        borderRadius: 14,
                        padding: '.75rem 1rem',
                        boxShadow: '0 1px 6px rgba(217,119,6,0.06)',
                        cursor: 'pointer'
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          flexShrink: 0,
                          background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem'
                        }}
                      >
                        🍽️
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1c1917', fontSize: '.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {f.title}
                        </div>
                        <div className="small-muted" style={{ fontSize: '.8rem', marginTop: 2 }}>
                          {(f.ingredients || []).slice(0, 3).join(', ')}{(f.ingredients || []).length > 3 ? ' …' : ''}
                        </div>
                      </div>

                      {f.time && <span className="badge">⏱ {f.time}m</span>}

                      <button
                        aria-label={pinnedFavorites.includes(f.title) ? `Unpin ${f.title}` : `Pin ${f.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePinnedFavorite(f.title)
                        }}
                        title={pinnedFavorites.includes(f.title) ? 'Unpin' : 'Pin to top'}
                        style={{
                          flexShrink: 0,
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: pinnedFavorites.includes(f.title) ? 'rgba(245,158,11,0.2)' : 'rgba(0,0,0,0.05)',
                          border: '1px solid rgba(0,0,0,0.12)',
                          color: '#92400e',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          lineHeight: 1,
                          padding: 0
                        }}
                      >
                        📌
                      </button>

                      <button
                        aria-label={`Delete ${f.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          const idx = favorites.findIndex((x) => x?.title === f?.title)
                          deleteFavorite(idx)
                        }}
                        title="Remove from favorites"
                        style={{
                          flexShrink: 0,
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.18)',
                          color: '#ef4444',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          transition: 'background .14s, transform .12s',
                          lineHeight: 1,
                          padding: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
                          e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  ))}

                  {visibleFavorites.length === 0 && (
                    <div className="small-muted">No favorites match your search.</div>
                  )}
                </div>
              )}
            </div>
          </section>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}





