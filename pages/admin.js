import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import { RequireAuth } from '../lib/requireAuth'
import { subscribeToAuth } from '../lib/auth'
import { auth, db } from '../lib/firebase'
import { writeAuditLog } from '../lib/auditLog'
import {
  collection, getDocs, orderBy, query, limit,
  doc, setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'

const EMPTY_FORM = { firstname: '', email: '', role: 'client', phone: '', notes: '' }

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState('warn') // 'warn' | 'success' | 'error'

  // Edit modal state
  const [editTarget, setEditTarget] = useState(null) // row being edited
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deniedLogged, setDeniedLogged] = useState(false)

  const isAdmin = !!user?.isAdmin

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u))
    return () => unsub()
  }, [])

  function showMsg(text, type = 'warn') {
    setMessage(text)
    setMsgType(type)
  }

  async function audit(action, details = {}, status = 'success', target = {}) {
    await writeAuditLog({
      actorUid: user?.uid || auth?.currentUser?.uid || null,
      actorEmail: user?.email || auth?.currentUser?.email || null,
      action,
      targetUid: target.uid || null,
      targetEmail: target.email || null,
      status,
      source: 'admin-ui',
      details,
    })
  }

  async function ensureToken() {
    if (!auth?.currentUser) {
      showMsg('No active Firebase session. Please sign out and sign in again as admin.', 'error')
      return false
    }
    await auth.currentUser.getIdToken(true)
    return true
  }

  async function loadClients() {
    if (!isAdmin) return
    setLoading(true)
    setMessage('')
    try {
      if (!(await ensureToken())) return
      const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'), limit(100))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setRows(data)
    } catch (err) {
      const code = String(err?.code || '')
      if (code.includes('permission-denied')) {
        showMsg('Could not load clients. Firestore denied admin read. Publish firestore.rules from this project (or paste them in Firebase Console → Firestore Database → Rules).', 'error')
      } else {
        showMsg(`Could not load clients. ${err?.message || 'Unknown error.'}`, 'error')
      }
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadClients()
  }, [isAdmin])

  useEffect(() => {
    if (user && !isAdmin && !deniedLogged) {
      setDeniedLogged(true)
      audit('admin_access_denied', { page: 'admin' }, 'blocked')
    }
  }, [user, isAdmin, deniedLogged])

  // ── Role quick-change ────────────────────────────────────────────────────
  async function setClientRole(row, role) {
    if (!isAdmin || !row?.id) return
    if (!(await ensureToken())) return
    try {
      await setDoc(doc(db, 'users', row.id), {
        role,
        isAdmin: role === 'admin',
        roleUpdatedAt: serverTimestamp(),
      }, { merge: true })
      await audit('admin_set_role', { role }, 'success', { uid: row.id, email: row.email || null })
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, role, isAdmin: role === 'admin' } : r))
      showMsg(`Updated ${row.email || row.id} to ${role}.`, 'success')
    } catch (err) {
      await audit('admin_set_role', { role, error: String(err?.message || 'unknown_error') }, 'error', { uid: row.id, email: row.email || null })
      const code = String(err?.code || '')
      showMsg(
        code.includes('permission-denied')
          ? 'Role update failed. Firestore denied admin write. Publish firestore.rules first.'
          : `Role update failed. ${err?.message || 'Unknown error.'}`,
        'error',
      )
    }
  }

  // ── Edit profile ─────────────────────────────────────────────────────────
  function openEdit(row) {
    setEditTarget(row)
    setEditForm({
      firstname: row.firstname || '',
      email: row.email || '',
      role: row.role || (row.isAdmin ? 'admin' : 'client'),
      phone: row.phone || '',
      notes: row.notes || '',
    })
  }

  function closeEdit() {
    setEditTarget(null)
    setEditForm(EMPTY_FORM)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editTarget) return
    if (!(await ensureToken())) return
    setEditSaving(true)
    try {
      const role = editForm.role
      const payload = {
        firstname: editForm.firstname.trim(),
        email: editForm.email.trim(),
        role,
        isAdmin: role === 'admin',
        phone: editForm.phone.trim(),
        notes: editForm.notes.trim(),
        updatedAt: serverTimestamp(),
      }
      await setDoc(doc(db, 'users', editTarget.id), payload, { merge: true })
      await audit('admin_edit_profile', { changedFields: Object.keys(payload) }, 'success', { uid: editTarget.id, email: payload.email || null })
      setRows((prev) => prev.map((r) => r.id === editTarget.id ? { ...r, ...payload } : r))
      showMsg(`Profile updated for ${payload.email || editTarget.id}.`, 'success')
      closeEdit()
    } catch (err) {
      await audit('admin_edit_profile', { error: String(err?.message || 'unknown_error') }, 'error', { uid: editTarget.id, email: editForm.email || null })
      showMsg(`Save failed. ${err?.message || 'Unknown error.'}`, 'error')
    } finally {
      setEditSaving(false)
    }
  }

  // ── Delete user ──────────────────────────────────────────────────────────
  function openDelete(row) {
    setDeleteTarget(row)
    setDeleteConfirm('')
  }

  function closeDelete() {
    setDeleteTarget(null)
    setDeleteConfirm('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    if (!(await ensureToken())) return
    setDeleteLoading(true)
    try {
      await deleteDoc(doc(db, 'users', deleteTarget.id))
      await audit('admin_delete_profile', {}, 'success', { uid: deleteTarget.id, email: deleteTarget.email || null })
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      showMsg(`Deleted profile for ${deleteTarget.email || deleteTarget.id}.`, 'success')
      closeDelete()
    } catch (err) {
      await audit('admin_delete_profile', { error: String(err?.message || 'unknown_error') }, 'error', { uid: deleteTarget.id, email: deleteTarget.email || null })
      showMsg(`Delete failed. ${err?.message || 'Unknown error.'}`, 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Message colours ──────────────────────────────────────────────────────
  const msgStyle = {
    warn:    { background: 'rgba(217,119,6,0.10)',  color: '#92400e' },
    success: { background: 'rgba(16,185,129,0.10)', color: '#065f46' },
    error:   { background: 'rgba(239,68,68,0.10)',  color: '#991b1b' },
  }[msgType] || {}

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <RequireAuth fallbackPath="/admin">
      <div className="min-h-screen py-10">
        <div className="app-container">
          <div className="card">
            <PageHeader title="Admin Client Management" subtitle="Manage client roles and review user profiles." />

            {!isAdmin ? (
              <div style={{ padding: '1rem 0' }}>
                <div className="small-muted">You are signed in, but this section is admin-only.</div>
                <div style={{ marginTop: 10 }}>
                  <Link href="/generate" className="btn-primary" style={{ textDecoration: 'none' }}>Back to app</Link>
                </div>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" className="btn-primary" onClick={loadClients} disabled={loading}>
                    {loading ? 'Loading…' : 'Refresh clients'}
                  </button>
                  <span className="small-muted">Admin: {user?.email}</span>
                </div>

                {/* Status message */}
                {message && (
                  <div style={{ marginTop: 12, padding: '.6rem .85rem', borderRadius: 10, ...msgStyle }}>
                    {message}
                  </div>
                )}

                {/* Table */}
                <div style={{ marginTop: 14, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                        {['Email', 'Name', 'Phone', 'Role', 'Actions'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: '12px 10px' }} className="small-muted">
                            {loading ? 'Loading clients…' : 'No clients found.'}
                          </td>
                        </tr>
                      )}
                      {rows.map((r) => {
                        const role = r.role || (r.isAdmin ? 'admin' : 'client')
                        return (
                          <tr key={r.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <td style={{ padding: '10px' }}>{r.email || r.id}</td>
                            <td style={{ padding: '10px' }}>{r.firstname || '—'}</td>
                            <td style={{ padding: '10px' }}>{r.phone || '—'}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                                background: role === 'admin' ? 'rgba(236,138,18,0.15)' : 'rgba(99,102,241,0.10)',
                                color: role === 'admin' ? '#b45309' : '#4338ca',
                              }}>{role}</span>
                            </td>
                            <td style={{ padding: '10px' }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                  onClick={() => openEdit(r)}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                  onClick={() => setClientRole(r, role === 'admin' ? 'client' : 'admin')}
                                >
                                  {role === 'admin' ? '⬇️ Make client' : '⬆️ Make admin'}
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    fontSize: '0.8rem', padding: '4px 12px', borderRadius: 20, border: 'none',
                                    background: 'rgba(239,68,68,0.1)', color: '#b91c1c', cursor: 'pointer', fontWeight: 600,
                                  }}
                                  onClick={() => openDelete(r)}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ─────────────────────────────────────────── */}
      {editTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 480,
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 4, fontFamily: 'Fredoka, sans-serif', fontSize: '1.4rem' }}>
              Edit Profile
            </h2>
            <div style={{ marginBottom: 16, fontSize: '0.85rem', color: '#6b7280' }}>{editTarget.email || editTarget.id}</div>

            <form onSubmit={saveEdit}>
              {[
                { label: 'First name', key: 'firstname', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: '0.88rem' }}>{label}</label>
                  <input
                    type={type}
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 10,
                      border: '1.5px solid #e5e7eb', fontSize: '0.95rem', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: '0.88rem' }}>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10,
                    border: '1.5px solid #e5e7eb', fontSize: '0.95rem', background: '#fff',
                  }}
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: '0.88rem' }}>Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10,
                    border: '1.5px solid #e5e7eb', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={closeEdit} disabled={editSaving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          }}>
            <h2 style={{ marginTop: 0, color: '#b91c1c', fontFamily: 'Fredoka, sans-serif', fontSize: '1.4rem' }}>
              Delete Profile
            </h2>
            <p style={{ marginBottom: 16, color: '#374151' }}>
              This will permanently delete the Firestore profile for{' '}
              <strong>{deleteTarget.email || deleteTarget.id}</strong>.
              This cannot be undone.
            </p>
            <p style={{ marginBottom: 8, fontSize: '0.88rem', color: '#6b7280' }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 10, boxSizing: 'border-box',
                border: '1.5px solid #fca5a5', fontSize: '0.95rem', marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={closeDelete} disabled={deleteLoading}>Cancel</button>
              <button
                type="button"
                disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                onClick={confirmDelete}
                style={{
                  padding: '8px 20px', borderRadius: 20, border: 'none', fontWeight: 700,
                  background: deleteConfirm === 'DELETE' ? '#ef4444' : '#fca5a5',
                  color: '#fff', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed', fontSize: '0.95rem',
                }}
              >
                {deleteLoading ? 'Deleting…' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireAuth>
  )
}
