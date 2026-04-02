import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import IngredientInput from '../components/IngredientInput'
import RecipeCard from '../components/RecipeCard'
import theme from '../lib/theme'
import { buildLocalRecipe } from '../lib/localRecipeGenerator'
import ChefHatIcon from '../components/icons/ChefHat'
import AnimatedBackground from '../components/AnimatedBackground'

export default function Home() {
  const router = useRouter()
  const pantryStaples = ['onion', 'garlic', 'tomato', 'potato', 'rice', 'pasta', 'egg', 'spinach']

  const [ingredients, setIngredients] = useState([])
  const [dietary, setDietary] = useState('')
  const [maxTime, setMaxTime] = useState('')
  const [targetCalories, setTargetCalories] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [favorites, setFavorites] = useState([])
  const [model, setModel] = useState('gpt-4o-mini')
  const [recentRecipes, setRecentRecipes] = useState([])
  const [favoriteQuery, setFavoriteQuery] = useState('')
  const [favoriteSort, setFavoriteSort] = useState('newest')
  const [deletedFavorite, setDeletedFavorite] = useState(null)
  const [deletedFavoriteIndex, setDeletedFavoriteIndex] = useState(-1)
  const [pinnedFavorites, setPinnedFavorites] = useState([])
  const importFileRef = useRef(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pantrio:favorites') || '[]')
      setFavorites(saved)
    } catch (e) {}

    try {
      const recent = JSON.parse(localStorage.getItem('pantrio:recent') || '[]')
      setRecentRecipes(Array.isArray(recent) ? recent : [])
    } catch (e) {}

    try {
      const pinned = JSON.parse(localStorage.getItem('pantrio:pinnedFavorites') || '[]')
      setPinnedFavorites(Array.isArray(pinned) ? pinned : [])
    } catch (e) {}

    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get('r')
      if (shared) {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(shared))))
        if (parsed?.title && Array.isArray(parsed?.ingredients) && Array.isArray(parsed?.steps)) {
          setRecipe(parsed)
          setRecentRecipes((prev) => {
            const deduped = prev.filter((r) => r?.title !== parsed?.title)
            return [parsed, ...deduped].slice(0, 5)
          })
        }
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    localStorage.setItem('pantrio:favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('pantrio:recent', JSON.stringify(recentRecipes))
  }, [recentRecipes])

  useEffect(() => {
    const qCuisine = router?.query?.cuisine
    if (typeof qCuisine === 'string' && qCuisine.trim()) {
      setCuisine(qCuisine)
    }
  }, [router?.query?.cuisine])

  useEffect(() => {
    localStorage.setItem('pantrio:pinnedFavorites', JSON.stringify(pinnedFavorites))
  }, [pinnedFavorites])

  useEffect(() => {
    if (!deletedFavorite) return
    const t = setTimeout(() => {
      setDeletedFavorite(null)
      setDeletedFavoriteIndex(-1)
    }, 6000)
    return () => clearTimeout(t)
  }, [deletedFavorite])

  useEffect(() => {
    function onHotkey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading) {
        e.preventDefault()
        generate()
      }
    }
    window.addEventListener('keydown', onHotkey)
    return () => window.removeEventListener('keydown', onHotkey)
  }, [loading, ingredients, dietary, maxTime, cuisine, model])

  async function generate() {
    setLoading(true)
    setErrorMessage('')
    try {
      const data = buildLocalRecipe({
        ingredients,
        dietary,
        maxTime: Number(maxTime) || undefined,
        targetCalories: Number(targetCalories) || undefined,
        cuisine,
        model,
      })
      setRecipe(data)
      setRecentRecipes(prev => {
        const deduped = prev.filter((r) => r?.title !== data?.title)
        return [data, ...deduped].slice(0, 5)
      })
    } catch (e) {
      console.error(e)
      setRecipe(null)
      setErrorMessage('Failed to generate recipe.')
    } finally {
      setLoading(false)
    }
  }

  function saveFavorite(r) {
    setFavorites(prev => {
      const exists = prev.some((item) => item?.title === r?.title)
      if (exists) {
        setErrorMessage('This recipe is already in favorites.')
        return prev
      }
      const updated = [r, ...prev]
      return updated.slice(0, 10)
    })
  }

  function deleteFavorite(i) {
    setFavorites(prev => {
      const toDelete = prev[i]
      if (!toDelete) return prev
      setDeletedFavorite(toDelete)
      setDeletedFavoriteIndex(i)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  function undoDeleteFavorite() {
    if (!deletedFavorite) return
    setFavorites(prev => {
      if (prev.some((item) => item?.title === deletedFavorite?.title)) {
        return prev
      }
      const next = [...prev]
      const at = Math.max(0, Math.min(deletedFavoriteIndex, next.length))
      next.splice(at, 0, deletedFavorite)
      return next.slice(0, 10)
    })
    setDeletedFavorite(null)
    setDeletedFavoriteIndex(-1)
  }

  function togglePinnedFavorite(title) {
    setPinnedFavorites((prev) => {
      if (prev.includes(title)) {
        return prev.filter((t) => t !== title)
      }
      return [title, ...prev]
    })
  }

  function clearFavorites() {
    if (!favorites.length) return
    if (window.confirm('Delete all saved favorites?')) {
      setFavorites([])
    }
  }

  function openFavorite(favorite) {
    setRecipe(favorite)
    setErrorMessage('')
  }

  function exportFavorites() {
    if (!favorites.length) {
      setErrorMessage('No favorites to export yet.')
      return
    }
    const payload = {
      app: 'Pantrio',
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pantrio-favorites.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importFavorites(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const incoming = Array.isArray(parsed) ? parsed : parsed?.favorites
      if (!Array.isArray(incoming)) {
        setErrorMessage('Invalid file format for favorites import.')
        return
      }

      setFavorites((prev) => {
        const merged = [...incoming, ...prev]
        const deduped = []
        const seen = new Set()

        for (const item of merged) {
          const key = (item?.title || '').trim().toLowerCase()
          if (!key || seen.has(key)) continue
          seen.add(key)
          deduped.push(item)
          if (deduped.length === 10) break
        }
        return deduped
      })
      setErrorMessage('')
    } catch (e) {
      setErrorMessage('Could not import favorites file.')
    } finally {
      event.target.value = ''
    }
  }

  function openRandomSavedRecipe() {
    const pool = [...favorites, ...recentRecipes]
    if (!pool.length) {
      setErrorMessage('No saved or recent recipes available yet.')
      return
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    setRecipe(pick)
    setErrorMessage('')
  }

  function quickAddIngredient(item) {
    setIngredients(prev => {
      const exists = prev.some((v) => v.toLowerCase() === item.toLowerCase())
      if (exists) return prev
      return [...prev, item]
    })
  }

  function clearIngredients() {
    setIngredients([])
  }

  const filteredFavorites = favorites.filter((f) => {
    const q = favoriteQuery.trim().toLowerCase()
    if (!q) return true
    const title = (f?.title || '').toLowerCase()
    const ingredientsText = (f?.ingredients || []).join(' ').toLowerCase()
    return title.includes(q) || ingredientsText.includes(q)
  })

  const visibleFavorites = [...filteredFavorites].sort((a, b) => {
    const ap = pinnedFavorites.includes(a?.title)
    const bp = pinnedFavorites.includes(b?.title)
    if (ap !== bp) return ap ? -1 : 1

    if (favoriteSort === 'az') {
      return (a?.title || '').localeCompare(b?.title || '')
    }
    if (favoriteSort === 'za') {
      return (b?.title || '').localeCompare(a?.title || '')
    }
    const ai = favorites.indexOf(a)
    const bi = favorites.indexOf(b)
    return favoriteSort === 'oldest' ? bi - ai : ai - bi
  })

  return (
    <div className="min-h-screen" style={{paddingBottom: '3rem'}}>
      <AnimatedBackground />

      <div className="app-container">

        {/* ── Hero Header ── */}
        <header className="text-center mb-10 pt-6 fade-in-up">
          <div className="flex justify-center mb-4">
            <div className="hero-illustration">
              <ChefHatIcon className="w-10 h-10" style={{color:'#d97706'}} />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight gradient-text mb-2">{theme.appName}</h1>
          <p style={{color:'#78716c', fontSize:'1.05rem', maxWidth:420, margin:'0 auto'}}>{theme.tagline}</p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <Link href="/" className="btn-primary" style={{textDecoration:'none'}}>Home</Link>
            <Link href="/cuisines" className="btn-primary" style={{textDecoration:'none'}}>Explore Cuisines</Link>
            <Link href="/planner" className="btn-primary" style={{textDecoration:'none'}}>Weekly Planner</Link>
            <Link href="/calories" className="btn-primary" style={{textDecoration:'none'}}>Meal Calories</Link>
            <Link href="/daily-calories" className="btn-primary" style={{textDecoration:'none'}}>Daily Calorie Plan</Link>
          </div>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            <span className="hero-badge">🌿 Reduce waste</span>
            <span className="hero-badge">⚡ Fast recipes</span>
            <span className="hero-badge">🆓 100% Free</span>
          </div>
          <div className="mt-5 flex justify-center">
            <img
              src="/img/cookiing2.svg"
              alt="Cooking illustration"
              style={{
                width:'100%',
                maxWidth:360,
                height:150,
                objectFit:'contain',
                background:'rgba(255,255,255,0.72)',
                borderRadius:14,
                padding:'.45rem',
                border:'1px solid rgba(217,119,6,0.14)'
              }}
            />
          </div>
        </header>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 gap-4 mb-6 fade-in-up" style={{animationDelay:'.08s'}}>
          <div className="stat-card">
            <div className="stat-icon" style={{background:'linear-gradient(135deg,#fef3c7,#fde68a)'}}>🥕</div>
            <div>
              <div className="small-muted" style={{fontSize:'.78rem',fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase'}}>Ingredients</div>
              <div style={{fontSize:'1.9rem', fontWeight:800, color:'#92400e', lineHeight:1}}>{ingredients.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:'linear-gradient(135deg,#fce7f3,#fbcfe8)'}}>⭐</div>
            <div>
              <div className="small-muted" style={{fontSize:'.78rem',fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase'}}>Favorites</div>
              <div style={{fontSize:'1.9rem', fontWeight:800, color:'#92400e', lineHeight:1}}>{favorites.length}</div>
            </div>
          </div>
        </div>

        {/* ── Main Card ── */}
        <main className="card card-accented fade-in-up" style={{animationDelay:'.14s'}}>

          {/* Section header */}
          <div className="mb-5 flex items-center gap-3">
            <div style={{
              width:44,height:44,borderRadius:12,
              background:'linear-gradient(135deg,#fef9c3,#fde68a)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',
              boxShadow:'0 2px 10px rgba(217,119,6,0.18)'
            }}>🥘</div>
            <div>
              <h2 style={{fontSize:'1.15rem', fontWeight:700, color:'#1c1917', margin:0}}>{theme.labels.pantryPrompt}</h2>
              <p className="small-muted" style={{margin:0, marginTop:2}}>{theme.labels.pantryHelp}</p>
            </div>
          </div>

          <hr className="section-divider" />

          {/* Ingredient input */}
          <div className="mt-4">
            <IngredientInput value={ingredients} onChange={setIngredients} placeholder={theme.placeholders.ingredients} />

            <div style={{marginTop:'.7rem', display:'flex', flexWrap:'wrap', gap:'.45rem', alignItems:'center'}}>
              <span className="small-muted" style={{fontSize:'.82rem'}}>Quick add:</span>
              {pantryStaples.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => quickAddIngredient(item)}
                  style={{
                    border:'1px solid rgba(217,119,6,0.18)',
                    borderRadius:999,
                    padding:'.18rem .55rem',
                    background:'rgba(255,255,255,0.82)',
                    color:'#92400e',
                    fontSize:'.78rem',
                    cursor:'pointer'
                  }}
                >
                  + {item}
                </button>
              ))}
              <button
                type="button"
                onClick={clearIngredients}
                disabled={ingredients.length === 0}
                style={{
                  marginLeft:'.35rem',
                  border:'1px solid rgba(239,68,68,0.28)',
                  borderRadius:8,
                  padding:'.2rem .55rem',
                  background: ingredients.length ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.06)',
                  color: ingredients.length ? '#dc2626' : '#9ca3af',
                  fontSize:'.78rem',
                  cursor: ingredients.length ? 'pointer' : 'not-allowed'
                }}
              >
                Clear ingredients
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div style={{marginTop:'1rem', display:'flex', gap:'.6rem', flexWrap:'wrap', alignItems:'center'}}>
            <select className="form-control" value={dietary} onChange={e=>setDietary(e.target.value)}>
              {theme.dietaryOptions.map((opt) => (
                <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              className="form-control"
              style={{width:110}}
              placeholder={theme.placeholders.maxTime}
              value={maxTime}
              onChange={e=>setMaxTime(e.target.value)}
            />
            <input
              className="form-control"
              style={{width:130}}
              placeholder="Target kcal"
              value={targetCalories}
              onChange={e=>setTargetCalories(e.target.value.replace(/[^\d]/g, ''))}
            />
            <input
              className="form-control"
              style={{width:140}}
              list="cuisine-types"
              placeholder={theme.placeholders.cuisine}
              value={cuisine}
              onChange={e=>setCuisine(e.target.value)}
            />
            <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:'.5rem'}}>
              <span className="small-muted" style={{fontSize:'.8rem'}}>{theme.labels.model}</span>
              <select className="form-control" style={{fontSize:'.82rem'}} value={model} onChange={e=>setModel(e.target.value)}>
                {theme.modelOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <datalist id="cuisine-types">
            {theme.cuisineOptions?.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div style={{marginTop:'.6rem', display:'flex', alignItems:'center', gap:'.45rem', flexWrap:'wrap'}}>
            <span className="small-muted" style={{fontSize:'.8rem'}}>Cuisine types:</span>
            {(theme.cuisineOptions || []).slice(0, 8).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCuisine(c)}
                style={{
                  border:'1px solid rgba(217,119,6,0.18)',
                  borderRadius:999,
                  padding:'.18rem .55rem',
                  background: cuisine === c ? 'rgba(217,119,6,0.18)' : 'rgba(255,255,255,0.82)',
                  color:'#92400e',
                  fontSize:'.78rem',
                  cursor:'pointer'
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Generate button + tip */}
          <div style={{marginTop:'1.4rem', display:'flex', flexWrap:'wrap', alignItems:'center', gap:'1rem'}}>
            <button
              className={`btn-primary${loading ? ' loading' : ''}`}
              onClick={generate}
              disabled={loading}
              style={{minWidth:170, textAlign:'center', fontSize:'1rem'}}
            >
              {loading ? '🍳 ' + theme.labels.cooking : '✨ ' + theme.labels.generate}
            </button>
            <div className="tip-callout" style={{flex:1, minWidth:200}}>
              <span>💡</span>
              <span><strong>Tip:</strong> {theme.tips[0]}</span>
            </div>
          </div>

          {/* Output area */}
          <div style={{marginTop:'1.4rem'}}>
            {errorMessage && (
              <div style={{
                background:'linear-gradient(135deg,#fef2f2,#fee2e2)',
                border:'1px solid rgba(239,68,68,0.25)',
                borderRadius:12, padding:'.75rem 1rem',
                color:'#b91c1c', fontSize:'.9rem', marginBottom:'1rem'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}
            {loading && (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <div className="skeleton shimmer" style={{height:28, width:'55%', borderRadius:10}}></div>
                <div className="skeleton shimmer" style={{height:16, width:'85%', borderRadius:8}}></div>
                <div className="skeleton shimmer" style={{height:16, width:'75%', borderRadius:8}}></div>
                <div className="skeleton shimmer" style={{height:16, width:'80%', borderRadius:8}}></div>
              </div>
            )}
            {recipe && !loading && <RecipeCard recipe={recipe} onSave={()=>saveFavorite(recipe)} isFull={favorites.length >= 10} />}
          </div>
        </main>

        {/* ── Recently Generated ── */}
        <section style={{marginTop:'1.5rem'}} className="fade-in-up">
          <div className="card">
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.75rem'}}>
              <h3 style={{margin:0, fontSize:'1.05rem', fontWeight:700, color:'#1c1917'}}>Recent recipes</h3>
              <span className="small-muted">Last {Math.min(5, recentRecipes.length)} generated</span>
            </div>

            {recentRecipes.length === 0 ? (
              <p className="small-muted">Generate a recipe to see history here.</p>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'.6rem'}}>
                {recentRecipes.map((r, idx) => (
                  <button
                    key={`${r?.title}-${idx}`}
                    type="button"
                    onClick={() => setRecipe(r)}
                    style={{
                      textAlign:'left',
                      border:'1px solid rgba(217,119,6,0.16)',
                      background:'rgba(255,255,255,0.75)',
                      borderRadius:10,
                      padding:'.65rem .8rem',
                      cursor:'pointer'
                    }}
                  >
                    <div style={{fontWeight:600, color:'#1c1917', fontSize:'.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{r?.title || 'Untitled recipe'}</div>
                    <div className="small-muted" style={{fontSize:'.8rem'}}>{r?.cuisine || 'General'}{r?.time ? ` • ${r.time} min` : ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Favorites ── */}
        <section style={{marginTop:'1.5rem'}} className="fade-in-up">
          <div className="card">
            {deletedFavorite && (
              <div style={{
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center',
                gap:'.8rem',
                marginBottom:'.8rem',
                border:'1px solid rgba(59,130,246,0.2)',
                borderRadius:10,
                background:'rgba(59,130,246,0.08)',
                padding:'.55rem .75rem'
              }}>
                <span className="small-muted" style={{color:'#1e3a8a'}}>Removed “{deletedFavorite?.title}”.</span>
                <button
                  type="button"
                  onClick={undoDeleteFavorite}
                  style={{
                    border:'1px solid rgba(59,130,246,0.35)',
                    borderRadius:8,
                    background:'white',
                    color:'#1d4ed8',
                    padding:'.28rem .6rem',
                    fontSize:'.8rem',
                    fontWeight:600,
                    cursor:'pointer'
                  }}
                >
                  Undo
                </button>
              </div>
            )}

            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'.6rem'}}>
                <span style={{fontSize:'1.3rem'}}>⭐</span>
                <h3 style={{margin:0, fontSize:'1.05rem', fontWeight:700, color:'#1c1917'}}>{theme.labels.favoritesTitle}</h3>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'.6rem'}}>
                <span style={{
                  fontSize:'.78rem', fontWeight:700, padding:'.2rem .6rem',
                  borderRadius:50, letterSpacing:'.03em',
                  background: favorites.length >= 10 ? 'linear-gradient(135deg,#fee2e2,#fecaca)' : 'linear-gradient(135deg,#fef3c7,#fde68a)',
                  color: favorites.length >= 10 ? '#b91c1c' : '#92400e',
                  border: favorites.length >= 10 ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(217,119,6,0.20)'
                }}>
                  {favorites.length}/10
                </span>
                <span className="hero-badge">{theme.labels.savedLocally}</span>
              </div>
            </div>

            <div style={{display:'flex', gap:'.6rem', alignItems:'center', marginBottom:'.75rem', flexWrap:'wrap'}}>
              <input
                className="form-control"
                style={{minWidth:220}}
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
              <span className="small-muted" style={{fontSize:'.82rem'}}>Click a favorite to open it in the recipe card.</span>
              <span className="small-muted" style={{fontSize:'.8rem'}}>Shortcut: Ctrl/Cmd + Enter to generate</span>
              <button
                type="button"
                onClick={openRandomSavedRecipe}
                style={{
                  padding:'.5rem .85rem',
                  borderRadius:10,
                  border:'1px solid rgba(217,119,6,0.3)',
                  background:'rgba(217,119,6,0.08)',
                  color:'#b45309',
                  cursor:'pointer'
                }}
              >
                Pick random
              </button>
              <button
                type="button"
                onClick={exportFavorites}
                disabled={favorites.length === 0}
                style={{
                  padding:'.5rem .85rem',
                  borderRadius:10,
                  border:'1px solid rgba(59,130,246,0.35)',
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
                  padding:'.5rem .85rem',
                  borderRadius:10,
                  border:'1px solid rgba(16,185,129,0.35)',
                  background:'rgba(16,185,129,0.08)',
                  color:'#047857',
                  cursor:'pointer'
                }}
              >
                Import JSON
              </button>
              <input
                ref={importFileRef}
                type="file"
                accept="application/json"
                onChange={importFavorites}
                style={{display:'none'}}
              />
              <button
                type="button"
                onClick={clearFavorites}
                disabled={favorites.length === 0}
                style={{
                  padding:'.5rem .85rem',
                  borderRadius:10,
                  border:'1px solid rgba(239,68,68,0.3)',
                  background: favorites.length === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(239,68,68,0.08)',
                  color: favorites.length === 0 ? '#9ca3af' : '#dc2626',
                  cursor: favorites.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Clear all
              </button>
            </div>

            {favorites.length >= 10 && (
              <div style={{
                display:'flex', alignItems:'center', gap:'.5rem',
                background:'linear-gradient(135deg,#fef2f2,#fee2e2)',
                border:'1px solid rgba(239,68,68,0.20)',
                borderRadius:10, padding:'.5rem .9rem',
                fontSize:'.83rem', color:'#b91c1c', marginBottom:'.75rem'
              }}>
                <span>⚠️</span>
                <span>Limit reached — delete a saved recipe to add more.</span>
              </div>
            )}
            <hr className="section-divider" />
            {favorites.length === 0
              ? (
                <div style={{textAlign:'center', padding:'1.5rem 0', color:'#a8a29e'}}>
                  <div style={{fontSize:'2.5rem', marginBottom:'.5rem'}}>🍽️</div>
                  <p style={{margin:0, fontSize:'.9rem'}}>{theme.labels.noFavorites}</p>
                </div>
              )
              : (
                <div style={{display:'flex', flexDirection:'column', gap:'.65rem', marginTop:'.75rem'}}>
                  {visibleFavorites.map((f, i) => (
                    <div
                      key={i}
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
                      display:'flex', alignItems:'center', gap:'.9rem',
                      background:'linear-gradient(135deg,rgba(255,251,235,0.85),rgba(255,247,237,0.70))',
                      border:'1px solid rgba(217,119,6,0.12)',
                      borderRadius:14, padding:'.75rem 1rem',
                      boxShadow:'0 1px 6px rgba(217,119,6,0.06)',
                      cursor:'pointer'
                    }}>
                      <div style={{
                        width:40,height:40,borderRadius:10,flexShrink:0,
                        background:'linear-gradient(135deg,#fef3c7,#fde68a)',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem'
                      }}>🍽️</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontWeight:600, color:'#1c1917', fontSize:'.95rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{f.title}</div>
                        <div className="small-muted" style={{fontSize:'.8rem', marginTop:2}}>{f.ingredients?.slice(0,3).join(', ')}{f.ingredients?.length > 3 ? ' …' : ''}</div>
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
                          flexShrink:0, width:30, height:30, borderRadius:'50%',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          background: pinnedFavorites.includes(f.title) ? 'rgba(245,158,11,0.2)' : 'rgba(0,0,0,0.05)',
                          border:'1px solid rgba(0,0,0,0.12)',
                          color:'#92400e', fontSize:'1rem', cursor:'pointer', lineHeight:1, padding:0
                        }}
                      >📌</button>
                      <button
                        aria-label={`Delete ${f.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFavorite(favorites.indexOf(f))
                        }}
                        title="Remove from favorites"
                        style={{
                          flexShrink:0, width:30, height:30, borderRadius:'50%',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          background:'rgba(239,68,68,0.08)',
                          border:'1px solid rgba(239,68,68,0.18)',
                          color:'#ef4444', fontSize:'1rem', cursor:'pointer',
                          transition:'background .14s, transform .12s',
                          lineHeight:1, padding:0
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.18)';e.currentTarget.style.transform='scale(1.1)'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';e.currentTarget.style.transform='scale(1)'}}
                      >🗑</button>
                    </div>
                  ))}
                  {visibleFavorites.length === 0 && (
                    <div className="small-muted">No favorites match your search.</div>
                  )}
                </div>
              )
            }
          </div>
        </section>
      </div>
    </div>
  )
}
