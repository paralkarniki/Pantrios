import Head from 'next/head'
import '../styles/globals.css'
import ThemeProvider from '../components/ThemeProvider'
import SiteNav from '../components/SiteNav'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isHomePage = router.pathname === '/'

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

