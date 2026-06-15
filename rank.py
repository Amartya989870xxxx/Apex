#!/usr/bin/env python3
"""
APEX rank.py — Candidate Intelligence & Ranking
Team Kairos | India.Runs Hackathon | Track 1: Data & AI Challenge

Ranks ~50k candidates for: Senior AI Engineer — Founding Team at Redrob AI
Output: submission.csv with top 100 ranked candidates

CPU-only, no network calls, runs in ~5 minutes on 16GB RAM.
"""

import argparse
import json
import csv
import re
import math
import sys
from datetime import datetime, date

# ---------------------------------------------------------------------------
# JOB DESCRIPTION SIGNALS
# ---------------------------------------------------------------------------

# Must-have skill keywords (higher weight)
MUST_HAVE_SKILLS = {
    # Embeddings & retrieval
    "embedding", "embeddings", "sentence-transformer", "sentence_transformer",
    "sentence transformers", "bge", "e5", "openai embeddings", "text-embedding",
    "semantic search", "dense retrieval", "bi-encoder", "cross-encoder",
    # Vector DBs
    "vector db", "vector database", "pinecone", "weaviate", "qdrant", "faiss",
    "elasticsearch", "milvus", "chroma", "pgvector", "hybrid search",
    "approximate nearest neighbor", "ann", "hnsw",
    # Core AI/ML
    "nlp", "natural language processing", "large language model", "llm",
    "transformer", "bert", "gpt", "retrieval augmented generation", "rag",
    "information retrieval", "ranking", "reranking", "re-ranking",
    # Evaluation
    "ndcg", "mrr", "map", "a/b testing", "evaluation framework", "offline eval",
    # Python
    "python",
}

# Nice-to-have skill keywords (lower weight)
NICE_TO_HAVE_SKILLS = {
    "lora", "qlora", "peft", "fine-tuning", "fine tuning", "finetuning",
    "xgboost", "learning to rank", "ltr", "lightgbm", "catboost",
    "hr-tech", "hrtech", "marketplace", "recommendation system", "recommender",
    "distributed systems", "distributed training", "kubernetes", "ray",
    "triton", "onnx", "tensorrt", "model serving", "mlops", "mlflow",
    "open source", "github", "huggingface", "hugging face",
    "pytorch", "tensorflow", "jax",
    "langchain", "llamaindex", "llama index",
    "spark", "kafka", "redis",
    "aws", "gcp", "azure", "cloud",
}

# Negative signals (over-qualified or wrong domain)
NEGATIVE_SIGNALS = {
    "sap", "salesforce", "oracle", "erp", "mainframe", "cobol",
    "frontend only", "react only", "angular only", "ios", "android",
    "mobile developer", "game developer", "unity", "unreal",
}

# Experience sweet spot for this role
EXP_MIN = 5.0
EXP_IDEAL_MIN = 5.0
EXP_IDEAL_MAX = 9.0
EXP_MAX = 14.0

# Education tier weights
EDU_TIER_WEIGHTS = {
    "tier_1": 1.0,   # IIT/IIM/BITS
    "tier_2": 0.75,
    "tier_3": 0.45,
    "tier_4": 0.25,
    None: 0.30,       # unknown
}

# Relevant degree fields
RELEVANT_FIELDS = {
    "computer science", "cs", "information technology", "it",
    "artificial intelligence", "machine learning", "data science",
    "electronics", "electrical engineering", "ece", "ee",
    "mathematics", "statistics", "engineering",
}

# ---------------------------------------------------------------------------
# SCORING FUNCTIONS
# ---------------------------------------------------------------------------

def normalize(value, low, high):
    """Clamp and normalize value to [0, 1]."""
    if high == low:
        return 0.5
    return max(0.0, min(1.0, (value - low) / (high - low)))


