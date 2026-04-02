import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { buildLocalRecipe } from '../lib/localRecipeGenerator'
import theme from '../lib/theme'
import AnimatedBackground from '../components/AnimatedBackground'

const FEATURES = [
	{
		title: 'Generate Recipes',
		description: 'Turn your pantry ingredients into quick meal ideas in seconds.',
		href: '/generate',
		emoji: '🥘',
	},
	{
		title: 'Explore Cuisines',
		description: 'Discover cuisine styles, flavors, and staple ingredients.',
		href: '/cuisines',
		emoji: '🌍',
	},
	{
		title: 'Weekly Planner',
		description: 'Plan meals for the week and save everything locally.',
		href: '/planner',
		emoji: '🗓️',
	},
	{
		title: 'Meal Calories',
		description: 'View estimated calorie totals for your generated meals.',
		href: '/calories',
		emoji: '🔥',
	},
	{
		title: 'Daily Calorie Plan',
		description: 'Set a daily calorie goal and auto-plan meals to match it.',
		href: '/daily-calories',
		emoji: '🎯',
	},
]

const QUICK_KITS = [
	{
		name: '15-Minute Protein Boost',
		ingredients: ['egg', 'spinach', 'tomato', 'onion'],
		cuisine: 'Indian',
		dietary: 'High Protein',
		maxTime: 15,
	},
	{
		name: 'Cozy Comfort Bowl',
		ingredients: ['rice', 'mushroom', 'garlic', 'carrot'],
		cuisine: 'Japanese',
		dietary: 'Vegetarian',
		maxTime: 25,
	},
	{
		name: 'Fresh & Light Plate',
		ingredients: ['cucumber', 'chickpeas', 'tomato', 'lettuce'],
		cuisine: 'Mediterranean',
		dietary: 'Vegan',
		maxTime: 20,
	},
]

