import { useState } from 'react'
import theme from '../lib/theme'

export default function IngredientInput({ value = [], onChange, placeholder = theme.placeholders.ingredients }) {
  const [text, setText] = useState('')

  function add() {
    const t = text.trim()
    if (!t) return
    const parts = t.split(',').map(s => s.trim()).filter(Boolean)
    onChange([...value, ...parts])
    setText('')
  }

  function onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  function remove(idx) {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <label style={{display:'block', fontSize:'.82rem', fontWeight:700, color:'#92400e', marginBottom:'.5rem', letterSpacing:'.04em', textTransform:'uppercase'}}>
        {theme.labels.ingredients}
      </label>
      <div style={{display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
        <input
          className="form-control"
          style={{flex:'1 1 200px', borderRadius:12, minWidth:'150px'}}
          placeholder={placeholder}
          value={text}
          onKeyDown={onKey}
          onChange={e=>setText(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary"
          style={{borderRadius:12, padding:'.55rem 1.1rem', fontSize:'.9rem', flexShrink:0, minWidth:'80px', minHeight:'44px'}}
          onClick={add}
        >
          + Add
        </button>
      </div>
      {value.length > 0 && (
        <div style={{display:'flex', flexWrap:'wrap', gap:'.5rem', marginTop:'.75rem'}}>
          {value.map((v, i) => (
            <span key={i} className="chip">
              {v}
              <button
                aria-label={`Remove ${v}`}
                onClick={()=>remove(i)}
                style={{background:'none', border:'none', cursor:'pointer', color:'#b45309', fontSize:'.85rem', padding:0, lineHeight:1, marginLeft:2}}
              >✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
