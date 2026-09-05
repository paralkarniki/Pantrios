import { useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'

const PRESETS = [
  { label: '10-minute', minutes: 10, title: 'Speedy skillet', note: 'Ultra-fast weekday dinners' },
  { label: '15-minute', minutes: 15, title: 'Quick stir-fry', note: 'Fast and fresh' },
  { label: '25-minute', minutes: 25, title: 'Balanced bowl', note: 'Still quick, a bit more complete' },
  { label: 'Batch cook', minutes: 60, title: 'Meal prep tray', note: 'Cook once, eat all week' },
  { label: 'Lazy dinner', minutes: 20, title: 'Low-effort pasta', note: 'Minimal cleanup, maximum comfort' },
]

export default function TimeModePage() {
  const [selected, setSelected] = useState(PRESETS[0])
  const picks = useMemo(() => PRESETS, [])

  return (
    <FeaturePage
      title="Time Mode"
      subtitle="Generate meals by cooking time"
      intro="Give users a time-first mode for busy days. Whether they want a 10-minute dinner or a batch-cook session, the app can tailor recipes to the clock."
      badge="Time aware"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Use generator</Link>}
      highlights={[
        { icon: '⏱️', title: 'Fast dinner', text: 'Prioritize recipes that finish on time.' },
        { icon: '🍱', title: 'Batch mode', text: 'Ideal for meal prep and leftovers.' },
        { icon: '🛋️', title: 'Lazy dinner', text: 'Comfort food with less effort.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
          {picks.map((item) => (
            <button key={item.label} type="button" className="chip" onClick={() => setSelected(item)} style={{ cursor: 'pointer', border: 'none' }}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <div className="badge">{selected.label}</div>
            <h2 style={{ margin: '.75rem 0 .35rem' }}>{selected.title}</h2>
            <p className="small-muted" style={{ margin: 0 }}>{selected.note}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed, #fde68a)', color: '#92400e' }}>⏳</div>
            <div>
              <div style={{ fontWeight: 800 }}>{selected.minutes} minutes</div>
              <div className="small-muted" style={{ marginTop: 4 }}>Use this as the recipe time target.</div>
            </div>
          </div>
        </div>
      </section>
    </FeaturePage>
  )
}
