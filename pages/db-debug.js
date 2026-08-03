import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import { subscribeToAuth } from '../lib/auth'
import { subscribeUserData } from '../lib/userData'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function getStaticProps() {
  const debugEnabled = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEBUG_PAGES === 'true'
  if (!debugEnabled) {
    return { notFound: true }
  }
  return { props: {} }
}

export default function DbDebugPage() {
  const [user, setUser] = useState(null)
  const [docData, setDocData] = useState(null)
  const [status, setStatus] = useState('waiting')
  const [userDocData, setUserDocData] = useState(null)
  const [userDocStatus, setUserDocStatus] = useState('waiting')

  useEffect(() => {
    const unsubAuth = subscribeToAuth((u) => setUser(u))
    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (!user?.uid) {
      setDocData(null)
      setStatus('signed-out')
      setUserDocData(null)
      setUserDocStatus('signed-out')
      return
    }

    setStatus('loading')
    const unsubUserData = subscribeUserData(user.uid, (data) => {
      setDocData(data)
      setStatus('loaded')
    })

    const fetchUserDoc = async () => {
      setUserDocStatus('loading')
      try {
        const docRef = doc(db, 'users', user.uid)
        const snapshot = await getDoc(docRef)
        setUserDocData(snapshot.exists() ? snapshot.data() : null)
        setUserDocStatus('loaded')
      } catch (err) {
        console.warn('Failed to load users doc', err)
        setUserDocData(null)
        setUserDocStatus('error')
      }
    }

    fetchUserDoc()

    return () => unsubUserData()
  }, [user])

  return (
    <div className="min-h-screen py-10">
      <div className="app-container">
        <div className="card">
          <PageHeader title="Firestore Debug" subtitle="View the current userData document in your Firebase default database." />

          {!user ? (
            <div style={{ padding: '1rem' }}>
              <div className="small-muted">You are not signed in.</div>
              <div style={{ marginTop: 12 }}>
                <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
                  Sign in to inspect Firestore
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              <div className="small-muted">Signed in as {user.email}</div>
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/profile" className="btn-secondary" style={{ textDecoration: 'none' }}>
                  Back to profile
                </Link>
                <a href="https://console.firebase.google.com/u/2/project/pantrio-gen/firestore/databases/-default-/data" target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>
                  Open Firebase Console
                </a>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="small-muted">Firestore path</div>
                <div style={{ marginTop: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace' }}>
                  <code>userData/{user.uid}</code>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="small-muted">User profile status</div>
                <div style={{ marginTop: 6 }}>{userDocStatus}</div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="small-muted">User profile document</div>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#faf7ed', borderRadius: 12, padding: '1rem', marginTop: 8, minHeight: 160 }}>
                  {userDocStatus === 'loading' ? 'Loading…' : JSON.stringify(userDocData || { message: 'No users doc found yet.' }, null, 2)}
                </pre>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="small-muted">Status</div>
                <div style={{ marginTop: 6 }}>{status}</div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="small-muted">Document data</div>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#faf7ed', borderRadius: 12, padding: '1rem', marginTop: 8, minHeight: 160 }}>
                  {status === 'loading' ? 'Loading…' : JSON.stringify(docData || { message: 'No document found yet.' }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
