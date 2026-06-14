import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ChevronDown, Check, Menu, X } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const faqs = [
  {
    q: 'How does Apex rank candidates?',
    a: 'Apex uses a three-layer scoring model combining semantic fit, career trajectory metadata, and behavioral signals. Each layer is weighted and combined into a single composite ranking score with full explainability per candidate.'
  },
  {
    q: 'Where does candidate data come from?',
    a: 'Candidate profiles are pulled from your connected Supabase database. Apex works entirely with your existing candidate pool — no third-party data brokers or external databases required.'
  },
  {
    q: 'Can I adjust how candidates are scored?',
    a: 'Yes. Every search includes tunable signal weight sliders. You decide how much semantic fit, career trajectory, and behavioral signals influence the final ranking for each specific role.'
  },
  {
    q: 'Is Apex built for technical hiring?',
    a: 'Apex was designed with technical roles in mind. The semantic engine understands engineering domains, framework ecosystems, and seniority patterns — not just keyword matching.'
  },
  {
    q: 'How is this different from an ATS filter?',
    a: 'Traditional ATS systems match exact keywords and fail on synonyms. Apex understands meaning — a candidate with "event-driven architecture" experience matches a role requiring "Kafka and async systems" expertise.'
  }
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderBottom: '1px solid #222',
        cursor: 'pointer',
        padding: '28px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '16px',
          fontWeight: 500,
          color: open ? '#f0f0f0' : '#888',
          transition: 'color 0.2s',
          flex: 1,
        }}>
          {q}
        </span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
          <ChevronDown size={18} color="#e8ff47" />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{
              paddingTop: '16px',
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#666',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const heroY = useTransform(scrollY, [0, 500], [0, -60])

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '72px',
        display: 'flex', alignItems: 'center',
        padding: '0 64px',
        borderBottom: '1px solid #1a1a1a',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#e8ff47', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Apex
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <Link to="/dashboard" style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600,
                color: '#0a0a0a', background: '#f0f0f0',
                padding: '10px 22px', borderRadius: '10px',
                textDecoration: 'none', display: 'inline-block',
                letterSpacing: '-0.01em',
              }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 20px', textDecoration: 'none' }}>
                  Sign In
                </Link>
                <Link to="/signup" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, color: '#0a0a0a', background: '#e8ff47', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', display: 'inline-block' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{ paddingTop: '160px', paddingBottom: '120px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div style={{ opacity: heroOpacity, y: heroY, width: '100%' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                marginBottom: '40px',
                padding: '8px 16px', borderRadius: '999px',
                border: '1px solid #222',
                fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#e8ff47',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e8ff47' }} />
              AI Candidate Intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(52px, 8vw, 112px)',
                color: '#f0f0f0',
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
                marginBottom: '32px',
                fontWeight: 900,
              }}
            >
              Rank the right<br />
              candidates.<br />
              <span style={{ color: '#e8ff47', fontStyle: 'italic' }}>Decisively.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '18px', lineHeight: 1.7,
                color: '#666', maxWidth: '500px',
                marginBottom: '48px',
              }}
            >
              Paste a job description. Apex semantically ranks your entire candidate pool and delivers a shortlist worth hiring from — in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '80px' }}
            >
              <Link to="/signup" style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500,
                color: '#0a0a0a', background: '#e8ff47',
                border: 'none', cursor: 'pointer',
                padding: '14px 28px', borderRadius: '12px',
                textDecoration: 'none',
              }}>
                Get Started Free <ArrowUpRight size={15} />
              </Link>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500,
                color: '#f0f0f0', background: 'none',
                border: '1px solid #222', cursor: 'pointer',
                padding: '14px 28px', borderRadius: '12px',
              }}>
                See How It Works
              </button>
            </motion.div>

            {/* HERO PRODUCT MOCKUP */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: '100%', maxWidth: '860px',
                borderRadius: '20px', overflow: 'hidden',
                border: '1px solid #1e1e1e',
                background: '#111',
                boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
              }}
            >
              {/* Browser chrome */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 20px',
                borderBottom: '1px solid #1e1e1e',
                background: '#0f0f0f',
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                </div>
                <div style={{
                  flex: 1, textAlign: 'center', maxWidth: '260px', margin: '0 auto',
                  background: '#1a1a1a', borderRadius: '6px', padding: '4px 12px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#555',
                }}>
                  apex.ai — Senior Backend Engineer
                </div>
              </div>
              {/* App body */}
              <div style={{ display: 'flex', height: '320px' }}>
                {/* Left: candidates */}
                <div style={{ width: '220px', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid #1e1e1e',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '10px',
                    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444',
                  }}>
                    Candidates
                  </div>
                  {[
                    { rank: 1, name: 'Priya Shah', score: 94 },
                    { rank: 2, name: 'Arjun Mehta', score: 87 },
                    { rank: 3, name: 'Sneha Patel', score: 81 },
                    { rank: 4, name: 'Rahul Verma', score: 74 },
                    { rank: 5, name: 'Maya Iyer', score: 62 },
                  ].map(c => (
                    <div key={c.rank} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: '1px solid #161616',
                      background: c.rank === 1 ? 'rgba(232,255,71,0.04)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#333', width: '20px' }}>#{c.rank}</span>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 500, color: c.rank === 1 ? '#f0f0f0' : '#666' }}>{c.name}</span>
                      </div>
                      <span style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 700,
                        padding: '2px 7px', borderRadius: '6px',
                        background: c.score >= 85 ? 'rgba(232,255,71,0.12)' : c.score >= 70 ? 'rgba(255,190,50,0.12)' : 'rgba(255,80,80,0.12)',
                        color: c.score >= 85 ? '#e8ff47' : c.score >= 70 ? '#ffbe32' : '#ff5050',
                      }}>
                        {c.score}%
                      </span>
                    </div>
                  ))}
                </div>
                {/* Right: signal breakdown */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 40px', gap: '24px' }}>
                  <div>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>
                      Signal Breakdown
                    </p>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#f0f0f0', fontWeight: 700 }}>
                      Composite rank score
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Semantic Fit', value: 92, delay: 0.5 },
                      { label: 'Career Trajectory', value: 84, delay: 0.65 },
                      { label: 'Behavioral Signals', value: 76, delay: 0.8 },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                          <span>{s.label}</span>
                          <span style={{ color: '#e8ff47' }}>{s.value}%</span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '2px', background: '#1e1e1e', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.value}%` }}
                            transition={{ duration: 1, delay: s.delay, ease: 'easeOut' }}
                            style={{ height: '100%', background: '#e8ff47', borderRadius: '2px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '48px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444' }}>
            Trusted by recruiting teams at fast-growing companies
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '48px' }}>
            {['Acme Corp', 'Startify', 'NexaHire', 'TalentOS', 'Horizon Labs'].map(co => (
              <span key={co} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, color: '#333' }}>{co}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE 1 */}
      <section style={{ padding: '160px 64px' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
          style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '96px', alignItems: 'center' }}
        >
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8ff47' }}>
              Deep Job Understanding
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 4vw, 56px)', color: '#f0f0f0', lineHeight: 1.1, fontWeight: 900 }}>
              Sees beyond<br />
              <span style={{ color: '#e8ff47', fontStyle: 'italic' }}>keywords.</span>
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', lineHeight: 1.8, color: '#666', maxWidth: '400px' }}>
              Most ATS tools fail because they match words, not meaning. Apex reads your job description the way a senior recruiter would — understanding context, seniority signals, and what the role actually demands.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Understands synonyms and domain equivalents', 'Infers seniority from description language', 'Extracts implicit requirements automatically'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Check size={14} color="#e8ff47" style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#888' }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            variants={fadeUp}
            style={{
              height: '360px', borderRadius: '20px',
              background: '#111', border: '1px solid #1e1e1e',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px',
              padding: '40px',
            }}
          >
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#f0f0f0', fontWeight: 700 }}>
              Semantic Analysis Engine
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {['distributed systems ≈ microservices', '5+ years → senior', 'team lead → leadership', 'Kafka → async systems'].map(tag => (
                <span key={tag} style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 500,
                  padding: '8px 14px', borderRadius: '999px',
                  border: '1px solid #2a2a2a', color: '#e8ff47',
                  background: 'rgba(232,255,71,0.04)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURE 2 */}
      <section style={{ padding: '160px 64px', background: '#0f0f0f', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
          style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '96px', alignItems: 'center' }}
        >
          <motion.div
            variants={fadeUp}
            style={{
              height: '360px', borderRadius: '20px',
              background: '#111', border: '1px solid #1e1e1e',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px',
              padding: '40px',
            }}
          >
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#f0f0f0', fontWeight: 700 }}>
              Signal Integration Layer
            </span>
            <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[{ label: 'Semantic Fit', value: 84 }, { label: 'Career Trajectory', value: 71 }, { label: 'Behavioral Signals', value: 53 }].map((s, i) => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                    <span>{s.label}</span>
                    <span style={{ color: '#e8ff47' }}>{s.value}%</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: '#1e1e1e', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                      style={{ height: '100%', background: '#e8ff47', borderRadius: '2px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8ff47' }}>
              Signal Integration
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 4vw, 56px)', color: '#f0f0f0', lineHeight: 1.1, fontWeight: 900 }}>
              Every signal.<br />
              <span style={{ color: '#e8ff47', fontStyle: 'italic' }}>One score.</span>
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', lineHeight: 1.8, color: '#666', maxWidth: '400px' }}>
              Apex combines three layers of intelligence — semantic fit, career trajectory metadata, and behavioral signals — into a single composite ranking score with full explainability per candidate.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Weighted signal scoring tunable per search', 'Career progression speed analysis', 'GitHub and LinkedIn activity signals'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Check size={14} color="#e8ff47" style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#888' }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURE 3 */}
      <section style={{ padding: '160px 64px' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
          style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '96px', alignItems: 'center' }}
        >
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8ff47' }}>
              The Output
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 4vw, 56px)', color: '#f0f0f0', lineHeight: 1.1, fontWeight: 900 }}>
              A shortlist worth<br />
              <span style={{ color: '#e8ff47', fontStyle: 'italic' }}>hiring from.</span>
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', lineHeight: 1.8, color: '#666', maxWidth: '400px' }}>
              No more wading through 200 resumes. Apex delivers a ranked list of your top candidates — each with a match score, signal breakdown, and plain-English explanation of why they rank where they do.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Numbered ranking with composite scores', 'Per-candidate AI reasoning explanation', 'One-click profile deep dive'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Check size={14} color="#e8ff47" style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#888' }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            variants={fadeUp}
            style={{
              height: '360px', borderRadius: '20px',
              background: '#111', border: '1px solid #1e1e1e',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
              padding: '40px',
            }}
          >
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#f0f0f0', fontWeight: 700 }}>
              Ranked Shortlist
            </span>
            <div style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e1e1e' }}>
              {[
                { rank: 1, name: 'Priya S.', score: 94 },
                { rank: 2, name: 'Arjun M.', score: 87 },
                { rank: 3, name: 'Sneha P.', score: 81 },
                { rank: 4, name: 'Rahul V.', score: 74 },
              ].map((c, i) => (
                <div key={c.rank} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < 3 ? '1px solid #1a1a1a' : 'none',
                  background: '#161616',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#333' }}>#{c.rank}</span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, color: '#f0f0f0' }}>{c.name}</span>
                  </div>
                  <span style={{
                    fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 700,
                    padding: '4px 10px', borderRadius: '8px',
                    background: c.score >= 85 ? 'rgba(232,255,71,0.12)' : 'rgba(255,190,50,0.12)',
                    color: c.score >= 85 ? '#e8ff47' : '#ffbe32',
                  }}>
                    {c.score}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '160px 64px', background: '#0f0f0f', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
          style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}
        >
          <motion.h2 variants={fadeUp} style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 5vw, 64px)', color: '#f0f0f0', fontWeight: 900, marginBottom: '16px' }}>
            How Apex works
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', color: '#555', marginBottom: '80px' }}>
            Three steps from job description to shortlist.
          </motion.p>
          <motion.div variants={stagger} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '64px' }}>
            {[
              { n: '01', title: 'Paste your JD', body: 'Drop in any job description. Apex extracts requirements, seniority signals, and domain context automatically — no formatting required.' },
              { n: '02', title: 'Set signal weights', body: 'Tune how much semantic fit, career trajectory, and behavioral signals influence the final ranking for this specific role.' },
              { n: '03', title: 'Get your shortlist', body: 'Receive a ranked list of your best-fit candidates with composite scores and plain-English explanations. Hire with confidence.' },
            ].map(step => (
              <motion.div key={step.n} variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', color: '#e8ff47', fontWeight: 900, lineHeight: 1, opacity: 0.5 }}>
                  {step.n}
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#f0f0f0', fontWeight: 700 }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', lineHeight: 1.8, color: '#555', maxWidth: '240px' }}>
                  {step.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA */}
      <section style={{ padding: '160px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,255,71,0.05) 0%, transparent 70%)'
        }} />
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
          style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
        >
          <motion.h2 variants={fadeUp} style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(44px, 7vw, 96px)', color: '#f0f0f0', fontWeight: 900, lineHeight: 1.05, marginBottom: '24px' }}>
            Start hiring<br />
            <span style={{ color: '#e8ff47', fontStyle: 'italic' }}>decisively.</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', lineHeight: 1.7, color: '#555', maxWidth: '440px', marginBottom: '48px' }}>
            No setup required. Paste a job description and get a ranked shortlist in under 30 seconds.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/signup" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 500,
              color: '#0a0a0a', background: '#e8ff47',
              border: 'none', cursor: 'pointer',
              padding: '16px 32px', borderRadius: '12px',
              textDecoration: 'none',
            }}>
              Get Started Free <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '120px 64px', borderTop: '1px solid #1a1a1a' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
          style={{ maxWidth: '720px', margin: '0 auto' }}
        >
          <motion.h2 variants={fadeUp} style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 5vw, 56px)', color: '#f0f0f0', fontWeight: 900, textAlign: 'center', marginBottom: '64px' }}>
            Questions & answers
          </motion.h2>
          <motion.div variants={fadeUp}>
            {faqs.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '40px 64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#e8ff47', fontWeight: 900 }}>Apex</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#333' }}>© 2026 Apex. All rights reserved.</span>
        </div>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#333' }}>Built by Team Kairos</span>
      </footer>

    </div>
  )
}