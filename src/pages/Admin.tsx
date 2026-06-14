import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Candidate } from '../data/candidates'
import { CANDIDATE_POOL } from '../data/candidates'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState<Candidate[]>(
    JSON.parse(localStorage.getItem('apex_candidates') || JSON.stringify(CANDIDATE_POOL))
  )
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [editing, setEditing] = useState<Candidate | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSelect = (c: Candidate) => {
    setSelected(c)
    setEditing({ ...c })
    setSaved(false)
  }

  const handleChange = (field: keyof Candidate, value: string | string[]) => {
    if (!editing) return
    setEditing({ ...editing, [field]: value })
  }

  const handleSave = () => {
    if (!editing) return
    const updated = candidates.map(c => c.id === editing.id ? editing : c)
    setCandidates(updated)
    localStorage.setItem('apex_candidates', JSON.stringify(updated))
    setSelected(editing)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0' }}>
      
      {/* Navbar */}
      <nav style={{
        height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 48px',
        borderBottom: '1px solid #1a1a1a',
        background: 'rgba(10,10,10,0.95)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#e8ff47', fontWeight: 900 }}>
            Apex
          </span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: '#333',
            background: '#161616', border: '1px solid #2a2a2a', padding: '4px 10px', borderRadius: '6px'
          }}>
            Admin Panel
          </span>
        </div>
        <button
          onClick={handleSignOut}
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#555',
            background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </nav>

      <div style={{ paddingTop: '64px', display: 'flex', height: '100vh' }}>

        {/* Left: candidate list */}
        <div style={{ width: '280px', borderRight: '1px solid #1a1a1a', overflowY: 'auto',
          background: '#0f0f0f', flexShrink: 0 }}>
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #1a1a1a' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444' }}>
              Candidate Pool ({candidates.length})
            </p>
          </div>
          {candidates.map(c => (
            <div
              key={c.id}
              onClick={() => handleSelect(c)}
              style={{
                padding: '16px 24px', cursor: 'pointer',
                borderBottom: '1px solid #161616',
                background: selected?.id === c.id ? '#161616' : 'transparent',
                borderLeft: selected?.id === c.id ? '2px solid #e8ff47' : '2px solid transparent',
              }}
            >
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500,
                color: selected?.id === c.id ? '#f0f0f0' : '#888' }}>
                {c.name}
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#444', marginTop: '4px' }}>
                {c.current_position.split('@')[1]?.trim() || c.current_position}
              </p>
            </div>
          ))}
        </div>

        {/* Right: editor */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
          {!editing ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#333' }}>
                Select a candidate to edit
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#444' }}>
                Changes save to localStorage and persist across sessions
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: '720px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#f0f0f0', fontWeight: 900 }}>
                  {editing.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {saved && (
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#e8ff47' }}>
                      ✓ Saved
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600,
                      color: '#0a0a0a', background: '#e8ff47', border: 'none', cursor: 'pointer',
                      padding: '10px 24px', borderRadius: '8px' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Form fields */}
              {([
                { key: 'name', label: 'Full Name', type: 'text' },
                { key: 'current_position', label: 'Current Position', type: 'text' },
                { key: 'linkedin_url', label: 'LinkedIn URL', type: 'text' },
                { key: 'github_url', label: 'GitHub URL', type: 'text' },
                { key: 'summary', label: 'Profile Summary', type: 'textarea' },
                { key: 'experience', label: 'Experience', type: 'textarea' },
                { key: 'education', label: 'Education', type: 'text' },
                { key: 'github_activity', label: 'GitHub Activity', type: 'textarea' },
                { key: 'notable_projects', label: 'Notable Projects', type: 'textarea' },
              ] as { key: keyof Candidate; label: string; type: string }[]).map(field => (
                <div key={field.key} style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '11px',
                    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: '#555', marginBottom: '8px' }}>
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={editing[field.key] as string}
                      onChange={e => handleChange(field.key, e.target.value)}
                      rows={4}
                      style={{ width: '100%', background: '#111', border: '1px solid #1e1e1e',
                        borderRadius: '10px', padding: '14px 16px', color: '#f0f0f0',
                        fontSize: '14px', fontFamily: 'DM Sans, sans-serif', resize: 'vertical',
                        outline: 'none', lineHeight: 1.6 }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={editing[field.key] as string}
                      onChange={e => handleChange(field.key, e.target.value)}
                      style={{ width: '100%', background: '#111', border: '1px solid #1e1e1e',
                        borderRadius: '10px', padding: '14px 16px', color: '#f0f0f0',
                        fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                    />
                  )}
                </div>
              ))}

              {/* Skills editor */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '11px',
                  fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#555', marginBottom: '8px' }}>
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={editing.skills.join(', ')}
                  onChange={e => handleChange('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  style={{ width: '100%', background: '#111', border: '1px solid #1e1e1e',
                    borderRadius: '10px', padding: '14px 16px', color: '#f0f0f0',
                    fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {editing.skills.map(s => (
                    <span key={s} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
                      color: '#888', background: '#161616', border: '1px solid #1e1e1e',
                      borderRadius: '6px', padding: '4px 10px' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px', background: '#111', borderRadius: '12px',
                border: '1px solid #1e1e1e', marginTop: '8px' }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#444', marginBottom: '4px' }}>
                  ⚠️ Changes save to localStorage only. To make permanent changes, update src/data/candidates.ts directly.
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#333' }}>
                  Admin URL: localhost:5173/admin — never share this URL with judges or users.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
