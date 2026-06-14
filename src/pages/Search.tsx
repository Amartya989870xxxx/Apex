import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { RankedCandidate } from '../data/candidates'
import { rankCandidates, getCandidatePool } from '../lib/groq'

// ─── Signal Bar Component ───────────────────────────────────────────────
function SignalBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const color = value >= 85 ? '#e8ff47' : value >= 70 ? '#ffbe32' : '#ff5050'
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '12px',
        color: '#666',
        marginBottom: '6px',
      }}>
        <span>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div style={{
        height: '4px',
        borderRadius: '2px',
        background: '#1e1e1e',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '2px' }}
        />
      </div>
    </div>
  )
}

// ─── Skeleton Card ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: '#111',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '16px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ width: '120px', height: '14px', background: '#1e1e1e', borderRadius: '4px', marginBottom: '8px' }} />
          <div style={{ width: '200px', height: '12px', background: '#161616', borderRadius: '4px' }} />
        </div>
        <div style={{ width: '48px', height: '32px', background: '#1e1e1e', borderRadius: '8px' }} />
      </div>
      <div style={{ marginTop: '16px' }}>
        <div style={{ width: '100%', height: '10px', background: '#161616', borderRadius: '4px', marginBottom: '6px' }} />
        <div style={{ width: '80%', height: '10px', background: '#161616', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {[60, 80, 50, 70].map((w, i) => (
          <div key={i} style={{ width: `${w}px`, height: '24px', background: '#161616', borderRadius: '6px' }} />
        ))}
      </div>
    </div>
  )
}

