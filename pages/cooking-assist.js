import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import RecipeCard from '../components/RecipeCard'
import { estimateStepDurations } from '../lib/aiAssistant'

const STEPS = [
  { label: 'Prep ingredients', minutes: 2 },
  { label: 'Sauté base', minutes: 3 },
  { label: 'Cook main mix', minutes: 6 },
]

export default function CookingAssistPage() {
  const [running, setRunning] = useState(false)
  const [dynamicSteps, setDynamicSteps] = useState(STEPS)
  const [active, setActive] = useState(0)
  const [remaining, setRemaining] = useState(STEPS[0].minutes * 60)
  const [status, setStatus] = useState('Tap play to hear steps.')
  const [stepInput, setStepInput] = useState('Chop onions. Saute with oil. Add chickpeas and cook. Serve hot with herbs.')

  const [title, setTitle] = useState('Golden chickpea bowl')
  const [cuisine, setCuisine] = useState('Mediterranean')

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    setRemaining((dynamicSteps[active]?.minutes || 1) * 60)
    setRunning(false)
  }, [active, dynamicSteps])

  const recipe = useMemo(() => ({
    title,
    cuisine,
    time: 20,
    dietary: 'High-protein',
    ingredients: ['chickpeas', 'tomato', 'olive oil', 'spinach'],
    steps: dynamicSteps.map((x) => x.label),
  }), [title, cuisine])

  const timeDisplay = useMemo(() => {
    const m = Math.floor(remaining / 60)
    const s = String(remaining % 60).padStart(2, '0')
    return `${m}:${s}`
  }, [remaining])

  function playVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setStatus('Voice mode is not available in this browser.')
      return
    }
    const text = recipe.steps.join(' ')
    const u = new SpeechSynthesisUtterance(text)
    u.onstart = () => setStatus('Voice instructions are playing.')
    u.onend = () => setStatus('Voice instructions finished.')
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  function stopVoice() {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setStatus('Voice instructions stopped.')
  }

  function runAiStepTiming() {
    const parsed = estimateStepDurations(stepInput)
    if (!parsed.length) {
      setStatus('Add a few cooking instructions first.')
      return
    }
    setDynamicSteps(parsed)
    setActive(0)
    setStatus(`AI mapped ${parsed.length} steps with time estimates.`)
  }

  return (
    <div className="app-container">
      <PageHeader
        title="Cooking Assist Hub"
        subtitle="Voice mode + step timer + shareable card in one page"
        actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Open generator</Link>}
      />

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Voice mode</h2>
        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={playVoice}>Play</button>
          <button className="btn-primary" onClick={stopVoice} style={{ background: 'linear-gradient(135deg,#f59e0b,#c2410c)' }}>Stop</button>
        </div>
        <p className="small-muted" style={{ marginTop: '.7rem' }}>{status}</p>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Step timer</h2>
        <textarea
          className="form-control"
          rows={3}
          value={stepInput}
          onChange={(e) => setStepInput(e.target.value)}
          placeholder="Paste recipe steps here for AI timing"
        />
        <div style={{ marginTop: '.7rem' }}>
          <button className="btn-primary" type="button" onClick={runAiStepTiming}>AI estimate step times</button>
        </div>
        <div style={{ display: 'grid', gap: '.7rem' }}>
          {dynamicSteps.map((s, i) => (
            <button key={s.label} type="button" className="stat-card" onClick={() => setActive(i)} style={{ textAlign: 'left', cursor: 'pointer' }}>
              <div style={{ fontWeight: 700 }}>{i + 1}. {s.label} · {s.minutes} min</div>
            </button>
          ))}
        </div>
        <div className="stat-card" style={{ marginTop: '.8rem', justifyContent: 'space-between' }}>
          <div>
            <div className="small-muted">Current timer</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{timeDisplay}</div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn-primary" onClick={() => setRunning((v) => !v)}>{running ? 'Pause' : 'Start'}</button>
            <button className="btn-primary" onClick={() => setRemaining((dynamicSteps[active]?.minutes || 1) * 60)} style={{ background: 'linear-gradient(135deg,#f59e0b,#c2410c)' }}>Reset</button>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Shareable recipe card</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '.9rem' }}>
          <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
          <input className="form-control" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="cuisine" />
        </div>
        <RecipeCard recipe={recipe} onSave={() => {}} />
      </section>
    </div>
  )
}
