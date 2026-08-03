export default function handler(req, res) {
	const debugEnabled = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEBUG_PAGES === 'true'

	if (!debugEnabled) {
		return res.status(404).json({ error: 'Debug endpoint disabled' })
	}

	return res.status(200).json({ ok: true, note: 'No server auth in this project; auth is local-only in lib/auth.js.' })
}

