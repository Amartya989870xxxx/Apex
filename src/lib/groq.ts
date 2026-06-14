import type { Candidate, RankedCandidate } from '../data/candidates'
import { CANDIDATE_POOL } from '../data/candidates'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export function getCandidatePool(): Candidate[] {
  const stored = localStorage.getItem('apex_candidates')
  if (stored) {
    try { return JSON.parse(stored) } catch { return CANDIDATE_POOL }
  }
  return CANDIDATE_POOL
}

export async function rankCandidates(
  jobTitle: string,
  jobDescription: string,
  candidates: Candidate[],
  weights: { semantic: number; career: number; behavioral: number }
): Promise<RankedCandidate[]> {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('Groq API Key is not set or is invalid in .env')
  }

  const prompt = `You are an expert AI recruiter. Analyze this job and rank the candidates.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

SIGNAL WEIGHTS (how much each factor matters, 0-100):
- Semantic Fit (skills/experience match): ${weights.semantic}
- Career Trajectory (growth/progression): ${weights.career}  
- Behavioral Signals (activity/contributions): ${weights.behavioral}

CANDIDATES TO RANK:
${candidates.map((c, i) => `
CANDIDATE ${i + 1}: ${c.name}
Current Role: ${c.current_position}
Summary: ${c.summary}
Skills: ${c.skills.join(', ')}
Experience: ${c.experience}
Education: ${c.education}
GitHub Activity: ${c.github_activity}
Notable Projects: ${c.notable_projects}
`).join('\n---\n')}

Return ONLY a JSON array with this exact structure, no markdown, no explanation:
[
  {
    "candidate_id": "candidate's name exactly as given",
    "rank": 1,
    "match_score": 94,
    "signal_breakdown": {
      "semantic": 96,
      "career": 91,
      "behavioral": 88
    },
    "why_ranked": "2-3 sentence plain-English explanation of why they ranked here, referencing specific skills and signals from their profile"
  }
]

Rules:
- match_score must be between 40-99
- Rank all ${candidates.length} candidates (1 = best fit)
- signal_breakdown values must reflect the signal weights given
- why_ranked must be specific to this candidate and this job, not generic
- Return valid JSON only, nothing else`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Groq API error (Status: ${response.status}): ${errText || 'Unknown Error'}`)
  }
  
  const data = await response.json()
  const content = data.choices[0].message.content.trim()

  // Clean output just in case there is markdown wrapper
  const cleanContent = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
  const parsed = JSON.parse(cleanContent)
  
  return parsed as RankedCandidate[]
}
