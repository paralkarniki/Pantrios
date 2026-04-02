import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { estimateRecipeCalories, mealTypeFromRecipe } from '../lib/calorieEstimator'

function dedupeByTitle(items = []) {
  const out = []
  const seen = new Set()
  for (const r of items) {
    const key = (r?.title || '').trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

export default function CaloriesPage() {
  const [rows, setRows] = useState([])
  const [mealFilter, setMealFilter] = useState('All')

  useEffect(() => {
    try {
      const favorites = JSON.parse(localStorage.getItem('pantrio:favorites') || '[]')
      const recent = JSON.parse(localStorage.getItem('pantrio:recent') || '[]')
      const merged = dedupeByTitle([...(recent || []), ...(favorites || [])])

      const normalized = merged.map((recipe) => ({
        recipe,
        calories: estimateRecipeCalories(recipe),
        mealType: mealTypeFromRecipe(recipe),
        cuisine: recipe?.cuisine || 'General',
      }))

      setRows(normalized)
    } catch (e) {
      setRows([])
    }
  }, [])

  const visibleRows = useMemo(() => {
    if (mealFilter === 'All') return rows
    return rows.filter((r) => r.mealType === mealFilter)
  }, [rows, mealFilter])

  const totalCalories = useMemo(() => visibleRows.reduce((sum, r) => sum + r.calories, 0), [visibleRows])
  const avgCalories = visibleRows.length ? Math.round(totalCalories / visibleRows.length) : 0

  return (
    <div className="min-h-screen py-10">
      <div className="app-container">
        <div className="card">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Meal Calories</h1>
              <p className="small-muted mt-1">Estimated calories for your generated and saved meals.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-primary">Home</Link>
              <Link href="/generate" className="btn-primary">Back to Generator</Link>
              <Link href="/daily-calories" className="btn-primary">Daily Plan</Link>
            </div>
          </div>

          <div className="mt-4 card" style={{ padding: '.7rem .85rem' }}>
            <img
              src="/img/aisoup.svg"
              alt="Calorie insights visual"
              style={{ width: '100%', height: 140, objectFit: 'contain', background: 'rgba(255,255,255,0.72)', borderRadius: 10, padding: '.35rem' }}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="card" style={{ padding: '.8rem 1rem' }}>
              <div className="small-muted">Meals Count</div>
              <div className="text-2xl font-bold mt-1">{visibleRows.length}</div>
            </div>
            <div className="card" style={{ padding: '.8rem 1rem' }}>
              <div className="small-muted">Total Calories</div>
              <div className="text-2xl font-bold mt-1">{totalCalories} kcal</div>
            </div>
            <div className="card" style={{ padding: '.8rem 1rem' }}>
              <div className="small-muted">Average per Meal</div>
              <div className="text-2xl font-bold mt-1">{avgCalories} kcal</div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMealFilter(t)}
                style={{
                  border: '1px solid rgba(217,119,6,0.18)',
                  borderRadius: 999,
                  padding: '.22rem .7rem',
                  background: mealFilter === t ? 'rgba(217,119,6,0.18)' : 'white',
                  color: '#92400e',
                  fontSize: '.82rem',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {visibleRows.length === 0 ? (
            <div className="mt-6 card" style={{ padding: '1rem' }}>
              <p className="small-muted" style={{ margin: 0 }}>No meals available yet. Generate recipes on the home page first.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleRows.map(({ recipe, calories, mealType, cuisine }, idx) => (
                <div key={`${recipe?.title}-${idx}`} className="card" style={{ padding: '.95rem 1rem' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-lg" style={{ lineHeight: 1.25 }}>{recipe?.title || 'Untitled meal'}</div>
                      <div className="small-muted mt-1">{cuisine} • {mealType}</div>
                    </div>
                    <span className="badge" style={{ fontWeight: 700 }}>{calories} kcal</span>
                  </div>
                  <div className="small-muted mt-3">Ingredients: {(recipe?.ingredients || []).slice(0, 4).join(', ')}{(recipe?.ingredients || []).length > 4 ? ' ...' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
