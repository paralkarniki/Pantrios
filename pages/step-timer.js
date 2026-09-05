import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'

const STEPS = [
  { label: 'Prep vegetables', minutes: 2 },
  { label: 'Sauté aromatics', minutes: 3 },
  { label: 'Cook main ingredients', minutes: 6 },
  { label: 'Finish and garnish', minutes: 2 },
]

export default function StepTimerPage() {
  const [active, setActive] = useState(0)
  const [remaining, setRemaining] = useState(STEPS[0].minutes * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => {
      setRemaining((sec) => {
        if (sec <= 1) {
          setRunning(false)
          return 0
        }
        return sec - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    setRemaining(STEPS[active].minutes * 60)
    setRunning(false)
  }, [active])

  const current = STEPS[active]
  const display = useMemo(() => {
    const mins = Math.floor(remaining / 60)
    const secs = String(remaining % 60).padStart(2, '0')
    return `${mins}:${secs}`
  }, [remaining])

  return (
    <FeaturePage
      title="Step Timer"
      subtitle="Automatic timers inside recipe steps"
      intro="Attach a timer to each step so the cooking flow becomes easier to follow. It works well for mobile users who need quick feedback while cooking."
      badge="Timer mode"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Open recipes</Link>}
      highlights={[
        { icon: '⏲️', title: 'Per-step timing', text: 'Track each step separately.' },
        { icon: '📱', title: 'Mobile friendly', text: 'One-tap controls for the kitchen.' },
        { icon: '✅', title: 'Focus mode', text: 'Keep cooks on schedule.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <div className="badge">Current step</div>
            <h2 style={{ margin: '.75rem 0 .35rem' }}>{current.label}</h2>
            <p className="small-muted" style={{ margin: 0 }}>{current.minutes} minute timer</p>
          </div>
          <div className="stat-card" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="small-muted">Remaining</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1c1917' }}>{display}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-primary" onClick={() => setRunning((v) => !v)}>
                {running ? 'Pause' : 'Start'}
              </button>
              <button type="button" className="btn-primary" onClick={() => setRemaining(current.minutes * 60)} style={{ background: 'linear-gradient(135deg,#f59e0b,#c2410c)' }}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Recipe steps</h2>
        <div style={{ display: 'grid', gap: '.75rem' }}>
          {STEPS.map((step, index) => (
            <button
              key={step.label}
              type="button"
              onClick={() => setActive(index)}
              className="stat-card"
              style={{ textAlign: 'left', cursor: 'pointer', border: index === active ? '1px solid rgba(217,119,6,0.28)' : '1px solid rgba(255,220,100,0.30)' }}
            >
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed, #fde68a)', color: '#92400e' }}>{index + 1}</div>
              <div>
                <div style={{ fontWeight: 800 }}>{step.label}</div>
                <div className="small-muted" style={{ marginTop: 4 }}>{step.minutes} minute timer</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </FeaturePage>
  )
}
