import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import theme from '../lib/theme'
import { RequireAuth } from '../lib/requireAuth'
import PageHeader from '../components/PageHeader'
import { subscribeToAuth } from '../lib/auth'
import { saveUserData, subscribeUserData } from '../lib/userData'
import { readScopedJSON, writeScopedJSON, removeScoped, scopedStorageKey } from '../lib/clientStorage'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const QUICK_MEALS = ['Power Bowl', 'Stir-Fry Plate', 'One-Pot Meal', 'Wrap + Salad', 'Soup & Toast', 'Rice + Curry']
const SMART_SETTINGS_KEY = 'pantrio:planner-smart-settings'

const INGREDIENT_CATALOG = {
  rice: { category: 'pantry', unit: 'cup', cost: 0.6, qty: 1 },
  quinoa: { category: 'pantry', unit: 'cup', cost: 1.2, qty: 0.8 },
  oats: { category: 'pantry', unit: 'cup', cost: 0.7, qty: 0.8 },
  pasta: { category: 'pantry', unit: 'cup', cost: 0.9, qty: 1 },
  lentils: { category: 'protein', unit: 'cup', cost: 0.9, qty: 1 },
  chickpeas: { category: 'protein', unit: 'cup', cost: 0.95, qty: 1 },
  beans: { category: 'protein', unit: 'cup', cost: 1, qty: 1 },
  paneer: { category: 'protein', unit: 'g', cost: 0.012, qty: 160 },
  tofu: { category: 'protein', unit: 'g', cost: 0.01, qty: 160 },
  chicken: { category: 'protein', unit: 'g', cost: 0.013, qty: 170 },
  egg: { category: 'protein', unit: 'pc', cost: 0.35, qty: 2 },
  yogurt: { category: 'dairy', unit: 'cup', cost: 0.9, qty: 1 },
  milk: { category: 'dairy', unit: 'cup', cost: 0.5, qty: 1 },
  cheese: { category: 'dairy', unit: 'g', cost: 0.015, qty: 80 },
  spinach: { category: 'produce', unit: 'cup', cost: 0.8, qty: 1.5 },
  tomato: { category: 'produce', unit: 'pc', cost: 0.45, qty: 2 },
  onion: { category: 'produce', unit: 'pc', cost: 0.35, qty: 1 },
  bellpepper: { category: 'produce', unit: 'pc', cost: 0.9, qty: 1 },
  broccoli: { category: 'produce', unit: 'cup', cost: 1.1, qty: 1.2 },
  carrot: { category: 'produce', unit: 'pc', cost: 0.3, qty: 2 },
  cucumber: { category: 'produce', unit: 'pc', cost: 0.6, qty: 1 },
  potato: { category: 'produce', unit: 'pc', cost: 0.4, qty: 2 },
  banana: { category: 'produce', unit: 'pc', cost: 0.4, qty: 1 },
  apple: { category: 'produce', unit: 'pc', cost: 0.55, qty: 1 },
  avocado: { category: 'produce', unit: 'pc', cost: 1.8, qty: 1 },
  garlic: { category: 'spices', unit: 'clove', cost: 0.08, qty: 3 },
  ginger: { category: 'spices', unit: 'tbsp', cost: 0.15, qty: 1 },
  cumin: { category: 'spices', unit: 'tsp', cost: 0.08, qty: 1 },
  turmeric: { category: 'spices', unit: 'tsp', cost: 0.06, qty: 1 },
  chili: { category: 'spices', unit: 'tsp', cost: 0.06, qty: 1 },
  oliveoil: { category: 'pantry', unit: 'tbsp', cost: 0.2, qty: 1.5 },
  bread: { category: 'pantry', unit: 'slice', cost: 0.2, qty: 2 },
  tortilla: { category: 'pantry', unit: 'pc', cost: 0.5, qty: 2 },
}

const CATEGORY_ORDER = ['produce', 'protein', 'dairy', 'pantry', 'spices', 'other']