# Known tech company founding years for duration sanity checks
# A non-exhaustive list of common companies; unknown companies default to no penalty
COMPANY_FOUNDING_YEARS = {
    "google": 1998, "microsoft": 1975, "amazon": 1994, "meta": 2004, "facebook": 2004,
    "apple": 1976, "netflix": 1997, "uber": 2009, "airbnb": 2008, "twitter": 2006,
    "x": 2006, "linkedin": 2003, "stripe": 2010, "openai": 2015, "anthropic": 2021,
    "deepmind": 2010, "hugging face": 2016, "huggingface": 2016, "cohere": 2019,
    "pinecone": 2019, "weaviate": 2019, "qdrant": 2021, "chroma": 2022,
    "redrob": 2022, "flipkart": 2007, "zomato": 2008, "swiggy": 2014,
    "ola": 2010, "paytm": 2010, "byju": 2011, "byjus": 2011, "razorpay": 2014,
    "freshworks": 2010, "zoho": 1996, "infosys": 1981, "wipro": 1945, "tcs": 1968,
    "hcl": 1976, "tech mahindra": 1986, "mindtree": 1999, "mphasis": 2000,
}

CURRENT_YEAR = date.today().year


def detect_honeypot(candidate: dict) -> tuple[bool, str]:
    """
    Detect impossible/fabricated profiles.
    Returns (is_honeypot: bool, reason: str).

    Three checks per spec:
    1. Role duration > company could possibly exist (company age check)
    2. 10+ skills all claiming 'expert' with 0 duration_months
    3. years_of_experience < sum(career_history durations)/12 by >3 years
    """
    profile = candidate.get("profile", {}) or {}
    history = candidate.get("career_history", []) or []
    skills  = candidate.get("skills", []) or []

    # --- Check 1: Duration > company age ---
    for job in history:
        company = (job.get("company") or "").lower().strip()
        duration_months = job.get("duration_months") or 0
        duration_years = duration_months / 12.0

        # Try to find founding year for known companies
        founding_year = None
        for known_name, year in COMPANY_FOUNDING_YEARS.items():
            if known_name in company:
                founding_year = year
                break

        if founding_year is not None:
            max_possible_years = CURRENT_YEAR - founding_year + 1
            if duration_years > max_possible_years + 0.5:  # +0.5 tolerance for rounding
                return True, (
                    f"impossible tenure: {duration_years:.1f} yrs at {company!r} "
                    f"(founded ~{founding_year}, max possible {max_possible_years:.0f} yrs)"
                )

    # --- Check 2: 10+ skills all 'expert' with 0 duration ---
    expert_zero_dur = [
        s for s in skills
        if (s.get("proficiency") or "").lower() == "expert"
        and (s.get("duration_months") or 0) == 0
    ]
    if len(expert_zero_dur) >= 10:
        return True, (
            f"fabricated skill claims: {len(expert_zero_dur)} 'expert' skills "
            f"each with 0 months of experience"
        )

    # --- Check 3: Stated YOE << sum of history durations ---
    stated_yoe = profile.get("years_of_experience")
    if stated_yoe is not None and history:
        history_total_months = sum((j.get("duration_months") or 0) for j in history)
        history_years = history_total_months / 12.0
        # History can exceed stated YOE slightly (overlap/concurrent roles) but not by >3 yrs
        if history_years > stated_yoe + 3.0:
            return True, (
                f"YOE inconsistency: states {stated_yoe:.1f} yrs but career history "
                f"totals {history_years:.1f} yrs (delta {history_years - stated_yoe:.1f} yrs)"
            )

    return False, ""


