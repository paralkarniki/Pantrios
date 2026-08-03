import theme from '../lib/theme'
import { useEffect, useState } from 'react'
import ClockIcon from './icons/Clock'
import LeafIcon from './icons/Leaf'

function pickFoodEmoji(recipe = {}) {
  const words = [
    recipe.title || '',
    ...(recipe.ingredients || []),
    recipe.cuisine || '',
  ].join(' ').toLowerCase()

  if (/(rice|bowl|grain)/.test(words)) return '🍚'
  if (/(pasta|noodle|spaghetti)/.test(words)) return '🍝'
  if (/(salad|leaf|spinach|lettuce)/.test(words)) return '🥗'
  if (/(soup|broth)/.test(words)) return '🍲'
  if (/(egg|omelet)/.test(words)) return '🍳'
  if (/(curry|masala)/.test(words)) return '🍛'
  if (/(taco|mexican)/.test(words)) return '🌮'
  if (/(bread|toast|sandwich)/.test(words)) return '🥪'
  return '🍽️'
}

function cuisineColors(cuisine = '') {
  const c = cuisine.toLowerCase()
  if (c.includes('indian')) return { a: '#f59e0b', b: '#dc2626' }
  if (c.includes('italian')) return { a: '#16a34a', b: '#dc2626' }
  if (c.includes('mexican')) return { a: '#16a34a', b: '#ea580c' }
  if (c.includes('asian')) return { a: '#0891b2', b: '#7c3aed' }
  return { a: '#d97706', b: '#c2410c' }
}