export default function HomePage() {
	const [activeFeature, setActiveFeature] = useState(0)
	const [activeKit, setActiveKit] = useState(0)
	const [stats, setStats] = useState({ favorites: 0, recent: 0, planned: 0 })

	useEffect(() => {
		try {
			const favorites = JSON.parse(localStorage.getItem('pantrio:favorites') || '[]')
			const recent = JSON.parse(localStorage.getItem('pantrio:recent') || '[]')
			const planned = JSON.parse(localStorage.getItem('pantrio:meal-plan') || '[]')
			const plannedCount = Array.isArray(planned) ? planned.filter((r) => r?.meal?.trim()).length : 0

			setStats({
				favorites: Array.isArray(favorites) ? favorites.length : 0,
				recent: Array.isArray(recent) ? recent.length : 0,
				planned: plannedCount,
			})
		} catch (e) {}
	}, [])

	const previewRecipe = useMemo(() => {
		const kit = QUICK_KITS[activeKit]
		return buildLocalRecipe(kit)
	}, [activeKit])

	function shuffleExperience() {
		setActiveFeature(Math.floor(Math.random() * FEATURES.length))
		setActiveKit(Math.floor(Math.random() * QUICK_KITS.length))
	}

	return (
		<div className="min-h-screen py-12" style={{ paddingBottom: '3rem' }}>
			<AnimatedBackground />
			<div className="app-container">
				<section className="card text-center fade-in-up" style={{ padding: '2rem 1.2rem' }}>
					<div className="flex justify-center mb-4">
						<div className="hero-illustration">
							<img src="/img/logo.png" alt="Pantrio logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
						</div>
					</div>
					<h1 className="text-5xl font-extrabold gradient-text">{theme.appName}</h1>
					<p className="small-muted mt-3" style={{ maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
						{theme.tagline}
					</p>

					<div className="mt-6 flex flex-wrap justify-center gap-2">
						<span className="hero-badge">🌿 Reduce waste</span>
						<span className="hero-badge">⚡ Fast recipes</span>
						<span className="hero-badge">🆓 100% Free</span>
					</div>

					<div className="mt-6 flex justify-center gap-2 flex-wrap">
						<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>
							Start Generating Recipes
						</Link>
						<Link href="/cuisines" className="btn-primary" style={{ textDecoration: 'none' }}>
							Explore Cuisines
						</Link>
						<Link href="/calories" className="btn-primary" style={{ textDecoration: 'none' }}>
							Meal Calories
						</Link>
					</div>

					<div className="mt-5 flex justify-center gap-2 flex-wrap">
						<button
							type="button"
							className="btn-primary"
							onClick={shuffleExperience}
							style={{ background: 'linear-gradient(135deg,#0ea5e9,#0369a1)' }}
						>
							🎲 Shuffle Inspiration
						</button>
						<Link href="/planner" className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
							🗓️ Plan This Week
						</Link>
						<Link href="/daily-calories" className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg,#db2777,#be185d)' }}>
							🎯 Hit Daily Calories
						</Link>
					</div>

					<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
						<div className="card" style={{ padding: '.8rem 1rem' }}>
							<div className="small-muted">Saved Favorites</div>
							<div className="text-2xl font-bold mt-1">{stats.favorites}</div>
						</div>
						<div className="card" style={{ padding: '.8rem 1rem' }}>
							<div className="small-muted">Recent Recipes</div>
							<div className="text-2xl font-bold mt-1">{stats.recent}</div>
						</div>
						<div className="card" style={{ padding: '.8rem 1rem' }}>
							<div className="small-muted">Meals Planned</div>
							<div className="text-2xl font-bold mt-1">{stats.planned}</div>
						</div>
					</div>
				</section>

				<section className="mt-6 card fade-in-up" style={{ padding: '1rem 1.1rem' }}>
					<div className="mt-3 card" style={{ padding: '.75rem .85rem' }}>
						<img
							src="/img/chef.svg"
							alt="Home chef illustration"
							style={{
								width: '100%',
								height: 170,
								objectFit: 'contain',
								background: 'rgba(255,255,255,0.7)',
								borderRadius: 12,
								padding: '.4rem',
							}}
						/>
					</div>
				</section>

				<section className="mt-6 card fade-in-up" style={{ padding: '1rem 1.1rem' }}>
					<div className="flex items-center justify-between gap-3 flex-wrap">
						<div>
							<h2 className="text-2xl font-semibold" style={{ margin: 0 }}>Interactive Meal Preview</h2>
							<p className="small-muted mt-1">Try a starter meal-kit, then jump to generator.</p>
						</div>
						<Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>
							Generate from this idea
						</Link>
					</div>

					<div className="mt-3 flex gap-2 flex-wrap">
						{QUICK_KITS.map((kit, idx) => (
							<button
								key={kit.name}
								type="button"
								onClick={() => setActiveKit(idx)}
								style={{
									border: '1px solid rgba(217,119,6,0.22)',
									borderRadius: 999,
									padding: '.24rem .75rem',
									background: activeKit === idx ? 'rgba(217,119,6,0.18)' : 'white',
									color: '#92400e',
									fontSize: '.82rem',
									cursor: 'pointer',
								}}
							>
								{kit.name}
							</button>
						))}
					</div>

					<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="card" style={{ padding: '.9rem 1rem' }}>
							<div className="small-muted">Suggested Title</div>
							<div className="text-lg font-semibold mt-1">{previewRecipe.title}</div>
							<div className="small-muted mt-1">{previewRecipe.cuisine} • {previewRecipe.time || 20} min</div>
							<div className="mt-3 flex flex-wrap gap-2">
								{(previewRecipe.ingredients || []).slice(0, 4).map((ing) => (
									<span key={ing} className="chip">{ing}</span>
								))}
							</div>
						</div>

						<div className="card" style={{ padding: '.9rem 1rem' }}>
							<div className="small-muted">First Step Preview</div>
							<p style={{ marginTop: '.45rem', marginBottom: 0, color: '#1c1917' }}>
								{(previewRecipe.steps || [])[0] || 'Add ingredients to begin.'}
							</p>
						</div>
					</div>
				</section>

				<section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in-up">
					{FEATURES.map((item, idx) => (
						<div
							key={item.href}
							className="card"
							onMouseEnter={() => setActiveFeature(idx)}
							style={{
								padding: '1rem 1.1rem',
								border: activeFeature === idx ? '1px solid rgba(217,119,6,0.35)' : undefined,
								boxShadow: activeFeature === idx ? '0 6px 24px rgba(217,119,6,0.15)' : undefined,
								transform: activeFeature === idx ? 'translateY(-2px)' : 'translateY(0px)',
								transition: 'all .18s ease',
							}}
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<h2 className="text-xl font-semibold" style={{ margin: 0 }}>
										{item.emoji} {item.title}
									</h2>
									<p className="small-muted mt-2" style={{ marginBottom: 0 }}>{item.description}</p>
								</div>
								<Link href={item.href} className="btn-primary" style={{ textDecoration: 'none' }}>
									Open
								</Link>
							</div>
						</div>
					))}
				</section>
			</div>
		</div>
	)
}