def skill_match_score(candidate: dict) -> tuple[float, list[str]]:
    """
    Score based on keyword overlap with JD skills.
    Returns (score 0-1, list of matched must-have skills).
    """
    # Build a single text blob from all text fields
    text_parts = []

    profile = candidate.get("profile", {})
    text_parts.append(profile.get("headline", ""))
    text_parts.append(profile.get("summary", ""))
    text_parts.append(profile.get("current_title", ""))

    for job in candidate.get("career_history", []):
        text_parts.append(job.get("title", ""))
        text_parts.append(job.get("description", ""))

    for skill in candidate.get("skills", []):
        text_parts.append(skill.get("name", ""))

    for cert in candidate.get("certifications", []):
        text_parts.append(cert.get("name", ""))

    # Skill assessment keys
    signals = candidate.get("redrob_signals", {})
    assess = signals.get("skill_assessment_scores", {}) or {}
    text_parts.extend(assess.keys())

    full_text = " ".join(text_parts).lower()
    full_text = re.sub(r"[^a-z0-9\s\-_/]", " ", full_text)

    # Count must-haves
    matched_must = []
    for kw in MUST_HAVE_SKILLS:
        if kw in full_text:
            matched_must.append(kw)

    matched_nice = sum(1 for kw in NICE_TO_HAVE_SKILLS if kw in full_text)
    negative_hit = sum(1 for kw in NEGATIVE_SIGNALS if kw in full_text)

    # Score components
    must_ratio = len(matched_must) / len(MUST_HAVE_SKILLS)
    nice_ratio = matched_nice / len(NICE_TO_HAVE_SKILLS)

    # Boost for explicit skill proficiency + assessment scores
    skill_boost = 0.0
    for skill in candidate.get("skills", []):
        name = skill.get("name", "").lower()
        prof = skill.get("proficiency", "").lower()
        end = skill.get("endorsements", 0) or 0
        for kw in MUST_HAVE_SKILLS:
            if kw in name:
                if prof in ("expert", "advanced"):
                    skill_boost += 0.015
                elif prof == "intermediate":
                    skill_boost += 0.008
                if end > 20:
                    skill_boost += 0.005

    # Assessment score bonus (Python, ML are key for this role)
    assess_bonus = 0.0
    for skill_name, score in assess.items():
        if score and score > 0:
            sn = skill_name.lower()
            if any(kw in sn for kw in ["python", "ml", "machine learning", "nlp", "deep learning"]):
                assess_bonus += (score / 100) * 0.02

    raw = (must_ratio * 0.65 + nice_ratio * 0.25) + min(skill_boost, 0.10) + min(assess_bonus, 0.05)
    raw -= negative_hit * 0.05

    return max(0.0, min(1.0, raw)), matched_must


def experience_score(candidate: dict) -> float:
    """Score years of experience for a 5-9 year sweet spot."""
    yoe = candidate.get("profile", {}).get("years_of_experience")
    if yoe is None:
        # Estimate from career history
        total = sum(j.get("duration_months", 0) or 0 for j in candidate.get("career_history", []))
        yoe = total / 12.0

    if yoe < 1:
        return 0.05
    elif yoe < EXP_IDEAL_MIN:
        # Ramp up: 1yr→0.3, 4yr→0.75, 5yr→1.0
        return normalize(yoe, 1.0, EXP_IDEAL_MIN) * 0.75 + 0.05
    elif yoe <= EXP_IDEAL_MAX:
        return 1.0
    elif yoe <= EXP_MAX:
        # Slight decay for over-experienced
        return 1.0 - normalize(yoe, EXP_IDEAL_MAX, EXP_MAX) * 0.35
    else:
        return 0.35


def career_trajectory_score(candidate: dict) -> float:
    """
    Score career progression: title seniority, company size, AI/ML domain relevance,
    and recency of relevant experience.
    """
    profile = candidate.get("profile", {})
    history = candidate.get("career_history", [])

    # Title seniority
    current_title = (profile.get("current_title") or "").lower()
    title_score = 0.3
    senior_titles = ["senior", "lead", "principal", "staff", "architect", "head of", "director"]
    mid_titles = ["engineer", "scientist", "researcher", "developer", "analyst"]
    ai_titles = ["ai", "ml", "machine learning", "nlp", "data scientist", "research", "deep learning", "llm"]

    if any(t in current_title for t in senior_titles):
        title_score = 0.85
    elif any(t in current_title for t in mid_titles):
        title_score = 0.60

    if any(t in current_title for t in ai_titles):
        title_score = min(1.0, title_score + 0.20)

    # Company size (larger = more scale experience, relevant for founding team who want scale knowledge)
    company_size = profile.get("current_company_size", "") or ""
    size_score_map = {
        "10001+": 0.9, "5001-10000": 0.85, "1001-5000": 0.80,
        "501-1000": 0.75, "201-500": 0.70, "51-200": 0.65,
        "11-50": 0.55, "1-10": 0.50,
    }
    size_score = size_score_map.get(company_size, 0.60)

    # Domain relevance in history
    ai_months = 0
    total_months = 0
    for job in history:
        dur = job.get("duration_months", 0) or 0
        total_months += dur
        title = (job.get("title") or "").lower()
        desc = (job.get("description") or "").lower()
        industry = (job.get("industry") or "").lower()
        if any(kw in title + desc + industry for kw in ["ai", "ml", "nlp", "data", "machine learning",
                                                          "deep learning", "research", "retrieval"]):
            ai_months += dur

    domain_ratio = (ai_months / total_months) if total_months > 0 else 0.0

    # Progression speed (promotions or title changes)
    titles_seen = [j.get("title", "").lower() for j in history]
    progression = min(1.0, len(set(titles_seen)) / 4.0) * 0.5 + 0.5

    score = (title_score * 0.35 + size_score * 0.20 + domain_ratio * 0.35 + progression * 0.10)
    return max(0.0, min(1.0, score))