function buildRecipeImage(recipe = {}) {
  const title = (recipe.title || 'Custom Recipe').slice(0, 34)
  const subtitle = `${recipe.cuisine || 'Homestyle'}${recipe.time ? ` • ${recipe.time} min` : ''}`.slice(0, 38)
  const emoji = pickFoodEmoji(recipe)
  const { a, b } = cuisineColors(recipe.cuisine)

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="100%" stop-color="${b}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="675" fill="url(#g)"/>
  <circle cx="1080" cy="90" r="170" fill="rgba(255,255,255,0.14)"/>
  <circle cx="140" cy="610" r="230" fill="rgba(255,255,255,0.10)"/>

  <text x="80" y="180" font-size="64" font-family="Inter, Segoe UI, Arial" fill="rgba(255,255,255,0.96)" font-weight="700">${title}</text>
  <text x="80" y="240" font-size="34" font-family="Inter, Segoe UI, Arial" fill="rgba(255,255,255,0.9)">${subtitle}</text>

  <rect x="80" y="300" width="560" height="230" rx="22" fill="rgba(255,255,255,0.2)"/>
  <text x="110" y="360" font-size="34" font-family="Inter, Segoe UI, Arial" fill="white">Generated Recipe</text>
  <text x="110" y="420" font-size="28" font-family="Inter, Segoe UI, Arial" fill="rgba(255,255,255,0.95)">Ingredients + Steps ready</text>

  <text x="955" y="470" text-anchor="middle" font-size="190">${emoji}</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export default function RecipeCard({ recipe = {}, onSave, isFull = false, onUnsave, onPin, onUnpin, isPinned = false, isSaved = false }) {
  const [copied, setCopied] = useState(false)
  const [cookMode, setCookMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [cardTransform, setCardTransform] = useState('perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)')
  const [showIngredients, setShowIngredients] = useState(true)
  const [showInstructions, setShowInstructions] = useState(true)
  const [imageZoom, setImageZoom] = useState(false)
  const [doneSteps, setDoneSteps] = useState({})
  const [imageSrc, setImageSrc] = useState(null)

  useEffect(() => {
    setCookMode(false)
    setCurrentStep(0)
    setShowIngredients(true)
    setShowInstructions(true)
    setImageZoom(false)
    setDoneSteps({})
  }, [recipe?.title])

  useEffect(() => {
    // Build the recipe image on the client only to avoid SSR/CSR emoji mismatches
    try {
      const customImage = recipe?.image || recipe?.imageUrl || recipe?.photo || ''
      setImageSrc(customImage || buildRecipeImage(recipe))
    } catch (e) {
      setImageSrc(null)
    }
  }, [recipe])

  function handleCardMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setCardTransform(`perspective(900px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-2px)`)
  }

  function handleCardMouseLeave() {
    setCardTransform('perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)')
  }

  function toggleDoneStep(index) {
    setDoneSteps((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  function handleCopy() {
    navigator.clipboard?.writeText(`${recipe.title}\n\nIngredients:\n${(recipe.ingredients||[]).join('\n')}\n\nSteps:\n${(recipe.steps||[]).join('\n')}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  function handleShareLink() {
    try {
      const payload = {
        title: recipe.title,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        cuisine: recipe.cuisine || '',
        dietary: recipe.dietary || '',
        time: recipe.time || undefined,
      }
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      const url = `${window.location.origin}/generate?r=${encodeURIComponent(encoded)}`
      navigator.clipboard?.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (e) {}
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="recipe-card fade-in-up" style={{
      background:'rgba(255,255,255,0.90)',
      border:'1px solid rgba(255,255,255,0.75)',
      borderRadius:20,
      boxShadow:'0 6px 32px rgba(15,23,42,0.10)',
      overflow:'hidden',
      marginTop:4,
      transform: cardTransform,
      transition:'transform .16s ease, box-shadow .2s ease'
    }} onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
      {/* Gradient top strip */}
      <div style={{
        height:5,
        background:'linear-gradient(90deg, #f59e0b, #d97706, #c2410c)'
      }} />

      {/* Header */}
      <div style={{padding:'1.2rem 1.4rem .9rem', borderBottom:'1px solid rgba(217,119,6,0.10)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap'}}>
          <div>
            <h3 style={{margin:0, fontSize:'1.35rem', fontWeight:800, color:'#1c1917'}}>{recipe.title}</h3>
            {recipe.cuisine && (
              <span className="hero-badge" style={{marginTop:'.4rem', display:'inline-flex'}}>
                🌍 {recipe.cuisine}
              </span>
            )}
          </div>
          <div className="card-actions" style={{display:'flex', gap:'.5rem', flexShrink:0}}>
            {!!(recipe.steps || []).length && (
              <button
                onClick={() => setCookMode((v) => !v)}
                style={{
                  padding:'.45rem .9rem', borderRadius:50, fontSize:'.85rem', fontWeight:600,
                  border:'1.5px solid rgba(217,119,6,0.25)',
                  background: cookMode ? '#fed7aa' : 'rgba(255,251,235,0.9)',
                  color:'#92400e', cursor:'pointer'
                }}
              >
                {cookMode ? 'Exit cook mode' : 'Cook mode'}
              </button>
            )}
            <button
              onClick={handleShareLink}
              style={{
                padding:'.45rem .9rem', borderRadius:50, fontSize:'.85rem', fontWeight:600,
                border:'1.5px solid rgba(217,119,6,0.25)',
                background:'rgba(255,251,235,0.9)',
                color:'#92400e', cursor:'pointer'
              }}
            >
              🔗 Share
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding:'.45rem .9rem', borderRadius:50, fontSize:'.85rem', fontWeight:600,
                border:'1.5px solid rgba(217,119,6,0.25)',
                background:'rgba(255,251,235,0.9)',
                color:'#92400e', cursor:'pointer'
              }}
            >
              🖨 Print
            </button>
            <button
              onClick={handleCopy}
              style={{
                padding:'.45rem .9rem', borderRadius:50, fontSize:'.85rem', fontWeight:600,
                border:'1.5px solid rgba(217,119,6,0.25)',
                background: copied ? '#fde68a' : 'rgba(255,251,235,0.9)',
                color:'#92400e', cursor:'pointer',
                transition:'background .15s, transform .12s',
              }}
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={onSave}
              disabled={isFull}
              title={isFull ? 'Favorites full — delete one to save more' : 'Save to favorites'}
              style={{
                padding:'.45rem .9rem', borderRadius:50, fontSize:'.85rem', fontWeight:600,
                background: isFull ? 'rgba(0,0,0,0.07)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                color: isFull ? '#a8a29e' : '#fff',
                border: isFull ? '1px solid rgba(0,0,0,0.10)' : 'none',
                cursor: isFull ? 'not-allowed' : 'pointer',
                boxShadow: isFull ? 'none' : '0 2px 10px rgba(245,158,11,0.35)',
                transition:'transform .12s, box-shadow .12s',
              }}
            >
              {isFull ? '⭐ Full' : '⭐ Save'}
            </button>
            {isSaved && (
              <>
                <button
                  onClick={onPin}
                  title={isPinned ? 'Unpin from favorites' : 'Pin to favorites'}
                  style={{
                    padding:'.45rem .9rem', borderRadius:50, fontSize:'.85rem', fontWeight:600,
                    background: isPinned ? 'linear-gradient(135deg,#ec4899,#db2777)' : 'rgba(255,251,235,0.9)',
                    color: isPinned ? '#fff' : '#92400e',
                    border: isPinned ? 'none' : '1.5px solid rgba(236,72,153,0.25)',
                    cursor:'pointer',
                    boxShadow: isPinned ? '0 2px 10px rgba(236,72,153,0.25)' : 'none',
                    transition:'transform .12s, box-shadow .12s',
                  }}
                >
                  {isPinned ? '📌 Pinned' : '📌 Pin'}
                </button>
                <button
                  onClick={onUnsave}
                  title='Remove from favorites'
                  style={{
                    padding:'.45rem .9rem', borderRadius:50, fontSize:'.85rem', fontWeight:600,
                    background:'rgba(255,251,235,0.9)',
                    color:'#92400e',
                    border:'1.5px solid rgba(217,119,6,0.25)',
                    cursor:'pointer',
                    transition:'transform .12s, box-shadow .12s',
                  }}
                >
                  🗑️ Unsave
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{display:'flex', gap:'.5rem', marginTop:'.7rem', flexWrap:'wrap'}}>
          {recipe.time && <span className="badge"><ClockIcon className="icon" /> {recipe.time} min</span>}
          {recipe.dietary && <span className="badge"><LeafIcon className="icon" /> {recipe.dietary}</span>}
          {recipe.estimatedCalories && <span className="badge">🔥 {recipe.estimatedCalories} kcal</span>}
          {recipe.targetCalories && <span className="badge">🎯 Target {recipe.targetCalories} kcal</span>}
          <span className="badge">✅ {Object.values(doneSteps).filter(Boolean).length}/{(recipe.steps || []).length || 0} steps</span>
        </div>
      </div>

        <div style={{padding:'1rem 1.4rem 0'}}>
          <img
            src={imageSrc || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>'}
            alt={`Generated image for ${recipe.title || 'recipe'}`}
            onClick={() => setImageZoom((v) => !v)}
            title={imageZoom ? 'Click to zoom out' : 'Click to zoom in'}
            style={{
              width:'100%',
              aspectRatio:'16 / 9',
              objectFit:'cover',
              // borderRadius controlled via CSS for smoother layering
              borderRadius:14,
              border:'1px solid rgba(217,119,6,0.16)',
              boxShadow:'0 4px 16px rgba(15,23,42,0.08)',
              cursor:'zoom-in',
              transform:imageZoom ? 'scale(1.03)' : 'scale(1)',
              transition:'transform .2s ease'
            }}
            className="hero-card"
          />
          <div className="small-muted" style={{fontSize:'.75rem', marginTop:'.35rem'}}>Click image to zoom</div>
        </div>

      {cookMode && (recipe.steps || []).length > 0 && (
        <div style={{padding:'1rem 1.4rem', borderBottom:'1px solid rgba(217,119,6,0.10)', background:'rgba(255,251,235,0.5)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.8rem', marginBottom:'.55rem'}}>
            <div style={{fontWeight:700, color:'#92400e', fontSize:'.9rem'}}>Step {currentStep + 1} of {recipe.steps.length}</div>
            <div className="small-muted" style={{fontSize:'.8rem'}}>{Math.round(((currentStep + 1) / recipe.steps.length) * 100)}% complete</div>
          </div>

          <div style={{height:8, borderRadius:999, background:'rgba(217,119,6,0.14)', overflow:'hidden', marginBottom:'.7rem'}}>
            <div style={{height:'100%', width:`${((currentStep + 1) / recipe.steps.length) * 100}%`, background:'linear-gradient(90deg,#f59e0b,#d97706)'}} />
          </div>

          <div style={{fontSize:'.92rem', color:'#1f2937', lineHeight:1.6, marginBottom:'.75rem'}}>{recipe.steps[currentStep]}</div>

          <div style={{display:'flex', gap:'.5rem'}}>
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              style={{
                padding:'.38rem .75rem', borderRadius:8, border:'1px solid rgba(0,0,0,0.12)',
                background: currentStep === 0 ? 'rgba(0,0,0,0.06)' : 'white',
                color: currentStep === 0 ? '#a3a3a3' : '#374151',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep((s) => Math.min((recipe.steps.length - 1), s + 1))}
              disabled={currentStep >= recipe.steps.length - 1}
              style={{
                padding:'.38rem .75rem', borderRadius:8, border:'1px solid rgba(217,119,6,0.28)',
                background: currentStep >= recipe.steps.length - 1 ? 'rgba(0,0,0,0.06)' : 'rgba(217,119,6,0.1)',
                color: currentStep >= recipe.steps.length - 1 ? '#a3a3a3' : '#92400e',
                cursor: currentStep >= recipe.steps.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.2rem', padding:'1.2rem 1.4rem'}}>
        <div>
          <button
            type="button"
            onClick={() => setShowIngredients((v) => !v)}
            style={{fontWeight:700, fontSize:'.9rem', color:'#d97706', marginBottom:'.6rem', display:'flex', alignItems:'center', gap:'.4rem', background:'none', border:'none', padding:0, cursor:'pointer'}}
          >
            {showIngredients ? '▾' : '▸'} 🥗 Ingredients
          </button>
          {showIngredients && (
            <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:'.4rem'}}>
              {(recipe.ingredients || []).map((ing, i) => (
                <li key={i} style={{
                  display:'flex', alignItems:'flex-start', gap:'.5rem',
                  fontSize:'.875rem', color:'#44403c', lineHeight:1.45
                }}>
                  <span style={{color:'#d97706', flexShrink:0, marginTop:1}}>▸</span>
                  {ing}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.6rem', gap:'.5rem'}}>
            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              style={{fontWeight:700, fontSize:'.9rem', color:'#d97706', display:'flex', alignItems:'center', gap:'.4rem', background:'none', border:'none', padding:0, cursor:'pointer'}}
            >
              {showInstructions ? '▾' : '▸'} 👨‍🍳 Instructions
            </button>
            <button
              type="button"
              onClick={() => setDoneSteps({})}
              style={{border:'1px solid rgba(217,119,6,0.2)', background:'rgba(255,251,235,0.8)', borderRadius:8, padding:'.2rem .5rem', fontSize:'.72rem', color:'#92400e', cursor:'pointer'}}
            >
              Reset checks
            </button>
          </div>

          {showInstructions && (
            <ol style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:'.55rem'}}>
              {(recipe.steps || []).map((s, i) => (
                <li
                  key={i}
                  onClick={() => toggleDoneStep(i)}
                  style={{display:'flex', alignItems:'flex-start', gap:'.6rem', fontSize:'.875rem', color:'#44403c', lineHeight:1.5, cursor:'pointer', opacity: doneSteps[i] ? 0.65 : 1}}
                  title={doneSteps[i] ? 'Marked done — click to uncheck' : 'Click to mark done'}
                >
                  <span style={{
                    flexShrink:0, width:20, height:20, borderRadius:'50%',
                    background: doneSteps[i] ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#fde68a,#fbbf24)',
                    color: doneSteps[i] ? '#fff' : '#92400e', fontWeight:700, fontSize:'.72rem',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    marginTop:1
                  }}>{doneSteps[i] ? '✓' : (i + 1)}</span>
                  <span style={{textDecoration: doneSteps[i] ? 'line-through' : 'none'}}>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
