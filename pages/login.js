import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { subscribeToAuth, loginWithEmail, loginWithGoogle, signupWithEmail, logout, sendPasswordReset } from '../lib/auth'

const isProduction = process.env.NODE_ENV === 'production'
const ENABLE_TEST_USERS = !isProduction && process.env.NEXT_PUBLIC_ENABLE_TEST_USERS === 'true'
const TEST_USER_PASSWORD = String(process.env.NEXT_PUBLIC_TEST_USER_PASSWORD || '')

const TEST_USERS = [
	{ email: 'alex.smith@example.com', firstname: 'Alex' },
	{ email: 'maria.gonzalez@example.com', firstname: 'Maria' },
	{ email: 'sam99@example.com', firstname: 'Sam' },
]

export default function LoginPage() {
		const router = useRouter()
		const [user, setUser] = useState(null)
		const [mode, setMode] = useState('login')

		const [email, setEmail] = useState('')
		const [password, setPassword] = useState('')
		const [firstname, setFirstname] = useState('')
		const [busy, setBusy] = useState(false)
		const [message, setMessage] = useState('')
		const [showReset, setShowReset] = useState(false)
		const [suppressRedirect, setSuppressRedirect] = useState(false)

		useEffect(() => {
			const unsub = subscribeToAuth((u) => setUser(u))
			return () => unsub()
		}, [])

		useEffect(() => {
			const m = String(router.query?.mode || '').toLowerCase()
			if (m === 'signup') setMode('signup')
			if (m === 'login') setMode('login')
		}, [router.query?.mode])

		useEffect(() => {
			if (!user) return
			if (suppressRedirect) return
			const params = new URLSearchParams(window.location.search)
			const redirect = params.get('redirect')
			router.replace(redirect || '/generate')
		}, [user, router, suppressRedirect])

		const canSubmit = useMemo(() => {
			return email.trim().length > 3 && password.length >= 6
		}, [email, password])

		async function onSubmit(e) {
			e.preventDefault()
			setBusy(true)
			setMessage('')
			try {
				if (mode === 'signup') {
					await signupWithEmail(email.trim(), password, firstname.trim())
					setMessage('Account created. Redirecting…')
				} else {
					await loginWithEmail(email.trim(), password)
					setMessage('Logged in. Redirecting…')
				}
			} catch (err) {
				setMessage(err?.message || 'Authentication failed')
			} finally {
				setBusy(false)
			}
		}

		async function onGoogle() {
			setBusy(true)
			setMessage('')
			try {
				const user = await loginWithGoogle()
				if (user) setMessage('Logged in. Redirecting…')
				else setMessage('Redirecting to Google sign-in…')
			} catch (err) {
				setMessage(err?.message || 'Google login failed')
			} finally {
				setBusy(false)
			}
		}

		async function quickLogin(u) {
			if (!ENABLE_TEST_USERS) return
			if (!u) return
			if (!TEST_USER_PASSWORD) {
				setMessage('Test user password is not configured. Set NEXT_PUBLIC_TEST_USER_PASSWORD for dev-only quick login.')
				return
			}
			setBusy(true)
			setMessage('')
			try {
				await loginWithEmail(u.email, TEST_USER_PASSWORD, u.firstname)
				setMessage('Logged in as ' + (u.firstname || u.email))
			} catch (err) {
				const code = String(err?.code || '').toLowerCase()
				if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('invalid-login-credentials')) {
					try {
						await signupWithEmail(u.email, TEST_USER_PASSWORD, u.firstname)
						setMessage('Created and logged in as ' + (u.firstname || u.email))
					} catch (signupErr) {
						setMessage(signupErr?.message || 'Quick login/signup failed')
					}
				} else {
					setMessage(err?.message || 'Quick login failed')
				}
			} finally {
				setBusy(false)
			}
		}

		async function createSampleUsers() {
			if (!ENABLE_TEST_USERS) return
			if (!TEST_USER_PASSWORD) {
				setMessage('Test user password is not configured. Set NEXT_PUBLIC_TEST_USER_PASSWORD for dev-only seeding.')
				return
			}
			setBusy(true)
			setMessage('')
			setSuppressRedirect(true)
			try {
				let created = 0
				let synced = 0
				let failed = 0

				for (const u of TEST_USERS) {
					try {
						await signupWithEmail(u.email, TEST_USER_PASSWORD, u.firstname)
						created += 1
					} catch (err) {
						const code = String(err?.code || '').toLowerCase()
						const msg = String(err?.message || '').toLowerCase()
						const exists = code.includes('email-already-in-use') || msg.includes('already registered')

						if (exists) {
							try {
								await loginWithEmail(u.email, TEST_USER_PASSWORD, u.firstname)
								synced += 1
							} catch (loginErr) {
								failed += 1
							}
						} else {
							failed += 1
						}
					}
				}

				try {
					await logout()
				} catch {}

				setMessage(`Sample users synced to Firebase. Created: ${created}, synced existing: ${synced}, failed: ${failed}.`)
			} catch (err) {
				setMessage(err?.message || 'Could not create sample users')
			} finally {
				setSuppressRedirect(false)
				setBusy(false)
			}
		}

		async function onSendReset(e) {
			e?.preventDefault()
			if (!email || String(email).trim().length < 4) {
				setMessage('Enter your account email to reset password.')
				return
			}

			setBusy(true)
			setMessage('')
			try {
				console.log('[auth] sending password reset to', email)
				await sendPasswordReset(email.trim())
				console.log('[auth] sendPasswordReset succeeded')
				setMessage('If an account exists, a password reset email has been sent.')
				setShowReset(false)
			} catch (err) {
				console.error('[auth] sendPasswordReset error', err)
				const code = err?.code || 'unknown'
				setMessage(`${err?.message || 'Could not send reset email'} (${code})`)
			} finally {
				setBusy(false)
			}
		}

		return (
			<div className="min-h-screen flex items-center justify-center py-10">
				<div className="app-container" style={{ maxWidth: 660 }}>
					<div className="card p-6" style={{ background: 'linear-gradient(135deg, rgba(255,250,230,0.85), rgba(254,243,199,0.65))', border: '1px solid rgba(217,119,6,0.18)', boxShadow: '0 10px 30px rgba(217,119,6,0.10)' }}>
						<div className="flex items-center justify-between gap-3 flex-wrap">
							<div className="flex items-center gap-3">
								<div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', border: '1px solid rgba(217,119,6,0.22)' }}>
									🧑‍🍳
								</div>
								<h1 className="text-2xl font-bold">{mode === 'signup' ? 'Create your Pantrio account' : 'Welcome'}</h1>
							</div>

							<div className="flex gap-2">
								<Link className="btn-primary" href="/" style={{ textDecoration: 'none' }}>Home</Link>
								<Link className="btn-primary" href="/planner" style={{ textDecoration: 'none' }}>Planner</Link>
							</div>
						</div>

						<p className="small-muted mt-2" style={{ marginTop: 10 }}>Login to sync favorites & plan meals with Firebase.</p>

						<div className="mt-4 flex gap-2 flex-wrap">
							<button type="button" onClick={() => setMode('login')} className={mode === 'login' ? 'btn-primary' : 'btn-secondary'}>Login</button>
							<button type="button" onClick={() => setMode('signup')} className={mode === 'signup' ? 'btn-primary' : 'btn-secondary'}>Create account</button>
							<div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
								<span className="hero-badge" style={{ background: 'rgba(217,119,6,0.14)', border: '1px solid rgba(217,119,6,0.20)', color: '#92400e' }}>✨ Fast & free</span>
							</div>
						</div>

						{ENABLE_TEST_USERS && (
							<div style={{ marginTop: 12 }}>
								<div className="small-muted">Quick test accounts:</div>
								<div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
									{TEST_USERS.map((u) => (
										<div key={u.email} className="card" style={{ padding: '.7rem' }}>
											<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
												<div style={{ fontWeight: 700 }}>{u.firstname || u.email}</div>
												<div style={{ display: 'flex', gap: 8 }}>
													<button type="button" className="btn-secondary" onClick={() => quickLogin(u)} disabled={busy}>Use</button>
													<button type="button" className="btn-secondary" onClick={() => createSampleUsers()} disabled={busy}>Seed</button>
												</div>
											</div>
											<div className="small-muted" style={{ marginTop: 8, fontSize: '.88rem' }}>{u.email}</div>
											<div style={{ marginTop: 6 }}><small className="small-muted">Dev tools only; credentials hidden.</small></div>
										</div>
									))}
								</div>
							</div>
						)}

						{message && (
							<div style={{ marginTop: 14, background: 'linear-gradient(135deg,#fef9c3,#fde68a)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 12, padding: '.65rem .9rem', color: '#92400e', fontSize: '.95rem' }}>
								{message}
							</div>
						)}

						<div className="mt-5">
							<button type="button" onClick={onGoogle} disabled={busy} className="btn-primary w-full" style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{busy ? 'Please wait…' : 'Continue with Google'}</button>

							<div className="mt-3" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
								<hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)' }} />
								<span className="small-muted">or</span>
								<hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)' }} />
							</div>

							<form onSubmit={onSubmit} className="mt-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
								{mode === 'signup' && (
									<label>
										<div className="small-muted">First name</div>
										<input className="form-control" value={firstname} onChange={(e) => setFirstname(e.target.value)} type="text" placeholder="Your name (optional)" />
									</label>
								)}

								<label>
									<div className="small-muted">Email</div>
									<input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required />
								</label>

								<label>
									<div className="small-muted">Password</div>
									<input className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="At least 6 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
								</label>

								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
									<a role="button" onClick={() => setShowReset((v) => !v)} className="small-muted" style={{ cursor: 'pointer' }}>Forgot password?</a>
								</div>

								{showReset && (
									<form onSubmit={onSendReset} style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
										<input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" required />
										<button type="submit" className="btn-primary" disabled={busy} style={{ padding: '.45rem .8rem' }}>Send reset link</button>
									</form>
								)}

								<button type="submit" disabled={busy || !canSubmit} className="btn-primary" style={{ padding: '0.75rem 1rem' }}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Login'}</button>

								<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
									<p className="small-muted" style={{ margin: 0, flex: '1 1 240px' }}>Tip: use any password ≥ 6 chars for local auth mode.</p>
									<span style={{ flex: '0 0 auto', fontSize: '.82rem', fontWeight: 700, padding: '.25rem .6rem', borderRadius: 999, border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.55)', color: '#1c1917' }}>🔐 Secure-ish</span>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		)
	}

