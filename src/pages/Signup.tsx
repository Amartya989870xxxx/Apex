import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!fullName || !company || !email || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, fullName, company)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '24px',
    }}>
      <div style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: '20px',
        padding: '48px',
        width: '100%',
        maxWidth: '440px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '22px',
            color: '#e8ff47',
            fontWeight: 900,
          }}>
            Apex
          </span>
        </Link>

        {/* Heading */}
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          color: '#f0f0f0',
          fontWeight: 900,
          marginTop: '32px',
        }}>
          Create account
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#666',
          marginTop: '8px',
          marginBottom: '32px',
        }}>
          Start finding the right candidates
        </p>

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
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Full Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Jane Smith"
            style={inputStyle}
          />
        </div>

        {/* Company */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Company</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Acme Corp"
            style={inputStyle}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            background: '#e8ff47',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            marginTop: '8px',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* Bottom link */}
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#555',
          textAlign: 'center',
          marginTop: '24px',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#e8ff47', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
