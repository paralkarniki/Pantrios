import { useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'

const MOODS = {
  cozy: ['Creamy mushroom pasta', 'Baked tomato soup', 'Warm lentil stew'],
  spicy: ['Harissa chicken bowls', 'Chili garlic noodles', 'Spiced chickpea curry'],
  light: ['Citrus salad', 'Herby grain bowl', 'Steamed fish and greens'],
  comfort: ['Mac and cheese', 'Chicken pot pie', 'Loaded mashed potato bowl'],
  highprotein: ['Greek chicken bowl', 'Tofu stir-fry', 'Turkey taco skillet'],
}

const LABELS = {
  cozy: 'Cozy',
  spicy: 'Spicy',
  light: 'Light',
  comfort: 'Comfort food',
  highprotein: 'High-protein',
}

export default function MoodModePage() {
  const [mood, setMood] = useState('cozy')
  const recipes = useMemo(() => MOODS[mood] || MOODS.cozy, [mood])

  return (
    <FeaturePage
      title="Mood Mode"
      subtitle="Generate meals based on how you feel"
      intro="Give the app personality. Mood mode helps users choose a cooking style that matches their day — cozy, light, spicy, or protein-focused."
      badge="Personalized"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Match my mood</Link>}
      highlights={[
        { icon: '🧡', title: 'Comfort picks', text: 'Great for rainy nights and relaxed cooking.' },
        { icon: '🌶️', title: 'Spice dial', text: 'Raise or lower the heat with one tap.' },
        { icon: '💪', title: 'Protein-first', text: 'Keep meals aligned with goals.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
          {Object.keys(MOODS).map((key) => (
            <button key={key} type="button" className="chip" onClick={() => setMood(key)} style={{ cursor: 'pointer', border: 'none', opacity: mood === key ? 1 : 0.75 }}>
              {LABELS[key]}
            </button>
          ))}
        </div>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>{LABELS[mood]}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {recipes.map((item) => (
            <div key={item} className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed, #fde68a)', color: '#92400e' }}>😊</div>
              <div style={{ fontWeight: 700 }}>{item}</div>
            </div>
          ))}
        </div>
      </section>
    </FeaturePage>
  )
}
