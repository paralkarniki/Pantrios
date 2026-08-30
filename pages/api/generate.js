const checkRateLimit = require('../../lib/rateLimit')

const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'])

function parseClientIp(req) {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.trim()) {
    return xf.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

function allowedOrigins() {
  const envOrigins = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || '').trim()

  // Always allow localhost in dev
  const devOrigins = process.env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : []

  // Auto-detect Vercel deployment URLs from built-in env vars
  const vercelUrl = String(process.env.VERCEL_URL || '').trim()
  const vercelBranchUrl = String(process.env.VERCEL_BRANCH_URL || '').trim()
  const vercelOrigins = [
    vercelUrl ? `https://${vercelUrl}` : '',
    vercelBranchUrl ? `https://${vercelBranchUrl}` : '',
  ].filter(Boolean)

  return new Set([
    ...devOrigins,
    ...envOrigins,
    ...vercelOrigins,
    ...(appUrl ? [appUrl] : []),
  ])
}

function isOriginAllowed(origin, origins) {
  if (!origin) return true // same-origin requests (no Origin header) always allowed
  if (origins.has(origin)) return true
  // Also allow any *.vercel.app subdomain belonging to this project
  const projectName = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || '').replace(/^https?:\/\//, '').split('.')[0]
  if (projectName && origin.includes(projectName) && origin.endsWith('.vercel.app')) return true
  return false
}

function securityAudit(action, details = {}) {
  try {
    const payload = {
      action,
      source: 'api/generate',
      timestamp: new Date().toISOString(),
      ...details,
    }
    console.info('[security-audit]', JSON.stringify(payload))
  } catch {
    // Best-effort logging only
  }
}

function sanitizePayload(body = {}) {
  const rawIngredients = Array.isArray(body.ingredients) ? body.ingredients : []
  const ingredients = rawIngredients
    .map((x) => String(x || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20)

  const dietary = String(body.dietary || '').trim().slice(0, 40)
  const cuisine = String(body.cuisine || '').trim().slice(0, 40)

  const n = Number(body.maxTime)
  const maxTime = Number.isFinite(n) ? Math.max(5, Math.min(180, Math.round(n))) : undefined

  const c = Number(body.targetCalories)
  const targetCalories = Number.isFinite(c) ? Math.max(100, Math.min(5000, Math.round(c))) : undefined

  return { ingredients, dietary, cuisine, maxTime, targetCalories }
}

function toTitleCase(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
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
  const lower = haystack.map(x => String(x).toLowerCase())
  return words.some(w => lower.some(v => v.includes(w)))
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
  const ing = ingredients.map(i => String(i).toLowerCase())
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
    indian: [
      'cumin, coriander, turmeric, garam masala',
      'mustard seeds, curry powder, chili flakes'
    ],
    italian: [
      'oregano, basil, thyme, chili flakes',
      'garlic, parsley, black pepper'
    ],
    mexican: [
      'cumin, smoked paprika, chili powder, lime zest',
      'oregano, chipotle powder, garlic'
    ],
    asian: [
      'soy sauce, sesame oil, ginger, garlic',
      'rice vinegar, chili paste, scallions'
    ],
    default: [
      'salt, black pepper, garlic powder, paprika',
      'herbs, lemon juice, black pepper'
    ]
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
    other: ['to taste', '1 tsp', '1 tbsp']
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

function planSteps({ dishType, base, cuisineLabel, seasoningBlend, maxTime, seed }) {
  const proteins = base.filter(i => ingredientCategory(i) === 'protein')
  const carbs = base.filter(i => ingredientCategory(i) === 'carb')
  const veggies = base.filter(i => ingredientCategory(i) === 'veg')
  const aromatics = base.filter(i => ingredientCategory(i) === 'aromatic')

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
      'Finish with lemon juice, adjust salt, and serve immediately.'
    ],
    'grain-bowl': [
      `Cook ${carbText} until tender; fluff and keep warm.${timeHint}`,
      `In another pan, sauté ${aromaticText}, then cook ${proteinText} with ${seasoningBlend}.`,
      `Quick-cook ${vegText} until just crisp-tender to keep texture.`,
      `Build bowls with grains at the base, top with protein and vegetables, then drizzle pan juices.`,
      `Taste, adjust seasoning, and garnish with fresh herbs or citrus.`
    ],
    'masala-curry': [
      `Prep ${base.slice(0, 6).join(', ')}; keep tomatoes and aromatics separate.${timeHint}`,
      `Sauté ${aromaticText} in oil until softened, then add ${seasoningBlend} to bloom spices.`,
      'Add tomatoes and cook until the mixture thickens into a rich masala base.',
      `Fold in ${proteinText} and ${vegText}, add a splash of water, and simmer until well-coated.`,
      `Adjust salt and heat level, then serve warm with your favorite side.`
    ],
    'taco-bowl': [
      `Prep ${proteinText} and ${vegText}; keep a fresh topping component aside.${timeHint}`,
      `Sauté ${proteinText} with ${seasoningBlend} until aromatic and lightly caramelized.`,
      `Cook ${vegText} briefly so they stay bright and slightly crunchy.`,
      `Assemble bowls with a base (rice/beans if available), then add cooked mix and toppings.`,
      'Finish with lime or lemon juice and serve.'
    ],
    'warm-salad': [
      `Prep greens and vegetables; pat dry for better texture.${timeHint}`,
      `Quick-sear ${proteinText} with ${seasoningBlend}, then rest for 2 minutes.`,
      `Toss ${vegText} and greens with olive oil, lemon, salt, and pepper.`,
      `Slice protein and layer over the salad for a warm-cool contrast.`,
      'Serve immediately while the protein is still warm.'
    ],
    'stir-fry': [
      `Prep everything before cooking (stir-fry moves fast).${timeHint}`,
      `Sear ${proteinText} quickly in a hot pan; remove once lightly browned.`,
      `Stir-fry ${aromaticText} then ${vegText} over high heat for 2-4 minutes.`,
      `Return protein and toss with ${seasoningBlend} until evenly coated.`,
      'Taste and adjust seasoning; serve hot.'
    ],
    'one-pot': [
      `Prep ${base.slice(0, 6).join(', ')} and keep components organized.${timeHint}`,
      `Cook ${aromaticText} in oil until soft and fragrant.`,
      `Add ${proteinText} and sear lightly, then stir in ${vegText} and ${seasoningBlend}.`,
      'Add a small splash of water, cover, and cook gently until tender and flavorful.',
      `Serve as a ${cuisineLabel} comfort-style dish.`
    ]
  }

  const selected = stepsByType[dishType] || stepsByType['one-pot']
  return selected.map((s, idx) => `${idx + 1}. ${s}`)
}

