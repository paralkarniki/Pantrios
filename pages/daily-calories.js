import { useEffect, useMemo, useState } from 'react'
import { buildLocalRecipe } from '../lib/localRecipeGenerator'
import theme from '../lib/theme'
import PageHeader from '../components/PageHeader'
import { subscribeToAuth } from '../lib/auth'
import { saveUserData, subscribeUserData } from '../lib/userData'
import { readScopedJSON, writeScopedJSON, removeScoped } from '../lib/clientStorage'

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

const TARGET_PRESETS = [1600, 1800, 2000, 2200, 2500]

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
  const [user, setUser] = useState(null)
  const [dailyTarget, setDailyTarget] = useState('2200')
  const [mealCount, setMealCount] = useState('3')
  const [dietary, setDietary] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [maxTime, setMaxTime] = useState('25')
  const [ingredientsText, setIngredientsText] = useState('egg, rice, tomato, spinach')
  const [plan, setPlan] = useState([])
  const [editMode, setEditMode] = useState(false)

  function applySavedPlan(saved) {
    if (!saved || !Array.isArray(saved.plan)) return false
    setDailyTarget(String(saved.dailyTarget || 2200))
    setMealCount(String(saved.mealCount || 3))
    setDietary(saved.dietary || '')
    setCuisine(saved.cuisine || '')
    setMaxTime(String(saved.maxTime || 25))
    setIngredientsText(saved.ingredientsText || '')
    setPlan(saved.plan)
    return true
  }

  function loadLocalPlan() {
    const saved = readScopedJSON('pantrio:daily-calorie-plan', user?.uid, {}, { legacyKey: 'pantrio:daily-calorie-plan' })
    return applySavedPlan(saved)
  }

  useEffect(() => {
    const unsubAuth = subscribeToAuth((u) => setUser(u))
    return () => unsubAuth()
  }, [])

  useEffect(() => {
    loadLocalPlan()
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return

    const unsubUserData = subscribeUserData(user.uid, (data) => {
      if (data?.dailyCaloriePlan && Array.isArray(data.dailyCaloriePlan.plan)) {
        applySavedPlan(data.dailyCaloriePlan)
      }
    })

    return () => {
      if (unsubUserData) unsubUserData()
    }
  }, [user?.uid])

  const totalTarget = Math.max(800, Math.min(5000, Number(dailyTarget) || 2200))
  const bucketPreview = useMemo(() => calorieBuckets(totalTarget, mealCount), [totalTarget, mealCount])

  const summary = useMemo(() => {
    if (!plan.length) return { totalEstimated: 0, delta: 0 }
    const totalEstimated = plan.reduce((sum, p) => sum + (p.estimatedCalories || 0), 0)
    return {
      totalEstimated,
      delta: totalEstimated - totalTarget,
    }
  }, [plan, totalTarget])

  const avgPerMeal = Number(mealCount) > 0 ? Math.round(totalTarget / Number(mealCount)) : 0

  const planProgress = useMemo(() => {
    if (!plan.length || !totalTarget) return 0
    return Math.max(0, Math.min(100, Math.round((summary.totalEstimated / totalTarget) * 100)))
  }, [plan.length, summary.totalEstimated, totalTarget])

  function persistPlan(nextPlan, extra = {}) {
    const payload = {
      createdAt: new Date().toISOString(),
      dailyTarget: totalTarget,
      mealCount: Number(mealCount),
      dietary,
      cuisine,
      maxTime: Number(maxTime) || undefined,
      ingredientsText,
      plan: nextPlan,
      ...extra,
    }

    writeScopedJSON('pantrio:daily-calorie-plan', user?.uid, payload)

    if (user?.uid) {
      saveUserData(user.uid, { dailyCaloriePlan: payload })
    }
  }

  function updateMeal(index, key, value) {
    setPlan((prev) => prev.map((meal, idx) => (idx === index ? { ...meal, [key]: value } : meal)))
  }

  function updateMealIngredients(index, value) {
    const ingredients = value
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    updateMeal(index, 'ingredients', ingredients)
  }

  function updateMealSteps(index, value) {
    const steps = value
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean)
    updateMeal(index, 'steps', steps)
  }

  function saveEditedPlan() {
    persistPlan(plan, { updatedAt: new Date().toISOString() })
    setEditMode(false)
  }

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
    persistPlan(next)
  }

  function loadLastPlan() {
    const saved = readScopedJSON('pantrio:daily-calorie-plan', user?.uid, {}, { legacyKey: 'pantrio:daily-calorie-plan' })
    if (!saved || !Array.isArray(saved.plan)) return
    setDailyTarget(String(saved.dailyTarget || 2200))
    setMealCount(String(saved.mealCount || 3))
    setDietary(saved.dietary || '')
    setCuisine(saved.cuisine || '')
    setMaxTime(String(saved.maxTime || 25))
    setIngredientsText(saved.ingredientsText || '')
    setPlan(saved.plan)
  }

  function resetInputs() {
    setDailyTarget('2200')
    setMealCount('3')
    setDietary('')
    setCuisine('')
    setMaxTime('25')
    setIngredientsText('egg, rice, tomato, spinach')
    setEditMode(false)
  }

  function clearPlan() {
    setPlan([])
    setEditMode(false)
    removeScoped('pantrio:daily-calorie-plan', user?.uid)
    if (user?.uid) {
      saveUserData(user.uid, { dailyCaloriePlan: { plan: [] } })
    }
  }

  return (
    <div className="min-h-screen py-10">
      <div className="app-container">
        <div className="card">
          <PageHeader title="Daily Calorie Meal Planner" subtitle="Set your daily calorie goal and auto-generate meals to match it." />

          <div className="mt-4 card" style={{ padding: '.7rem .85rem' }}>
            <img
              src="/img/chef.svg"
              alt="Daily calorie planning"
              style={{ width: '100%', height: 135, objectFit: 'contain', background: 'rgba(255,255,255,0.72)', borderRadius: 10, padding: '.35rem' }}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <div className="small-muted" style={{ marginBottom: 6 }}>Daily target</div>
              <input
                className="form-control"
                placeholder="Daily target kcal"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div>
              <div className="small-muted" style={{ marginBottom: 6 }}>Meals</div>
              <select className="form-control" value={mealCount} onChange={(e) => setMealCount(e.target.value)}>
                <option value="2">2 meals</option>
                <option value="3">3 meals</option>
                <option value="4">4 meals</option>
                <option value="5">5 meals</option>
              </select>
            </div>
            <div>
              <div className="small-muted" style={{ marginBottom: 6 }}>Max time per meal</div>
              <input
                className="form-control"
                placeholder="Max mins per meal"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div>
              <div className="small-muted" style={{ marginBottom: 6 }}>Dietary filter</div>
              <select className="form-control" value={dietary} onChange={(e) => setDietary(e.target.value)}>
                {theme.dietaryOptions.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="small-muted" style={{ marginBottom: 6 }}>Cuisine</div>
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
            <div>
              <div className="small-muted" style={{ marginBottom: 6 }}>Quick calorie presets</div>
              <div className="flex flex-wrap gap-2">
                {TARGET_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="badge"
                    onClick={() => setDailyTarget(String(p))}
                    style={{
                      cursor: 'pointer',
                      background: String(totalTarget) === String(p) ? 'rgba(217,119,6,0.16)' : 'rgba(217,119,6,0.08)',
                    }}
                  >
                    {p} kcal
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="small-muted" style={{ marginBottom: 6 }}>Base ingredients</div>
            <input
              className="form-control"
              style={{ width: '100%' }}
              placeholder="Base ingredients (comma separated)"
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
            />
          </div>

          <div className="mt-3 card" style={{ padding: '.65rem .8rem', background: 'rgba(255,255,255,0.72)' }}>
            <div className="small-muted">Target split preview</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {bucketPreview.map((b) => (
                <span key={b.slot} className="badge">{b.slot}: {b.targetCalories} kcal</span>
              ))}
            </div>
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
            <button
              type="button"
              onClick={resetInputs}
              style={{
                border: '1px solid rgba(100,116,139,0.32)',
                background: 'rgba(100,116,139,0.08)',
                color: '#334155',
                borderRadius: 10,
                padding: '.55rem .9rem',
              }}
            >
              Reset Inputs
            </button>
            {!!plan.length && (
              <>
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  style={{
                    border: '1px solid rgba(249,115,22,0.35)',
                    background: 'rgba(249,115,22,0.10)',
                    color: '#c2410c',
                    borderRadius: 10,
                    padding: '.55rem .9rem',
                  }}
                >
                  {editMode ? 'Cancel Edit' : 'Edit Plan'}
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={saveEditedPlan}
                    style={{
                      border: '1px solid rgba(34,197,94,0.35)',
                      background: 'rgba(34,197,94,0.10)',
                      color: '#166534',
                      borderRadius: 10,
                      padding: '.55rem .9rem',
                    }}
                  >
                    Save Edits
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearPlan}
                  style={{
                    border: '1px solid rgba(220,38,38,0.30)',
                    background: 'rgba(220,38,38,0.08)',
                    color: '#b91c1c',
                    borderRadius: 10,
                    padding: '.55rem .9rem',
                  }}
                >
                  Clear Plan
                </button>
              </>
            )}
          </div>

          {!!plan.length && (
            <>
              <div className="mt-5 grid grid-cols-1 gap-3">
                <div className="card" style={{ padding: '.8rem 1rem' }}>
                  <div className="small-muted">Daily Target</div>
                  <div className="text-2xl font-bold mt-1">{totalTarget} kcal</div>
                  <div className="small-muted mt-1">~{avgPerMeal} kcal per meal</div>
                </div>
              </div>

              <div className="mt-3 card" style={{ padding: '.7rem .9rem' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <div className="small-muted">Calorie alignment</div>
                  <div className="small-muted">{planProgress}% of target</div>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${planProgress}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: summary.delta > 0
                        ? 'linear-gradient(90deg,#f59e0b,#dc2626)'
                        : 'linear-gradient(90deg,#22c55e,#16a34a)',
                      transition: 'width .2s ease',
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.map((meal, idx) => (
                  <div key={meal.key} className="card" style={{ padding: '.95rem 1rem' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {editMode ? (
                          <>
                            <input
                              className="form-control"
                              style={{ marginBottom: '.45rem' }}
                              value={meal.slot || ''}
                              onChange={(e) => updateMeal(idx, 'slot', e.target.value)}
                              placeholder="Meal slot"
                            />
                            <input
                              className="form-control"
                              value={meal.title || ''}
                              onChange={(e) => updateMeal(idx, 'title', e.target.value)}
                              placeholder="Meal title"
                            />
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <input
                                className="form-control"
                                value={meal.cuisine || ''}
                                onChange={(e) => updateMeal(idx, 'cuisine', e.target.value)}
                                placeholder="Cuisine"
                              />
                              <input
                                className="form-control"
                                value={String(meal.time || maxTime || 25)}
                                onChange={(e) => updateMeal(idx, 'time', e.target.value.replace(/[^\d]/g, ''))}
                                placeholder="Minutes"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="small-muted">{meal.slot}</div>
                            <div className="text-lg font-semibold">{meal.title}</div>
                            <div className="small-muted mt-1">{meal.cuisine} • {meal.time || maxTime || 25} min</div>
                          </>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {editMode ? (
                          <div className="grid gap-2" style={{ minWidth: 130 }}>
                            <input
                              className="form-control"
                              value={String(meal.slotTarget || '')}
                              onChange={(e) => updateMeal(idx, 'slotTarget', Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
                              placeholder="Target kcal"
                            />
                            <input
                              className="form-control"
                              value={String(meal.estimatedCalories || '')}
                              onChange={(e) => updateMeal(idx, 'estimatedCalories', Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
                              placeholder="Est kcal"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="badge">🎯 {meal.slotTarget} kcal</div>
                            <div className="small-muted mt-1">Est. {meal.estimatedCalories || 0} kcal</div>
                          </>
                        )}
                      </div>
                    </div>

                    {editMode ? (
                      <>
                        <div className="mt-3">
                          <input
                            className="form-control"
                            placeholder="Ingredients (comma separated)"
                            value={Array.isArray(meal.ingredients) ? meal.ingredients.join(', ') : ''}
                            onChange={(e) => updateMealIngredients(idx, e.target.value)}
                          />
                        </div>
                        <div className="mt-2">
                          <textarea
                            className="form-control"
                            placeholder="Steps (one step per line)"
                            value={Array.isArray(meal.steps) ? meal.steps.join('\n') : ''}
                            onChange={(e) => updateMealSteps(idx, e.target.value)}
                            rows={3}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(meal.ingredients || []).slice(0, 4).map((ing) => (
                            <span key={`${meal.key}-${ing}`} className="chip">{ing}</span>
                          ))}
                        </div>

                        <ol className="mt-3" style={{ marginBottom: 0, paddingLeft: '1rem', color: '#44403c', fontSize: '.88rem' }}>
                          {(meal.steps || []).slice(0, 2).map((step, stepIdx) => (
                            <li key={`${meal.key}-step-${stepIdx}`}>{step}</li>
                          ))}
                        </ol>
                      </>
                    )}
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
