const STOP_WORDS = new Set([
  'and', 'with', 'from', 'into', 'for', 'the', 'a', 'an', 'some', 'fresh', 'leftover', 'leftovers', 'plus', 'then', 'or', 'to', 'of',
])

const KNOWN_INGREDIENTS = [
  'onion', 'garlic', 'tomato', 'spinach', 'rice', 'chicken', 'egg', 'eggs', 'broccoli', 'carrot', 'bell pepper', 'mushroom',
  'potato', 'beans', 'chickpeas', 'pasta', 'cheese', 'milk', 'butter', 'tofu', 'paneer', 'yogurt', 'cumin', 'paprika', 'turmeric',
  'coriander', 'chili', 'lemon', 'lime', 'corn', 'beef', 'fish', 'shrimp', 'oats', 'bread', 'quinoa', 'lentils',
]

export function extractIngredientsFromText(text = '') {
  const raw = String(text)
    .toLowerCase()
    .replace(/[^a-z,\s-]/g, ' ')
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean)

  const out = []
  for (const token of raw) {
    if (STOP_WORDS.has(token)) continue
    if (token.length < 3) continue
    if (KNOWN_INGREDIENTS.includes(token)) out.push(token)
  }

  return Array.from(new Set(out)).slice(0, 15)
}

export function scoreSubstitutions(baseIngredient = '', candidates = [], allergens = []) {
  const base = String(baseIngredient || '').toLowerCase()
  return (Array.isArray(candidates) ? candidates : []).map((candidate) => {
    const name = String(candidate || '')
    const lower = name.toLowerCase()

    let score = 0.5
    if (base.includes('milk') && /milk|cream|oat|soy|almond/.test(lower)) score += 0.35
    if (base.includes('egg') && /flax|chia|banana|yogurt/.test(lower)) score += 0.3
    if (base.includes('butter') && /oil|ghee|butter/.test(lower)) score += 0.25
    if (base.includes('flour') && /flour|blend/.test(lower)) score += 0.3

    if (allergens.includes('dairy') && /milk|cheese|cream|butter|yogurt/.test(lower)) score -= 0.4
    if (allergens.includes('egg') && /egg/.test(lower)) score -= 0.4
    if (allergens.includes('gluten') && /flour|pasta|bread/.test(lower)) score -= 0.3
    if (allergens.includes('nuts') && /almond|cashew|nut/.test(lower)) score -= 0.3
    if (allergens.includes('soy') && /soy/.test(lower)) score -= 0.3

    const confidence = Math.max(0.05, Math.min(0.98, score))
    return { name, confidence }
  }).sort((a, b) => b.confidence - a.confidence)
}

export function recommendBudgetMeals(meals = [], { budget = 0, timePreset = 20, recentTitles = [] } = {}) {
  const recentSet = new Set((recentTitles || []).map((x) => String(x || '').toLowerCase()))
  return (Array.isArray(meals) ? meals : []).map((meal) => {
    const title = String(meal?.title || '')
    const cost = Number(meal?.cost || 0)

    let score = 0
    score += Math.max(0, 1 - Math.abs(cost - budget) / Math.max(1, budget || 1)) * 0.5
    score += cost <= budget ? 0.3 : 0
    score += timePreset <= 15 && /fried|taco|bowl|stir/.test(title.toLowerCase()) ? 0.15 : 0.05
    score += recentSet.has(title.toLowerCase()) ? 0.05 : 0.15

    return {
      ...meal,
      aiScore: Number(score.toFixed(3)),
      reason: cost <= budget ? 'within budget' : 'slightly above budget',
    }
  }).sort((a, b) => b.aiScore - a.aiScore)
}

export function estimateCostPerServing(recipe = {}) {
  const ingredientsCount = Array.isArray(recipe?.ingredients) ? recipe.ingredients.length : 0
  const time = Number(recipe?.time || 0)
  const proteinHeavy = /chicken|beef|fish|shrimp|paneer|tofu|egg/i.test((recipe?.ingredients || []).join(' '))

  let base = 1.25 + ingredientsCount * 0.35
  if (time > 35) base += 0.4
  if (proteinHeavy) base += 0.75

  return Number(Math.max(1.2, Math.min(12, base)).toFixed(2))
}

