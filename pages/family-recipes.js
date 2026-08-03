import { useEffect, useState } from 'react'
import RecipeCard from '../components/RecipeCard'
import PageHeader from '../components/PageHeader'
import { subscribeToAuth } from '../lib/auth'
import { saveUserData, subscribeUserData } from '../lib/userData'
import { RequireAuth } from '../lib/requireAuth'
import { readScopedJSON, writeScopedJSON } from '../lib/clientStorage'

const STORAGE_KEY = 'pantrio:family-recipes'
const CUISINE_TYPES = [
  'Indian',
  'Italian',
  'Mexican',
  'Chinese',
  'Thai',
  'Japanese',
  'Mediterranean',
  'American',
  'Middle Eastern',
  'Other',
]

const DIETARY_TYPES = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Egg-free',
  'Nut-free',
  'High-protein',
  'Low-carb',
  'Keto',
  'Halal',
  'Kosher',
  'Pescatarian',
  'Other',
]

function emptyRecipe() {
  return {
    title: '',
    cuisine: '',
    dietary: '',
    time: '',
    ingredients: [],
    steps: [],
      image: '',
    }
}

export default function FamilyRecipesPage() {
  const [user, setUser] = useState(null)
  const [list, setList] = useState([])
  const [form, setForm] = useState(emptyRecipe())
  const [editingIndex, setEditingIndex] = useState(-1)
  const [previewIndex, setPreviewIndex] = useState(-1)
  const [query, setQuery] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    let unsubUserData = null

    if (!user || !user.uid) {
      const saved = readScopedJSON(STORAGE_KEY, user?.uid, [], { legacyKey: STORAGE_KEY })
      setList(Array.isArray(saved) ? saved : [])
      return () => {
        if (unsubUserData) unsubUserData()
      }
    }

    unsubUserData = subscribeUserData(user.uid, (data) => {
      if (Array.isArray(data.familyRecipes)) {
        setList(data.familyRecipes)
      } else {
        const saved = readScopedJSON(STORAGE_KEY, user?.uid, [], { legacyKey: STORAGE_KEY })
        setList(Array.isArray(saved) ? saved : [])
      }
    })

    return () => {
      if (unsubUserData) unsubUserData()
    }
  }, [user])

  useEffect(() => {
    writeScopedJSON(STORAGE_KEY, user?.uid, list)
    if (user?.uid) {
      saveUserData(user.uid, { familyRecipes: list })
    }
  }, [list, user])

  function onChange(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function saveRecipe() {
    const r = {
      ...form,
      ingredients: String(form.ingredients || '').split(',').map((s) => s.trim()).filter(Boolean),
      steps: String(form.steps || '').split('\n').map((s) => s.trim()).filter(Boolean),
    }
    if (!r.title) return
    if (editingIndex >= 0) {
      setList((prev) => prev.map((p, i) => (i === editingIndex ? r : p)))
      setEditingIndex(-1)
    } else {
      setList((prev) => [r, ...prev])
    }
    setForm(emptyRecipe())
  }

  function editRecipe(i) {
    const r = list[i]
    setForm({
      ...r,
      ingredients: (r.ingredients || []).join(', '),
      steps: (r.steps || []).join('\n'),
    })
    setEditingIndex(i)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
    function handleImageUpload(file) {
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = String(reader.result || '')
        if (dataUrl) {
          setForm((prev) => ({ ...prev, image: dataUrl }))
        }
      }
      reader.readAsDataURL(file)
    }

  function deleteRecipe(i) {
    setList((prev) => prev.filter((_, idx) => idx !== i))
    if (previewIndex === i) setPreviewIndex(-1)
  }

  function exportRecipes() {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pantrio-family-recipes.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importRecipes(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '[]'))
        if (Array.isArray(parsed)) setList((prev) => [...parsed, ...prev])
      } catch (err) {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const totalMinutes = list.reduce((sum, item) => sum + (Number(item?.time) || 0), 0)
  const cuisines = Array.from(new Set(list.map((item) => String(item?.cuisine || '').trim()).filter(Boolean))).sort()
  const quickIdeas = [
    'Grandma\'s Sunday curry',
    'School lunchbox favorite',
    'Festival sweet treat',
    'Rainy-day comfort bowl',
  ]

  const filteredList = list
    .filter((item) => {
      const haystack = [
        item.title,
        item.cuisine,
        item.dietary,
        ...(item.ingredients || []),
      ].join(' ').toLowerCase()

      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase())
      const matchesCuisine = cuisineFilter === 'all' || String(item.cuisine || '').toLowerCase() === cuisineFilter
      return matchesQuery && matchesCuisine
    })
    .sort((a, b) => {
      if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''))
      if (sortBy === 'time') return (Number(a.time) || 0) - (Number(b.time) || 0)
      return 0
    })

  const displayedList = sortBy === 'newest' ? filteredList : filteredList

  const featuredRecipe = displayedList[0] || list[0] || null

  return (
    <RequireAuth fallbackPath="/family-recipes">
      <div className="min-h-screen py-10">
        <div className="app-container">
          <div className="card">
          <PageHeader
            title="Family Recipes"
            subtitle="Save and manage your family's favorite recipes locally, then sync them with your account."
            actions={(
              <>
                <button className="btn-primary" onClick={exportRecipes}>Export</button>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} className="btn-secondary">
                  <input type="file" accept="application/json" onChange={importRecipes} style={{ display: 'none' }} />
                  Import
                </label>
              </>
            )}
          />

          <div className="mt-4" style={{
            padding: '1rem 1.1rem',
            borderRadius: 22,
            background: 'linear-gradient(135deg, rgba(251,191,36,0.16), rgba(249,115,22,0.10), rgba(59,130,246,0.08))',
            border: '1px solid rgba(217,119,6,0.12)',
            display: 'grid',
            gridTemplateColumns: '1.3fr .9fr',
            gap: '1rem',
            alignItems: 'stretch',
          }}>
            <div>
              <div className="hero-badge">📖 Family cookbook corner</div>
              <h2 style={{ margin: '0.8rem 0 0.35rem 0', fontSize: '1.65rem', lineHeight: 1.1 }}>
                Turn your kitchen memories into a recipe vault.
              </h2>
              <p style={{ margin: 0, color: '#57534e', lineHeight: 1.65, maxWidth: 600 }}>
                Save the dishes your family talks about, the comfort meals you always come back to, and the quick fixes that rescue busy evenings.
              </p>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {quickIdeas.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    className="chip"
                    onClick={() => onChange('title', idea)}
                    style={{ cursor: 'pointer' }}
                  >
                    ✨ {idea}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <div className="stat-card" style={{ padding: '0.95rem 1rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.18)' }}>🍲</div>
                <div>
                  <div className="small-muted">Recipes saved</div>
                  <div style={{ fontSize: '1.55rem', fontWeight: 800 }}>{list.length}</div>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '0.95rem 1rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.16)' }}>🌍</div>
                <div>
                  <div className="small-muted">Cuisine styles</div>
                  <div style={{ fontSize: '1.55rem', fontWeight: 800 }}>{cuisines.length}</div>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '0.95rem 1rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.16)' }}>⏱️</div>
                <div>
                  <div className="small-muted">Total cook time</div>
                  <div style={{ fontSize: '1.55rem', fontWeight: 800 }}>{totalMinutes || 0} min</div>
                </div>
              </div>
            </div>
          </div>

          {featuredRecipe && (
            <div className="mt-4 card card-accented" style={{ padding: '1rem 1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div className="small-muted">Featured family favorite</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4 }}>{featuredRecipe.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {!!featuredRecipe.cuisine && <span className="badge">🌍 {featuredRecipe.cuisine}</span>}
                    {!!featuredRecipe.dietary && <span className="badge">🥬 {featuredRecipe.dietary}</span>}
                    {!!featuredRecipe.time && <span className="badge">⏱️ {featuredRecipe.time} min</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setPreviewIndex(list.findIndex((item) => item.title === featuredRecipe.title && item.time === featuredRecipe.time))}
                >
                  Preview favorite
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card" style={{ padding: '.95rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <div className="small-muted">Add / Edit Recipe</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{editingIndex >= 0 ? 'Polish a family classic' : 'Capture a recipe worth repeating'}</div>
                </div>
                <span className="badge">📝 Tip: add one step per line</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <input className="form-control" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Title" value={form.title} onChange={(e) => onChange('title', e.target.value)} />
                <select
                  className="form-control"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={form.cuisine}
                  onChange={(e) => onChange('cuisine', e.target.value)}
                >
                  <option value="">Select cuisine type</option>
                  {CUISINE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  className="form-control"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={form.dietary}
                  onChange={(e) => onChange('dietary', e.target.value)}
                >
                  <option value="">Select dietary type</option>
                  {DIETARY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input className="form-control" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Time (mins)" value={form.time} onChange={(e) => onChange('time', e.target.value)} />
              </div>
              <textarea className="form-control" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Ingredients (comma separated)" rows={3} value={form.ingredients} onChange={(e) => onChange('ingredients', e.target.value)} />
              <textarea className="form-control" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Steps (one per line)" rows={5} value={form.steps} onChange={(e) => onChange('steps', e.target.value)} />

              <div className="card" style={{ padding: '.85rem', background: 'rgba(255,251,235,0.65)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Final product image</div>
                    <div className="small-muted" style={{ marginTop: 4 }}>Add a photo or use the built-in recipe art.</div>
                  </div>
                  <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    📷 Upload image
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    />
                  </label>
                </div>

                {form.image ? (
                  <div style={{ marginTop: 12 }}>
                    <img
                      src={form.image}
                      alt="Recipe preview"
                      style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 16, border: '1px solid rgba(217,119,6,0.15)' }}
                    />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn-secondary" onClick={() => setForm((prev) => ({ ...prev, image: '' }))}>Remove image</button>
                    </div>
                  </div>
                ) : (
                  <div className="small-muted" style={{ marginTop: 12 }}>No image added yet.</div>
                )}
              </div>

              <div className="tip-callout" style={{ marginTop: '.25rem', alignItems: 'flex-start' }}>
                <span>💡</span>
                <span style={{ lineHeight: 1.5 }}>Make recipes feel special by naming who made them, when you serve them, or what memory they bring back.</span>
              </div>

              <div className="mt-2 flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={saveRecipe}>{editingIndex >= 0 ? 'Update' : 'Add'}</button>
                <button onClick={() => { setForm(emptyRecipe()); setEditingIndex(-1) }} style={{ border:'1px solid rgba(0,0,0,0.08)', background: 'white', padding: '.5rem .85rem', borderRadius:10 }}>Clear</button>
              </div>
            </div>

            <div>
              <div className="card" style={{ padding: '.85rem', marginBottom: '.9rem' }}>
                <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    className="form-control"
                    placeholder="Search titles, cuisines, ingredients..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ flex: '1 1 260px', minWidth: 0 }}
                  />
                  <select
                    className="form-control"
                    value={cuisineFilter}
                    onChange={(e) => setCuisineFilter(e.target.value)}
                    style={{ flex: '0 1 180px', minWidth: 170 }}
                  >
                    <option value="all">All cuisines</option>
                    {cuisines.map((item) => <option key={item} value={item.toLowerCase()}>{item}</option>)}
                  </select>
                  <select
                    className="form-control"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ flex: '0 1 170px', minWidth: 160 }}
                  >
                    <option value="newest">Newest first</option>
                    <option value="title">Sort by title</option>
                    <option value="time">Sort by time</option>
                  </select>
                </div>
              </div>

              <div className="small-muted">Saved Recipes ({displayedList.length} shown{displayedList.length !== list.length ? ` of ${list.length}` : ''})</div>
              <div className="mt-3 flex flex-col gap-3">
                {list.length === 0 && (
                  <div className="card" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,251,235,0.95), rgba(239,246,255,0.92))' }}>
                    <div style={{ fontSize: '2rem' }}>🍽️</div>
                    <div style={{ fontWeight: 700, marginTop: 6 }}>No family recipes yet.</div>
                    <div className="small-muted" style={{ marginTop: 6 }}>Start with a comfort meal, a holiday favorite, or the dish everyone asks you to make.</div>
                  </div>
                )}
                {list.length > 0 && displayedList.length === 0 && (
                  <div className="card small-muted" style={{ padding: '.85rem' }}>No recipes match your current search or cuisine filter.</div>
                )}
                {displayedList.map((r, i) => {
                  const realIndex = list.findIndex((item, idx) => idx >= 0 && item === r)
                  return (
                  <div key={`${r.title}-${realIndex}-${i}`} className="card" style={{ padding: '.8rem .9rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,250,245,0.95))' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div className="font-semibold">{r.title}</div>
                          {!!r.dietary && <span className="chip">🥬 {r.dietary}</span>}
                          {!!r.image && <span className="chip">📷 Photo added</span>}
                        </div>
                        <div className="small-muted mt-1">{r.cuisine || 'Homestyle'} {r.time ? `• ${r.time}m` : ''} {r.ingredients?.length ? `• ${r.ingredients.length} ingredients` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setPreviewIndex(previewIndex === realIndex ? -1 : realIndex)} className="btn-primary">{previewIndex === realIndex ? 'Hide' : 'Preview'}</button>
                        <button onClick={() => editRecipe(realIndex)} style={{ border:'1px solid rgba(217,119,6,0.18)', background:'rgba(255,251,235,0.9)', borderRadius:10, padding:'.45rem .7rem' }}>Edit</button>
                        <button onClick={() => deleteRecipe(realIndex)} style={{ border:'1px solid rgba(239,68,68,0.24)', background:'rgba(239,68,68,0.06)', borderRadius:10, padding:'.45rem .7rem' }}>Delete</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      <span className="badge">🧂 {(r.ingredients || []).length} ingredients</span>
                      <span className="badge">🪄 {(r.steps || []).length} steps</span>
                    </div>
                    {previewIndex === realIndex && (
                      <div className="mt-3">
                        <RecipeCard recipe={r} />
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
