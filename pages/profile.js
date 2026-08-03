import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import PageHeader from '../components/PageHeader'
import Link from 'next/link'
import { subscribeToAuth, logout } from '../lib/auth'
import { saveUserData, subscribeUserData } from '../lib/userData'
import { RequireAuth } from '../lib/requireAuth'
import { readScopedJSON, writeScopedJSON, scopedStorageKey, listScopedKeys } from '../lib/clientStorage'

const PROFILE_HEALTH_KEY = 'pantrio:profile-health'
const ACTIVITY_MULTIPLIERS = {
  sedentary: 28,
  light: 31,
  moderate: 34,
  active: 37,
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [counts, setCounts] = useState({ favorites: 0, recent: 0, planned: 0 })
  const [message, setMessage] = useState('')
  const [health, setHealth] = useState({ weightKg: '', activity: 'moderate' })

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    let unsubUserData = null

    const loadLocalCounts = () => {
      try {
        const favorites = readScopedJSON('pantrio:favorites', user?.uid, [], { legacyKey: 'pantrio:favorites' })
        const recent = readScopedJSON('pantrio:recent', user?.uid, [], { legacyKey: 'pantrio:recent' })

        const weekKeys = listScopedKeys('pantrio:meal-plan:', user?.uid)
        let plannedCount = 0
        for (const key of weekKeys) {
          const rows = JSON.parse(localStorage.getItem(key) || '[]')
          if (Array.isArray(rows)) {
            plannedCount += rows.filter((r) => String(r?.meal || '').trim()).length
          }
        }

        setCounts({
          favorites: Array.isArray(favorites) ? favorites.length : 0,
          recent: Array.isArray(recent) ? recent.length : 0,
          planned: plannedCount,
        })
      } catch (e) {
        setCounts({ favorites: 0, recent: 0, planned: 0 })
      }
    }

    const loadLocalHealth = () => {
      try {
        const saved = readScopedJSON(PROFILE_HEALTH_KEY, user?.uid, {}, { legacyKey: PROFILE_HEALTH_KEY })
        setHealth({
          weightKg: saved?.weightKg ? String(saved.weightKg) : '',
          activity: saved?.activity || 'moderate',
        })
      } catch (e) {
        setHealth({ weightKg: '', activity: 'moderate' })
      }
    }

    if (!user || !user.uid) {
      loadLocalCounts()
      loadLocalHealth()
      return () => {
        if (unsubUserData) unsubUserData()
      }
    }

    unsubUserData = subscribeUserData(user.uid, (data) => {
      const favorites = Array.isArray(data.favorites) ? data.favorites.length : 0
      const recent = Array.isArray(data.recent) ? data.recent.length : 0
      const planned = Array.isArray(data.mealPlan) ? data.mealPlan.length : 0

      if (data?.profileHealth) {
        setHealth({
          weightKg: data.profileHealth.weightKg ? String(data.profileHealth.weightKg) : '',
          activity: data.profileHealth.activity || 'moderate',
        })
      } else {
        loadLocalHealth()
      }

      if (favorites || recent || planned) {
        setCounts({ favorites, recent, planned })
      } else {
        loadLocalCounts()
      }
    })

    return () => {
      if (unsubUserData) unsubUserData()
    }
  }, [user])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  const weightValue = Number(health.weightKg)
  const hasWeight = Number.isFinite(weightValue) && weightValue > 0
  const estimatedDailyCalories = hasWeight
    ? Math.round(weightValue * (ACTIVITY_MULTIPLIERS[health.activity] || ACTIVITY_MULTIPLIERS.moderate))
    : 0

  async function saveHealthProfile() {
    try {
      const cleanWeight = Number(health.weightKg)
      if (!Number.isFinite(cleanWeight) || cleanWeight < 20 || cleanWeight > 300) {
        throw new Error('Please enter a valid weight between 20 and 300 kg.')
      }

      const payload = {
        weightKg: cleanWeight,
        activity: health.activity || 'moderate',
        estimatedDailyCalories: Math.round(cleanWeight * (ACTIVITY_MULTIPLIERS[health.activity] || ACTIVITY_MULTIPLIERS.moderate)),
        updatedAt: new Date().toISOString(),
      }

      writeScopedJSON(PROFILE_HEALTH_KEY, user?.uid, payload)
      if (user?.uid) {
        await saveUserData(user.uid, { profileHealth: payload })
      }
      setMessage('Weight saved. Daily calorie estimate updated.')
    } catch (err) {
      setMessage(err?.message || 'Could not save your weight.')
    }
  }

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), user: null, data: {} }
    try {
      payload.user = JSON.parse(localStorage.getItem('pantrio:localUser') || 'null')
    } catch {}
    const scopedKeys = [
      scopedStorageKey('pantrio:favorites', user?.uid),
      scopedStorageKey('pantrio:recent', user?.uid),
      scopedStorageKey('pantrio:family-recipes', user?.uid),
      scopedStorageKey('pantrio:daily-calorie-plan', user?.uid),
      scopedStorageKey('pantrio:profile-health', user?.uid),
      ...listScopedKeys('pantrio:meal-plan:', user?.uid),
      'pantrio:localUser',
    ]

    scopedKeys.forEach((k) => {
      try {
        payload.data[k] = JSON.parse(localStorage.getItem(k) || 'null')
      } catch (e) {
        payload.data[k] = null
      }
    })

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pantrio-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Export started — downloaded JSON file.')
  }

  function updateEmail() {
    const next = window.prompt('Enter new email', user?.email || '')
    if (!next) return
    try {
      const clean = String(next).trim()
      if (clean.length < 4) throw new Error('Email too short')
      localStorage.setItem('pantrio:localUser', JSON.stringify({ email: clean }))
      window.dispatchEvent(new Event('pantrio:auth'))
      setMessage('Email updated')
    } catch (err) {
      setMessage(err?.message || 'Update failed')
    }
  }

  return (
    <RequireAuth fallbackPath="/profile">
      <div className="min-h-screen py-10">
        <div className="app-container">
          <div className="card fade-in-up">
            <PageHeader
              title="Profile"
              subtitle="Your account and locally stored data"
            />

          {!user ? (
            <div style={{ padding: '1rem 0' }}>
              <div className="small-muted">You are not signed in.</div>
              <div style={{ marginTop: 10 }}>
                <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Sign in</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Greeting */}
              <div style={{ padding: '1.2rem', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.08))', borderRadius: 12, border: '1px solid rgba(34,197,94,0.15)' }}>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#16a34a' }}>👋 Hi, {(() => {
                  const fn = String(user?.firstname || '').trim()
                  if (fn && !['chef', 'guest', 'user'].includes(fn.toLowerCase())) return fn
                  if (user?.email) {
                    const local = String(user.email).split('@')[0]
                    const parts = local.split(/[\.\+\-_]/).filter(Boolean)
                    const candidate = (parts[0] || local || '').replace(/[^a-zA-Z]/g, '')
                    if (candidate) return candidate.charAt(0).toUpperCase() + candidate.slice(1)
                  }
                  return 'Chef'
                })()}!</p>
                <p style={{ margin: '0.5rem 0 0 0', color: '#78716c', fontSize: '.95rem' }}>Welcome to your Pantrio profile. Explore your saved recipes and manage your preferences.</p>
              </div>

              {/* Account Section */}
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>👤 Account</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div className="small-muted">Email</div>
                    <div style={{ fontWeight: 700, marginTop: 8, wordBreak: 'break-all' }}>{user.email}</div>
                  </div>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div className="small-muted">Status</div>
                    <div style={{ fontWeight: 700, marginTop: 8, color: '#16a34a' }}>✓ Logged in</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={updateEmail} className="btn-primary">✏️ Update email</button>
                  <button type="button" onClick={handleLogout} className="btn-secondary">🚪 Logout</button>
                </div>

                {message && <div style={{ marginTop: 12, padding: '0.6rem 0.9rem', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: '#16a34a', fontSize: '.9rem' }}>{message}</div>}
              </div>

              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>🔥 Daily calories</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(220px, .8fr)', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div className="small-muted" style={{ marginBottom: 10 }}>Enter your weight to get a rough daily calorie estimate.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '.9rem' }}>Weight (kg)</label>
                        <input
                          className="form-control"
                          placeholder="e.g. 68"
                          value={health.weightKg}
                          onChange={(e) => setHealth((prev) => ({ ...prev, weightKg: e.target.value.replace(/[^\d.]/g, '') }))}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '.9rem' }}>Activity</label>
                        <select
                          className="form-control"
                          value={health.activity}
                          onChange={(e) => setHealth((prev) => ({ ...prev, activity: e.target.value }))}
                        >
                          <option value="sedentary">Sedentary</option>
                          <option value="light">Lightly active</option>
                          <option value="moderate">Moderately active</option>
                          <option value="active">Very active</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" onClick={saveHealthProfile} className="btn-primary">Save calorie profile</button>
                      <Link href="/daily-calories" className="btn-secondary" style={{ textDecoration: 'none' }}>Open meal planner</Link>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(59,130,246,0.08))' }}>
                    <div className="small-muted">Estimated maintenance calories</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#b45309', marginTop: 8 }}>
                      {hasWeight ? `${estimatedDailyCalories} kcal/day` : '—'}
                    </div>
                    <div style={{ marginTop: 10, fontSize: '.92rem', color: '#78716c', lineHeight: 1.5 }}>
                      This is a quick estimate based on your weight and activity level. Use it as a planning starting point.
                    </div>
                    {hasWeight && (
                      <div style={{ marginTop: 12, fontSize: '.88rem', color: '#57534e' }}>
                        Weight: <strong>{weightValue} kg</strong> · Activity: <strong>{health.activity}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data & Storage Section */}
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>💾 Your Data</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⭐</div>
                    <div className="small-muted">Saved favorites</div>
                    <div style={{ fontWeight: 700, marginTop: 8, fontSize: '1.5rem' }}>{counts.favorites}</div>
                  </div>
                  <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📋</div>
                    <div className="small-muted">Recent recipes</div>
                    <div style={{ fontWeight: 700, marginTop: 8, fontSize: '1.5rem' }}>{counts.recent}</div>
                  </div>
                  <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🗓️</div>
                    <div className="small-muted">Planned meals</div>
                    <div style={{ fontWeight: 700, marginTop: 8, fontSize: '1.5rem' }}>{counts.planned}</div>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>⚙️ Actions</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={exportData} className="btn-primary">📥 Export my data</button>
                  <Link href="/family-recipes" className="btn-primary" style={{ textDecoration: 'none' }}>👨‍👩‍👧 Family Recipes</Link>
                  <Link href="/planner" className="btn-primary" style={{ textDecoration: 'none' }}>📅 View meal plan</Link>
                </div>
              </div>

              {/* Help & Info Section */}
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>ℹ️ About</h3>
                <div className="card" style={{ padding: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#1c1917' }}>
                    <strong>Pantrio</strong> is a browser-first recipe tool. When signed in, your data syncs to Firebase so it follows you across devices.
                  </p>
                  <ul style={{ margin: '0.75rem 0 0 1.5rem', color: '#78716c', fontSize: '.9rem' }}>
                    <li>✓ Optional account for cloud sync</li>
                    <li>✓ 100% free, no ads, no tracking</li>
                    <li>✓ Favorites, plans, and recipes can sync to Firestore</li>
                    <li>✓ Export & backup your recipes anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