function buildTitle({ dishType, cuisineLabel, timeLabel, dietaryLabel, calorieLabel, hero, seed }) {
  const suffixByType = {
    'flash-skillet': ['Skillet', 'Sauté', 'Quick Pan Toss'],
    'grain-bowl': ['Power Bowl', 'Nourish Bowl', 'Harvest Bowl'],
    'masala-curry': ['Masala', 'Curry', 'Spiced Simmer'],
    'taco-bowl': ['Taco Bowl', 'Fiesta Bowl', 'Spice Bowl'],
    'warm-salad': ['Warm Salad', 'Crunch Bowl', 'Fresh Plate'],
    'stir-fry': ['Stir-Fry', 'Wok Toss', 'Sizzler'],
    'one-pot': ['One-Pot Meal', 'Pantry Pot', 'Comfort Pot']
  }
  const suffix = pick(suffixByType[dishType] || ['Recipe'], seed + 17)
  return `${timeLabel}${calorieLabel}${dietaryLabel}${cuisineLabel} ${hero} ${suffix}`.replace(/\s+/g, ' ').trim()
}

function buildLocalRecipe({ ingredients = [], dietary = '', maxTime, targetCalories, cuisine = '' }) {
  const cleaned = ingredients
    .map(i => String(i || '').trim())
    .filter(Boolean)
    .slice(0, 10)

  const base = cleaned.length ? cleaned : ['onion', 'garlic', 'tomato', 'chickpeas']
  const seed = hashString(`${base.join('|')}|${dietary}|${maxTime || ''}|${cuisine}|${targetCalories || ''}`)
  const cuisineLabel = cuisine ? toTitleCase(cuisine) : 'Home-Style'
  const dietaryLabel = dietary ? `${dietary} ` : ''
  const timeLabel = maxTime && Number(maxTime) > 0 ? `${Number(maxTime)}-Minute ` : 'Quick '
  const calorieLabel = targetCalories && Number(targetCalories) > 0 ? `${Number(targetCalories)}-Cal ` : ''

  const dishType = classifyDish({ ingredients: base, cuisine, maxTime })
  const hero = toTitleCase(pick(base, seed) || 'Pantry')
  const seasoningBlend = cuisineSeasoning(cuisine, dishType, dietary, seed)

  const title = buildTitle({ dishType, cuisineLabel, timeLabel, dietaryLabel, calorieLabel, hero, seed })
  const ingredientList = ingredientLines(base, dietary, seed)
  const steps = planSteps({
    dishType,
    base,
    cuisineLabel,
    seasoningBlend,
    maxTime,
    seed
  })

  return {
    title,
    cuisine: cuisineLabel,
    dietary: dietary || undefined,
    time: maxTime && Number(maxTime) > 0 ? Number(maxTime) : undefined,
    calories: targetCalories && Number(targetCalories) > 0 ? Number(targetCalories) : undefined,
    ingredients: ingredientList,
    steps
  }
}