def behavioral_signals_score(candidate: dict) -> float:
    """Score engagement + platform signals."""
    signals = candidate.get("redrob_signals", {}) or {}

    # Recruiter response rate (key signal)
    rrr = signals.get("recruiter_response_rate")
    rrr_score = rrr if (rrr is not None and rrr >= 0) else 0.40  # default if missing

    # GitHub activity (crucial for AI engineer)
    gh = signals.get("github_activity_score")
    if gh is None or gh < 0:
        gh_score = 0.20  # no GitHub — mild penalty for AI engineer role
    else:
        gh_score = gh / 100.0

    # Interview completion rate
    icr = signals.get("interview_completion_rate")
    icr_score = icr if (icr is not None and icr >= 0) else 0.50

    # Offer acceptance rate (reliability signal)
    oar = signals.get("offer_acceptance_rate")
    oar_score = oar if (oar is not None and oar >= 0) else 0.50

    # Profile completeness
    pcs = signals.get("profile_completeness_score", 50) or 50
    pcs_score = pcs / 100.0

    # Recency: last active date
    lad = signals.get("last_active_date")
    recency_score = 0.5
    if lad:
        try:
            last_active = datetime.strptime(lad[:10], "%Y-%m-%d").date()
            days_since = (date.today() - last_active).days
            if days_since <= 30:
                recency_score = 1.0
            elif days_since <= 90:
                recency_score = 0.8
            elif days_since <= 180:
                recency_score = 0.6
            elif days_since <= 365:
                recency_score = 0.4
            else:
                recency_score = 0.2
        except Exception:
            pass

    score = (
        rrr_score   * 0.28 +
        gh_score    * 0.25 +
        icr_score   * 0.18 +
        oar_score   * 0.10 +
        pcs_score   * 0.10 +
        recency_score * 0.09
    )
    return max(0.0, min(1.0, score))


def education_score(candidate: dict) -> float:
    """Score based on education tier and relevance of field."""
    education = candidate.get("education", [])
    if not education:
        return 0.25

    best_tier_score = 0.0
    field_relevant = False

    for edu in education:
        tier = edu.get("tier")
        tier_score = EDU_TIER_WEIGHTS.get(tier, 0.30)
        best_tier_score = max(best_tier_score, tier_score)

        field = (edu.get("field_of_study") or "").lower()
        if any(f in field for f in RELEVANT_FIELDS):
            field_relevant = True

    field_bonus = 0.15 if field_relevant else 0.0
    return min(1.0, best_tier_score + field_bonus)


