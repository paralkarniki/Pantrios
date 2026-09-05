import { useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'

const MEALS = [
  { title: 'Bean tacos', cost: 1.8, tag: 'under budget' },
  { title: 'Vegetable fried rice', cost: 2.2, tag: 'fast lunch' },
  { title: 'Chickpea pasta', cost: 3.4, tag: 'family friendly' },
  { title: 'Chicken tray bake', cost: 4.8, tag: 'high protein' },
  { title: 'Salmon grain bowl', cost: 6.1, tag: 'premium' },
  { title: 'Steak dinner', cost: 8.4, tag: 'special occasion' },
]

export default function BudgetModePage() {
  const [budget, setBudget] = useState('5')
  const [servings, setServings] = useState('2')

  const results = useMemo(() => {
    const limit = Number(budget) || 0
    const count = Math.max(1, Number(servings) || 1)
    return MEALS
      .filter((meal) => meal.cost * count <= limit * count)
      .sort((a, b) => a.cost - b.cost)
  }, [budget, servings])

  return (
    <FeaturePage
      title="Budget Mode"
      subtitle="Generate meals by price per serving"
      intro="Help users keep dinner affordable with a price-first mode. They can set a per-serving budget and instantly see meals that fit their range."
      badge="Cost aware"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Generate now</Link>}
      highlights={[
        { icon: '💵', title: 'Per-serving pricing', text: 'Focus on what each plate costs.' },
        { icon: '🛒', title: 'Budget control', text: 'Keep meals within a target amount.' },
        { icon: '🍲', title: 'Affordable ideas', text: 'Show the best-value meal options first.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <label>
            <div className="small-muted" style={{ fontWeight: 700 }}>Budget per serving ($)</div>
            <input className="form-control" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 5" />
          </label>
          <label>
            <div className="small-muted" style={{ fontWeight: 700 }}>Servings</div>
            <input className="form-control" type="number" value={servings} onChange={(e) => setServings(e.target.value)} placeholder="e.g. 2" />
          </label>
        </div>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Best matches</h2>
          <span className="badge">${budget || '0'} per serving</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: '1rem' }}>
          {results.map((meal) => (
            <div key={meal.title} className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed, #fde68a)', color: '#92400e' }}>₹</div>
              <div>
                <div style={{ fontWeight: 800 }}>{meal.title}</div>
                <div className="small-muted" style={{ marginTop: 4 }}>${meal.cost.toFixed(2)} per serving · {meal.tag}</div>
              </div>
            </div>
          ))}
          {!results.length && <p className="small-muted">Increase the budget to reveal more meal ideas.</p>}
        </div>
      </section>
    </FeaturePage>
  )
}
