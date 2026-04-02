import Link from 'next/link'
import { useMemo, useState } from 'react'
import { buildLocalRecipe } from '../lib/localRecipeGenerator'
import theme from '../lib/theme'

const SLOT_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2']
const SLOT_SPLITS = {
  2: [0.45, 0.55],
  3: [0.3, 0.35, 0.35],
  4: [0.25, 0.3, 0.3, 0.15],
  5: [0.2, 0.25, 0.25, 0.15, 0.15],
}

const SLOT_INGREDIENT_HINTS = {
  Breakfast: ['oats', 'egg', 'banana'],
  Lunch: ['rice', 'beans', 'spinach'],
  Dinner: ['paneer', 'chicken', 'broccoli'],
  'Snack 1': ['yogurt', 'nuts', 'apple'],
  'Snack 2': ['toast', 'peanut butter', 'fruit'],
}

function normalizeIngredients(text = '') {
  return text
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function calorieBuckets(total, mealCount) {
  const count = Math.max(2, Math.min(5, Number(mealCount) || 3))
  const split = SLOT_SPLITS[count] || SLOT_SPLITS[3]
  const slots = SLOT_NAMES.slice(0, count)

  return slots.map((slot, idx) => ({
    slot,
    targetCalories: Math.max(120, Math.round(total * split[idx])),
  }))
}

export default function DailyCaloriesPage() {
  const [dailyTarget, setDailyTarget] = useState('2200')
  const [mealCount, setMealCount] = useState('3')
  const [dietary, setDietary] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [maxTime, setMaxTime] = useState('25')
  const [ingredientsText, setIngredientsText] = useState('egg, rice, tomato, spinach')
  const [plan, setPlan] = useState([])

  const totalTarget = Math.max(800, Math.min(5000, Number(dailyTarget) || 2200))

  const summary = useMemo(() => {
    if (!plan.length) return { totalEstimated: 0, delta: 0 }
    const totalEstimated = plan.reduce((sum, p) => sum + (p.estimatedCalories || 0), 0)
    return {
      totalEstimated,
      delta: totalEstimated - totalTarget,
    }
  }, [plan, totalTarget])

  function generatePlan() {
    const baseIngredients = normalizeIngredients(ingredientsText)
    const buckets = calorieBuckets(totalTarget, mealCount)

    const next = buckets.map((bucket, idx) => {
      const hints = SLOT_INGREDIENT_HINTS[bucket.slot] || []
      const additions = hints.slice(0, 2)
      const ingredients = Array.from(new Set([...baseIngredients, ...additions]))

      const recipe = buildLocalRecipe({
        ingredients,
        dietary,
        cuisine,
        maxTime: Number(maxTime) || undefined,
        targetCalories: bucket.targetCalories,
      })

      return {
        ...recipe,
        slot: bucket.slot,
        slotTarget: bucket.targetCalories,
        key: `${bucket.slot}-${idx}`,
      }
    })

    setPlan(next)
    try {
      localStorage.setItem('pantrio:daily-calorie-plan', JSON.stringify({
        createdAt: new Date().toISOString(),
        dailyTarget: totalTarget,
        mealCount: Number(mealCount),
        dietary,
        cuisine,
        maxTime: Number(maxTime) || undefined,
        ingredientsText,
        plan: next,
      }))
    } catch (e) {}
  }

  function loadLastPlan() {
    try {
      const saved = JSON.parse(localStorage.getItem('pantrio:daily-calorie-plan') || '{}')
      if (!saved || !Array.isArray(saved.plan)) return
      setDailyTarget(String(saved.dailyTarget || 2200))
      setMealCount(String(saved.mealCount || 3))
      setDietary(saved.dietary || '')
      setCuisine(saved.cuisine || '')
      setMaxTime(String(saved.maxTime || 25))
      setIngredientsText(saved.ingredientsText || '')
      setPlan(saved.plan)
    } catch (e) {}
  }

  return (
    <div className="min-h-screen py-10">
      <div className="app-container">
        <div className="card">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Daily Calorie Meal Planner</h1>
              <p className="small-muted mt-1">Set your daily calorie goal and auto-generate meals to match it.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-primary">Home</Link>
              <Link href="/generate" className="btn-primary">Generator</Link>
            </div>
          </div>

          <div className="mt-4 card" style={{ padding: '.7rem .85rem' }}>
            <img
              src="/img/chef.svg"
              alt="Daily calorie planning"
              style={{ width: '100%', height: 135, objectFit: 'contain', background: 'rgba(255,255,255,0.72)', borderRadius: 10, padding: '.35rem' }}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              className="form-control"
              placeholder="Daily target kcal"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value.replace(/[^\d]/g, ''))}
            />
            <select className="form-control" value={mealCount} onChange={(e) => setMealCount(e.target.value)}>
              <option value="2">2 meals</option>
              <option value="3">3 meals</option>
              <option value="4">4 meals</option>
              <option value="5">5 meals</option>
            </select>
            <input
              className="form-control"
              placeholder="Max mins per meal"
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value.replace(/[^\d]/g, ''))}
            />
            <select className="form-control" value={dietary} onChange={(e) => setDietary(e.target.value)}>
              {theme.dietaryOptions.map((opt) => (
                <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              className="form-control"
              list="daily-cuisine-types"
              placeholder="Cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
            />
            <datalist id="daily-cuisine-types">
              {theme.cuisineOptions.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className="mt-3">
            <input
              className="form-control"
              style={{ width: '100%' }}
              placeholder="Base ingredients (comma separated)"
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
            />
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button className="btn-primary" onClick={generatePlan}>Generate Daily Plan</button>
            <button
              type="button"
              onClick={loadLastPlan}
              style={{
                border: '1px solid rgba(59,130,246,0.32)',
                background: 'rgba(59,130,246,0.08)',
                color: '#1d4ed8',
                borderRadius: 10,
                padding: '.55rem .9rem',
              }}
            >
              Load Last Plan
            </button>
          </div>

          {!!plan.length && (
            <>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="card" style={{ padding: '.8rem 1rem' }}>
                  <div className="small-muted">Daily Target</div>
                  <div className="text-2xl font-bold mt-1">{totalTarget} kcal</div>
                </div>
                <div className="card" style={{ padding: '.8rem 1rem' }}>
                  <div className="small-muted">Planned Total</div>
                  <div className="text-2xl font-bold mt-1">{summary.totalEstimated} kcal</div>
                </div>
                <div className="card" style={{ padding: '.8rem 1rem' }}>
                  <div className="small-muted">Difference</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: summary.delta > 0 ? '#b91c1c' : '#166534' }}>
                    {summary.delta > 0 ? '+' : ''}{summary.delta} kcal
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.map((meal) => (
                  <div key={meal.key} className="card" style={{ padding: '.95rem 1rem' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="small-muted">{meal.slot}</div>
                        <div className="text-lg font-semibold">{meal.title}</div>
                        <div className="small-muted mt-1">{meal.cuisine} • {meal.time || maxTime || 25} min</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="badge">🎯 {meal.slotTarget} kcal</div>
                        <div className="small-muted mt-1">Est. {meal.estimatedCalories || 0} kcal</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(meal.ingredients || []).slice(0, 4).map((ing) => (
                        <span key={`${meal.key}-${ing}`} className="chip">{ing}</span>
                      ))}
                    </div>

                    <ol className="mt-3" style={{ marginBottom: 0, paddingLeft: '1rem', color: '#44403c', fontSize: '.88rem' }}>
                      {(meal.steps || []).slice(0, 2).map((step, idx) => (
                        <li key={`${meal.key}-step-${idx}`}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
