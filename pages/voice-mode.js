import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'

const STEPS = [
  'Heat a skillet over medium heat.',
  'Add oil and sauté onions for two minutes.',
  'Stir in the vegetables and seasoning.',
  'Cook until everything is tender and glossy.',
  'Serve hot with a squeeze of lemon.',
]

export default function VoiceModePage() {
  const [speaking, setSpeaking] = useState(false)
  const [status, setStatus] = useState('Tap play to hear the recipe steps.')

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  const voiceSupported = useMemo(() => typeof window !== 'undefined' && 'speechSynthesis' in window, [])

  function playVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setStatus('Voice playback is not supported in this browser.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(`Recipe instructions. ${STEPS.join(' ')}`)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => {
      setSpeaking(true)
      setStatus('Voice instructions are playing.')
    }
    utterance.onend = () => {
      setSpeaking(false)
      setStatus('Voice instructions finished.')
    }
    utterance.onerror = () => {
      setSpeaking(false)
      setStatus('Voice playback stopped.')
    }
    window.speechSynthesis.speak(utterance)
  }

  function stopVoice() {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setSpeaking(false)
    setStatus('Voice playback stopped.')
  }

  return (
    <FeaturePage
      title="Voice Mode"
      subtitle="Hands-free cooking instructions"
      intro="Make the kitchen feel easier with spoken recipe steps. This page uses the browser’s speech engine so users can cook without looking at the screen every second."
      badge="Hands-free"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Open generator</Link>}
      highlights={[
        { icon: '🔊', title: 'Read aloud', text: 'Speak each step in sequence.' },
        { icon: '👐', title: 'Hands free', text: 'Great for messy kitchen moments.' },
        { icon: '📣', title: 'Accessible', text: 'Helpful for multitasking and visibility.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn-primary" onClick={playVoice} disabled={!voiceSupported}>
            {speaking ? 'Speaking…' : 'Play voice steps'}
          </button>
          <button type="button" className="btn-primary" onClick={stopVoice} style={{ background: 'linear-gradient(135deg,#f59e0b,#c2410c)' }}>
            Stop
          </button>
        </div>
        <p className="small-muted" style={{ marginTop: '1rem' }}>{status}</p>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Example voice steps</h2>
        <ol style={{ display: 'grid', gap: '.75rem', margin: 0, paddingLeft: '1.2rem' }}>
          {STEPS.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>
    </FeaturePage>
  )
}