def availability_score(candidate: dict) -> float:
    """Score availability and fit signals."""
    signals = candidate.get("redrob_signals", {}) or {}
    profile = candidate.get("profile", {}) or {}

    score = 0.5

    # Open to work
    otw = signals.get("open_to_work_flag")
    if otw is True:
        score += 0.20
    elif otw is False:
        score -= 0.10

    # Notice period (shorter = better for founding team urgency)
    np_days = signals.get("notice_period_days")
    if np_days is not None:
        if np_days <= 15:
            score += 0.15
        elif np_days <= 30:
            score += 0.10
        elif np_days <= 60:
            score += 0.05
        elif np_days > 90:
            score -= 0.10

    # Location (India preferred for Pune/Noida hybrid)
    country = (profile.get("country") or "").lower()
    location = (profile.get("location") or "").lower()
    willing_to_relocate = signals.get("willing_to_relocate", False)

    if country == "india" or "india" in location:
        score += 0.15
        if any(city in location for city in ["pune", "noida", "delhi", "mumbai",
                                              "bangalore", "bengaluru", "hyderabad",
                                              "gurgaon", "gurugram", "ncr"]):
            score += 0.05
    elif willing_to_relocate:
        score += 0.05

    # Work mode preference
    wm = (signals.get("preferred_work_mode") or "").lower()
    if wm in ("hybrid", "on-site", "onsite", "flexible"):
        score += 0.05

    # Salary range (role probably offers 25-60 LPA for founding team AI engineer)
    sal = signals.get("expected_salary_range_inr_lpa") or {}
    sal_min = sal.get("min", 0) or 0
    sal_max = sal.get("max", 0) or 0
    if sal_min > 0 and sal_max > 0:
        # Check overlap with expected range 25-60 LPA
        if sal_max < 15:
            score -= 0.05  # might be underqualified
        elif sal_min > 80:
            score -= 0.10  # might be too expensive for Series A

    return max(0.0, min(1.0, score))


def build_reasoning(
    candidate: dict,
    component_scores: dict,
    matched_skills: list,
    is_top10: bool = False,
) -> str:
    """
    Build a concise plain-English reasoning string with:
    - Specific company name(s) from career history
    - Named matched skills (not generic labels)
    - Honest concerns for weaker signals
    - Extra precision callout for top-10 candidates
    """
    profile  = candidate.get("profile", {}) or {}
    signals  = candidate.get("redrob_signals", {}) or {}
    history  = candidate.get("career_history", []) or []
    edu_list = candidate.get("education", []) or []

    yoe = profile.get("years_of_experience")
    if yoe is None:
        total = sum(j.get("duration_months", 0) or 0 for j in history)
        yoe = total / 12.0

    title   = profile.get("current_title") or "Engineer"
    company = profile.get("current_company") or ""
    rrr     = signals.get("recruiter_response_rate")
    gh      = signals.get("github_activity_score")

    # ---- Specific matched skills (priority ordered) ----
    PRIORITY_SKILLS = [
        "python", "faiss", "qdrant", "pinecone", "weaviate", "milvus", "chroma",
        "embedding", "embeddings", "sentence-transformer", "sentence transformers",
        "bge", "e5", "rag", "retrieval augmented generation",
        "vector db", "vector database", "hybrid search",
        "llm", "large language model", "nlp", "natural language processing",
        "lora", "qlora", "fine-tuning", "peft",
        "ndcg", "mrr", "reranking", "learning to rank",
    ]
    skill_preview = []
    for ps in PRIORITY_SKILLS:
        if ps in matched_skills and ps not in skill_preview:
            # Use clean display name
            display = ps.replace("-", " ").upper() if len(ps) <= 5 else ps.title()
            skill_preview.append(display)
        if len(skill_preview) >= 4:
            break
    if not skill_preview and matched_skills:
        skill_preview = [s.title() for s in matched_skills[:4]]

    # ---- Build parts ----
    parts = []

    # Opening: title + company + YOE
    if company:
        parts.append(f"{title} @ {company}, {yoe:.1f} yrs exp")
    else:
        parts.append(f"{title}, {yoe:.1f} yrs exp")

    # Matched skills
    if skill_preview:
        parts.append(f"matched: {', '.join(skill_preview[:4])}")

    # Behavioral signals — specific values
    if rrr is not None and rrr >= 0:
        rrr_label = "high" if rrr >= 0.7 else ("mid" if rrr >= 0.4 else "low")
        parts.append(f"recruiter response {rrr:.2f} ({rrr_label})")

    if gh is not None and gh >= 0:
        gh_label = "strong" if gh >= 70 else ("moderate" if gh >= 40 else "weak")
        parts.append(f"GitHub {gh:.0f}/100 ({gh_label})")
    elif gh == -1 or gh is None:
        pass  # Omit rather than flag as concern unless low-ranked

    # Education — specific institution if tier_1/tier_2
    if edu_list:
        top_edu = min(edu_list, key=lambda e: (e.get("tier") or "tier_4"))
        tier = top_edu.get("tier") or ""
        inst = top_edu.get("institution") or ""
        if tier in ("tier_1", "tier_2") and inst:
            parts.append(f"{inst} ({tier})")
        elif tier in ("tier_1", "tier_2"):
            parts.append(f"{tier} graduate")

    # Location specifics
    location = profile.get("location") or ""
    country  = profile.get("country") or ""
    if location and country.lower() == "india":
        parts.append(f"based in {location}")
    elif country and country.lower() != "india":
        wtr = signals.get("willing_to_relocate", False)
        if wtr:
            parts.append(f"{country}-based, open to relocate")
        else:
            parts.append(f"{country}-based, relocation unknown")

    # ---- Honest concerns for weaker dimensions ----
    concerns = []
    skill_s = component_scores.get("skill", 1.0)
    exp_s   = component_scores.get("experience", 1.0)
    behav_s = component_scores.get("behavioral", 1.0)

    if skill_s < 0.25:
        concerns.append("limited AI/ML keyword match")
    if yoe < 4:
        concerns.append(f"experience below ideal ({yoe:.1f} yrs, role wants 5–9)")
    elif yoe > 11:
        concerns.append(f"may be over-experienced ({yoe:.1f} yrs)")
    if rrr is not None and rrr < 0.35:
        concerns.append(f"low recruiter response rate ({rrr:.2f})")
    if gh == -1:
        concerns.append("no GitHub activity on platform")

    if concerns:
        parts.append("concerns: " + ", ".join(concerns))

    # Top-10 precision callout
    if is_top10:
        assess = signals.get("skill_assessment_scores") or {}
        py_score = assess.get("Python") or assess.get("python")
        ml_score = assess.get("ML") or assess.get("Machine Learning")
        if py_score and ml_score:
            parts.append(f"assessed Python {py_score}/100, ML {ml_score}/100")
        elif py_score:
            parts.append(f"assessed Python {py_score}/100")

    return "; ".join(parts)[:250]


