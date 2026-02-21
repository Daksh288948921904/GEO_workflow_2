from typing import TypedDict, Dict, Any
from langgraph.graph import StateGraph, END
from openai import OpenAI
from dotenv import load_dotenv
import json
import os

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")


class GEOState(TypedDict):
    llm_context: Dict[str, Any]
    technical_analysis: str
    content_analysis: str
    prioritized_plan: str
    final_report: str


def call_llm(system_prompt: str, user_prompt: str) -> str:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
    )
    return response.choices[0].message.content



def extract_facts(ctx: dict) -> str:
    pi   = ctx.get("page_identity", {})
    ps   = ctx.get("product_summary", {})
    cm   = ctx.get("content_metrics", {})
    av   = ctx.get("ai_visibility_summary", {})
    ss   = ctx.get("section_scores", {})
    wa   = ctx.get("weak_areas", {})
    pen  = ctx.get("penalties", {})
    po   = ctx.get("priority_order", [])
    exc  = ctx.get("content_excerpt", "")

    return f"""
PAGE: {pi.get("url", "unknown")}
TITLE: {pi.get("title", "")}
META DESCRIPTION: {pi.get("meta_description", "")}

PRODUCT: {ps.get("name", "")} | Brand: {ps.get("brand", "")} | Price: {ps.get("currency","")} {ps.get("price","")}
AVAILABILITY: {ps.get("availability","")} | Rating: {ps.get("rating","")} ({ps.get("review_count","")} reviews)

CONTENT METRICS:
- Word count: {cm.get("word_count", 0)} words
- Headings found: {cm.get("heading_count", 0)}
- Feature bullets found: {cm.get("feature_count", 0)}
- Specification rows found: {cm.get("specification_count", 0)}

AI READINESS SCORE: {av.get("final_score","?")} / {av.get("max_possible","100")} ({av.get("ai_readiness_pct","?")}%) — {av.get("readiness_band","")}

SECTION SCORES (out of their max):
- Schema markup:    {ss.get("schema","?")} / 20
- Entity clarity:   {ss.get("entity","?")} / 15
- Content depth:    {ss.get("content","?")} / 25
- Trust signals:    {ss.get("trust","?")} / 20
- Extractability:   {ss.get("extractability","?")} / 20

PENALTY FLAGS: {json.dumps(pen) if pen else "none"}

PRIORITY ORDER (worst first): {" → ".join(po)}

SPECIFIC MISSING SIGNALS (these scored 0 and need fixing):
{json.dumps(wa, indent=2)}

CONTENT EXCERPT (actual page text sample):
{exc[:800]}
""".strip()


# ==============================================================
# Technical Auditor
# ==============================================================
def technical_auditor(state: GEOState) -> GEOState:
    facts = extract_facts(state["llm_context"])

    system = """You are a senior technical GEO (Generative Engine Optimization) engineer.
Your job is to audit a real product page and tell the developer EXACTLY what code and HTML changes to make.
Be brutally specific. Name the exact HTML tags, JSON-LD fields, and attribute values to add or change.
Never give generic advice. Every recommendation must be a concrete website edit."""

    user = f"""Audit this product page for AI/GEO technical readiness.

{facts}

Your output MUST follow this exact structure for each issue:

## [Issue Name]
**Why it matters for AI/LLMs:** [1-2 sentences on how this hurts AI visibility specifically]
**Current state:** [what exists now on this page]
**Exact fix:** [the literal HTML, JSON-LD snippet, or tag to add/change]
**Score impact:** +X points in [section]

Cover ALL of these failing signals: {json.dumps(state["llm_context"].get("weak_areas", {}))}

Also check: missing canonical URL, missing hreflang, incomplete JSON-LD Product schema, missing specs table HTML.

Do not write paragraphs of explanation. Be surgical. A developer should be able to copy-paste your fixes."""

    state["technical_analysis"] = call_llm(system, user)
    return state


# ==============================================================
# Content Strategist
# ==============================================================
def content_strategist(state: GEOState) -> GEOState:
    facts = extract_facts(state["llm_context"])
    ps    = state["llm_context"].get("product_summary", {})

    system = """You are a GEO content strategist who specializes in making product pages get cited by AI search engines (ChatGPT, Perplexity, Google SGE).
You know that LLMs cite pages that directly answer questions, have structured specs, and have FAQ schema.
Give only page-level content changes — actual text, HTML structure, and schema to add to THIS specific product page."""

    user = f"""Analyze this product page for content gaps that prevent AI engines from citing it.

{facts}

The product is: {ps.get("name","this product")} by {ps.get("brand","this brand")}

## What to deliver:

### 1. Missing Content Sections
For each missing section, write:
- **Section name** (e.g. "Specifications Table")
- **Why AI engines need it** (1 sentence)
- **Exact content to add** (write the actual text/HTML, not just "add a table")

### 2. FAQ Schema — Write 6 real Q&As for THIS product
Format each as:
**Q: [specific question a buyer would ask]**
A: [direct, factual answer using the product data above]

These must be real questions about THIS specific product (dimensions, materials, compatibility, assembly, warranty).
Include the JSON-LD FAQ schema block ready to paste into the page <head>.

### 3. Semantic Gap Analysis
List 5 specific topics this page doesn't cover that users ask about this product category.
For each topic: write the missing paragraph (2-3 sentences) to add to the page.

### 4. Content Rewrite Suggestions
The current meta description is: "{state["llm_context"].get("page_identity",{}).get("meta_description","")}"
Rewrite it to be more AI-answerable (include key specs, use case, differentiator — under 160 chars).

Do not write generic tips. Write the actual content to add."""

    state["content_analysis"] = call_llm(system, user)
    return state


