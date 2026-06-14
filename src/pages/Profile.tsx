import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user, profile, signOut, updateProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [avatarHover, setAvatarHover] = useState(false)

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setCompany(profile.company || '')
    }
  }, [profile])

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Name cannot be empty')
      return
    }
    setError('')
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName.trim(), company: company.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with avatar URL
      await updateProfile({ avatar_url: publicUrl })
      await refreshProfile()
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getInitials = () => {
    const name = profile?.full_name || user?.email || ''
    return name
      .split(' ')
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  }

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    color: active ? '#f0f0f0' : '#555',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.2s',
  })

  const inputStyle: React.CSSProperties = {
    background: '#161616',
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    padding: '14px 16px',
    color: '#f0f0f0',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '12px',
    fontWeight: 600,
    color: '#555',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      {/* NAVBAR */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 48px',
        borderBottom: '1px solid #1a1a1a',
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '20px',
              color: '#e8ff47',
              fontWeight: 900,
            }}>
              Apex
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/dashboard" style={navLinkStyle(false)}>Dashboard</Link>
            <Link to="/search" style={navLinkStyle(false)}>New Search</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#555',
            }}>
              {profile?.full_name || user?.email}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#555',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f0f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: '128px 32px 64px',
        }}
      >
        {/* Page header */}
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          color: '#f0f0f0',
          fontWeight: 900,
          marginBottom: '8px',
        }}>
          Profile
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#555',
          marginBottom: '40px',
        }}>
          Manage your recruiter account
        </p>

        {/* Avatar Section */}
        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}>
            {/* Avatar */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              style={{
                position: 'relative',
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                cursor: 'pointer',
                flexShrink: 0,
                overflow: 'hidden',
                background: profile?.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : 'linear-gradient(135deg, #e8ff47 0%, #c4d93a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #1e1e1e',
                transition: 'border-color 0.3s, transform 0.2s',
                transform: avatarHover ? 'scale(1.04)' : 'scale(1)',
                borderColor: avatarHover ? '#e8ff47' : '#1e1e1e',
              }}
            >
              {!profile?.avatar_url && (
                <span style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#0a0a0a',
                }}>
                  {getInitials()}
                </span>
              )}

              {/* Hover overlay */}
              <AnimatePresence>
                {avatarHover && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.55)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0f0f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '9px',
                      fontWeight: 600,
                      color: '#f0f0f0',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase' as const,
                    }}>
                      {uploading ? 'Uploading...' : 'Change'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload spinner overlay */}
              {uploading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #e8ff47',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />

            {/* Avatar info */}
            <div>
              <h2 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '24px',
                color: '#f0f0f0',
                fontWeight: 900,
              }}>
                {profile?.full_name || 'Your Name'}
              </h2>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#555',
                marginTop: '4px',
              }}>
                {profile?.company && (
                  <span style={{ color: '#666' }}>{profile.company} · </span>
                )}
                {user?.email}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#e8ff47',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '10px',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Upload photo
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px',
            color: '#f0f0f0',
            fontWeight: 900,
            marginBottom: '24px',
          }}>
            Personal Information
          </h3>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#ff5050',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          {/* Success */}
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  background: 'rgba(232,255,71,0.08)',
                  border: '1px solid rgba(232,255,71,0.2)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#e8ff47',
                  fontSize: '14px',
                  fontFamily: 'DM Sans, sans-serif',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8ff47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Profile saved successfully
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#333')}
              onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
            />
          </div>

          {/* Company */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Company</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Your company"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#333')}
              onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
            />
          </div>

          {/* Email (read only) */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              style={{
                ...inputStyle,
                color: '#555',
                cursor: 'not-allowed',
                background: '#0f0f0f',
              }}
            />
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#333',
              marginTop: '8px',
            }}>
              Email cannot be changed
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              background: '#e8ff47',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              opacity: saving ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Danger Zone */}
        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '20px',
          padding: '32px 40px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#f0f0f0',
              }}>
                Sign out
              </h3>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#555',
                marginTop: '4px',
              }}>
                Sign out of your Apex account
              </p>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ff5050',
                background: 'rgba(255,80,80,0.08)',
                border: '1px solid rgba(255,80,80,0.15)',
                borderRadius: '8px',
                padding: '8px 20px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,80,80,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,80,80,0.08)')}
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>

      {/* Global styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