def passes_ndcg10_filter(candidate: dict) -> bool:
    """
    Strict filter for top-10 positions (NDCG@10 focus).
    Candidate must have:
      - 'python' anywhere in skills/text
      - at least one of: embedding, vector, rag, retrieval in skills/text
      - years_of_experience between 4 and 12 (inclusive)
    """
    profile = candidate.get("profile", {}) or {}
    history = candidate.get("career_history", []) or []
    skills  = candidate.get("skills", []) or []

    yoe = profile.get("years_of_experience")
    if yoe is None:
        total = sum(j.get("duration_months", 0) or 0 for j in history)
        yoe = total / 12.0

    if not (4.0 <= yoe <= 12.0):
        return False

    # Build text corpus for keyword check
    text_parts = [
        profile.get("headline", ""),
        profile.get("summary", ""),
        profile.get("current_title", ""),
    ]
    for job in history:
        text_parts.append(job.get("title", ""))
        text_parts.append(job.get("description", ""))
    for s in skills:
        text_parts.append(s.get("name", ""))
    signals = candidate.get("redrob_signals", {}) or {}
    assess  = signals.get("skill_assessment_scores", {}) or {}
    text_parts.extend(assess.keys())

    text = " ".join(text_parts).lower()

    has_python = "python" in text or "pytorch" in text or any(
        s.get("name", "").lower() == "python" for s in candidate.get("skills", [])
    ) or any(
        "py" in k.lower()
        for k in (candidate.get("redrob_signals", {}).get("skill_assessment_scores", {}) or {})
    )
    has_retrieval = any(kw in text for kw in [
        "embedding", "embeddings", "vector", "rag",
        "retrieval", "faiss", "pinecone", "qdrant",
        "weaviate", "semantic search", "sentence-transformer",
    ])

    return has_python and has_retrieval


