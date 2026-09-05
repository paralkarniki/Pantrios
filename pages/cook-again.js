import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import FeaturePage from '../components/FeaturePage'
import RecipeCard from '../components/RecipeCard'
import { subscribeToAuth } from '../lib/auth'
import { readScopedJSON } from '../lib/clientStorage'

const RECENT_KEY = 'pantrio:recent'

function encodeRecipe(recipe) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(recipe))))
}

export default function CookAgainPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const saved = readScopedJSON(RECENT_KEY, user?.uid, [], { legacyKey: RECENT_KEY })
    setRecipes(Array.isArray(saved) ? saved : [])
  }, [user?.uid])

  function rerun(recipe) {
    const encoded = encodeRecipe(recipe)
    router.push(`/generate?r=${encodeURIComponent(encoded)}`)
  }

  return (
    <FeaturePage
      title="Cook Again Memory"
      subtitle="Instantly rerun successful meals"
      intro="Remember meals that worked well and bring them back with one click. This makes the app feel personal and helps users repeat their favorites without rebuilding them from scratch."
      badge="Memory mode"
      actions={<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Start new recipe</Link>}
      highlights={[
        { icon: '🧠', title: 'Recipe memory', text: 'Keeps successful meals close.' },
        { icon: '🔁', title: 'One-click rerun', text: 'Reuse the same recipe instantly.' },
        { icon: '⭐', title: 'Favorite loop', text: 'Repeat the meals people enjoy most.' },
      ]}
    >
      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Recent successful meals</h2>
          <span className="badge">{recipes.length} saved</span>
        </div>
      </section>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {recipes.length ? recipes.map((recipe) => (
          <div key={recipe.title || JSON.stringify(recipe)} className="card fade-in-up">
            <RecipeCard recipe={recipe} onSave={() => {}} />
            <div style={{ marginTop: '1rem' }}>
              <button type="button" className="btn-primary" onClick={() => rerun(recipe)}>
                Cook again
              </button>
            </div>
          </div>
        )) : (
          <section className="card fade-in-up">
            <p className="small-muted" style={{ margin: 0 }}>No recent meals yet. Generate a recipe first, then return here to rerun it instantly.</p>
          </section>
        )}
      </div>
    </FeaturePage>
  )
}
