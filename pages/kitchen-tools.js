import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import RecipeCard from '../components/RecipeCard'
import { extractIngredientsFromText, scoreSubstitutions } from '../lib/aiAssistant'
import theme from '../lib/theme'

function detectIngredients(fileName = '') {
  return extractIngredientsFromText(fileName)
}

function parseAllergens(input = '') {
  return String(input)
    .toLowerCase()
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function recipeToIdeas(recipe = {}) {
  const title = String(recipe?.title || '').trim()
  const steps = Array.isArray(recipe?.steps)
    ? recipe.steps.map((s) => String(s || '').replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
    : []

  return [title, ...steps].filter(Boolean).slice(0, 3)
}

export default function KitchenToolsPage() {
  const [fileName, setFileName] = useState('')
  const [detected, setDetected] = useState([])
  const [pantryNotes, setPantryNotes] = useState('')
  const [aiExtracted, setAiExtracted] = useState([])

  const [ingredient, setIngredient] = useState('')
  const [allergenText, setAllergenText] = useState('')

  const [leftovers, setLeftovers] = useState('')
  const [mood, setMood] = useState(String((theme.cuisineOptions || [])[0] || 'homestyle').toLowerCase())
  const [ideas, setIdeas] = useState([])
  const [loadingIdeas, setLoadingIdeas] = useState(false)
  const [ideasError, setIdeasError] = useState('')
  const [loadingRecipe, setLoadingRecipe] = useState(false)
  const [aiRecipe, setAiRecipe] = useState(null)
  const [aiError, setAiError] = useState('')

  const allergens = useMemo(() => parseAllergens(allergenText), [allergenText])
  const contextSuggestions = useMemo(() => {
    const fromLeftovers = extractIngredientsFromText(leftovers)
    const cuisineStaples = Object.values(theme.cuisineGuides || {})
      .flatMap((guide) => Array.isArray(guide?.staples) ? guide.staples : [])
      .slice(0, 24)

    const pool = Array.from(new Set([
      ...(detected || []),
      ...(aiExtracted || []),
      ...fromLeftovers,
      ...cuisineStaples,
    ]))

    const key = String(ingredient || '').trim().toLowerCase()
    return pool.filter((item) => String(item).toLowerCase() !== key).slice(0, 8)
  }, [detected, aiExtracted, leftovers, ingredient])

  const rankedSuggestions = useMemo(
    () => scoreSubstitutions(ingredient, contextSuggestions, allergens),
    [ingredient, contextSuggestions, allergens]
  )
  const moodSuggestions = useMemo(() => (theme.cuisineOptions || []).slice(0, 6).map((x) => String(x).toLowerCase()), [])

  useEffect(() => {
    setIdeas([])
    setIdeasError('')
  }, [leftovers, mood])

  function onPickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDetected([])
  }

  function runDetection() {
    setDetected(detectIngredients(fileName))
  }

  function runAiExtraction() {
    setAiExtracted(extractIngredientsFromText(pantryNotes))
  }

  async function generateAiRecipe() {
    const fromLeftovers = String(leftovers || '').split(',').map((x) => x.trim()).filter(Boolean)
    const merged = Array.from(new Set([...(detected || []), ...(aiExtracted || []), ...fromLeftovers])).slice(0, 12)
    if (!merged.length) {
      setAiError('Add pantry notes or detect ingredients first.')
      return
    }

    setLoadingRecipe(true)
    setAiError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: merged,
          dietary: allergens.includes('dairy') ? 'dairy-free' : '',
          cuisine: mood,
          maxTime: 20,
          model: 'gpt-4o-mini',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'AI recipe failed')
      setAiRecipe(data)
    } catch (err) {
      setAiError(err?.message || 'AI recipe failed')
    } finally {
      setLoadingRecipe(false)
    }
  }

  async function generateLeftoverIdeas() {
    const parsed = extractIngredientsFromText(leftovers)
    if (!parsed.length) {
      setIdeas([])
      setIdeasError('Add leftovers first to generate AI ideas.')
      return
    }

    setLoadingIdeas(true)
    setIdeasError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: parsed,
          cuisine: mood,
          maxTime: 20,
          model: 'gpt-4o-mini',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'AI idea generation failed')
      setIdeas(recipeToIdeas(data))
    } catch (err) {
      setIdeas([])
      setIdeasError(err?.message || 'AI idea generation failed')
    } finally {
      setLoadingIdeas(false)
    }
  }

  return (
    <div className="app-container">
      <PageHeader
        title="Kitchen Tools Hub"
        subtitle="Pantry scanner + substitutions + leftovers + mood in one place"
        actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Generate recipe</Link>}
      />

      <section className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Pantry scanner</h2>
          <span className="badge">Combined view</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.6rem', marginTop: '.8rem' }}>
          <input type="file" accept="image/*" className="form-control" onChange={onPickFile} />
          <button className="btn-primary" onClick={runDetection} disabled={!fileName}>Detect</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.8rem' }}>
          {detected.length ? detected.map((x) => <span className="chip" key={x}>{x}</span>) : <span className="small-muted">Upload photo and detect ingredients.</span>}
        </div>

        <div style={{ marginTop: '.9rem', display: 'grid', gap: '.6rem' }}>
          <textarea
            className="form-control"
            rows={3}
            value={pantryNotes}
            onChange={(e) => setPantryNotes(e.target.value)}
            placeholder="Add pantry notes like: 2 onions, spinach, leftover rice"
          />
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" type="button" onClick={runAiExtraction}>AI extract ingredients</button>
            <button className="btn-primary" type="button" onClick={generateAiRecipe} disabled={loadingRecipe}>
              {loadingRecipe ? 'Generating…' : 'AI recipe from pantry'}
            </button>
          </div>
          {!!aiExtracted.length && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {aiExtracted.map((x) => <span className="chip" key={x}>AI: {x}</span>)}
            </div>
          )}
          {!!aiError && <p className="small-muted" style={{ margin: 0, color: '#b91c1c' }}>{aiError}</p>}
        </div>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Smart substitutions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '.6rem' }}>
          <input className="form-control" value={ingredient} onChange={(e) => setIngredient(e.target.value)} placeholder="ingredient to replace" />
          <input className="form-control" value={allergenText} onChange={(e) => setAllergenText(e.target.value)} placeholder="allergens (comma separated): dairy, nuts" />
          <div style={{ display: 'grid', gap: '.5rem' }}>
            {rankedSuggestions.map((item) => (
              <div key={item.name} className="stat-card" style={{ padding: '.7rem .9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>{item.name}</span>
                  <span className="badge">AI {Math.round(item.confidence * 100)}%</span>
                </div>
              </div>
            ))}
            {!rankedSuggestions.length && <p className="small-muted" style={{ margin: 0 }}>Add pantry context above to get AI substitutions.</p>}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Leftover + mood mode</h2>
        <textarea className="form-control" rows={3} value={leftovers} onChange={(e) => setLeftovers(e.target.value)} placeholder="leftovers, comma separated" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.7rem' }}>
          {moodSuggestions.map((m) => (
            <button key={m} type="button" className="chip" onClick={() => setMood(m)} style={{ border: 'none', cursor: 'pointer', opacity: mood === m ? 1 : 0.75 }}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '.7rem' }}>
          <button className="btn-primary" type="button" onClick={generateLeftoverIdeas} disabled={loadingIdeas}>
            {loadingIdeas ? 'Generating…' : 'AI suggest leftover ideas'}
          </button>
        </div>
        <div style={{ display: 'grid', gap: '.6rem', marginTop: '.8rem' }}>
          {ideas.map((idea) => <div key={idea} className="stat-card"><div style={{ fontWeight: 700 }}>{idea}</div></div>)}
          {!ideas.length && !ideasError && <p className="small-muted" style={{ margin: 0 }}>Generate AI ideas from leftovers and mood.</p>}
          {!!ideasError && <p className="small-muted" style={{ margin: 0, color: '#b91c1c' }}>{ideasError}</p>}
        </div>
      </section>

      {aiRecipe && (
        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>AI pantry recipe</h2>
          <RecipeCard recipe={aiRecipe} onSave={() => {}} />
        </section>
      )}
    </div>
  )
}
