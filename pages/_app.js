import Head from 'next/head'
import '../styles/globals.css'
import ThemeProvider from '../components/ThemeProvider'
import SiteNav from '../components/SiteNav'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ''

function pageview(url) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', GA_ID, { page_path: url })
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isHomePage = router.pathname === '/'

  useEffect(() => {
    const handleRouteChange = (url) => pageview(url)
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router.events])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#fffaf5" />
      </Head>
      <ThemeProvider>
        <SiteNav />
        <main style={{ paddingTop: !isHomePage ? '80px' : 0, paddingBottom: '2rem' }}>
          <Component {...pageProps} />
        </main>
      </ThemeProvider>
    </>
  )
}

