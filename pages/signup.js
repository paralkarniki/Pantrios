import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function SignupRedirectPage() {
	const router = useRouter()

	useEffect(() => {
		router.replace('/login?mode=signup')
	}, [router])

	return null
}