export function recipesToMealCandidates(recipes = []) {
  const list = Array.isArray(recipes) ? recipes : []
  const seen = new Set()
  const out = []

  for (const recipe of list) {
    const title = String(recipe?.title || '').trim()
    if (!title) continue
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    out.push({
      title,
      cost: estimateCostPerServing(recipe),
      cuisine: recipe?.cuisine || 'Homestyle',
      time: Number(recipe?.time || 0) || undefined,
      source: recipe?.source || 'history',
    })
  }

  return out
}

export function deriveTimePresetsFromRecipes(recipes = [], fallback = [10, 15, 20, 30]) {
  const list = Array.isArray(recipes) ? recipes : []
  const times = list
    .map((r) => Number(r?.time || 0))
    .filter((n) => Number.isFinite(n) && n >= 5 && n <= 120)

  const unique = Array.from(new Set(times.map((n) => Math.round(n / 5) * 5))).sort((a, b) => a - b)
  if (unique.length) return unique.slice(0, 8)
  return fallback
}

export function estimateStepDurations(inputText = '') {
  const parts = String(inputText || '')
    .split(/[\n\.]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8)

  if (!parts.length) return []

  return parts.map((text) => {
    const t = text.toLowerCase()
    let minutes = 3
    if (/prep|chop|slice|mix/.test(t)) minutes = 2
    if (/saute|sauté|stir|fry|cook/.test(t)) minutes = 5
    if (/bake|roast|simmer/.test(t)) minutes = 12
    if (/rest|serve|garnish/.test(t)) minutes = 1
    return { label: text, minutes }
  })
}

