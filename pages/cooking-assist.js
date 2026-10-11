import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import RecipeCard from '../components/RecipeCard'
import { subscribeToAuth } from '../lib/auth'
import { readScopedJSON, writeScopedJSON } from '../lib/clientStorage'
import {
  buildPlatingGuide,
  buildShareCardCopy,
  buildTasteProfile,
  estimateStepDurations,
  rankRecipesForTaste,
  remixRecipeWithPantry,
} from '../lib/aiAssistant'

const TASTE_KEY = 'pantrio:taste-ratings'

export default function CookingAssistPage() {
  const recognitionRef = useRef(null)
  const [user, setUser] = useState(null)
  const [running, setRunning] = useState(false)
  const [liveMode, setLiveMode] = useState(false)
  const [listening, setListening] = useState(false)
  const [commandStatus, setCommandStatus] = useState('Voice commands: “next”, “back”, “repeat”, “pause”, “start”.')
  const [dynamicSteps, setDynamicSteps] = useState([])
  const [active, setActive] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [status, setStatus] = useState('Tap play to hear steps.')
  const [stepInput, setStepInput] = useState('')

  const [title, setTitle] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [ingredientsText, setIngredientsText] = useState('')
  const [platingStyle, setPlatingStyle] = useState('fine-dining')

  const [sharePlatform, setSharePlatform] = useState('instagram')
  const [shareTone, setShareTone] = useState('fun')
  const [shareStatus, setShareStatus] = useState('')

  const [friendRecipeText, setFriendRecipeText] = useState('')
  const [pantryRemixText, setPantryRemixText] = useState('')
  const [remixResult, setRemixResult] = useState(null)

  const [tasteRatings, setTasteRatings] = useState([])
  const [tasteLoaded, setTasteLoaded] = useState(false)
  const [tasteTitle, setTasteTitle] = useState('')
  const [tasteCuisine, setTasteCuisine] = useState('')
  const [tasteScoreInput, setTasteScoreInput] = useState('5')

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const saved = readScopedJSON(TASTE_KEY, user?.uid, [], { legacyKey: TASTE_KEY })
    setTasteRatings(Array.isArray(saved) ? saved : [])
    setTasteLoaded(true)
  }, [user?.uid])

  useEffect(() => {
    if (!tasteLoaded) return
    writeScopedJSON(TASTE_KEY, user?.uid, tasteRatings)
  }, [tasteLoaded, user?.uid, tasteRatings])

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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  const recipe = useMemo(() => ({
    title: title || 'Custom recipe',
    cuisine: cuisine || 'Homestyle',
    time: dynamicSteps.reduce((sum, s) => sum + (Number(s?.minutes || 0)), 0) || undefined,
    dietary: undefined,
    ingredients: String(ingredientsText || '').split(',').map((x) => x.trim()).filter(Boolean),
    steps: dynamicSteps.map((x) => x.label),
  }), [title, cuisine, dynamicSteps, ingredientsText])

  const platingGuide = useMemo(() => buildPlatingGuide(recipe, platingStyle), [recipe, platingStyle])
  const tasteProfile = useMemo(() => buildTasteProfile(tasteRatings), [tasteRatings])
  const tasteFit = useMemo(() => {
    const ranked = rankRecipesForTaste([recipe], tasteProfile)
    return ranked[0] || null
  }, [recipe, tasteProfile])

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

  function speakText(text = '') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const t = String(text || '').trim()
    if (!t) return
    const u = new SpeechSynthesisUtterance(t)
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

  function applyVoiceCommand(transcript = '') {
    const cmd = String(transcript || '').toLowerCase()
    if (!cmd) return

    if (cmd.includes('next')) {
      setActive((v) => Math.min(v + 1, Math.max(0, dynamicSteps.length - 1)))
      setCommandStatus('Command received: next step.')
      return
    }
    if (cmd.includes('back') || cmd.includes('previous')) {
      setActive((v) => Math.max(0, v - 1))
      setCommandStatus('Command received: previous step.')
      return
    }
    if (cmd.includes('repeat')) {
      speakText(dynamicSteps[active]?.label || '')
      setCommandStatus('Command received: repeat current step.')
      return
    }
    if (cmd.includes('pause') || cmd.includes('stop timer')) {
      setRunning(false)
      setCommandStatus('Command received: pause timer.')
      return
    }
    if (cmd.includes('start') || cmd.includes('resume')) {
      if (dynamicSteps.length) setRunning(true)
      setCommandStatus('Command received: start timer.')
    }
  }

  function startHandsFree() {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setCommandStatus('Voice command recognition is not supported in this browser.')
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setCommandStatus('Voice command recognition error. Try again.')
    rec.onresult = (event) => {
      const result = event?.results?.[event.results.length - 1]
      const text = result?.[0]?.transcript || ''
      applyVoiceCommand(text)
    }

    recognitionRef.current = rec
    rec.start()
  }

  function stopHandsFree() {
    if (recognitionRef.current) recognitionRef.current.stop()
    setListening(false)
  }

  function saveTasteRating() {
    const nextTitle = String(tasteTitle || recipe?.title || '').trim()
    if (!nextTitle) return
    const nextCuisine = String(tasteCuisine || recipe?.cuisine || '').trim() || 'Homestyle'
    const nextRating = Math.max(1, Math.min(5, Number(tasteScoreInput) || 5))

    setTasteRatings((prev) => ([
      { title: nextTitle, cuisine: nextCuisine, rating: nextRating, timestamp: new Date().toISOString() },
      ...prev,
    ]).slice(0, 40))

    setTasteTitle('')
    setTasteCuisine('')
    setTasteScoreInput('5')
  }

  function makeShareCopy() {
    const payload = buildShareCardCopy(recipe, { platform: sharePlatform, tone: shareTone })
    const text = `${payload.caption}\n${payload.hashtags}`
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
      setShareStatus('Share caption copied.')
      return
    }
    setShareStatus(text)
  }

  function runRemix() {
    setRemixResult(remixRecipeWithPantry(friendRecipeText, pantryRemixText))
  }

  return (
    <div className="app-container">
      <PageHeader
        title="Cooking Assist Hub"
        subtitle="Live cook mode + taste AI + social remix + plating in one page"
        actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Open generator</Link>}
      />

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Live cook mode (hands-free)</h2>
        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={playVoice}>Play</button>
          <button className="btn-primary" onClick={stopVoice} style={{ background: 'linear-gradient(135deg,#f59e0b,#c2410c)' }}>Stop</button>
          <button className="btn-primary" onClick={startHandsFree} style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>Start voice commands</button>
          <button className="btn-primary" onClick={stopHandsFree} style={{ background: 'linear-gradient(135deg,#64748b,#334155)' }}>Stop commands</button>
          <button className="btn-primary" onClick={() => setLiveMode((v) => !v)} style={{ background: 'linear-gradient(135deg,#10b981,#047857)' }}>{liveMode ? 'Exit big mode' : 'Big cook mode'}</button>
        </div>
        <p className="small-muted" style={{ marginTop: '.7rem' }}>{status}</p>
        <p className="small-muted" style={{ marginTop: '.35rem' }}>{commandStatus} {listening ? '• Listening…' : ''}</p>
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
        {liveMode && !!dynamicSteps.length && (
          <div className="stat-card" style={{ marginTop: '.8rem', padding: '1rem' }}>
            <div className="small-muted">Live step</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.35, marginTop: '.35rem' }}>
              {active + 1}. {dynamicSteps[active]?.label}
            </div>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Taste personalization engine</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr .5fr auto', gap: '.55rem' }}>
          <input className="form-control" value={tasteTitle} onChange={(e) => setTasteTitle(e.target.value)} placeholder="recipe title" />
          <input className="form-control" value={tasteCuisine} onChange={(e) => setTasteCuisine(e.target.value)} placeholder="cuisine" />
          <input className="form-control" type="number" min="1" max="5" value={tasteScoreInput} onChange={(e) => setTasteScoreInput(e.target.value)} placeholder="rating" />
          <button className="btn-primary" type="button" onClick={saveTasteRating}>Save taste</button>
        </div>
        <div style={{ marginTop: '.7rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <span className="badge">Likes: {(tasteProfile.likes || []).join(', ') || '—'}</span>
          <span className="badge">Avoids: {(tasteProfile.dislikes || []).join(', ') || '—'}</span>
          <span className="badge">Current recipe fit: {Math.round(Number(tasteFit?.tasteScore || 0) * 100)}%</span>
        </div>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Social share + remix</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '.9rem' }}>
          <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
          <input className="form-control" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="cuisine" />
        </div>
        <input className="form-control" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} placeholder="ingredients comma separated" style={{ marginBottom: '.9rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '.55rem', marginBottom: '.8rem' }}>
          <select className="form-control" value={sharePlatform} onChange={(e) => setSharePlatform(e.target.value)}>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="x">X</option>
          </select>
          <select className="form-control" value={shareTone} onChange={(e) => setShareTone(e.target.value)}>
            <option value="fun">Fun</option>
            <option value="pro">Pro</option>
          </select>
          <button className="btn-primary" type="button" onClick={makeShareCopy}>Copy caption</button>
        </div>
        {!!shareStatus && <p className="small-muted" style={{ marginTop: 0 }}>{shareStatus}</p>}

        <div className="card" style={{ marginTop: '.8rem', padding: '.8rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '.55rem' }}>Remix friend recipe with my pantry</div>
          <textarea className="form-control" rows={2} value={friendRecipeText} onChange={(e) => setFriendRecipeText(e.target.value)} placeholder="friend recipe ingredients / description" />
          <textarea className="form-control" rows={2} value={pantryRemixText} onChange={(e) => setPantryRemixText(e.target.value)} placeholder="my pantry ingredients" style={{ marginTop: '.55rem' }} />
          <button className="btn-primary" type="button" onClick={runRemix} style={{ marginTop: '.55rem' }}>AI remix</button>
          {remixResult && (
            <div className="stat-card" style={{ marginTop: '.6rem', display: 'grid', gap: 4 }}>
              <div style={{ fontWeight: 800 }}>{remixResult.title}</div>
              <div className="small-muted">Ingredients: {(remixResult.ingredients || []).join(', ') || '—'}</div>
              <div className="small-muted">{remixResult.pitch}</div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: '.8rem', padding: '.8rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '.55rem' }}>Restaurant-at-home plating mode</div>
          <select className="form-control" value={platingStyle} onChange={(e) => setPlatingStyle(e.target.value)}>
            <option value="fine-dining">Fine dining</option>
            <option value="street-food">Street food</option>
            <option value="home-comfort">Home comfort</option>
          </select>
          <div style={{ display: 'grid', gap: '.45rem', marginTop: '.55rem' }}>
            {(platingGuide || []).map((line) => <div key={line} className="small-muted">• {line}</div>)}
          </div>
        </div>

        <RecipeCard recipe={recipe} onSave={() => {}} />
      </section>
    </div>
  )
}
