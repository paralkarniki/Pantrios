import { estimateRecipeCalories } from './calorieEstimator'

function toTitleCase(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function hashString(input = '') {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function pick(arr = [], seed = 0) {
  if (!arr.length) return undefined
  return arr[seed % arr.length]
}

function hasAny(haystack = [], words = []) {
  const lower = haystack.map((x) => String(x).toLowerCase())
  return words.some((w) => lower.some((v) => v.includes(w)))
}

function ingredientCategory(name = '') {
  const n = String(name).toLowerCase()
  if (/chicken|beef|pork|fish|shrimp|egg|tofu|paneer|lentil|beans|chickpea/.test(n)) return 'protein'
  if (/rice|quinoa|pasta|noodle|bread|tortilla|potato/.test(n)) return 'carb'
  if (/onion|garlic|ginger|scallion|shallot/.test(n)) return 'aromatic'
  if (/tomato|spinach|pepper|broccoli|carrot|mushroom|zucchini|cucumber|lettuce|corn/.test(n)) return 'veg'
  if (/oil|butter|ghee/.test(n)) return 'fat'
  return 'other'
}

function classifyDish({ ingredients = [], cuisine = '', maxTime }) {
  const ing = ingredients.map((i) => String(i).toLowerCase())
  const c = String(cuisine || '').toLowerCase()

  if (maxTime && Number(maxTime) <= 12) return 'flash-skillet'
  if (hasAny(ing, ['rice', 'quinoa', 'noodle', 'pasta'])) return 'grain-bowl'
  if (c.includes('indian') && hasAny(ing, ['tomato', 'onion', 'ginger', 'garlic'])) return 'masala-curry'
  if (c.includes('mex') || hasAny(ing, ['beans', 'corn', 'tortilla'])) return 'taco-bowl'
  if (hasAny(ing, ['lettuce', 'cucumber', 'spinach'])) return 'warm-salad'
  if (hasAny(ing, ['broccoli', 'carrot', 'mushroom', 'pepper'])) return 'stir-fry'
  return 'one-pot'
}

function cuisineSeasoning(cuisine = '', dishType = '', dietary = '', seed = 0) {
  const c = String(cuisine || '').toLowerCase()
  const isVegan = String(dietary || '').toLowerCase().includes('vegan')

  const options = {
    indian: ['cumin, coriander, turmeric, garam masala', 'mustard seeds, curry powder, chili flakes'],
    italian: ['oregano, basil, thyme, chili flakes', 'garlic, parsley, black pepper'],
    mexican: ['cumin, smoked paprika, chili powder, lime zest', 'oregano, chipotle powder, garlic'],
    asian: ['soy sauce, sesame oil, ginger, garlic', 'rice vinegar, chili paste, scallions'],
    default: ['salt, black pepper, garlic powder, paprika', 'herbs, lemon juice, black pepper'],
  }

  let key = 'default'
  if (c.includes('indian')) key = 'indian'
  else if (c.includes('italian')) key = 'italian'
  else if (c.includes('mex')) key = 'mexican'
  else if (c.includes('asian') || c.includes('chinese') || c.includes('thai')) key = 'asian'

  let blend = pick(options[key], seed) || options.default[0]
  if (!isVegan && (dishType === 'masala-curry' || key === 'indian')) blend += ', and a touch of butter'
  return blend
}

function ingredientLines(base = [], dietary = '', seed = 0) {
  const q = {
    protein: ['200 g', '250 g', '300 g'],
    carb: ['1 cup', '1.5 cups', '2 cups'],
    aromatic: ['1 small', '2 cloves', '1 tbsp'],
    veg: ['1 cup', '1.5 cups', '2 cups'],
    fat: ['1 tbsp', '2 tbsp'],
    other: ['to taste', '1 tsp', '1 tbsp'],
  }

  const lines = base.map((name, idx) => {
    const cat = ingredientCategory(name)
    const qty = pick(q[cat] || q.other, seed + idx)
    return `${toTitleCase(name)} - ${qty}`
  })

  const staples = String(dietary || '').toLowerCase().includes('vegan')
    ? ['Olive oil - 1 tbsp', 'Lemon juice - 1 tsp', 'Salt - to taste', 'Black pepper - to taste']
    : ['Olive oil - 1 tbsp', 'Butter - 1 tsp', 'Salt - to taste', 'Black pepper - to taste']

  return Array.from(new Set([...lines, ...staples]))
}

function planSteps({ dishType, base, cuisineLabel, seasoningBlend, maxTime }) {
  const proteins = base.filter((i) => ingredientCategory(i) === 'protein')
  const carbs = base.filter((i) => ingredientCategory(i) === 'carb')
  const veggies = base.filter((i) => ingredientCategory(i) === 'veg')
  const aromatics = base.filter((i) => ingredientCategory(i) === 'aromatic')

  const proteinText = proteins.length ? proteins.join(', ') : 'main protein'
  const carbText = carbs.length ? carbs.join(', ') : 'grain base'
  const vegText = veggies.length ? veggies.join(', ') : 'vegetables'
  const aromaticText = aromatics.length ? aromatics.join(', ') : 'onion and garlic'
  const timeHint = maxTime && Number(maxTime) > 0 ? ` Aim to finish in about ${Number(maxTime)} minutes.` : ''

  const stepsByType = {
    'flash-skillet': [
      `Prep ${base.slice(0, 6).join(', ')} into bite-size pieces for even cooking.${timeHint}`,
      `Heat oil in a wide skillet. Sauté ${aromaticText} for 60-90 seconds until fragrant.`,
      `Add ${proteinText}, sear on medium-high for color, then fold in ${vegText}.`,
      `Season with ${seasoningBlend}; toss for 3-5 minutes until glossy and cooked through.`,
      'Finish with lemon juice, adjust salt, and serve immediately.',
    ],
    'grain-bowl': [
      `Cook ${carbText} until tender; fluff and keep warm.${timeHint}`,
      `In another pan, sauté ${aromaticText}, then cook ${proteinText} with ${seasoningBlend}.`,
      `Quick-cook ${vegText} until just crisp-tender to keep texture.`,
      'Build bowls with grains at the base, top with protein and vegetables, then drizzle pan juices.',
      'Taste, adjust seasoning, and garnish with fresh herbs or citrus.',
    ],
    'masala-curry': [
      `Prep ${base.slice(0, 6).join(', ')}; keep tomatoes and aromatics separate.${timeHint}`,
      `Sauté ${aromaticText} in oil until softened, then add ${seasoningBlend} to bloom spices.`,
      'Add tomatoes and cook until the mixture thickens into a rich masala base.',
      `Fold in ${proteinText} and ${vegText}, add a splash of water, and simmer until well-coated.`,
      'Adjust salt and heat level, then serve warm with your favorite side.',
    ],
    'taco-bowl': [
      `Prep ${proteinText} and ${vegText}; keep a fresh topping component aside.${timeHint}`,
      `Sauté ${proteinText} with ${seasoningBlend} until aromatic and lightly caramelized.`,
      `Cook ${vegText} briefly so they stay bright and slightly crunchy.`,
      'Assemble bowls with a base (rice/beans if available), then add cooked mix and toppings.',
      'Finish with lime or lemon juice and serve.',
    ],
    'warm-salad': [
      `Prep greens and vegetables; pat dry for better texture.${timeHint}`,
      `Quick-sear ${proteinText} with ${seasoningBlend}, then rest for 2 minutes.`,
      'Toss vegetables and greens with olive oil, lemon, salt, and pepper.',
      'Slice protein and layer over the salad for a warm-cool contrast.',
      'Serve immediately while the protein is still warm.',
    ],
    'stir-fry': [
      `Prep everything before cooking (stir-fry moves fast).${timeHint}`,
      `Sear ${proteinText} quickly in a hot pan; remove once lightly browned.`,
      `Stir-fry ${aromaticText} then ${vegText} over high heat for 2-4 minutes.`,
      `Return protein and toss with ${seasoningBlend} until evenly coated.`,
      'Taste and adjust seasoning; serve hot.',
    ],
    'one-pot': [
      `Prep ${base.slice(0, 6).join(', ')} and keep components organized.${timeHint}`,
      `Cook ${aromaticText} in oil until soft and fragrant.`,
      `Add ${proteinText} and sear lightly, then stir in ${vegText} and ${seasoningBlend}.`,
      'Add a small splash of water, cover, and cook gently until tender and flavorful.',
      `Serve as a ${cuisineLabel} comfort-style dish.`,
    ],
  }

  const selected = stepsByType[dishType] || stepsByType['one-pot']
  return selected.map((s, idx) => `${idx + 1}. ${s}`)
}

function buildTitle({ dishType, cuisineLabel, timeLabel, dietaryLabel, hero, seed }) {
  const suffixByType = {
    'flash-skillet': ['Skillet', 'Sauté', 'Quick Pan Toss'],
    'grain-bowl': ['Power Bowl', 'Nourish Bowl', 'Harvest Bowl'],
    'masala-curry': ['Masala', 'Curry', 'Spiced Simmer'],
    'taco-bowl': ['Taco Bowl', 'Fiesta Bowl', 'Spice Bowl'],
    'warm-salad': ['Warm Salad', 'Crunch Bowl', 'Fresh Plate'],
    'stir-fry': ['Stir-Fry', 'Wok Toss', 'Sizzler'],
    'one-pot': ['One-Pot Meal', 'Pantry Pot', 'Comfort Pot'],
  }
  const suffix = pick(suffixByType[dishType] || ['Recipe'], seed + 17)
  return `${timeLabel}${dietaryLabel}${cuisineLabel} ${hero} ${suffix}`.replace(/\s+/g, ' ').trim()
}

function tuneForTargetCalories({ ingredients = [], dietary = '', targetCalories }) {
  const target = Number(targetCalories)
  if (!Number.isFinite(target) || target < 120) {
    return { ingredients, note: null }
  }

  const adjusted = [...ingredients]
  const isVeg = /vegan|vegetarian/i.test(dietary)

  let estimate = estimateRecipeCalories({ ingredients: adjusted })

  if (estimate < target - 90) {
    const boosters = []
    if (target - estimate > 260) boosters.push(isVeg ? 'Paneer - 150 g' : 'Chicken - 180 g')
    if (target - estimate > 170) boosters.push('Cooked rice - 1 cup')
    if (target - estimate > 100) boosters.push('Olive oil - 1 tbsp')
    if (target - estimate > 40) boosters.push('Peanut butter - 1 tbsp')

    boosters.forEach((line) => {
      if (!adjusted.some((i) => i.toLowerCase().includes(line.split(' - ')[0].toLowerCase()))) {
        adjusted.push(line)
      }
    })
  }

  if (estimate > target + 90) {
    for (let i = 0; i < adjusted.length; i += 1) {
      adjusted[i] = adjusted[i]
        .replace(/\b2\s*tbsp\b/i, '1 tbsp')
        .replace(/\b1\s*tbsp\b/i, '1 tsp')
        .replace(/\b2\s*cups?\b/i, '1 cup')
    }
  }

  estimate = estimateRecipeCalories({ ingredients: adjusted })
  return {
    ingredients: adjusted,
    note: `Calorie target: ~${Math.round(target)} kcal (estimated ${estimate} kcal).`,
    estimatedCalories: estimate,
    targetCalories: Math.round(target),
  }
}

export function buildLocalRecipe({ ingredients = [], dietary = '', maxTime, cuisine = '', targetCalories }) {
  const cleaned = ingredients
    .map((i) => String(i || '').trim())
    .filter(Boolean)
    .slice(0, 10)

  const base = cleaned.length ? cleaned : ['onion', 'garlic', 'tomato', 'chickpeas']
  const seed = hashString(`${base.join('|')}|${dietary}|${maxTime || ''}|${cuisine}`)
  const cuisineLabel = cuisine ? toTitleCase(cuisine) : 'Home-Style'
  const dietaryLabel = dietary ? `${dietary} ` : ''
  const timeLabel = maxTime && Number(maxTime) > 0 ? `${Number(maxTime)}-Minute ` : 'Quick '

  const dishType = classifyDish({ ingredients: base, cuisine, maxTime })
  const hero = toTitleCase(pick(base, seed) || 'Pantry')
  const seasoningBlend = cuisineSeasoning(cuisine, dishType, dietary, seed)

  const title = buildTitle({ dishType, cuisineLabel, timeLabel, dietaryLabel, hero, seed })
  const ingredientList = ingredientLines(base, dietary, seed)
  const steps = planSteps({
    dishType,
    base,
    cuisineLabel,
    seasoningBlend,
    maxTime,
  })

  const tuned = tuneForTargetCalories({
    ingredients: ingredientList,
    dietary,
    targetCalories,
  })

  const nextSteps = tuned?.note ? [...steps, `${steps.length + 1}. ${tuned.note}`] : steps

  return {
    title,
    cuisine: cuisineLabel,
    dietary: dietary || undefined,
    time: maxTime && Number(maxTime) > 0 ? Number(maxTime) : undefined,
    ingredients: tuned.ingredients,
    steps: nextSteps,
    estimatedCalories: tuned.estimatedCalories || estimateRecipeCalories({ ingredients: tuned.ingredients }),
    targetCalories: tuned.targetCalories,
  }
}