# ==============================================================
# Prioritizer
# ==============================================================
def prioritizer(state: GEOState) -> GEOState:
    facts  = extract_facts(state["llm_context"])
    wa     = state["llm_context"].get("weak_areas", {})
    scores = state["llm_context"].get("section_scores", {})

    system = """You are a GEO implementation consultant.
You turn technical and content audits into a clear, ordered action plan.
Every action must reference the SPECIFIC page and SPECIFIC change — no generic advice.
Format output cleanly with markdown tables and numbered lists."""

    user = f"""Build a prioritized GEO action plan for this specific page.

PAGE: {state["llm_context"].get("page_identity",{}).get("url","")}
CURRENT SCORE: {state["llm_context"].get("ai_visibility_summary",{}).get("final_score","?")} / 100
WORST SECTIONS: {" → ".join(state["llm_context"].get("priority_order",[]))}

SIGNALS SCORING 0 (must fix): {json.dumps(wa)}

TECHNICAL AUDIT FINDINGS:
{state["technical_analysis"]}

CONTENT AUDIT FINDINGS:
{state["content_analysis"]}

## Deliver this exact format:

### Quick Wins (implement in under 2 hours each)
| # | Change | Where on page | Score gain | Effort |
|---|--------|---------------|------------|--------|
List 4-6 rows. Be specific about WHERE on the page and WHAT to change.

### Structural Improvements (1-5 days each)
| # | Change | Implementation detail | Score gain | Effort |
|---|--------|----------------------|------------|--------|
List 4-6 rows.

### Implementation Order
Number each step. Reference the actual signals from weak_areas above.
Each step: "Go to [location] → Add/Change [specific thing] → Expected result: [score change]"

### Score Projection
Current: {state["llm_context"].get("ai_visibility_summary",{}).get("final_score","?")} / 100
After quick wins: X / 100
After all changes: X / 100
New band: [predicted band]

No generic advice. Every row must name a specific page element."""

    state["prioritized_plan"] = call_llm(system, user)
    return state


# ==============================================================
# Executive Report Builder
# ==============================================================
def report_builder(state: GEOState) -> GEOState:
    ctx  = state["llm_context"]
    av   = ctx.get("ai_visibility_summary", {})
    ps   = ctx.get("product_summary", {})
    pi   = ctx.get("page_identity", {})
    po   = ctx.get("priority_order", [])
    wa   = ctx.get("weak_areas", {})

    system = """You are a GEO optimization advisor writing a report for a product manager or CMO.
The report must be about THIS SPECIFIC product page and page — not generic AI/SEO advice.
Every sentence must reference actual data from the audit. Use the exact scores, URLs, and field names.
Be direct, specific, and actionable. Write like a consultant who has just audited the page."""

    user = f"""Write an executive GEO report for this product page.

PAGE: {pi.get("url","")}
PRODUCT: {ps.get("name","")} | {ps.get("brand","")} | {ps.get("currency","")} {ps.get("price","")}
CURRENT AI READINESS: {av.get("final_score","?")} / {av.get("max_possible","100")} ({av.get("ai_readiness_pct","?")}%) — {av.get("readiness_band","")}
WEAKEST AREAS: {", ".join(po[:3])} (worst first)
SIGNALS WITH SCORE 0: {json.dumps(wa)}

FULL TECHNICAL AUDIT:
{state["technical_analysis"]}

FULL CONTENT AUDIT:
{state["content_analysis"]}

FULL PRIORITY PLAN:
{state["prioritized_plan"]}

## Report structure:

## Executive Summary
2-3 sentences. Name the product, the exact score, and the #1 reason it scores low.
Be direct: "The [product] page scores X/100 because [specific reason from data]."

## Current AI Readiness Assessment
Score each dimension with the actual number and a one-line plain-English explanation of what that score means for THIS product:
- Schema: {ctx.get("section_scores",{}).get("schema","?")} / 20 — [explain]
- Entity: {ctx.get("section_scores",{}).get("entity","?")} / 15 — [explain]  
- Content: {ctx.get("section_scores",{}).get("content","?")} / 25 — [explain]
- Trust: {ctx.get("section_scores",{}).get("trust","?")} / 20 — [explain]
- Extractability: {ctx.get("section_scores",{}).get("extractability","?")} / 20 — [explain]

## Top 3 Changes That Will Move The Needle
For each: name the exact HTML/schema/content change, the specific score gain, and which AI engines will benefit.

## What Happens If You Fix Nothing
1-2 sentences on the competitive risk: which queries will competitors win, how will AI engines handle this page.

## Expected Uplift
- After quick wins (< 1 week): X%
- After full implementation: X%
- Projected new band: [name]

Keep the whole report under 600 words. No filler sentences."""

    state["final_report"] = call_llm(system, user)
    return state


# ==============================================================
# Build LangGraph Workflow
# ==============================================================
def build_geo_graph():
    builder = StateGraph(GEOState)

    builder.add_node("technical_audit",  technical_auditor)
    builder.add_node("content_strategy", content_strategist)
    builder.add_node("prioritize",       prioritizer)
    builder.add_node("report",           report_builder)

    builder.set_entry_point("technical_audit")

    builder.add_edge("technical_audit",  "content_strategy")
    builder.add_edge("content_strategy", "prioritize")
    builder.add_edge("prioritize",       "report")
    builder.add_edge("report",           END)

    return builder.compile()