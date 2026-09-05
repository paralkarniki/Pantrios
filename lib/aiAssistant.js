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
