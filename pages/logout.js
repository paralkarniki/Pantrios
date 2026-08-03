import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { logout } from '../lib/auth'

export default function LogoutPage() {
	const router = useRouter()
	const [busy, setBusy] = useState(true)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				await logout()
			} catch (e) {
				// ignore
			}
			if (!mounted) return
			setBusy(false)
			router.replace('/')
		})()
		return () => {
			mounted = false
		}
	}, [router])

	return (
		<div className="min-h-screen flex items-center justify-center py-10">
			<div className="card p-6">{busy ? 'Logging out…' : 'Done.'}</div>
		</div>
	)
}

