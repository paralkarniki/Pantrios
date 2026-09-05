import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'

const SAMPLE_INGREDIENTS = {
  default: ['onion', 'garlic', 'tomato', 'spinach'],
  veg: ['spinach', 'broccoli', 'carrot', 'bell pepper', 'mushroom'],
  fruit: ['banana', 'berries', 'apple', 'citrus', 'yogurt'],
  spice: ['cumin', 'paprika', 'turmeric', 'coriander', 'chili flakes'],
  breakfast: ['egg', 'milk', 'oats', 'bread', 'banana'],
}

function detectIngredients(fileName = '') {
  const name = String(fileName).toLowerCase()
  if (/(breakfast|fridge|eggs?)/.test(name)) return SAMPLE_INGREDIENTS.breakfast
  if (/(fruit|smoothie|juice)/.test(name)) return SAMPLE_INGREDIENTS.fruit
  if (/(spice|seasoning|masala)/.test(name)) return SAMPLE_INGREDIENTS.spice
  if (/(veg|veggie|produce|greens)/.test(name)) return SAMPLE_INGREDIENTS.veg
  return SAMPLE_INGREDIENTS.default
}

export default function PantryScannerPage() {
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState('')
  const [detected, setDetected] = useState([])
  const [status, setStatus] = useState('Upload a pantry photo to detect ingredients.')
  const [objectUrl, setObjectUrl] = useState('')

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  function onPickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    const nextUrl = URL.createObjectURL(file)
    setObjectUrl(nextUrl)
    setPreview(nextUrl)
    setFileName(file.name)
    setDetected([])
    setStatus('Photo loaded. Tap detect ingredients.')
  }

  function runDetection() {
    const next = detectIngredients(fileName)
    setDetected(next)
    setStatus(`Detected ${next.length} ingredients from the photo preview.`)
  }

  const ingredientCount = useMemo(() => detected.length, [detected])

  return (
    <FeaturePage
      title="Pantry Scanner"
      subtitle="Upload a pantry photo and extract ingredients"
      intro="Turn a quick pantry snapshot into a starter ingredient list. The scanner keeps the experience visual, fast, and mobile-friendly, so users can move from photo to recipe in a few taps."
      badge="Camera mode"
      actions={
        <Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>
          Open generator
        </Link>
      }
      highlights={[
        { icon: '📷', title: 'Photo upload', text: 'Preview a pantry image before detection.' },
        { icon: '🫙', title: 'Ingredient hints', text: 'Suggest likely ingredients from the image label.' },
        { icon: '✨', title: 'Fast start', text: 'Send detected items into recipe generation.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1rem', alignItems: 'start' }}>
          <div>
            <label className="small-muted" style={{ display: 'block', marginBottom: '.45rem', fontWeight: 700 }}>Upload pantry photo</label>
            <input type="file" accept="image/*" className="form-control" onChange={onPickFile} />

            <div style={{ marginTop: '1rem' }}>
              <button type="button" className="btn-primary" onClick={runDetection} disabled={!fileName}>
                Detect ingredients
              </button>
            </div>

            <p className="small-muted" style={{ marginTop: '1rem' }}>{status}</p>
            <p className="small-muted" style={{ marginTop: '.25rem' }}>{ingredientCount ? `${ingredientCount} suggested items ready.` : 'No ingredients detected yet.'}</p>
          </div>

          <div className="card" style={{ margin: 0, padding: '1rem', background: 'rgba(255,255,255,0.96)' }}>
            <div style={{ fontWeight: 800, marginBottom: '.5rem' }}>Preview</div>
            {preview ? (
              <img src={preview} alt="Pantry preview" style={{ width: '100%', borderRadius: 16, objectFit: 'cover', maxHeight: 260 }} />
            ) : (
              <div style={{ minHeight: 240, display: 'grid', placeItems: 'center', borderRadius: 16, background: 'linear-gradient(135deg, #fff7ed, #fff)', border: '1px dashed rgba(217,119,6,0.20)' }}>
                <div className="small-muted">Photo preview appears here.</div>
              </div>
            )}
            <div className="small-muted" style={{ marginTop: '.75rem' }}>{fileName || 'No file selected.'}</div>
          </div>
        </div>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Detected ingredients</h2>
          <span className="badge">{detected.length ? 'Ready for recipe generation' : 'Awaiting scan'}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginTop: '1rem' }}>
          {detected.length ? detected.map((item) => (
            <span key={item} className="chip">{item}</span>
          )) : <p className="small-muted" style={{ margin: 0 }}>Upload a pantry image, then tap detect to generate a starter ingredient list.</p>}
        </div>
      </section>
    </FeaturePage>
  )
}
