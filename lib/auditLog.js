import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export async function writeAuditLog(event = {}) {
  try {
    const payload = {
      actorUid: event.actorUid || null,
      actorEmail: event.actorEmail || null,
      action: String(event.action || 'unknown'),
      targetUid: event.targetUid || null,
      targetEmail: event.targetEmail || null,
      status: event.status || 'success',
      source: event.source || 'client',
      details: event.details && typeof event.details === 'object' ? event.details : {},
      createdAt: serverTimestamp(),
    }
    await addDoc(collection(db, 'auditLogs'), payload)
  } catch (err) {
    // Best-effort logging only
  }
}