const MEAL_TEMPLATES = [
  { title: 'Paneer Veg Bowl', cuisine: 'Indian', dietary: 'vegetarian', kcal: 640, ingredients: ['rice', 'paneer', 'spinach', 'tomato', 'onion', 'cumin', 'turmeric', 'oliveoil'] },
  { title: 'Chickpea Spinach Curry', cuisine: 'Indian', dietary: 'vegan', kcal: 610, ingredients: ['rice', 'chickpeas', 'spinach', 'tomato', 'onion', 'garlic', 'ginger', 'turmeric'] },
  { title: 'Chicken Rice Stir Fry', cuisine: 'Chinese', dietary: '', kcal: 670, ingredients: ['rice', 'chicken', 'bellpepper', 'onion', 'broccoli', 'garlic', 'ginger', 'oliveoil'] },
  { title: 'Tofu Veg Stir Fry', cuisine: 'Chinese', dietary: 'vegan', kcal: 590, ingredients: ['rice', 'tofu', 'bellpepper', 'broccoli', 'onion', 'garlic', 'ginger', 'oliveoil'] },
  { title: 'Mediterranean Quinoa Bowl', cuisine: 'Mediterranean', dietary: 'vegetarian', kcal: 600, ingredients: ['quinoa', 'chickpeas', 'cucumber', 'tomato', 'onion', 'yogurt', 'oliveoil'] },
  { title: 'Pasta Primavera', cuisine: 'Italian', dietary: 'vegetarian', kcal: 650, ingredients: ['pasta', 'tomato', 'onion', 'bellpepper', 'broccoli', 'cheese', 'oliveoil'] },
  { title: 'Bean Burrito Plate', cuisine: 'Mexican', dietary: 'vegetarian', kcal: 620, ingredients: ['beans', 'rice', 'tortilla', 'tomato', 'onion', 'cheese', 'chili'] },
  { title: 'Chicken Wrap & Salad', cuisine: 'American', dietary: '', kcal: 560, ingredients: ['chicken', 'tortilla', 'cucumber', 'tomato', 'onion', 'yogurt'] },
  { title: 'Egg Fried Rice', cuisine: 'Asian', dietary: 'eggetarian', kcal: 580, ingredients: ['rice', 'egg', 'onion', 'bellpepper', 'garlic', 'oliveoil'] },
  { title: 'Lentil Soup & Toast', cuisine: 'Middle Eastern', dietary: 'vegan', kcal: 540, ingredients: ['lentils', 'onion', 'tomato', 'carrot', 'garlic', 'bread', 'oliveoil'] },
  { title: 'Oats Yogurt Fruit Bowl', cuisine: 'International', dietary: 'vegetarian', kcal: 500, ingredients: ['oats', 'yogurt', 'banana', 'apple'] },
]

function parseList(text = '') {
  return String(text)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function normalizeUnit(unit = '') {
  const u = String(unit || '').toLowerCase().trim()
  const map = {
    pcs: 'pc',
    piece: 'pc',
    pieces: 'pc',
    cups: 'cup',
    slices: 'slice',
    tablespoons: 'tbsp',
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    clove: 'clove',
    cloves: 'clove',
    grams: 'g',
    kilogram: 'kg',
    kilograms: 'kg',
    litres: 'l',
    liters: 'l',
    milliliters: 'ml',
    millilitres: 'ml',
  }
  return map[u] || u
}

function convertQty(qty, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit)
  const to = normalizeUnit(toUnit)
  if (!from || !to || from === to) return qty

  const ratios = {
    kg: { g: 1000 },
    g: { kg: 1 / 1000 },
    l: { ml: 1000 },
    ml: { l: 1 / 1000 },
  }

  if (ratios[from] && ratios[from][to]) return qty * ratios[from][to]
  return qty
}

function parseIngredientToken(token = '') {
  const clean = String(token || '').trim()
  if (!clean) return null

  // supports: "2 tomato", "200g paneer", "1.5 cup rice"
  const m = clean.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/)
  if (!m) return { raw: clean, name: clean, qty: null, unit: '' }

  const qty = Number(m[1])
  const maybeUnit = normalizeUnit(m[2] || '')
  const name = String(m[3] || '').trim()

  // If token is like "2 tomato" then maybeUnit is actually part of name
  if (maybeUnit && !INGREDIENT_CATALOG[canonicalIngredientName(name)] && !['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'pc', 'slice', 'clove'].includes(maybeUnit)) {
    return { raw: clean, name: `${maybeUnit} ${name}`.trim(), qty, unit: '' }
  }

  return { raw: clean, name, qty, unit: maybeUnit }
}

function parseIngredientEntries(text = '') {
  return parseList(text)
    .map((t) => parseIngredientToken(t))
    .filter(Boolean)
}