def score_candidate(candidate: dict) -> tuple[float, dict, list, bool]:
    """
    Returns (total_score, components, matched_skills, is_honeypot).

    Scoring architecture:
      base_score = weighted sum of skill + experience + career + education + availability
      engagement_multiplier = 0.5 + 0.5 * behavioral_score   (range: 0.5 – 1.0)
      final_score = base_score * engagement_multiplier

    Honeypots are scored near 0.0 and flagged.
    """
    # --- Honeypot gate (run first, cheap) ---
    is_hp, hp_reason = detect_honeypot(candidate)
    if is_hp:
        return 0.001, {"honeypot": True, "reason": hp_reason}, [], True

    skill, matched = skill_match_score(candidate)
    exp    = experience_score(candidate)
    career = career_trajectory_score(candidate)
    behav  = behavioral_signals_score(candidate)
    edu    = education_score(candidate)
    avail  = availability_score(candidate)

    components = {
        "skill":        skill,
        "experience":   exp,
        "career":       career,
        "behavioral":   behav,
        "education":    edu,
        "availability": avail,
    }

    # Base score (behavioral excluded — used as multiplier below)
    base_score = (
        skill  * 0.45 +
        exp    * 0.22 +
        career * 0.18 +
        edu    * 0.10 +
        avail  * 0.05
    )

    # Title relevance gate — penalize clearly wrong-domain candidates
    current_title = (candidate.get("profile", {}).get("current_title") or "").lower()
    WRONG_DOMAIN_TITLES = [
        "hr manager", "accountant", "sales executive", "content writer",
        "graphic designer", "civil engineer", "mechanical engineer",
        "customer support", "operations manager", "marketing manager",
        "project manager", "business analyst", "ui designer", "ux designer"
    ]
    title_penalty = 0.0
    if any(t in current_title for t in WRONG_DOMAIN_TITLES):
        title_penalty = 0.35  # Strong penalty — these are not AI engineers
    # Apply penalty to base score
    base_score = base_score * (1.0 - title_penalty)

    # Minimum skill threshold gate — require at least 2 must-have skill matches
    # Single "rag" or "gpt" mentions shouldn't rank engineers into top 100
    if len(matched) < 2 and not is_hp:
        base_score = base_score * 0.4  # heavy penalty for single-keyword matches

    # Behavioral as engagement multiplier: disengaged candidates are penalised
    # even if their paper skills are strong. Range: 0.5 (behav=0) → 1.0 (behav=1).
    engagement_multiplier = 0.5 + 0.5 * behav

    total = base_score * engagement_multiplier

    return max(0.0, min(1.0, total)), components, matched, False