export default async function handler(req, res) {
  const ip = parseClientIp(req)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    securityAudit('method_blocked', { ip, method: req.method || 'unknown', status: 'blocked' })
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Cache-Control', 'no-store')

  const origin = String(req.headers.origin || '').trim()
  const allowed = allowedOrigins()
  if (!isOriginAllowed(origin, allowed)) {
    securityAudit('origin_blocked', { ip, origin, status: 'blocked' })
    return res.status(403).json({ error: 'Forbidden origin' })
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    securityAudit('content_type_blocked', { ip, contentType, status: 'blocked' })
    return res.status(415).json({ error: 'Content-Type must be application/json' })
  }

  const { ingredients = [], dietary = '', maxTime, targetCalories, cuisine = '' } = sanitizePayload(req.body || {})
  const requestedModel = String(req.body?.model || '').trim()

  if (!ingredients.length) {
    securityAudit('validation_failed', { ip, reason: 'missing_ingredients', status: 'blocked' })
    return res.status(400).json({ error: 'Please provide at least one ingredient' })
  }

  const minuteLimit = checkRateLimit(`${ip}:minute`, 20, 60_000)
  const hourLimit = checkRateLimit(`${ip}:hour`, 200, 3_600_000)

  res.setHeader('X-RateLimit-Limit', String(minuteLimit.limit))
  res.setHeader('X-RateLimit-Remaining', String(Math.min(minuteLimit.remaining, hourLimit.remaining)))
  res.setHeader('X-RateLimit-Reset', String(Math.min(minuteLimit.resetAt, hourLimit.resetAt)))

  if (!minuteLimit.allowed || !hourLimit.allowed) {
    const retryAfterMs = Math.max(minuteLimit.retryAfterMs || 0, hourLimit.retryAfterMs || 0)
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000))
    res.setHeader('Retry-After', String(retryAfterSec))
    securityAudit('rate_limit_blocked', {
      ip,
      status: 'blocked',
      minuteLimit,
      hourLimit,
      retryAfterSec,
    })
    return res.status(429).json({ error: 'Rate limit exceeded', retryAfterSec })
  }

  const useOpenAI = String(process.env.USE_OPENAI || 'false').toLowerCase() === 'true'
  const key = process.env.OPENAI_API_KEY

  // Free mode is the default: local generator, no paid API required.
  if (!useOpenAI || !key) {
    securityAudit('recipe_generated', {
      ip,
      status: 'success',
      mode: 'local',
      ingredientsCount: ingredients.length,
    })
    return res.status(200).json(buildLocalRecipe({ ingredients, dietary, maxTime, targetCalories, cuisine }))
  }

  try {
    const fallbackModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const model = requestedModel && ALLOWED_MODELS.has(requestedModel) ? requestedModel : fallbackModel

    const prompt = `You are a helpful chef. Given available ingredients: ${JSON.stringify(ingredients)}. Dietary constraint: ${dietary}. Max time: ${maxTime || 'no limit'}. Cuisine: ${cuisine}. Return only valid JSON with keys: title, ingredients (array of strings), steps (array of strings). Keep ingredients concise.`

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: 'You are a recipe generator.' }, { role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 700
      })
    })

    if (!r.ok) {
      const errorText = await r.text()
      securityAudit('openai_request_failed', {
        ip,
        status: 'error',
        code: r.status,
      })
      console.error('OpenAI request failed:', r.status, errorText)
      return res.status(502).json({ error: 'Upstream generation service failed' })
    }

    const data = await r.json()
    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || ''

    // Try parse JSON from the model response
    let parsed = null
    try {
      parsed = JSON.parse(text)
    } catch (e) {
      const m = text.match(/\{[\s\S]*\}/)
      if (m) {
        try { parsed = JSON.parse(m[0]) } catch (e) { parsed = null }
      }
    }

    if (!parsed) {
      securityAudit('openai_response_unparsable', { ip, status: 'error' })
      return res.status(200).json({ title: 'Generated Recipe', ingredients, steps: ['Model returned unparsable response.'] })
    }

    securityAudit('recipe_generated', {
      ip,
      status: 'success',
      mode: 'openai',
      ingredientsCount: ingredients.length,
    })
    return res.status(200).json(parsed)
  } catch (err) {
    securityAudit('generation_failed', {
      ip,
      status: 'error',
      message: String(err?.message || 'unknown_error'),
    })
    console.error(err)
    return res.status(500).json({ error: 'Generation failed' })
  }
}
