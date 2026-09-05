import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import PageHeader from '../components/PageHeader'
import { subscribeToAuth } from '../lib/auth'
import { readScopedJSON } from '../lib/clientStorage'
import { recommendBudgetMeals } from '../lib/aiAssistant'

const RECENT_KEY = 'pantrio:recent'
const PRESETS = [10, 15, 20, 30, 60]
const MEALS = [
  { title: 'Bean tacos', cost: 1.8 },
  { title: 'Veg fried rice', cost: 2.4 },
  { title: 'Chickpea pasta', cost: 3.2 },
  { title: 'Chicken tray bake', cost: 4.9 },
]

function encodeRecipe(recipe) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(recipe))))
}

export default function PlanningHubPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [budget, setBudget] = useState('5')
  const [timePreset, setTimePreset] = useState(15)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const saved = readScopedJSON(RECENT_KEY, user?.uid, [], { legacyKey: RECENT_KEY })
    setRecent(Array.isArray(saved) ? saved.slice(0, 6) : [])
  }, [user?.uid])

  const options = useMemo(() => {
    const b = Number(budget) || 0
    return MEALS.filter((x) => x.cost <= b)
  }, [budget])

  const aiRanked = useMemo(() => {
    return recommendBudgetMeals(MEALS, {
      budget: Number(budget) || 0,
      timePreset,
      recentTitles: recent.map((r) => r?.title).filter(Boolean),
    }).slice(0, 3)
  }, [budget, timePreset, recent])

  function cookAgain(recipe) {
    const encoded = encodeRecipe(recipe)
    router.push(`/generate?r=${encodeURIComponent(encoded)}`)
  }

  return (
    <div className="app-container">
      <PageHeader
        title="Planning Hub"
        subtitle="Budget mode + time mode + cook again memory"
        actions={<Link href="/planner" className="btn-primary" style={{ textDecoration: 'none' }}>Open weekly planner</Link>}
      />

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Budget mode</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.6rem' }}>
          <input className="form-control" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="budget per serving" />
          <span className="badge">${budget || '0'}/serving</span>
        </div>
        <div style={{ display: 'grid', gap: '.6rem', marginTop: '.8rem' }}>
          {options.length ? options.map((o) => <div key={o.title} className="stat-card"><div style={{ fontWeight: 700 }}>{o.title} · ${o.cost.toFixed(2)}</div></div>) : <p className="small-muted" style={{ margin: 0 }}>No meals in this range yet.</p>}
        </div>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>AI recommendations</h2>
        <p className="small-muted" style={{ marginTop: 0 }}>
          Ranked using budget fit, time target, and diversity from recent cooking history.
        </p>
        <div style={{ display: 'grid', gap: '.65rem' }}>
          {aiRanked.map((item) => (
            <div key={item.title} className="stat-card" style={{ justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{item.title}</div>
                <div className="small-muted" style={{ marginTop: 4 }}>${item.cost.toFixed(2)} · {item.reason}</div>
              </div>
              <span className="badge">AI {Math.round(item.aiScore * 100)}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Time mode</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {PRESETS.map((p) => (
            <button key={p} className="chip" type="button" onClick={() => setTimePreset(p)} style={{ border: 'none', cursor: 'pointer', opacity: timePreset === p ? 1 : 0.75 }}>
              {p} min
            </button>
          ))}
        </div>
        <p className="small-muted" style={{ marginTop: '.8rem' }}>Selected time target: {timePreset} minutes. Use this in the generator for faster results.</p>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Cook again memory</h2>
        <div style={{ display: 'grid', gap: '.7rem' }}>
          {recent.length ? recent.map((r, i) => (
            <div key={`${r?.title || 'recipe'}-${i}`} className="stat-card" style={{ justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{r?.title || 'Saved recipe'}</div>
                <div className="small-muted" style={{ marginTop: 4 }}>{r?.cuisine || 'Homestyle'}{r?.time ? ` · ${r.time} min` : ''}</div>
              </div>
              <button type="button" className="btn-primary" onClick={() => cookAgain(r)}>Cook again</button>
            </div>
          )) : <p className="small-muted" style={{ margin: 0 }}>No recent recipes yet. Generate one first.</p>}
        </div>
      </section>
    </div>
  )
}
