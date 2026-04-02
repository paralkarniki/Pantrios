import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import theme from '../lib/theme'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const QUICK_MEALS = ['Power Bowl', 'Stir-Fry Plate', 'One-Pot Meal', 'Wrap + Salad', 'Soup & Toast', 'Rice + Curry']

function normalizeRow(day, row = {}) {
  return {
    day,
    meal: row?.meal || '',
    cuisine: row?.cuisine || '',
    note: row?.note || '',
    done: Boolean(row?.done),
  }
}

export default function PlannerPage() {
  const [plan, setPlan] = useState(() => DAYS.map((d) => normalizeRow(d)))
  const [copiedShopping, setCopiedShopping] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pantrio:meal-plan') || '[]')
      if (Array.isArray(saved) && saved.length === 7) {
        setPlan(saved.map((row, idx) => normalizeRow(DAYS[idx], row)))
      }
    } catch (e) {}
  }, [])

  function update(index, key, value) {
    setPlan((prev) => prev.map((row, i) => i === index ? { ...row, [key]: value } : row))
  }

  function toggleDone(index) {
    setPlan((prev) => prev.map((row, i) => i === index ? { ...row, done: !row.done } : row))
  }

  function copyPreviousDay(index) {
    if (index === 0) return
    setPlan((prev) => prev.map((row, i) => {
      if (i !== index) return row
      const source = prev[index - 1]
      return { ...row, meal: source.meal, cuisine: source.cuisine, note: source.note }
    }))
  }

  function randomizeWeek() {
    setPlan((prev) => prev.map((row, i) => ({
      ...row,
      meal: QUICK_MEALS[i % QUICK_MEALS.length],
      cuisine: theme.cuisineOptions[(i * 3) % theme.cuisineOptions.length],
      note: row.note || 'Use pantry leftovers first',
    })))
  }

  function autofillFromDailyCaloriePlan() {
    try {
      const saved = JSON.parse(localStorage.getItem('pantrio:daily-calorie-plan') || '{}')
      const meals = Array.isArray(saved?.plan) ? saved.plan : []
      if (!meals.length) return

      setPlan((prev) => prev.map((row, i) => {
        const m = meals[i % meals.length]
        return {
          ...row,
          meal: m?.title || row.meal,
          cuisine: m?.cuisine || row.cuisine,
          note: m?.slotTarget ? `Target ${m.slotTarget} kcal` : row.note,
        }
      }))
    } catch (e) {}
  }

  function savePlan() {
    localStorage.setItem('pantrio:meal-plan', JSON.stringify(plan))
  }

  function clearPlan() {
    setPlan(DAYS.map((d) => normalizeRow(d)))
    localStorage.removeItem('pantrio:meal-plan')
  }

  function exportPlan() {
    const payload = {
      app: 'Pantrio',
      type: 'weekly-meal-plan',
      exportedAt: new Date().toISOString(),
      plan,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pantrio-weekly-plan.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const plannedMeals = useMemo(() => plan.filter((row) => row.meal.trim()).length, [plan])
  const doneMeals = useMemo(() => plan.filter((row) => row.done).length, [plan])
  const cuisinesUsed = useMemo(() => new Set(plan.map((row) => row.cuisine).filter(Boolean)).size, [plan])

  const shoppingItems = useMemo(() => {
    const items = []
    plan.forEach((row) => {
      String(row.note || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((x) => items.push(x))
    })
    return Array.from(new Set(items)).slice(0, 18)
  }, [plan])

  function copyShoppingList() {
    if (!shoppingItems.length) return
    navigator.clipboard?.writeText(shoppingItems.join('\n'))
    setCopiedShopping(true)
    setTimeout(() => setCopiedShopping(false), 1200)
  }

  return (
    <div className="min-h-screen py-10">
      <div className="app-container">
        <div className="card">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Weekly Meal Planner</h1>
              <p className="small-muted mt-1">Plan simple meals for the week and keep it saved locally.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-primary">Home</Link>
              <Link href="/generate" className="btn-primary">Back to Generator</Link>
            </div>
          </div>

          <div className="mt-4 card" style={{ padding: '.7rem .85rem' }}>
            <img
              src="/img/diet.svg"
              alt="Diet planner"
              style={{ width: '100%', height: 135, objectFit: 'contain', background: 'rgba(255,255,255,0.72)', borderRadius: 10, padding: '.3rem' }}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="card" style={{ padding: '.75rem .9rem' }}>
              <div className="small-muted">Planned Meals</div>
              <div className="text-2xl font-bold mt-1">{plannedMeals}/7</div>
            </div>
            <div className="card" style={{ padding: '.75rem .9rem' }}>
              <div className="small-muted">Done Meals</div>
              <div className="text-2xl font-bold mt-1">{doneMeals}/7</div>
            </div>
            <div className="card" style={{ padding: '.75rem .9rem' }}>
              <div className="small-muted">Cuisines Used</div>
              <div className="text-2xl font-bold mt-1">{cuisinesUsed}</div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button className="btn-primary" onClick={randomizeWeek}>Quick Fill Week</button>
            <button
              type="button"
              onClick={autofillFromDailyCaloriePlan}
              style={{ border:'1px solid rgba(59,130,246,0.35)', background:'rgba(59,130,246,0.08)', color:'#1d4ed8', borderRadius:10, padding:'.55rem .9rem' }}
            >
              Use Daily Calorie Plan
            </button>
            <button
              type="button"
              onClick={exportPlan}
              style={{ border:'1px solid rgba(16,185,129,0.35)', background:'rgba(16,185,129,0.08)', color:'#047857', borderRadius:10, padding:'.55rem .9rem' }}
            >
              Export Plan
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {plan.map((row, idx) => (
              <div key={row.day} className="card" style={{ padding: '.9rem 1rem' }}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                  <div className="font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                    <button
                      type="button"
                      onClick={() => toggleDone(idx)}
                      title={row.done ? 'Mark not done' : 'Mark done'}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '1px solid rgba(217,119,6,0.25)',
                        background: row.done ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'white',
                        color: row.done ? 'white' : '#92400e',
                        fontSize: '.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {row.done ? '✓' : '○'}
                    </button>
                    <span>{row.day}</span>
                  </div>
                  <input
                    className="form-control"
                    placeholder="Meal name"
                    value={row.meal}
                    onChange={(e) => update(idx, 'meal', e.target.value)}
                  />
                  <select
                    className="form-control"
                    value={row.cuisine}
                    onChange={(e) => update(idx, 'cuisine', e.target.value)}
                  >
                    <option value="">Cuisine type</option>
                    {theme.cuisineOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    className="form-control"
                    placeholder="Note (optional)"
                    value={row.note}
                    onChange={(e) => update(idx, 'note', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => copyPreviousDay(idx)}
                    disabled={idx === 0}
                    style={{ border:'1px solid rgba(217,119,6,0.2)', background: idx === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(255,251,235,0.85)', color: idx === 0 ? '#9ca3af' : '#92400e', borderRadius:10, padding:'.5rem .7rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: '.84rem' }}
                  >
                    Copy prev day
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 card" style={{ padding: '.9rem 1rem' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">Shopping Notes</div>
                <div className="small-muted mt-1">Add comma-separated notes per day to build this list.</div>
              </div>
              <button
                type="button"
                onClick={copyShoppingList}
                disabled={!shoppingItems.length}
                style={{ border:'1px solid rgba(59,130,246,0.35)', background: shoppingItems.length ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.06)', color: shoppingItems.length ? '#1d4ed8' : '#9ca3af', borderRadius:10, padding:'.5rem .8rem', cursor: shoppingItems.length ? 'pointer' : 'not-allowed' }}
              >
                {copiedShopping ? 'Copied!' : 'Copy list'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {shoppingItems.length === 0 ? (
                <span className="small-muted">No shopping notes yet.</span>
              ) : (
                shoppingItems.map((item) => <span key={item} className="chip">{item}</span>)
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button className="btn-primary" onClick={savePlan}>Save Plan</button>
            <button
              onClick={clearPlan}
              style={{ border:'1px solid rgba(239,68,68,0.35)', background:'rgba(239,68,68,0.08)', color:'#dc2626', borderRadius:10, padding:'.55rem .9rem' }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
