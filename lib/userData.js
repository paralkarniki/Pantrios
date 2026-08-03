import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

const USER_DATA_COLLECTION = 'userData'

export async function getUserData(uid) {
  if (!uid) return {}
  try {
    const docRef = doc(db, USER_DATA_COLLECTION, uid)
    const snapshot = await getDoc(docRef)
    return snapshot.exists() ? snapshot.data() : {}
  } catch (err) {
    return {}
  }
}

export async function saveUserData(uid, partialData = {}) {
  if (!uid) return
  try {
    const docRef = doc(db, USER_DATA_COLLECTION, uid)
    await setDoc(docRef, partialData, { merge: true })
  } catch (err) {
    console.warn('Unable to save user data', err)
  }
}

export function subscribeUserData(uid, callback) {
  if (!uid || typeof callback !== 'function') {
    return () => {}
  }

  const docRef = doc(db, USER_DATA_COLLECTION, uid)
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data())
    } else {
      callback({})
    }
  }, (err) => {
    console.warn('User data subscription error', err)
    callback({})
  })

  return unsubscribe
}
