import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import RecipeCard from '../components/RecipeCard'
import { estimateStepDurations } from '../lib/aiAssistant'

export default function CookingAssistPage() {
  const [running, setRunning] = useState(false)
  const [dynamicSteps, setDynamicSteps] = useState([])
  const [active, setActive] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [status, setStatus] = useState('Tap play to hear steps.')
  const [stepInput, setStepInput] = useState('')

  const [title, setTitle] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [ingredientsText, setIngredientsText] = useState('')

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
    if (!dynamicSteps.length) {
      setRemaining(0)
      setRunning(false)
      return
    }
    setRemaining((dynamicSteps[active]?.minutes || 1) * 60)
    setRunning(false)
  }, [active, dynamicSteps])

  const recipe = useMemo(() => ({
    title: title || 'Custom recipe',
    cuisine: cuisine || 'Homestyle',
    time: dynamicSteps.reduce((sum, s) => sum + (Number(s?.minutes || 0)), 0) || undefined,
    dietary: undefined,
    ingredients: String(ingredientsText || '').split(',').map((x) => x.trim()).filter(Boolean),
    steps: dynamicSteps.map((x) => x.label),
  }), [title, cuisine, dynamicSteps, ingredientsText])

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
    const text = recipe.steps.length ? recipe.steps.join(' ') : String(stepInput || '').trim()
    if (!text) {
      setStatus('Add recipe steps first for voice instructions.')
      return
    }
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
          {!dynamicSteps.length && <p className="small-muted" style={{ margin: 0 }}>No AI-timed steps yet. Paste steps and run AI estimate.</p>}
        </div>
        <div className="stat-card" style={{ marginTop: '.8rem', justifyContent: 'space-between' }}>
          <div>
            <div className="small-muted">Current timer</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{timeDisplay}</div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn-primary" onClick={() => setRunning((v) => !v)} disabled={!dynamicSteps.length}>{running ? 'Pause' : 'Start'}</button>
            <button className="btn-primary" onClick={() => setRemaining((dynamicSteps[active]?.minutes || 1) * 60)} disabled={!dynamicSteps.length} style={{ background: 'linear-gradient(135deg,#f59e0b,#c2410c)' }}>Reset</button>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Shareable recipe card</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '.9rem' }}>
          <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
          <input className="form-control" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="cuisine" />
        </div>
        <input className="form-control" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} placeholder="ingredients comma separated" style={{ marginBottom: '.9rem' }} />
        <RecipeCard recipe={recipe} onSave={() => {}} />
      </section>
    </div>
  )
}
