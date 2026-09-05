import { useMemo, useState } from 'react'
import Link from 'next/link'
import FeaturePage from '../components/FeaturePage'

const SUBSTITUTIONS = {
  milk: ['oat milk', 'soy milk', 'almond milk'],
  butter: ['olive oil', 'vegan butter', 'ghee'],
  egg: ['flax egg', 'chia egg', 'mashed banana'],
  flour: ['oat flour', 'almond flour', 'gluten-free blend'],
  cream: ['coconut cream', 'cashew cream', 'Greek yogurt'],
  cheese: ['nutritional yeast', 'vegan cheese', 'ricotta'],
  sugar: ['honey', 'maple syrup', 'date paste'],
  rice: ['quinoa', 'cauliflower rice', 'couscous'],
  pasta: ['zucchini noodles', 'whole wheat pasta', 'lentil pasta'],
}

const ALLERGENS = ['dairy', 'egg', 'gluten', 'nuts', 'soy']

function buildSuggestions(ingredient, allergens) {
  const key = String(ingredient || '').trim().toLowerCase()
  const base = SUBSTITUTIONS[key] || ['seasonal vegetables', 'beans', 'yogurt', 'tofu']
  const filtered = base.filter((item) => {
    const lower = item.toLowerCase()
    if (allergens.includes('dairy') && /milk|cheese|cream|yogurt|butter/.test(lower)) return false
    if (allergens.includes('egg') && /egg/.test(lower)) return false
    if (allergens.includes('gluten') && /flour|pasta|bread|couscous/.test(lower)) return false
    if (allergens.includes('nuts') && /almond|cashew|nut/.test(lower)) return false
    if (allergens.includes('soy') && /soy/.test(lower)) return false
    return true
  })
  return filtered.length ? filtered : ['olive oil', 'fresh herbs', 'salsa']
}

export default function SmartSubstitutionsPage() {
  const [ingredient, setIngredient] = useState('milk')
  const [selected, setSelected] = useState([])

  const suggestions = useMemo(() => buildSuggestions(ingredient, selected), [ingredient, selected])

  function toggleAllergen(name) {
    setSelected((prev) => prev.includes(name) ? prev.filter((x) => x !== name) : [name, ...prev])
  }

  return (
    <FeaturePage
      title="Smart Substitutions"
      subtitle="Suggests better swaps for missing ingredients and allergens"
      intro="Let users enter an ingredient and instantly see practical alternatives based on allergies, pantry constraints, or simple convenience."
      badge="Allergy-safe"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Try recipes</Link>}
      highlights={[
        { icon: '🥛', title: 'Ingredient aware', text: 'Suggests swaps by item type.' },
        { icon: '🧠', title: 'Allergy filters', text: 'Hide substitutions that conflict with dietary needs.' },
        { icon: '🔄', title: 'Fast fallback', text: 'Always returns usable kitchen alternatives.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: '1rem' }}>
          <div>
            <label className="small-muted" style={{ display: 'block', marginBottom: '.45rem', fontWeight: 700 }}>Ingredient to replace</label>
            <input className="form-control" value={ingredient} onChange={(e) => setIngredient(e.target.value)} placeholder="e.g. milk" />
          </div>
          <div>
            <div className="small-muted" style={{ marginBottom: '.45rem', fontWeight: 700 }}>Allergy filters</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {ALLERGENS.map((item) => (
                <button key={item} type="button" className="chip" onClick={() => toggleAllergen(item)} style={{ cursor: 'pointer', opacity: selected.includes(item) ? 1 : 0.8 }}>
                  {selected.includes(item) ? '✓ ' : ''}{item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Suggested swaps</h2>
          <span className="badge">{ingredient || 'ingredient'} · {selected.length ? `${selected.length} filters` : 'no filters'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: '1rem' }}>
          {suggestions.map((item) => (
            <div key={item} className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#c2410c' }}>↔</div>
              <div>
                <div style={{ fontWeight: 800 }}>{item}</div>
                <div className="small-muted" style={{ marginTop: 4 }}>Works as a practical substitute.</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </FeaturePage>
  )
}