// ─── Candidate Drawer ───────────────────────────────────────────────────
function CandidateDrawer({ candidate, onClose }: { candidate: RankedCandidate; onClose: () => void }) {
  const scoreColor = candidate.match_score >= 85 ? '#e8ff47' : candidate.match_score >= 70 ? '#ffbe32' : '#ff5050'

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 40,
        }}
      />
      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '440px',
          background: '#111',
          borderLeft: '1px solid #1e1e1e',
          zIndex: 50,
          overflowY: 'auto',
          padding: '40px',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#555',
            fontSize: '20px',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f0f0f0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >
          ✕
        </button>

        {/* Rank badge */}
        <span style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          color: '#e8ff47',
          background: 'rgba(232,255,71,0.1)',
          borderRadius: '6px',
          padding: '4px 10px',
          fontWeight: 600,
        }}>
          #{candidate.rank}
        </span>

        {/* Name */}
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          color: '#f0f0f0',
          fontWeight: 900,
          marginTop: '16px',
        }}>
          {candidate.name}
        </h2>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#555',
          marginTop: '4px',
        }}>
          {candidate.current_position}
        </p>

        {/* Score */}
        <p style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '64px',
          color: scoreColor,
          fontWeight: 900,
          marginTop: '24px',
          lineHeight: 1,
        }}>
          {candidate.match_score}
        </p>

        {/* Why they ranked here */}
        <div style={{
          background: '#161616',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px',
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: '#444',
            marginBottom: '8px',
          }}>
            Why they ranked here
          </p>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#888',
            lineHeight: 1.7,
          }}>
            {candidate.why_ranked}
          </p>
        </div>

        {/* Profile Summary */}
        <div style={{ marginTop: '24px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: '#444',
            marginBottom: '8px',
          }}>
            Profile Summary
          </p>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#888',
            lineHeight: 1.6,
          }}>
            {candidate.summary}
          </p>
        </div>

        {/* Experience */}
        <div style={{ marginTop: '24px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: '#444',
            marginBottom: '8px',
          }}>
            Experience
          </p>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#888',
            lineHeight: 1.6,
          }}>
            {candidate.experience}
          </p>
        </div>

        {/* Education */}
        <div style={{ marginTop: '24px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: '#444',
            marginBottom: '8px',
          }}>
            Education
          </p>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#888',
            lineHeight: 1.6,
          }}>
            {candidate.education}
          </p>
        </div>

        {/* Notable Projects */}
        <div style={{ marginTop: '24px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: '#444',
            marginBottom: '8px',
          }}>
            Notable Projects
          </p>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#888',
            lineHeight: 1.6,
          }}>
            {candidate.notable_projects}
          </p>
        </div>

        {/* Signal Breakdown */}
        <div style={{ marginTop: '24px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: '#444',
            marginBottom: '16px',
          }}>
            Signal Breakdown
          </p>
          <SignalBar label="Semantic Fit" value={candidate.signal_breakdown.semantic} delay={0.1} />
          <SignalBar label="Career Trajectory" value={candidate.signal_breakdown.career} delay={0.2} />
          <SignalBar label="Behavioral Signals" value={candidate.signal_breakdown.behavioral} delay={0.3} />
        </div>

        {/* Skills */}
        <div style={{ marginTop: '24px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: '#444',
            marginBottom: '12px',
          }}>
            Skills
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {candidate.skills.map(skill => (
              <span key={skill} style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                color: '#888',
                background: '#161616',
                border: '1px solid #1e1e1e',
                borderRadius: '6px',
                padding: '4px 10px',
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {candidate.linkedin_url && (
            <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#555',
              border: '1px solid #222',
              borderRadius: '6px',
              padding: '6px 14px',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}>
              LinkedIn ↗
            </a>
          )}
          {candidate.github_url && (
            <a href={candidate.github_url} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#555',
              border: '1px solid #222',
              borderRadius: '6px',
              padding: '6px 14px',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}>
              GitHub ↗
            </a>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ─── Main Search Page ───────────────────────────────────────────────────
export default function Search() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [weights, setWeights] = useState({ semantic: 70, career: 50, behavioral: 50 })
  const [searching, setSearching] = useState(false)
  const [candidates, setCandidates] = useState<RankedCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!jobDescription.trim() || !jobTitle.trim()) return
    setSearching(true)
    setCandidates([])
    setSearched(false)
    setError('')

    try {
      // Save search to Supabase
      const { data: searchRecord } = await supabase
        .from('searches')
        .insert({
          recruiter_id: user!.id,
          job_title: jobTitle,
          job_description: jobDescription,
          signal_weights: weights
        })
        .select()
        .single()

      console.log('Returned searchRecord:', searchRecord)

      // Call Groq to rank candidates
      const pool = getCandidatePool()
      const ranked = await rankCandidates(
        jobTitle,
        jobDescription,
        pool,
        weights
      )

      // Merge Groq ranking results with full candidate profiles
      const fullRanked = ranked.map(r => {
        const full = pool.find(c => c.name === r.candidate_id)!
        return { ...full, ...r }
      })

      setCandidates(fullRanked)
      setSearched(true)

      if (searchRecord) {
        localStorage.setItem('apex_last_search_results', JSON.stringify({
          search_id: searchRecord.id,
          top_score: fullRanked[0]?.match_score
        }))
      }

      console.log('Search record:', searchRecord)
      console.log('Ranked candidates:', fullRanked)

      // Save ranked candidates to Supabase
      if (searchRecord) {
        await supabase.from('candidates').insert(
          fullRanked.map(c => ({
            search_id: searchRecord.id,
            name: c.name,
            current_position: c.current_position,
            match_score: c.match_score,
            signal_breakdown: c.signal_breakdown,
            profile_summary: c.why_ranked,
            skills: c.skills,
            rank: c.rank
          }))
        )
      }
    } catch (err: any) {
      console.error('Ranking failed:', err)
      setError(err.message || 'Groq Ranking failed. Please check your API key and try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
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
      {/* Pulse animation for skeletons */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
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
            <Link to="/search" style={navLinkStyle(true)}>New Search</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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

            {/* Avatar link to Profile */}
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: profile?.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : 'linear-gradient(135deg, #e8ff47 0%, #c4d93a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #1e1e1e',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#e8ff47'
                e.currentTarget.style.transform = 'scale(1.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1e1e1e'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              >
                {!profile?.avatar_url && (
                  <span style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0a0a0a',
                  }}>
                    {(profile?.full_name || user?.email || '?').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* TWO-PANEL LAYOUT */}
      <div style={{ display: 'flex', paddingTop: '64px' }}>
        {/* LEFT PANEL */}
        <div style={{
          width: '380px',
          minWidth: '380px',
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          background: '#111',
          borderRight: '1px solid #1a1a1a',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '28px',
              color: '#f0f0f0',
              fontWeight: 900,
            }}>
              Find Candidates
            </h1>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#555',
              marginTop: '8px',
            }}>
              Paste a job description to rank your candidate pool
            </p>
          </div>

          {/* Job Title */}
          <div>
            <label style={labelStyle}>Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="Senior Backend Engineer"
              style={inputStyle}
            />
          </div>

          {/* Job Description */}
          <div>
            <label style={labelStyle}>Job Description</label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              style={{
                ...inputStyle,
                resize: 'none' as const,
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Signal Weights */}
          <div>
            <label style={labelStyle}>Signal Weights</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {([
                { key: 'semantic' as const, label: 'Semantic Fit' },
                { key: 'career' as const, label: 'Career Trajectory' },
                { key: 'behavioral' as const, label: 'Behavioral Signals' },
              ]).map(signal => (
                <div key={signal.key}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '8px',
                  }}>
                    <span>{signal.label}</span>
                    <span>{weights[signal.key]}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={weights[signal.key]}
                    onChange={e => setWeights(w => ({ ...w, [signal.key]: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      accentColor: '#e8ff47',
                      height: '4px',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              ))}
            </div>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#333',
              marginTop: '12px',
            }}>
              Weights are independent — tune each signal freely
            </p>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              width: '100%',
              background: '#e8ff47',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: searching ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              opacity: searching ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {searching ? 'Analyzing candidates...' : 'Find Best Candidates'}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          flex: 1,
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          background: '#0a0a0a',
          padding: '32px',
        }}>
          {/* Empty State */}
          {!searching && !searched && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '64px',
                color: '#e8ff47',
                lineHeight: 1,
              }}>
                →
              </span>
              <h2 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '28px',
                color: '#f0f0f0',
                fontWeight: 900,
                marginTop: '16px',
              }}>
                Results will appear here
              </h2>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#555',
                marginTop: '8px',
              }}>
                Paste a job description and click search
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {!searching && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <span style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}>
                ⚠️
              </span>
              <h2 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '24px',
                color: '#ff5050',
                fontWeight: 900,
              }}>
                Ranking Failed
              </h2>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#888',
                marginTop: '12px',
                maxWidth: '400px',
                lineHeight: 1.6,
              }}>
                {error}
              </p>
            </motion.div>
          )}

          {/* Loading Skeletons */}
          {searching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#888',
                marginBottom: '24px',
              }}>
                Apex is analyzing 6 candidates with Groq AI...
              </p>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          )}

          {/* Results */}
          {searched && !searching && candidates.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#555',
                marginBottom: '24px',
              }}>
                {candidates.length} candidates ranked by Apex AI
              </p>

              {candidates.map((c, index) => {
                const scoreColor = c.match_score >= 85 ? '#e8ff47' : c.match_score >= 70 ? '#ffbe32' : '#ff5050'

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    onClick={() => setSelectedCandidate(c)}
                    style={{
                      background: '#111',
                      border: '1px solid #1e1e1e',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '16px',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#e8ff47')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
                  >
                    {/* Top row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '14px',
                          color: '#333',
                        }}>
                          #{c.rank}
                        </span>
                        <span style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#f0f0f0',
                        }}>
                          {c.name}
                        </span>
                      </div>
                      <span style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '28px',
                        color: scoreColor,
                        fontWeight: 900,
                        lineHeight: 1,
                      }}>
                        {c.match_score}
                      </span>
                    </div>

                    {/* Position */}
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      color: '#555',
                      marginTop: '4px',
                      marginLeft: '24px',
                    }}>
                      {c.current_position}
                    </p>

                    {/* Why Ranked */}
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      color: '#666',
                      lineHeight: 1.6,
                      marginTop: '12px',
                    }}>
                      {c.why_ranked}
                    </p>

                    {/* Skills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {c.skills.map(skill => (
                        <span key={skill} style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '11px',
                          color: '#888',
                          background: '#161616',
                          border: '1px solid #1e1e1e',
                          borderRadius: '6px',
                          padding: '4px 10px',
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {c.linkedin_url && (
                        <a
                          href={c.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '12px',
                            color: '#555',
                            border: '1px solid #222',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            textDecoration: 'none',
                          }}
                        >
                          LinkedIn
                        </a>
                      )}
                      {c.github_url && (
                        <a
                          href={c.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '12px',
                            color: '#555',
                            border: '1px solid #222',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            textDecoration: 'none',
                          }}
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* CANDIDATE DRAWER */}
      <AnimatePresence>
        {selectedCandidate && (
          <CandidateDrawer
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