function toIngredientList(input = '') {
  if (Array.isArray(input)) return input.map((x) => String(x || '').trim()).filter(Boolean)
  return String(input || '')
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export function estimateMacrosFromRecipe(recipe = {}, { dailyCalories = 2200, goal = 'balanced' } = {}) {
  const ingredients = toIngredientList(recipe?.ingredients)
  const text = ingredients.join(' ').toLowerCase()
  const calories = Math.max(120, Math.round(Number(recipe?.calories || 0) || Number(dailyCalories) / 3))

  let proteinRatio = 0.26
  let carbRatio = 0.44
  let fatRatio = 0.3

  if (String(goal).toLowerCase().includes('protein')) {
    proteinRatio = 0.34
    carbRatio = 0.36
    fatRatio = 0.3
  } else if (String(goal).toLowerCase().includes('lean')) {
    proteinRatio = 0.32
    carbRatio = 0.4
    fatRatio = 0.28
  }

  if (/rice|pasta|bread|noodle|potato|quinoa|oats/.test(text)) carbRatio += 0.04
  if (/chicken|beef|fish|egg|tofu|paneer|lentil|beans/.test(text)) proteinRatio += 0.04
  if (/butter|oil|ghee|cheese|avocado|nuts/.test(text)) fatRatio += 0.03

  const ratioTotal = proteinRatio + carbRatio + fatRatio
  proteinRatio /= ratioTotal
  carbRatio /= ratioTotal
  fatRatio /= ratioTotal

  const proteinG = Math.round((calories * proteinRatio) / 4)
  const carbsG = Math.round((calories * carbRatio) / 4)
  const fatG = Math.round((calories * fatRatio) / 9)
  const fiberG = Math.max(6, Math.round(carbsG * 0.12))

  return { calories, proteinG, carbsG, fatG, fiberG }
}

export function buildAdaptiveNutritionPlan(recipes = [], { dailyCalories = 2200, goal = 'balanced', mealsPerDay = 3 } = {}) {
  const list = Array.isArray(recipes) ? recipes : []
  const mealCalories = Math.max(250, Math.round(Number(dailyCalories || 2200) / Math.max(1, Number(mealsPerDay || 3))))
  const top = list.slice(0, 5)

  const macroRows = (top.length ? top : [{ calories: mealCalories }]).map((recipe) => (
    estimateMacrosFromRecipe({ ...recipe, calories: recipe?.calories || mealCalories }, { dailyCalories, goal })
  ))

  const avg = macroRows.reduce((acc, row) => ({
    calories: acc.calories + row.calories,
    proteinG: acc.proteinG + row.proteinG,
    carbsG: acc.carbsG + row.carbsG,
    fatG: acc.fatG + row.fatG,
    fiberG: acc.fiberG + row.fiberG,
  }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 })

  const d = Math.max(1, macroRows.length)
  const perMeal = {
    calories: Math.round(avg.calories / d),
    proteinG: Math.round(avg.proteinG / d),
    carbsG: Math.round(avg.carbsG / d),
    fatG: Math.round(avg.fatG / d),
    fiberG: Math.round(avg.fiberG / d),
  }

  const guidance = [
    `Target about ${perMeal.calories} kcal per meal (${Number(dailyCalories || 2200)} kcal/day).`,
    `Aim for ~${perMeal.proteinG}g protein and ~${perMeal.fiberG}g fiber per meal.`,
    String(goal).toLowerCase().includes('protein')
      ? 'Prioritize protein-first plates (beans, lentils, eggs, tofu, chicken).'
      : 'Keep plates balanced: 1 protein + 1 carb + 2 produce components.',
  ]

  return { dailyCalories: Number(dailyCalories || 2200), perMeal, guidance }
}

export function buildLeftoverChain(leftoversText = '', { cuisine = 'homestyle', days = 3 } = {}) {
  const extracted = extractIngredientsFromText(leftoversText)
  const fallback = toIngredientList(leftoversText)
  const base = Array.from(new Set([...(extracted || []), ...fallback.map((x) => x.toLowerCase())])).slice(0, 8)

  if (!base.length) return []

  const methods = ['stir-fry', 'wrap', 'soup', 'fried rice', 'baked tray', 'warm bowl']
  const tones = ['fresh', 'spicy', 'comfort', 'light', 'smoky', 'zesty']
  const totalDays = Math.max(2, Math.min(5, Number(days) || 3))

  return Array.from({ length: totalDays }, (_, i) => {
    const lead = base[i % base.length]
    const support = base[(i + 1) % base.length]
    const method = methods[i % methods.length]
    const tone = tones[(i + 2) % tones.length]
    const carry = base[(i + 2) % base.length]

    return {
      day: i + 1,
      title: `${String(cuisine || 'homestyle')} ${lead} ${method}`.replace(/\s+/g, ' ').trim(),
      action: `Cook ${lead} + ${support} as a ${tone} ${method}; save some ${carry} for next day remix.`,
      carryOver: carry,
      reused: [lead, support],
    }
  })
}

export function scoreWasteReduction(chain = []) {
  const rows = Array.isArray(chain) ? chain : []
  const reused = rows.flatMap((x) => Array.isArray(x?.reused) ? x.reused : [])
  const unique = new Set(reused.map((x) => String(x || '').toLowerCase()))
  const reuseRate = reused.length ? unique.size / reused.length : 0
  const score = Math.round(Math.max(20, Math.min(95, 42 + rows.length * 11 + (1 - reuseRate) * 25)))
  const savedUsd = Number((rows.length * 2.1 + unique.size * 0.8).toFixed(2))
  return { score, savedUsd }
}

export function buildTasteProfile(ratings = []) {
  const list = Array.isArray(ratings) ? ratings : []
  const likes = {}
  const dislikes = {}

  list.forEach((row) => {
    const text = `${row?.title || ''} ${row?.cuisine || ''}`.toLowerCase()
    const tokens = text.split(/[^a-z]+/).filter((x) => x.length > 3)
    const target = Number(row?.rating || 0) >= 4 ? likes : dislikes
    tokens.forEach((t) => {
      target[t] = (target[t] || 0) + 1
    })
  })

  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k)
  return {
    likes: top(likes),
    dislikes: top(dislikes),
  }
}

