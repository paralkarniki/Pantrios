import { useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'
import RecipeCard from '../components/RecipeCard'

export default function ShareableRecipeCardsPage() {
  const [title, setTitle] = useState('Golden chickpea bowl')
  const [cuisine, setCuisine] = useState('Mediterranean')
  const [time, setTime] = useState('20')

  const recipe = useMemo(() => ({
    title,
    cuisine,
    time: Number(time) || undefined,
    dietary: 'High-protein',
    ingredients: ['chickpeas', 'tomato', 'cucumber', 'olive oil'],
    steps: ['Prep the vegetables.', 'Warm the chickpeas.', 'Assemble and serve.'],
  }), [title, cuisine, time])

  return (
    <FeaturePage
      title="Shareable Recipe Cards"
      subtitle="Social-friendly recipe layouts for sharing"
      intro="Make each recipe look shareable by default. Users can copy a link, print a card, or pass it to friends and family with a polished visual preview."
      badge="Share mode"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Create recipe</Link>}
      highlights={[
        { icon: '🔗', title: 'Share links', text: 'Create clean, copyable recipe URLs.' },
        { icon: '🖼️', title: 'Polished cards', text: 'Beautiful cards for social and messaging apps.' },
        { icon: '📤', title: 'Fast export', text: 'Copy, print, and share in a tap.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <label>
            <div className="small-muted" style={{ fontWeight: 700 }}>Card title</div>
            <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            <div className="small-muted" style={{ fontWeight: 700 }}>Cuisine</div>
            <input className="form-control" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
          </label>
          <label>
            <div className="small-muted" style={{ fontWeight: 700 }}>Time (min)</div>
            <input className="form-control" type="number" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Live card preview</h2>
        <RecipeCard recipe={recipe} onSave={() => {}} />
      </section>
    </FeaturePage>
  )
}
