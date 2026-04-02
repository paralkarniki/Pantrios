const theme = {
  appName: 'Pantrio',
  tagline: 'Turn ingredients into delicious meals — fast.',
  colors: {
    accent: '#d97706',
    accentDark: '#b45309'
  },
  labels: {
    ingredients: 'Ingredients',
    pantryPrompt: 'What do you have in your pantry?',
    pantryHelp: 'Enter ingredients and pick filters — Pantrio will suggest a recipe.',
    model: 'Model',
    tipPrefix: 'Tip',
    generate: 'Generate Recipe',
    cooking: 'Cooking...',
    copy: 'Copy',
    save: 'Save',
    favoritesTitle: 'Favorites',
    savedLocally: 'Saved locally',
    noFavorites: 'No saved recipes yet — save your favorites to see them here.',
    ingredientsSelected: 'Ingredients selected',
    favoritesSaved: 'Favorites saved'
  },
  placeholders: {
    ingredients: 'e.g. tomato, egg, spinach',
    cuisine: 'Cuisine',
    maxTime: 'Max min'
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
      flavor: 'Warm, spiced, layered',
      staples: ['cumin', 'turmeric', 'ginger']
    },
    Italian: {
      flavor: 'Herby, bright, tomato-forward',
      staples: ['olive oil', 'basil', 'garlic']
    },
    Mexican: {
      flavor: 'Smoky, zesty, earthy',
      staples: ['chili', 'lime', 'cilantro']
    },
    Chinese: {
      flavor: 'Savory, aromatic, balanced',
      staples: ['soy sauce', 'ginger', 'scallion']
    },
    Japanese: {
      flavor: 'Clean, umami-rich, subtle',
      staples: ['soy sauce', 'miso', 'sesame']
    },
    Thai: {
      flavor: 'Sweet, sour, spicy',
      staples: ['lime', 'chili', 'coconut']
    },
    Mediterranean: {
      flavor: 'Fresh, herbaceous, citrusy',
      staples: ['olive oil', 'lemon', 'oregano']
    },
    'Middle Eastern': {
      flavor: 'Fragrant, nutty, warming',
      staples: ['cumin', 'sumac', 'parsley']
    },
    French: {
      flavor: 'Rich, buttery, nuanced',
      staples: ['butter', 'thyme', 'shallot']
    },
    American: {
      flavor: 'Hearty, comfort-focused',
      staples: ['black pepper', 'onion', 'garlic']
    },
    Korean: {
      flavor: 'Spicy, tangy, savory',
      staples: ['gochujang', 'sesame oil', 'garlic']
    },
    Spanish: {
      flavor: 'Smoky, savory, olive-forward',
      staples: ['paprika', 'olive oil', 'garlic']
    }
  },
  modelOptions: [
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    { value: 'gpt-4o', label: 'gpt-4o' },
    { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' }
  ],
  tips: [
    'Try "tomato, egg" for a quick idea',
    'Combine cooked rice and leftover veggies',
    'Add a squeeze of lemon to brighten flavors'
  ]
}

export default theme