export function rankRecipesForTaste(recipes = [], profile = {}) {
  const likes = new Set((profile?.likes || []).map((x) => String(x).toLowerCase()))
  const dislikes = new Set((profile?.dislikes || []).map((x) => String(x).toLowerCase()))

  return (Array.isArray(recipes) ? recipes : []).map((recipe) => {
    const text = `${recipe?.title || ''} ${recipe?.cuisine || ''}`.toLowerCase()
    let score = 0.5

    likes.forEach((k) => { if (text.includes(k)) score += 0.15 })
    dislikes.forEach((k) => { if (text.includes(k)) score -= 0.18 })

    return {
      ...recipe,
      tasteScore: Number(Math.max(0.05, Math.min(0.98, score)).toFixed(3)),
    }
  }).sort((a, b) => b.tasteScore - a.tasteScore)
}

export function remixRecipeWithPantry(friendRecipeText = '', pantryText = '') {
  const friend = Array.from(new Set([
    ...extractIngredientsFromText(friendRecipeText),
    ...toIngredientList(friendRecipeText).map((x) => x.toLowerCase()),
  ])).slice(0, 10)

  const pantry = Array.from(new Set([
    ...extractIngredientsFromText(pantryText),
    ...toIngredientList(pantryText).map((x) => x.toLowerCase()),
  ])).slice(0, 10)

  const keep = friend.filter((x) => pantry.includes(x)).slice(0, 5)
  const add = pantry.filter((x) => !keep.includes(x)).slice(0, 3)
  const missing = friend.filter((x) => !pantry.includes(x)).slice(0, 3)

  const ingredients = Array.from(new Set([...keep, ...add])).slice(0, 8)
  const title = `${toIngredientList(friendRecipeText)[0] || 'Remixed Recipe'} · Pantry Edition`
  const pitch = missing.length
    ? `Swapped out ${missing.join(', ')} with pantry-friendly options: ${add.join(', ') || 'none needed'}.`
    : 'Your pantry already matches the base recipe closely; only minor tweaks recommended.'

  return { title, ingredients, pitch }
}

export function buildShareCardCopy(recipe = {}, { platform = 'instagram', tone = 'fun' } = {}) {
  const title = String(recipe?.title || 'Pantry Recipe')
  const cuisine = String(recipe?.cuisine || 'Homestyle')
  const time = Number(recipe?.time || 20)
  const tags = ['#pantrio', '#homecooking', '#recipe', `#${String(cuisine).toLowerCase().replace(/\s+/g, '')}`]
  const vibe = String(tone).toLowerCase() === 'pro' ? 'Plated and tested' : 'Zero-waste magic'
  const prefix = String(platform).toLowerCase() === 'whatsapp' ? 'Cook update:' : 'Just cooked:'
  const caption = `${prefix} ${title} in ${time} min. ${vibe}.`
  return { caption, hashtags: tags.join(' ') }
}

export function buildPlatingGuide(recipe = {}, style = 'fine-dining') {
  const title = String(recipe?.title || 'dish')
  const ingredients = toIngredientList(recipe?.ingredients).map((x) => x.toLowerCase())
  const herb = ingredients.find((x) => /parsley|cilantro|coriander|basil|mint/.test(x)) || 'fresh herbs'
  const crunch = ingredients.find((x) => /nuts|seed|onion|crouton/.test(x)) || 'a crunchy topping'
  const sauce = style === 'street-food' ? 'drizzle sauce generously' : 'add a tight sauce swipe on the plate'

  const baseByStyle = {
    'fine-dining': [
      `Use a wide plate and place ${title} slightly off-center.`,
      `${sauce}.`,
      `Finish with ${herb} and a small amount of ${crunch} for height.`,
    ],
    'street-food': [
      `Serve ${title} in a compact bowl or tray for bold visual contrast.`,
      `${sauce} and keep edges messy-on-purpose for street style.`,
      `Top with ${herb} and ${crunch} right before serving.`,
    ],
    'home-comfort': [
      `Serve ${title} warm in a deep bowl.`,
      `Keep portions generous and layer protein over carbs/veg.`,
      `Finish with ${herb} for freshness and serve immediately.`,
    ],
  }

  return baseByStyle[String(style || 'fine-dining').toLowerCase()] || baseByStyle['fine-dining']
}
