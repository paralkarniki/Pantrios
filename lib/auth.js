import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	signInWithRedirect,
	GoogleAuthProvider,
	signOut,
	sendPasswordResetEmail,
	onAuthStateChanged,
	updateProfile,
} from 'firebase/auth'
import { auth, db } from './firebase'
import { collection, doc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { saveUserData } from './userData'
import { readScopedJSON } from './clientStorage'
import { writeAuditLog } from './auditLog'

const LS_USER_KEY = 'pantrio:localUser'
const LS_CLIENT_ID_KEY = 'pantrio:clientId'
const ADMIN_EMAILS = [
	...(typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ADMIN_EMAILS
		? String(process.env.NEXT_PUBLIC_ADMIN_EMAILS).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
		: []),
]

function normalizeEmail(email = '') {
	return String(email || '').trim().toLowerCase()
}

function isAdminEmail(email = '') {
	const clean = normalizeEmail(email)
	return !!clean && ADMIN_EMAILS.includes(clean)
}

function safeLocalGet(key, fallback = null) {
	if (typeof window === 'undefined') return fallback
	try {
		const raw = window.localStorage.getItem(key)
		if (!raw) return fallback
		return JSON.parse(raw)
	} catch {
		return fallback
	}
}

function getClientId() {
	if (typeof window === 'undefined') return 'server'
	let id = window.localStorage.getItem(LS_CLIENT_ID_KEY)
	if (!id) {
		id = `client_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
		window.localStorage.setItem(LS_CLIENT_ID_KEY, id)
	}
	return id
}

async function syncClientDataToFirebase(uid, method = 'email') {
	if (!uid || typeof window === 'undefined') return

	const favorites = readScopedJSON('pantrio:favorites', uid, [], { legacyKey: 'pantrio:favorites' })
	const recent = readScopedJSON('pantrio:recent', uid, [], { legacyKey: 'pantrio:recent' })
	const pinnedFavorites = readScopedJSON('pantrio:pinnedFavorites', uid, [], { legacyKey: 'pantrio:pinnedFavorites' })
	const mealPlan = readScopedJSON('pantrio:meal-plan', uid, [], { legacyKey: 'pantrio:meal-plan' })
	const dailyCaloriePlan = readScopedJSON('pantrio:daily-calorie-plan', uid, {}, { legacyKey: 'pantrio:daily-calorie-plan' })
	const familyRecipes = readScopedJSON('pantrio:family-recipes', uid, [], { legacyKey: 'pantrio:family-recipes' })

	const clientId = getClientId()
	const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'

	await saveUserData(uid, {
		favorites: Array.isArray(favorites) ? favorites : [],
		recent: Array.isArray(recent) ? recent : [],
		pinnedFavorites: Array.isArray(pinnedFavorites) ? pinnedFavorites : [],
		mealPlan: Array.isArray(mealPlan) ? mealPlan : [],
		dailyCaloriePlan: dailyCaloriePlan && typeof dailyCaloriePlan === 'object' ? dailyCaloriePlan : {},
		familyRecipes: Array.isArray(familyRecipes) ? familyRecipes : [],
		lastClientSyncAt: new Date().toISOString(),
		lastClientSyncMethod: method,
		clients: {
			[clientId]: {
				lastSeenAt: new Date().toISOString(),
				method,
				userAgent,
			},
		},
	})
}

function ensureAuthReady() {
	if (auth) return auth
	throw new Error('Firebase Auth is not ready. Refresh and try again.')
}

function normalizeAuthError(err, action = 'continue') {
	const code = String(err?.code || '').toLowerCase()

	if (code.includes('configuration-not-found') || code.includes('operation-not-allowed')) {
		return `Firebase Auth is not configured for ${action}. Enable Email/Password (and Google if used) in Firebase Console → Authentication → Sign-in method.`
	}
	if (code.includes('invalid-api-key')) {
		return 'Firebase API key is invalid. Check your Firebase project config in lib/firebase.js.'
	}
	if (code.includes('network-request-failed')) {
		return 'Network error while contacting Firebase. Check your internet connection and retry.'
	}
	if (code.includes('email-already-in-use')) {
		return 'This email is already registered. Try logging in instead.'
	}
	if (
		code.includes('invalid-login-credentials') ||
		code.includes('invalid-credential') ||
		code.includes('wrong-password') ||
		code.includes('user-not-found')
	) {
		return 'Invalid email or password.'
	}
	if (code.includes('too-many-requests')) {
		return 'Too many attempts. Please wait a minute and try again.'
	}
	if (code.includes('popup-closed-by-user')) {
		return 'Google sign-in popup was closed before completing login.'
	}
	if (code.includes('popup-blocked')) {
		return 'Popup was blocked by the browser. Allow popups for this site and try again.'
	}

	return err?.message || `Could not ${action}. Please try again.`
}

function safeParse(json) {
	try {
		return JSON.parse(json)
	} catch {
		return null
	}
}

function getLocalUser() {
	if (typeof window === 'undefined') return null
	const raw = window.localStorage.getItem(LS_USER_KEY)
	return raw ? safeParse(raw) : null
}

export function getCachedLocalUser() {
	return getLocalUser()
}

function setLocalUser(user) {
	if (typeof window === 'undefined') return
	if (!user) window.localStorage.removeItem(LS_USER_KEY)
	else window.localStorage.setItem(LS_USER_KEY, JSON.stringify(user))
}

function notifyAuthChange() {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new Event('pantrio:auth'))
	}
}

async function saveUserProfile(uid, email, firstname, isNew = false, extra = {}) {
	if (!uid) return
	try {
		const userRef = doc(db, 'users', uid)
		const payload = {
			email,
			firstname,
			lastLogin: serverTimestamp(),
			...extra,
		}
		if (isNew) {
			payload.createdAt = serverTimestamp()
		}
		await setDoc(userRef, payload, { merge: true })
	} catch (error) {
		console.warn('Unable to save user profile', error)
	}
}

async function recordLoginEvent(uid, email, method = 'email') {
	if (!uid) return
	try {
		await addDoc(collection(db, 'loginHistory'), {
			uid,
			email,
			method,
			timestamp: serverTimestamp(),
		})
	} catch (error) {
		console.warn('Failed to record login event', error)
	}
}

async function loadStoredUser(fbUser) {
	if (!fbUser) return null
	const fallback = buildFastUser(fbUser)

	try {
		const userRef = doc(db, 'users', fbUser.uid)
		const snapshot = await getDoc(userRef)
		if (snapshot.exists()) {
			const data = snapshot.data()
			const role = data.role || (isAdmin ? 'admin' : 'client')
			return {
				email: fbUser.email,
				firstname: data.firstname || fallback.firstname,
				uid: fbUser.uid,
				role,
				isAdmin: role === 'admin',
			}
		}
	} catch (err) {
		console.warn('Failed to load stored user profile', err)
	}

	return fallback
}

function buildFastUser(fbUser) {
	if (!fbUser) return null
	const isAdmin = isAdminEmail(fbUser.email)
	return {
		email: fbUser.email,
		firstname: fbUser.displayName || fbUser.email?.split('@')[0] || 'Chef',
		uid: fbUser.uid,
		role: isAdmin ? 'admin' : 'client',
		isAdmin,
	}
}

export function subscribeToAuth(cb) {
	if (typeof window === 'undefined') {
		cb(null)
		return () => {}
	}

	const emitSafeLocal = () => {
		const local = getLocalUser()
		cb(local || null)
	}

	let unsubFirebase = () => {}
	let settled = false
	const emit = (user) => {
		settled = true
		cb(user)
	}

	const fallbackTimer = window.setTimeout(() => {
		if (!settled) emitSafeLocal()
	}, 1200)

	emitSafeLocal()
	try {
		const authClient = ensureAuthReady()
		unsubFirebase = onAuthStateChanged(authClient, async (fbUser) => {
			window.clearTimeout(fallbackTimer)
			if (fbUser) {
				const fastUser = buildFastUser(fbUser)
				setLocalUser(fastUser)
				emit(fastUser)

				loadStoredUser(fbUser)
					.then((user) => {
						if (user) {
							setLocalUser(user)
							cb(user)
						}
					})
					.catch((err) => {
						console.warn('Failed to hydrate stored user profile', err)
					})
			} else {
				setLocalUser(null)
				emit(null)
			}
		})
	} catch (err) {
		window.clearTimeout(fallbackTimer)
		emitSafeLocal()
	}

	const onStorage = () => emitSafeLocal()
	window.addEventListener('storage', onStorage)

	const onCustom = () => emitSafeLocal()
	window.addEventListener('pantrio:auth', onCustom)

	return () => {
		window.clearTimeout(fallbackTimer)
		unsubFirebase()
		window.removeEventListener('storage', onStorage)
		window.removeEventListener('pantrio:auth', onCustom)
	}
}

export async function loginWithEmail(email, password, firstname = '') {
	if (!email || typeof email !== 'string' || email.trim().length < 4) {
		throw new Error('Invalid email')
	}
	if (!password || password.length < 6) {
		throw new Error('Password must be at least 6 characters')
	}

	try {
		const authClient = ensureAuthReady()
		const result = await signInWithEmailAndPassword(authClient, email.trim(), password)
		const fbUser = result.user

		const name = firstname.trim() || fbUser.displayName || fbUser.email.split('@')[0] || 'Chef'
		if (firstname.trim()) {
			await updateProfile(fbUser, { displayName: name })
		}

		const user = {
			email: fbUser.email,
			firstname: name,
			uid: fbUser.uid,
			role: isAdminEmail(fbUser.email) ? 'admin' : 'client',
			isAdmin: isAdminEmail(fbUser.email),
		}

		await saveUserProfile(fbUser.uid, fbUser.email, user.firstname, false, {
			role: user.role,
			isAdmin: user.isAdmin,
		})
		await recordLoginEvent(fbUser.uid, fbUser.email, 'email')
		await writeAuditLog({
			action: 'auth.login.email',
			actorUid: fbUser.uid,
			actorEmail: fbUser.email,
			status: 'success',
			source: 'client',
		})
		await saveUserData(fbUser.uid, { initializedAt: new Date().toISOString() })
		await syncClientDataToFirebase(fbUser.uid, 'email')

		setLocalUser(user)
		notifyAuthChange()
		return user
	} catch (fbErr) {
		console.warn('Firebase login failed', fbErr)
		const wrapped = new Error(normalizeAuthError(fbErr, 'log in'))
		wrapped.code = fbErr?.code
		throw wrapped
	}
}

export async function signupWithEmail(email, password, firstname = '') {
	if (!email || typeof email !== 'string' || email.trim().length < 4) {
		throw new Error('Invalid email')
	}
	if (!password || password.length < 6) {
		throw new Error('Password must be at least 6 characters')
	}

	try {
		const authClient = ensureAuthReady()
		const result = await createUserWithEmailAndPassword(authClient, email.trim(), password)
		const fbUser = result.user

		const name = firstname.trim() || fbUser.email.split('@')[0] || 'Chef'
		await updateProfile(fbUser, { displayName: name })

		const user = {
			email: fbUser.email,
			firstname: name,
			uid: fbUser.uid,
			role: isAdminEmail(fbUser.email) ? 'admin' : 'client',
			isAdmin: isAdminEmail(fbUser.email),
		}

		await saveUserProfile(fbUser.uid, fbUser.email, user.firstname, true, {
			role: user.role,
			isAdmin: user.isAdmin,
		})
		await recordLoginEvent(fbUser.uid, fbUser.email, 'email')
		await writeAuditLog({
			action: 'auth.signup.email',
			actorUid: fbUser.uid,
			actorEmail: fbUser.email,
			status: 'success',
			source: 'client',
		})
		await saveUserData(fbUser.uid, { initializedAt: new Date().toISOString() })
		await syncClientDataToFirebase(fbUser.uid, 'email-signup')

		setLocalUser(user)
		notifyAuthChange()
		return user
	} catch (fbErr) {
		console.warn('Firebase signup failed', fbErr)
		const wrapped = new Error(normalizeAuthError(fbErr, 'create an account'))
		wrapped.code = fbErr?.code
		throw wrapped
	}
}

export async function loginWithGoogle() {
	try {
		const authClient = ensureAuthReady()
		const provider = new GoogleAuthProvider()
		provider.setCustomParameters({ prompt: 'select_account' })

		let result = null
		try {
			result = await signInWithPopup(authClient, provider)
		} catch (popupErr) {
			const code = String(popupErr?.code || '').toLowerCase()
			if (code.includes('popup-blocked') || code.includes('cancelled-popup-request')) {
				await signInWithRedirect(authClient, provider)
				return null
			}
			throw popupErr
		}
		const fbUser = result.user

		const name = fbUser.displayName || fbUser.email.split('@')[0] || 'Guest'
		const user = {
			email: fbUser.email,
			firstname: name,
			uid: fbUser.uid,
			role: isAdminEmail(fbUser.email) ? 'admin' : 'client',
			isAdmin: isAdminEmail(fbUser.email),
		}

		const existingProfileSnap = await getDoc(doc(db, 'users', fbUser.uid))
		await saveUserProfile(fbUser.uid, fbUser.email, user.firstname, !existingProfileSnap.exists(), {
			photoURL: fbUser.photoURL || null,
			provider: 'google',
			role: user.role,
			isAdmin: user.isAdmin,
		})
		await recordLoginEvent(fbUser.uid, fbUser.email, 'google')
		await writeAuditLog({
			action: 'auth.login.google',
			actorUid: fbUser.uid,
			actorEmail: fbUser.email,
			status: 'success',
			source: 'client',
		})
		await saveUserData(fbUser.uid, {
			initializedAt: new Date().toISOString(),
			profile: {
				email: fbUser.email,
				firstname: user.firstname,
				photoURL: fbUser.photoURL || null,
				provider: 'google',
			},
		})
		await syncClientDataToFirebase(fbUser.uid, 'google')

		setLocalUser(user)
		notifyAuthChange()
		return user
	} catch (fbErr) {
		console.warn('Firebase Google login failed', fbErr)
		const wrapped = new Error(normalizeAuthError(fbErr, 'sign in with Google'))
		wrapped.code = fbErr?.code
		throw wrapped
	}
}

export async function logout() {
	try {
		if (auth) await signOut(auth)
	} catch (err) {
		// Ignore Firebase logout errors
	}
	setLocalUser(null)
	notifyAuthChange()
}

export async function sendPasswordReset(email) {
	if (!email || typeof email !== 'string' || email.trim().length < 4) {
		throw new Error('Invalid email')
	}

	try {
		const authClient = ensureAuthReady()
		await sendPasswordResetEmail(authClient, String(email).trim())
		const u = authClient?.currentUser
		if (u?.uid) {
			await writeAuditLog({
				action: 'auth.password_reset.request',
				actorUid: u.uid,
				actorEmail: u.email || null,
				status: 'success',
				source: 'client',
				details: { requestedEmail: String(email).trim() },
			})
		}
		return true
	} catch (err) {
		console.warn('Password reset failed', err)
		const wrapped = new Error(normalizeAuthError(err, 'send password reset email'))
		wrapped.code = err?.code
		throw wrapped
	}
}

