const theme = {
  appName: 'Pantrio',
  tagline: 'Turn pantry bits into tasty wins — with a little kitchen swagger.',
  colors: {
    accent: '#ec8a12',
    accentDark: '#c85a12'
  },
  labels: {
    ingredients: 'Ingredient squad',
    pantryPrompt: 'What chaos is hiding in your pantry?',
    pantryHelp: 'Drop in ingredients and filters — Pantrio will do the delicious detective work.',
    model: 'Brainpower',
    tipPrefix: 'Kitchen gossip',
    generate: 'Cook up a recipe',
    cooking: 'Cooking up magic...',
    copy: 'Copy dish',
    save: 'Save the yum',
    favoritesTitle: 'Hall of Fame',
    savedLocally: 'Saved on this device',
    noFavorites: 'No favorites yet — rescue a recipe and give it a home here.',
    ingredientsSelected: 'Ingredients in the mix',
    favoritesSaved: 'Recipe saved to the yum jar'
  },
  placeholders: {
    ingredients: 'e.g. tomato, egg, spinach, maybe a miracle',
    cuisine: 'Cuisine mood',
    maxTime: 'Max minutes'
  },
  dietaryOptions: [
    { value: '', label: 'No dietary filter' },
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Vegetarian', label: 'Vegetarian' },
    { value: 'Keto', label: 'Keto' },
    { value: 'Gluten-Free', label: 'Gluten-Free' }
  ],
  cuisineOptions: [
    'Indian',
    'Italian',
    'Mexican',
    'Chinese',
    'Japanese',
    'Thai',
    'Mediterranean',
    'Middle Eastern',
    'French',
    'American',
    'Korean',
    'Spanish'
  ],
  cuisineGuides: {
    Indian: {
      flavor: 'Warm, spiced, and unapologetically alive',
      staples: ['cumin', 'turmeric', 'ginger']
    },
    Italian: {
      flavor: 'Herby, bright, and tomato’s biggest fan',
      staples: ['olive oil', 'basil', 'garlic']
    },
    Mexican: {
      flavor: 'Smoky, zesty, and here for a good time',
      staples: ['chili', 'lime', 'cilantro']
    },
    Chinese: {
      flavor: 'Savory, aromatic, and deeply satisfying',
      staples: ['soy sauce', 'ginger', 'scallion']
    },
    Japanese: {
      flavor: 'Clean, umami-rich, and quietly brilliant',
      staples: ['soy sauce', 'miso', 'sesame']
    },
    Thai: {
      flavor: 'Sweet, sour, spicy, and slightly dramatic',
      staples: ['lime', 'chili', 'coconut']
    },
    Mediterranean: {
      flavor: 'Fresh, herbaceous, and sunshine-adjacent',
      staples: ['olive oil', 'lemon', 'oregano']
    },
    'Middle Eastern': {
      flavor: 'Fragrant, nutty, and comforting in the best way',
      staples: ['cumin', 'sumac', 'parsley']
    },
    French: {
      flavor: 'Rich, buttery, and casually fancy',
      staples: ['butter', 'thyme', 'shallot']
    },
    American: {
      flavor: 'Hearty, comforting, and no one leaves hungry',
      staples: ['black pepper', 'onion', 'garlic']
    },
    Korean: {
      flavor: 'Spicy, tangy, savory, and full of attitude',
      staples: ['gochujang', 'sesame oil', 'garlic']
    },
    Spanish: {
      flavor: 'Smoky, savory, and olive oil’s playground',
      staples: ['paprika', 'olive oil', 'garlic']
    }
  },
  modelOptions: [
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    { value: 'gpt-4o', label: 'gpt-4o' },
    { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' }
  ],
  tips: [
    'Try "tomato, egg" when dinner needs a hero',
    'Leftover rice + lonely veggies = accidental masterpiece',
    'A squeeze of lemon can act like a tiny spotlight for flavors'
  ]
}

export default theme
