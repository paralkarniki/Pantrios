const CALORIE_LOOKUP = [
  { keys: ['egg'], kcal: 70 },
  { keys: ['chicken'], kcal: 165 },
  { keys: ['beef'], kcal: 250 },
  { keys: ['mutton', 'lamb'], kcal: 294 },
  { keys: ['fish', 'salmon', 'tuna'], kcal: 180 },
  { keys: ['paneer'], kcal: 265 },
  { keys: ['tofu'], kcal: 120 },
  { keys: ['lentil', 'dal'], kcal: 116 },
  { keys: ['chickpea', 'chana'], kcal: 164 },
  { keys: ['bean'], kcal: 130 },

  { keys: ['rice'], kcal: 205 },
  { keys: ['pasta', 'noodle'], kcal: 220 },
  { keys: ['bread'], kcal: 80 },
  { keys: ['potato'], kcal: 160 },
  { keys: ['oat'], kcal: 150 },
  { keys: ['tortilla'], kcal: 120 },

  { keys: ['tomato'], kcal: 22 },
  { keys: ['onion'], kcal: 40 },
  { keys: ['spinach'], kcal: 23 },
  { keys: ['broccoli'], kcal: 35 },
  { keys: ['carrot'], kcal: 41 },
  { keys: ['pepper', 'capsicum'], kcal: 31 },
  { keys: ['mushroom'], kcal: 22 },

  { keys: ['milk'], kcal: 120 },
  { keys: ['cheese'], kcal: 110 },
  { keys: ['yogurt', 'curd'], kcal: 100 },

  { keys: ['oil', 'olive oil'], kcal: 120 },
  { keys: ['butter', 'ghee'], kcal: 102 },
  { keys: ['peanut butter'], kcal: 95 },
]

function parseQuantity(line = '') {
  const match = line.match(/(\d+(?:\.\d+)?)/)
  if (!match) return 1
  const value = Number(match[1])
  if (!Number.isFinite(value)) return 1
  return Math.max(0.5, Math.min(value, 4))
}

function findBaseCalories(line = '') {
  const lower = line.toLowerCase()
  for (const item of CALORIE_LOOKUP) {
    if (item.keys.some((k) => lower.includes(k))) return item.kcal
  }
  return 60
}

export function estimateLineCalories(line = '') {
  const lower = line.toLowerCase()
  const qty = parseQuantity(line)
  const base = findBaseCalories(line)

  if (lower.includes('tbsp') && (lower.includes('oil') || lower.includes('butter') || lower.includes('ghee'))) {
    return Math.round(base * qty)
  }

  if (lower.includes('tsp') && (lower.includes('oil') || lower.includes('butter') || lower.includes('ghee'))) {
    return Math.round(base * 0.33 * qty)
  }

  if (lower.includes('cup')) return Math.round(base * qty)
  if (lower.includes('piece') || lower.includes('pcs') || lower.includes('slice')) return Math.round(base * qty)

  return Math.round(base * Math.max(0.75, Math.min(qty, 2)))
}

export function estimateRecipeCalories(recipe = {}) {
  const ingredients = recipe.ingredients || []
  const total = ingredients.reduce((sum, line) => sum + estimateLineCalories(line), 0)
  return Math.max(80, Math.round(total))
}

export function mealTypeFromRecipe(recipe = {}) {
  const text = `${recipe.title || ''} ${(recipe.steps || []).join(' ')}`.toLowerCase()
  if (/breakfast|omelet|oat|toast|pancake/.test(text)) return 'Breakfast'
  if (/snack|smoothie|salad/.test(text)) return 'Snack'
  if (/dinner|curry|stir-fry|one-pot/.test(text)) return 'Dinner'
  return 'Lunch'
}
