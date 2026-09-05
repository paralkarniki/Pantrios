import { useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'

const SAMPLE_INGREDIENTS = {
  default: ['onion', 'garlic', 'tomato', 'spinach'],
  veg: ['spinach', 'broccoli', 'carrot', 'bell pepper', 'mushroom'],
  spice: ['cumin', 'paprika', 'turmeric', 'coriander'],
}

const SUBSTITUTIONS = {
  milk: ['oat milk', 'soy milk', 'almond milk'],
  butter: ['olive oil', 'vegan butter', 'ghee'],
  egg: ['flax egg', 'chia egg', 'mashed banana'],
  flour: ['oat flour', 'almond flour', 'gluten-free blend'],
}

const ALLERGENS = ['dairy', 'egg', 'gluten', 'nuts', 'soy']
const MOODS = ['cozy', 'spicy', 'light', 'comfort', 'high-protein']

function detectIngredients(fileName = '') {
  const name = String(fileName).toLowerCase()
  if (/(spice|seasoning|masala)/.test(name)) return SAMPLE_INGREDIENTS.spice
  if (/(veg|veggie|produce|greens)/.test(name)) return SAMPLE_INGREDIENTS.veg
  return SAMPLE_INGREDIENTS.default
}

function buildSuggestions(ingredient, allergens) {
  const key = String(ingredient || '').trim().toLowerCase()
  const base = SUBSTITUTIONS[key] || ['olive oil', 'beans', 'tofu']
  const filtered = base.filter((item) => {
    const lower = item.toLowerCase()
    if (allergens.includes('dairy') && /milk|butter/.test(lower)) return false
    if (allergens.includes('egg') && /egg/.test(lower)) return false
    if (allergens.includes('gluten') && /flour/.test(lower)) return false
    if (allergens.includes('nuts') && /almond|nut/.test(lower)) return false
    if (allergens.includes('soy') && /soy/.test(lower)) return false
    return true
  })
  return filtered.length ? filtered : ['olive oil', 'fresh herbs']
}

function leftoverIdeas(text = '', mood = 'cozy') {
  const items = String(text).split(',').map((x) => x.trim()).filter(Boolean)
  if (!items.length) return [`${mood} soup bowl`, `${mood} stir-fry`, `${mood} wraps`]
  return [
    `${mood} bowl with ${items.slice(0, 2).join(' and ')}`,
    `${mood} fried rice using ${items[0]}`,
    `${mood} skillet with ${items.join(', ')}`,
  ]
}

export default function KitchenToolsPage() {
  const [fileName, setFileName] = useState('')
  const [detected, setDetected] = useState([])

  const [ingredient, setIngredient] = useState('milk')
  const [allergens, setAllergens] = useState([])

  const [leftovers, setLeftovers] = useState('rice, spinach, chicken')
  const [mood, setMood] = useState('cozy')

  const suggestions = useMemo(() => buildSuggestions(ingredient, allergens), [ingredient, allergens])
  const ideas = useMemo(() => leftoverIdeas(leftovers, mood), [leftovers, mood])

  function onPickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDetected([])
  }

  function runDetection() {
    setDetected(detectIngredients(fileName))
  }

  function toggleAllergen(name) {
    setAllergens((prev) => prev.includes(name) ? prev.filter((x) => x !== name) : [name, ...prev])
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
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Smart substitutions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '.6rem' }}>
          <input className="form-control" value={ingredient} onChange={(e) => setIngredient(e.target.value)} placeholder="ingredient to replace" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {ALLERGENS.map((a) => (
              <button key={a} type="button" className="chip" onClick={() => toggleAllergen(a)} style={{ border: 'none', cursor: 'pointer' }}>
                {allergens.includes(a) ? '✓ ' : ''}{a}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {suggestions.map((s) => <span className="chip" key={s}>{s}</span>)}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Leftover + mood mode</h2>
        <textarea className="form-control" rows={3} value={leftovers} onChange={(e) => setLeftovers(e.target.value)} placeholder="leftovers, comma separated" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.7rem' }}>
          {MOODS.map((m) => (
            <button key={m} type="button" className="chip" onClick={() => setMood(m)} style={{ border: 'none', cursor: 'pointer', opacity: mood === m ? 1 : 0.75 }}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: '.6rem', marginTop: '.8rem' }}>
          {ideas.map((idea) => <div key={idea} className="stat-card"><div style={{ fontWeight: 700 }}>{idea}</div></div>)}
        </div>
      </section>
    </div>
  )
}