function canonicalIngredientName(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z]/g, '')
}

function matchesDietary(template, dietary = '') {
  const d = String(dietary || '').toLowerCase().trim()
  if (!d) return true
  if (d === 'vegetarian') return template.dietary === 'vegetarian' || template.dietary === 'vegan' || template.dietary === 'eggetarian'
  if (d === 'vegan') return template.dietary === 'vegan'
  if (d === 'eggetarian') return template.dietary === 'eggetarian' || template.dietary === 'vegetarian'
  return true
}

function matchesCuisine(template, cuisine = '') {
  const c = String(cuisine || '').toLowerCase().trim()
  if (!c) return true
  return String(template.cuisine || '').toLowerCase().includes(c)
}

function estimateMealCost(ingredients = [], pantrySet = new Set(), servings = 1) {
  let total = 0
  const items = []

  ingredients.forEach((entry) => {
    const rawName = typeof entry === 'string' ? entry : entry?.name
    const key = canonicalIngredientName(rawName)
    const meta = INGREDIENT_CATALOG[key] || { category: 'other', unit: 'unit', cost: 0.8, qty: 1 }
    const fromPantry = pantrySet.has(key)
    const parsedQty = typeof entry === 'object' && Number.isFinite(Number(entry?.qty)) ? Number(entry.qty) : null
    const parsedUnit = typeof entry === 'object' ? normalizeUnit(entry?.unit || '') : ''

    let qty = meta.qty * servings
    if (parsedQty != null && parsedQty > 0) {
      qty = parsedUnit ? convertQty(parsedQty, parsedUnit, meta.unit) : parsedQty
    }
    qty = Number(qty.toFixed(2))

    const lineCost = fromPantry ? 0 : Number((qty * meta.cost).toFixed(2))
    total += lineCost
    items.push({
      name: rawName,
      key,
      category: meta.category,
      unit: meta.unit,
      qty,
      cost: lineCost,
      fromPantry,
      rawInput: typeof entry === 'object' ? entry.raw : String(rawName || ''),
    })
  })

  return {
    total: Number(total.toFixed(2)),
    items,
  }
}

function buildSmartRow(dayLabel, dateISO, template, targetCalories, pantrySet) {
  const servings = Math.max(0.85, Math.min(1.35, (Number(targetCalories) || template.kcal || 600) / (template.kcal || 600)))
  const estimatedCalories = Math.round((template.kcal || 600) * servings)
  const costPack = estimateMealCost(template.ingredients || [], pantrySet, servings)

  return normalizeRow(dayLabel, {
    meal: template.title,
    cuisine: template.cuisine,
    note: `Target ${Math.round(targetCalories)} kcal • ${matchesDietary(template, 'vegan') ? 'Plant-forward' : 'Balanced'} • pantry-first`,
    estimatedCalories,
    estimatedCost: costPack.total,
    ingredients: costPack.items,
    ingredientText: (template.ingredients || []).join(', '),
  }, dateISO)
}

