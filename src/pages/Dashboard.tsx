import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface SearchRecord {
  id: string
  job_title: string
  created_at: string
  signal_weights: { semantic: number; career: number; behavioral: number }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning,'
  if (h < 17) return 'Good afternoon,'
  return 'Good evening,'
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [searches, setSearches] = useState<SearchRecord[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [thisWeekCount, setThisWeekCount] = useState(0)
  const [topScoresMap, setTopScoresMap] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!user) return
    const fetchSearches = async () => {
      // 1. Fetch total counts
      const { count: totalSearchesCount } = await supabase
        .from('searches')
        .select('*', { count: 'exact', head: true })
        .eq('recruiter_id', user.id)
      setTotalCount(totalSearchesCount || 0)

      // 2. Fetch weekly counts
      const oneWeekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: weeklySearchesCount } = await supabase
        .from('searches')
        .select('*', { count: 'exact', head: true })
        .eq('recruiter_id', user.id)
        .gte('created_at', oneWeekAgoIso)
      setThisWeekCount(weeklySearchesCount || 0)

      // 3. Fetch recent searches
      const { data: searchesData } = await supabase
        .from('searches')
        .select('*')
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      const searchesList = searchesData || []
      setSearches(searchesList)

      // 4. Fetch top scores for recent searches
      if (searchesList.length > 0) {
        const searchIds = searchesList.map(s => s.id)
        const { data: topScores } = await supabase
          .from('candidates')
          .select('search_id, match_score')
          .in('search_id', searchIds)
          .order('match_score', { ascending: false })

        const scoreMap: Record<string, number> = {}
        topScores?.forEach(row => {
          if (!scoreMap[row.search_id]) {
            scoreMap[row.search_id] = row.match_score
          }
        })

        // Fallback check
        const lastResult = JSON.parse(localStorage.getItem('apex_last_search_results') || '{}')
        searchesList.forEach(search => {
          if (!scoreMap[search.id] && lastResult.search_id === search.id) {
            scoreMap[search.id] = lastResult.top_score
          }
        })

        setTopScoresMap(scoreMap)
      }
      setLoadingData(false)
    }
    fetchSearches()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const totalSearches = totalCount
  const candidatesRanked = totalCount * 6
  const thisWeek = thisWeekCount

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

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Recruiter'

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
            <Link to="/dashboard" style={navLinkStyle(true)}>Dashboard</Link>
            <Link to="/search" style={navLinkStyle(false)}>New Search</Link>
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
                    {getInitials()}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          paddingTop: '64px',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '128px 64px 64px',
        }}
      >
        {/* Greeting */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: '#555',
          }}>
            {getGreeting()}
          </p>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '48px',
            color: '#f0f0f0',
            fontWeight: 900,
            marginTop: '4px',
          }}>
            {displayName}
          </h1>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '48px',
        }}>
          {[
            { label: 'Total Searches', value: totalSearches, desc: 'all time' },
            { label: 'Candidates Ranked', value: candidatesRanked, desc: 'across all searches' },
            { label: 'This Week', value: thisWeek, desc: 'searches in last 7 days' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: '16px',
              padding: '28px',
            }}>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: '#444',
                marginBottom: '12px',
              }}>
                {stat.label}
              </p>
              <p style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '40px',
                color: '#e8ff47',
                fontWeight: 900,
              }}>
                {stat.value}
              </p>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#555',
                marginTop: '4px',
              }}>
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Searches */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '24px',
              color: '#f0f0f0',
              fontWeight: 900,
            }}>
              Recent Searches
            </h2>
            <button
              onClick={() => navigate('/search')}
              style={{
                background: '#e8ff47',
                color: '#0a0a0a',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              New Search →
            </button>
          </div>

          {loadingData ? (
            <div style={{
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: '16px',
              padding: '64px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid #e8ff47',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : searches.length === 0 ? (
            /* Empty state */
            <div style={{
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: '16px',
              padding: '64px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#161616',
                borderRadius: '12px',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '20px' }}>🔍</span>
              </div>
              <h3 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '22px',
                color: '#f0f0f0',
                fontWeight: 900,
              }}>
                No searches yet
              </h3>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#555',
                marginTop: '8px',
              }}>
                Start your first candidate search
              </p>
              <button
                onClick={() => navigate('/search')}
                style={{
                  background: '#e8ff47',
                  color: '#0a0a0a',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '24px',
                }}
              >
                Start Searching
              </button>
            </div>
          ) : (
            /* Table */
            <div style={{
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #1a1a1a',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: '#333',
              }}>
                <span>Job Title</span>
                <span>Date</span>
                <span>Candidates</span>
                <span>Top Score</span>
              </div>
              {/* Rows */}
              {searches.map(s => (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '16px 24px',
                  borderBottom: '1px solid #0f0f0f',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  alignItems: 'center',
                }}>
                  <span style={{ color: '#f0f0f0' }}>{s.job_title || 'Untitled Search'}</span>
                  <span style={{ color: '#555' }}>
                    {new Date(s.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span style={{ color: '#555' }}>6</span>
                  <span style={{ color: '#e8ff47', fontWeight: 600 }}>
                    {topScoresMap[s.id] ? `${topScoresMap[s.id]}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
