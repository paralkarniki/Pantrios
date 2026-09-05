import { useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'

function buildIdeas(text = '') {
  const words = String(text).split(',').map((x) => x.trim()).filter(Boolean)
  if (!words.length) return ['Turn extras into a stir-fry.', 'Make a grain bowl.', 'Bake into a frittata.']
  return [
    `Use ${words.slice(0, 2).join(' and ')} in a fried rice bowl.`,
    `Fold ${words[0]} into soup or stew.`,
    `Make a wrap, salad, or hash with ${words.join(', ')}.`,
  ]
}

export default function LeftoverModePage() {
  const [leftovers, setLeftovers] = useState('rice, chicken, spinach')
  const ideas = useMemo(() => buildIdeas(leftovers), [leftovers])

  return (
    <FeaturePage
      title="Leftover Mode"
      subtitle="Recipes that intentionally reuse leftovers"
      intro="Help users rescue leftovers before they go stale. This mode makes the app feel practical, waste-saving, and budget-smart."
      badge="Waste saver"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Reuse now</Link>}
      highlights={[
        { icon: '♻️', title: 'Waste reduction', text: 'Turn leftovers into a plan.' },
        { icon: '🥘', title: 'Flexible cooking', text: 'Works with whatever is in the fridge.' },
        { icon: '🧊', title: 'Fridge-friendly', text: 'Designed for next-day meals.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <label>
          <div className="small-muted" style={{ marginBottom: '.45rem', fontWeight: 700 }}>What’s left in the fridge?</div>
          <textarea className="form-control" rows={4} value={leftovers} onChange={(e) => setLeftovers(e.target.value)} placeholder="e.g. rice, roast chicken, broccoli" />
        </label>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Leftover ideas</h2>
        <div style={{ display: 'grid', gap: '.75rem' }}>
          {ideas.map((idea) => (
            <div key={idea} className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed, #fde68a)', color: '#92400e' }}>♻</div>
              <div style={{ fontWeight: 700 }}>{idea}</div>
            </div>
          ))}
        </div>
      </section>
    </FeaturePage>
  )
}