function buildShoppingFromPlan(plan = [], pantrySet = new Set()) {
  const bucket = {}

  plan.forEach((row) => {
    const existing = Array.isArray(row?.ingredients) && row.ingredients.length
      ? row.ingredients
      : []

    existing.forEach((it) => {
      const key = canonicalIngredientName(it.key || it.name)
      if (!key || pantrySet.has(key)) return
      const cat = it.category || 'other'
      const unit = it.unit || 'unit'
      const mapKey = `${key}:${unit}`
      if (!bucket[cat]) bucket[cat] = {}
      if (!bucket[cat][mapKey]) {
        bucket[cat][mapKey] = {
          name: it.name || key,
          qty: 0,
          unit,
          cost: 0,
        }
      }
      bucket[cat][mapKey].qty += Number(it.qty || 0)
      bucket[cat][mapKey].cost += Number(it.cost || 0)
    })
  })

  const grouped = {}
  CATEGORY_ORDER.forEach((cat) => {
    const rows = Object.values(bucket[cat] || {})
      .map((x) => ({
        ...x,
        qty: Number(x.qty.toFixed(2)),
        cost: Number(x.cost.toFixed(2)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    if (rows.length) grouped[cat] = rows
  })

  return grouped
}

function toMonthValue(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function buildMonthWeeks(monthValue) {
  const [y, m] = String(monthValue || '').split('-').map((x) => Number(x))
  const year = Number.isFinite(y) ? y : new Date().getFullYear()
  const monthIndex = Number.isFinite(m) ? m - 1 : new Date().getMonth()

  const monthStart = new Date(year, monthIndex, 1)
  const monthEnd = new Date(year, monthIndex + 1, 0)

  const start = new Date(monthStart)
  const mondayOffset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - mondayOffset)

  const pretty = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
  const weeks = []
  let cursor = new Date(start)

  for (let weekNumber = 1; weekNumber <= 6; weekNumber += 1) {
    const days = []
    let hasInMonth = false

    for (let i = 0; i < 7; i += 1) {
      const d = new Date(cursor)
      d.setDate(cursor.getDate() + i)
      const inMonth = d.getMonth() === monthIndex
      if (inMonth) hasInMonth = true
      days.push({
        iso: d.toISOString().slice(0, 10),
        label: `${DAYS[i]} ${String(d.getDate()).padStart(2, '0')}`,
        inMonth,
      })
    }

    if (!hasInMonth && cursor > monthEnd) break

    const inMonthDays = days.filter((d) => d.inMonth)
    const startRange = inMonthDays[0] || days[0]
    const endRange = inMonthDays[inMonthDays.length - 1] || days[6]

    weeks.push({
      id: `${toMonthValue(new Date(year, monthIndex, 1))}-W${weekNumber}`,
      label: `Week ${weekNumber}`,
      rangeLabel: `${pretty.format(new Date(startRange.iso))} - ${pretty.format(new Date(endRange.iso))}`,
      days,
    })

    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

function weekStorageKey(weekId, userOrUid) {
  return scopedStorageKey(`pantrio:meal-plan:${weekId || 'default'}`, userOrUid)
}

function isPlanRows(value) {
  return Array.isArray(value) && value.length === 7
}

function normalizeRow(day, row = {}, dateISO = '') {
  return {
    day,
    dateISO: row?.dateISO || dateISO || '',
    meal: row?.meal || '',
    cuisine: row?.cuisine || '',
    note: row?.note || '',
    done: Boolean(row?.done),
    estimatedCalories: Number(row?.estimatedCalories || 0),
    estimatedCost: Number(row?.estimatedCost || 0),
    ingredients: Array.isArray(row?.ingredients) ? row.ingredients : [],
    ingredientText: row?.ingredientText || (Array.isArray(row?.ingredients) ? row.ingredients.map((it) => it?.rawInput || it?.name || '').filter(Boolean).join(', ') : ''),
  }
}

function emptyPlanForWeek(week) {
  if (!week?.days?.length) return DAYS.map((d) => normalizeRow(d))
  return week.days.map((d) => normalizeRow(d.label, {}, d.iso))
}

function normalizePlanForWeek(savedRows = [], week) {
  if (!week?.days?.length || !isPlanRows(savedRows)) return emptyPlanForWeek(week)
  return savedRows.map((row, idx) => normalizeRow(week.days[idx]?.label || DAYS[idx], row, week.days[idx]?.iso || ''))
}

export default function PlannerPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthValue(new Date()))
  const weeks = useMemo(() => buildMonthWeeks(selectedMonth), [selectedMonth])
  const [selectedWeekId, setSelectedWeekId] = useState('')
  const [user, setUser] = useState(null)
  const [remotePlansByWeek, setRemotePlansByWeek] = useState({})
  const [legacyRemotePlan, setLegacyRemotePlan] = useState([])
  const activeWeek = useMemo(() => weeks.find((w) => w.id === selectedWeekId) || weeks[0] || null, [weeks, selectedWeekId])
  const [plan, setPlan] = useState([])
  const [copiedShopping, setCopiedShopping] = useState(false)
  const [smartDailyTarget, setSmartDailyTarget] = useState('2200')
  const [smartCuisine, setSmartCuisine] = useState('')
  const [smartDietary, setSmartDietary] = useState('')
  const [pantryLeftovers, setPantryLeftovers] = useState('rice, onion, tomato')
  const [weeklyBudget, setWeeklyBudget] = useState('75')

  useEffect(() => {
    if (!weeks.length) return
    if (!selectedWeekId || !weeks.some((w) => w.id === selectedWeekId)) {
      setSelectedWeekId(weeks[0].id)
    }
  }, [weeks, selectedWeekId])

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const saved = readScopedJSON(SMART_SETTINGS_KEY, user?.uid, {}, { legacyKey: SMART_SETTINGS_KEY })
    if (saved && typeof saved === 'object') {
      setSmartDailyTarget(String(saved.dailyTarget || '2200'))
      setSmartCuisine(String(saved.cuisine || ''))
      setSmartDietary(String(saved.dietary || ''))
      setPantryLeftovers(String(saved.pantryLeftovers || 'rice, onion, tomato'))
      setWeeklyBudget(String(saved.weeklyBudget || '75'))
      return
    }

    const calorieSeed = readScopedJSON('pantrio:daily-calorie-plan', user?.uid, {}, { legacyKey: 'pantrio:daily-calorie-plan' })
    if (calorieSeed && typeof calorieSeed === 'object') {
      setSmartDailyTarget(String(calorieSeed.dailyTarget || '2200'))
      setSmartCuisine(String(calorieSeed.cuisine || ''))
      setSmartDietary(String(calorieSeed.dietary || ''))
      setPantryLeftovers(String(calorieSeed.ingredientsText || 'rice, onion, tomato'))
    }
  }, [user?.uid])

  useEffect(() => {
    writeScopedJSON(SMART_SETTINGS_KEY, user?.uid, {
      dailyTarget: smartDailyTarget,
      cuisine: smartCuisine,
      dietary: smartDietary,
      pantryLeftovers,
      weeklyBudget,
    })
  }, [user?.uid, smartDailyTarget, smartCuisine, smartDietary, pantryLeftovers, weeklyBudget])

  useEffect(() => {
    if (!user?.uid) {
      setRemotePlansByWeek({})
      setLegacyRemotePlan([])
      return
    }

    const unsubUserData = subscribeUserData(user.uid, (data) => {
      const nextByWeek = data?.mealPlanByWeek && typeof data.mealPlanByWeek === 'object' ? data.mealPlanByWeek : {}
      setRemotePlansByWeek(nextByWeek)
      setLegacyRemotePlan(isPlanRows(data?.mealPlan) ? data.mealPlan : [])
    })

    return () => {
      if (unsubUserData) unsubUserData()
    }
  }, [user?.uid])

  useEffect(() => {
    if (!activeWeek || !selectedWeekId) return

    if (user?.uid) {
      const remoteForWeek = remotePlansByWeek?.[selectedWeekId]
      if (isPlanRows(remoteForWeek)) {
        setPlan(normalizePlanForWeek(remoteForWeek, activeWeek))
        return
      }

      if (isPlanRows(legacyRemotePlan)) {
        setPlan(normalizePlanForWeek(legacyRemotePlan, activeWeek))
        return
      }
    }

    try {
      const saved = readScopedJSON(`pantrio:meal-plan:${selectedWeekId}`, user?.uid, [], {
        legacyKey: `pantrio:meal-plan:${selectedWeekId}`,
      })
      if (isPlanRows(saved)) {
        setPlan(normalizePlanForWeek(saved, activeWeek))
        return
      }
    } catch (e) {}

    setPlan(emptyPlanForWeek(activeWeek))
  }, [activeWeek, selectedWeekId, user?.uid, remotePlansByWeek, legacyRemotePlan])

  function update(index, key, value) {
    setPlan((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  }

  function updateRowIngredients(index, textValue) {
    const entries = parseIngredientEntries(textValue)
    setPlan((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row
        const servings = Math.max(0.75, Math.min(1.5, Number(row?.estimatedCalories || 600) / 600))
        const costPack = estimateMealCost(entries, pantrySet, servings)
        return {
          ...row,
          ingredientText: textValue,
          ingredients: costPack.items,
          estimatedCost: costPack.total,
        }
      })
    )
  }

  function toggleDone(index) {
    setPlan((prev) => prev.map((row, i) => (i === index ? { ...row, done: !row.done } : row)))
  }

  function copyPreviousDay(index) {
    if (index === 0) return
    setPlan((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row
        const source = prev[index - 1]
        return { ...row, meal: source.meal, cuisine: source.cuisine, note: source.note }
      })
    )
  }

  function randomizeWeek() {
    setPlan((prev) =>
      prev.map((row, i) => ({
        ...row,
        meal: QUICK_MEALS[i % QUICK_MEALS.length],
        cuisine: theme.cuisineOptions[(i * 3) % theme.cuisineOptions.length],
        note: row.note || 'Use pantry leftovers first',
      }))
    )
  }

  function autofillFromDailyCaloriePlan() {
    try {
      const saved = readScopedJSON('pantrio:daily-calorie-plan', user?.uid, {}, { legacyKey: 'pantrio:daily-calorie-plan' })
      const meals = Array.isArray(saved?.plan) ? saved.plan : []
      if (!meals.length) return

      setPlan((prev) =>
        prev.map((row, i) => {
          const m = meals[i % meals.length]
          const est = Number(m?.estimatedCalories || m?.slotTarget || 0)
          return {
            ...row,
            meal: m?.title || row.meal,
            cuisine: m?.cuisine || row.cuisine,
            note: m?.slotTarget ? `Target ${m.slotTarget} kcal` : row.note,
            estimatedCalories: est,
            estimatedCost: Number(row?.estimatedCost || 0),
            ingredients: Array.isArray(m?.ingredients)
              ? m.ingredients.map((name) => {
                const key = canonicalIngredientName(name)
                const meta = INGREDIENT_CATALOG[key] || { category: 'other', unit: 'unit', cost: 0.8, qty: 1 }
                return { name, key, category: meta.category, unit: meta.unit, qty: meta.qty, cost: Number((meta.qty * meta.cost).toFixed(2)), fromPantry: false }
              })
              : row.ingredients,
            ingredientText: Array.isArray(m?.ingredients) ? m.ingredients.join(', ') : row.ingredientText,
          }
        })
      )
    } catch (e) {}
  }

  function smartAutoFillWeek(optimizeForBudget = false) {
    if (!activeWeek?.days?.length) return

    const target = Math.max(1200, Number(smartDailyTarget) || 2200)
    const mealTarget = Math.round(target / 3)
    const budget = Math.max(0, Number(weeklyBudget) || 0)
    const pantrySet = new Set(parseList(pantryLeftovers).map((x) => canonicalIngredientName(x)))

    let candidates = MEAL_TEMPLATES.filter((t) => matchesDietary(t, smartDietary) && matchesCuisine(t, smartCuisine))
    if (!candidates.length) candidates = MEAL_TEMPLATES.slice()

    const priced = candidates
      .map((t) => {
        const pack = estimateMealCost(t.ingredients, pantrySet, Math.max(0.85, Math.min(1.35, mealTarget / (t.kcal || 600))))
        return { ...t, estCost: pack.total }
      })
      .sort((a, b) => a.estCost - b.estCost)

    const useBudgetMode = optimizeForBudget || (budget > 0 && budget < Number((priced.reduce((s, x) => s + x.estCost, 0) / Math.max(1, priced.length) * 7).toFixed(2)))
    const pool = useBudgetMode ? priced : priced.sort((a, b) => Math.abs((a.kcal || 600) - mealTarget) - Math.abs((b.kcal || 600) - mealTarget))

    const next = activeWeek.days.map((d, i) => {
      const template = pool[i % pool.length]
      return buildSmartRow(d.label, d.iso, template, mealTarget, pantrySet)
    })

    setPlan(next)
  }

  function savePlan() {
    if (!selectedWeekId) return
    writeScopedJSON(`pantrio:meal-plan:${selectedWeekId}`, user?.uid, plan)
    if (user?.uid) {
      const nextByWeek = { ...remotePlansByWeek, [selectedWeekId]: plan }
      setRemotePlansByWeek(nextByWeek)
      saveUserData(user.uid, { mealPlanByWeek: nextByWeek, mealPlan: plan })
    }
  }

  function clearPlan() {
    if (!selectedWeekId) return
    const empty = emptyPlanForWeek(activeWeek)
    setPlan(empty)
    removeScoped(`pantrio:meal-plan:${selectedWeekId}`, user?.uid)
    if (user?.uid) {
      const nextByWeek = { ...remotePlansByWeek, [selectedWeekId]: empty }
      setRemotePlansByWeek(nextByWeek)
      saveUserData(user.uid, { mealPlanByWeek: nextByWeek, mealPlan: empty })
    }
  }

  function exportPlan() {
    const payload = {
      app: 'Pantrio',
      type: 'weekly-meal-plan',
      exportedAt: new Date().toISOString(),
      month: selectedMonth,
      weekId: selectedWeekId,
      weekRange: activeWeek?.rangeLabel || '',
      plan,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pantrio-${selectedWeekId || 'weekly-plan'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const plannedMeals = useMemo(() => plan.filter((row) => row.meal.trim()).length, [plan])
  const doneMeals = useMemo(() => plan.filter((row) => row.done).length, [plan])
  const cuisinesUsed = useMemo(() => new Set(plan.map((row) => row.cuisine).filter(Boolean)).size, [plan])
  const plannedCalories = useMemo(() => plan.reduce((sum, row) => sum + Number(row?.estimatedCalories || 0), 0), [plan])
  const weeklyEstimatedCost = useMemo(() => Number(plan.reduce((sum, row) => sum + Number(row?.estimatedCost || 0), 0).toFixed(2)), [plan])
  const pantrySet = useMemo(() => new Set(parseList(pantryLeftovers).map((x) => canonicalIngredientName(x))), [pantryLeftovers])

  const shoppingGroups = useMemo(() => buildShoppingFromPlan(plan, pantrySet), [plan, pantrySet])

  function copyShoppingList() {
    const lines = []
    CATEGORY_ORDER.forEach((cat) => {
      const group = shoppingGroups[cat]
      if (!group?.length) return
      lines.push(cat.toUpperCase())
      group.forEach((it) => lines.push(`- ${it.name}: ${it.qty} ${it.unit} (~$${it.cost.toFixed(2)})`))
      lines.push('')
    })
    if (!lines.length) return
    navigator.clipboard?.writeText(lines.join('\n'))
    setCopiedShopping(true)
    setTimeout(() => setCopiedShopping(false), 1200)
  }

  return (
    <RequireAuth>
      <div className="min-h-screen py-10">
        <div className="app-container">
          <div className="card">
            <PageHeader title="Weekly Meal Planner" subtitle="Plan your week and save your meal plan to your account." />

            <div className="mt-4 card" style={{ padding: '.7rem .85rem' }}>
              <img
                src="/img/diet.svg"
                alt="Diet planner"
                style={{ width: '100%', height: 135, objectFit: 'contain', background: 'rgba(255,255,255,0.72)', borderRadius: 10, padding: '.3rem' }}
              />
            </div>

            <div className="mt-4 card" style={{ padding: '.9rem 1rem' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">Monthly Week View</div>
                  <div className="small-muted mt-1">Select month and week to plan meals.</div>
                </div>
                <input
                  type="month"
                  className="form-control"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ borderRadius: 10, maxWidth: 220 }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {weeks.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWeekId(w.id)}
                    style={{
                      border: '1px solid rgba(217,119,6,0.28)',
                      background: selectedWeekId === w.id ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : 'rgba(255,255,255,0.9)',
                      color: '#92400e',
                      borderRadius: 10,
                      padding: '.45rem .75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    title={w.rangeLabel}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              {!!activeWeek?.rangeLabel && (
                <div className="small-muted mt-3">Selected: {activeWeek.rangeLabel}</div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="card" style={{ padding: '.75rem .9rem' }}>
                <div className="small-muted">Planned Meals</div>
                <div className="text-2xl font-bold mt-1">{plannedMeals}/7</div>
              </div>
              <div className="card" style={{ padding: '.75rem .9rem' }}>
                <div className="small-muted">Weekly Calories</div>
                <div className="text-2xl font-bold mt-1">{plannedCalories.toLocaleString()}</div>
              </div>
              <div className="card" style={{ padding: '.75rem .9rem' }}>
                <div className="small-muted">Estimated Weekly Cost</div>
                <div className="text-2xl font-bold mt-1">${weeklyEstimatedCost.toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-4 card" style={{ padding: '.9rem 1rem' }}>
              <div className="font-semibold">Smart Weekly Auto-Planner</div>
              <div className="small-muted mt-1">Auto-fill week using calorie target, cuisine/dietary rules, pantry leftovers, and budget.</div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                <input
                  className="form-control"
                  placeholder="Daily calories"
                  value={smartDailyTarget}
                  onChange={(e) => setSmartDailyTarget(e.target.value.replace(/[^\d]/g, ''))}
                />
                <input
                  className="form-control"
                  list="planner-cuisine-options"
                  placeholder="Cuisine preference"
                  value={smartCuisine}
                  onChange={(e) => setSmartCuisine(e.target.value)}
                />
                <datalist id="planner-cuisine-options">
                  {theme.cuisineOptions.map((c) => <option key={c} value={c} />)}
                </datalist>
                <select className="form-control" value={smartDietary} onChange={(e) => setSmartDietary(e.target.value)}>
                  {theme.dietaryOptions.map((opt) => <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>)}
                </select>
                <input
                  className="form-control"
                  placeholder="Weekly budget ($)"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(e.target.value.replace(/[^\d.]/g, ''))}
                />
                <input
                  className="form-control"
                  style={{ gridColumn: '1 / -1' }}
                  placeholder="Pantry leftovers (comma separated)"
                  value={pantryLeftovers}
                  onChange={(e) => setPantryLeftovers(e.target.value)}
                />
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                <button className="btn-primary" onClick={() => smartAutoFillWeek(false)}>Smart Auto-Fill Week</button>
                <button
                  type="button"
                  onClick={() => smartAutoFillWeek(true)}
                  style={{ border:'1px solid rgba(16,185,129,0.35)', background:'rgba(16,185,129,0.08)', color:'#047857', borderRadius:10, padding:'.55rem .9rem' }}
                >
                  Optimize for Budget
                </button>
                <span className="small-muted" style={{ alignSelf: 'center' }}>Done meals: {doneMeals}/7 • Cuisines: {cuisinesUsed}</span>
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
                <div key={row.dateISO || `${row.day}-${idx}`} className="card" style={{ padding: '.9rem 1rem' }}>
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
                          cursor: 'pointer',
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
                      style={{
                        border:'1px solid rgba(217,119,6,0.2)',
                        background: idx === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(255,251,235,0.85)',
                        color: idx === 0 ? '#9ca3af' : '#92400e',
                        borderRadius:10,
                        padding:'.5rem .7rem',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '.84rem',
                      }}
                    >
                      Copy prev day
                    </button>
                  </div>
                  <div className="small-muted mt-2" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>~{Number(row?.estimatedCalories || 0)} kcal</span>
                    <span>~${Number(row?.estimatedCost || 0).toFixed(2)}</span>
                    {Array.isArray(row?.ingredients) && row.ingredients.length > 0 && (
                      <span>{row.ingredients.slice(0, 3).map((it) => it.name).join(', ')}{row.ingredients.length > 3 ? '…' : ''}</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="small-muted" style={{ marginBottom: 6 }}>Ingredients (comma separated)</div>
                    <input
                      className="form-control"
                      placeholder="e.g. rice, chicken, onion, spinach"
                      value={row?.ingredientText || ''}
                      onChange={(e) => updateRowIngredients(idx, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 card" style={{ padding: '.9rem 1rem' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">Shopping List Generator</div>
                  <div className="small-muted mt-1">Grouped by category with quantity and rough cost estimates.</div>
                </div>
                <button
                  type="button"
                  onClick={copyShoppingList}
                  disabled={!Object.keys(shoppingGroups).length}
                  style={{ border:'1px solid rgba(59,130,246,0.35)', background: Object.keys(shoppingGroups).length ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.06)', color: Object.keys(shoppingGroups).length ? '#1d4ed8' : '#9ca3af', borderRadius:10, padding:'.5rem .8rem', cursor: Object.keys(shoppingGroups).length ? 'pointer' : 'not-allowed' }}
                >
                  {copiedShopping ? 'Copied!' : 'Copy list'}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(shoppingGroups).length === 0 ? (
                  <span className="small-muted">No ingredient-backed meals yet. Use Smart Auto-Fill or Daily Calorie plan.</span>
                ) : (
                  CATEGORY_ORDER.filter((cat) => Array.isArray(shoppingGroups[cat]) && shoppingGroups[cat].length > 0).map((cat) => (
                    <div key={cat} className="card" style={{ padding: '.7rem .8rem' }}>
                      <div className="font-semibold" style={{ textTransform: 'capitalize' }}>{cat}</div>
                      <div className="mt-2" style={{ display: 'grid', gap: 6 }}>
                        {shoppingGroups[cat].map((it) => (
                          <div key={`${cat}-${it.name}-${it.unit}`} className="small-muted" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span>{it.name}</span>
                            <span>{it.qty} {it.unit} • ${it.cost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
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
    </RequireAuth>
  )
}