def rank_candidates(input_path: str, output_path: str, top_n: int = 100):
    print(f"[APEX] Reading candidates from: {input_path}")
    print(f"[APEX] Will output top {top_n} to: {output_path}")

    results     = []   # (score, candidate, components, matched_skills)
    total_read  = 0
    errors      = 0
    honeypots   = 0

    with open(input_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                candidate = json.loads(line)
                total_read += 1

                cid = candidate.get("candidate_id", f"UNKNOWN_{total_read}")
                score, components, matched, is_hp = score_candidate(candidate)

                if is_hp:
                    honeypots += 1
                    # Still log at near-zero so they appear in output if somehow forced
                    results.append({
                        "candidate_id": cid,
                        "score": score,
                        "reasoning": f"[HONEYPOT] {components.get('reason', 'impossible profile')}",
                        "candidate": candidate,
                        "components": components,
                        "matched": matched,
                        "is_hp": True,
                        "ndcg10_ok": False,
                    })
                else:
                    ndcg10_ok = passes_ndcg10_filter(candidate)
                    results.append({
                        "candidate_id": cid,
                        "score": score,
                        "reasoning": "",  # filled after ranking
                        "candidate": candidate,
                        "components": components,
                        "matched": matched,
                        "is_hp": False,
                        "ndcg10_ok": ndcg10_ok,
                    })

                if total_read % 5000 == 0:
                    print(f"  Processed {total_read:,} candidates... "
                          f"(honeypots so far: {honeypots})")

            except json.JSONDecodeError as e:
                errors += 1
                if errors <= 5:
                    print(f"  [WARN] JSON parse error on line {total_read}: {e}", file=sys.stderr)
            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"  [WARN] Error on candidate {total_read}: {e}", file=sys.stderr)

    print(f"[APEX] Done reading. Total: {total_read:,} | Honeypots: {honeypots} | Errors: {errors}")

    # Sort by score descending (honeypots naturally sink to the bottom)
    results.sort(key=lambda x: x["score"], reverse=True)

    # --- NDCG@10 enforcement ---
    # Collect candidates that pass the top-10 filter
    ndcg_pool   = [r for r in results if r["ndcg10_ok"] and not r["is_hp"]]
    non_ndcg    = [r for r in results if not r["ndcg10_ok"] and not r["is_hp"]]

    # Build final top-100:
    # Fill positions 1-10 from ndcg_pool (in score order), then fill 11-100 from remainder
    top10  = ndcg_pool[:10]
    top10_ids = {r["candidate_id"] for r in top10}

    # Remaining pool: ndcg_pool[10:] + non_ndcg, sorted by score
    remainder = sorted(
        [r for r in ndcg_pool[10:]] + non_ndcg,
        key=lambda x: x["score"], reverse=True
    )
    top90  = [r for r in remainder if r["candidate_id"] not in top10_ids][: top_n - 10]

    top = top10 + top90

    # Safety: if we couldn't fill 10 NDCG-qualified candidates, pad from remainder
    if len(top) < top_n:
        extras = [r for r in results if r["candidate_id"] not in {x["candidate_id"] for x in top}
                  and not r["is_hp"]]
        top += extras[: top_n - len(top)]

    # Truncate to top_n
    top = top[:top_n]

    # --- Build reasoning strings (now we know which are top-10) ---
    top10_id_set = {r["candidate_id"] for r in top[:10]}
    for item in top:
        is_top10 = item["candidate_id"] in top10_id_set
        if not item["is_hp"]:
            item["reasoning"] = build_reasoning(
                item["candidate"], item["components"], item["matched"], is_top10=is_top10
            )

    # --- Enforce strictly non-increasing scores ---
    for i in range(1, len(top)):
        if top[i]["score"] >= top[i - 1]["score"]:
            top[i]["score"] = top[i - 1]["score"] - 1e-6
    for item in top:
        item["score"] = max(0.0, min(1.0, item["score"]))

    # --- Write CSV ---
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["candidate_id", "rank", "score", "reasoning"])
        writer.writeheader()
        for rank_idx, item in enumerate(top, start=1):
            writer.writerow({
                "candidate_id": item["candidate_id"],
                "rank":         rank_idx,
                "score":        f"{item['score']:.4f}",
                "reasoning":    item["reasoning"],
            })

    # Summary
    ndcg10_count = sum(1 for r in top[:10] if r["ndcg10_ok"])
    print(f"[APEX] ✅ Written {len(top)} ranked candidates to: {output_path}")
    print(f"[APEX] NDCG@10 qualified in top-10: {ndcg10_count}/10")
    print(f"[APEX] Top 5 preview:")
    for i, item in enumerate(top[:5], 1):
        print(f"  #{i} {item['candidate_id']} | score={item['score']:.4f} | {item['reasoning'][:90]}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="APEX — Rank candidates for Senior AI Engineer role"
    )
    parser.add_argument(
        "--candidates",
        default="./candidates.jsonl",
        help="Path to candidates.jsonl (default: ./candidates.jsonl)"
    )
    parser.add_argument(
        "--out",
        default="./submission.csv",
        help="Output path for submission CSV (default: ./submission.csv)"
    )
    parser.add_argument(
        "--top",
        type=int,
        default=100,
        help="Number of top candidates to output (default: 100)"
    )
    args = parser.parse_args()

    start = datetime.now()
    rank_candidates(args.candidates, args.out, args.top)
    elapsed = (datetime.now() - start).total_seconds()
    print(f"[APEX] ⏱  Total time: {elapsed:.1f}s")


if __name__ == "__main__":
    main()
