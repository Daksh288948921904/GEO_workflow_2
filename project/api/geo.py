from typing import TypedDict, Dict, Any
from langgraph.graph import StateGraph, END
from openai import OpenAI
from dotenv import load_dotenv
import json
import os

load_dotenv()


class GEOState(TypedDict):
    llm_context:        Dict[str, Any]
    technical_analysis: str
    content_analysis:   str
    prioritized_plan:   str
    executive_summary:  str


def call_llm(system_prompt: str, user_prompt: str) -> str:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
    )
    return response.choices[0].message.content


def extract_facts(ctx: dict) -> str:

    pi   = ctx.get("page_identity", {})
    ps   = ctx.get("product_summary", {})
    cm   = ctx.get("content_metrics", {})
    av   = ctx.get("ai_visibility_summary", {})
    ss   = ctx.get("section_scores", {})
    bd   = ctx.get("breakdowns", {})
    wa   = ctx.get("weak_areas", {})
    pen  = ctx.get("penalties", {})
    po   = ctx.get("priority_order", [])
    exc  = ctx.get("content_excerpt", "")
    specs = ctx.get("specifications", {})
    faqs  = ctx.get("faqs", [])
    ts    = ctx.get("trust_signals", {})

    # Format currency symbol
    curr = ps.get("currency", "INR")
    sym  = {"INR": "₹", "USD": "$", "GBP": "£", "EUR": "€"}.get(curr, curr)
    price_str = f"{sym}{ps.get('price', 'N/A')}"
    rating_str = f"{ps.get('rating', 'N/A')} / 5.0 ({ps.get('review_count', '0')} reviews)"

    # Build pass/fail breakdown so LLM knows exactly what exists vs missing
    def signal_lines(section_bd: dict) -> str:
        lines = []
        for signal, score in section_bd.items():
            status = "✓ PASS" if score > 0 else "✗ FAIL (score 0 — needs fix)"
            lines.append(f"  {signal}: {score} pts  [{status}]")
        return "\n".join(lines)

    # Format specs compactly
    specs_str = "None extracted" if not specs else "\n".join(
        f"  {k}: {v}" for k, v in list(specs.items())[:15]
    )

    # Format FAQs compactly
    faqs_str = "None extracted" if not faqs else "\n".join(
        f"  Q: {f.get('question','')}\n  A: {f.get('answer','')[:120]}"
        for f in faqs[:5]
    )

    # Format trust signals with pass/fail so LLM knows exactly what exists
    def trust_lines(trust_dict: dict) -> str:
        lines = []
        for signal, value in trust_dict.items():
            status = "✓ EXISTS" if value else "✗ MISSING"
            lines.append(f"  {signal}: {value}  [{status}]")
        return "\n".join(lines) if lines else "  No trust signal data"

    return f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE FACTS (use ONLY these values — do not invent data)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL:              {pi.get("url", "unknown")}
TITLE:            {pi.get("title", "")}
META DESCRIPTION: {pi.get("meta_description", "(missing)")}

PRODUCT NAME:  {ps.get("name", "")}
BRAND:         {ps.get("brand", "")}
PRICE:         {price_str}
AVAILABILITY:  {ps.get("availability", "")}
RATING:        {rating_str}
SKU:           {ps.get("sku", "not found")}
GTIN:          {ps.get("gtin", "(missing — scores 0)") or "(missing — scores 0)"}
CATEGORY:      {ps.get("category", "")}

CONTENT ON PAGE:
- Word count:     {cm.get("word_count", 0)} words
- Headings:       {cm.get("heading_count", 0)} found
- Feature bullets:{cm.get("feature_count", 0)} found
- Spec rows:      {cm.get("specification_count", 0)} found
- FAQs:           {len(faqs)} found

SPECIFICATIONS EXTRACTED FROM PAGE:
{specs_str}

FAQs EXTRACTED FROM PAGE:
{faqs_str}

TRUST SIGNALS ON PAGE:
{trust_lines(ts)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI READINESS SCORE: {av.get("final_score","?")} / {av.get("max_possible","100")} ({av.get("ai_readiness_pct","?")}%) — {av.get("readiness_band","")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCHEMA MARKUP  [{ss.get("schema","?")} / 20]:
{signal_lines(bd.get("schema", {}))}

ENTITY CLARITY [{ss.get("entity","?")} / 15]:
{signal_lines(bd.get("entity", {}))}

CONTENT DEPTH  [{ss.get("content","?")} / 25]:
{signal_lines(bd.get("content", {}))}

TRUST SIGNALS  [{ss.get("trust","?")} / 20]:
{signal_lines(bd.get("trust", {}))}

EXTRACTABILITY [{ss.get("extractability","?")} / 20]:
{signal_lines(bd.get("extractability", {}))}

PENALTY FLAGS: {json.dumps(pen) if pen else "none"}

PRIORITY ORDER (worst section first): {" → ".join(po)}

SIGNALS SCORING 0 — THESE ARE THE ONLY THINGS TO FIX:
{json.dumps(wa, indent=2)}

⚠️  CRITICAL RULES FOR THE LLM:
1. ONLY recommend fixes for signals marked [✗ FAIL] above.
2. DO NOT recommend fixing anything marked [✓ PASS] — it already exists.
3. If canonical_url > 0, it EXISTS — do not say it is missing.
4. If schema_markup > 0, JSON-LD EXISTS — do not say it is missing.
5. If specs > 0, specifications EXIST — do not say they are missing.
6. If faq > 0, FAQs EXIST — do not say they are missing.
7. Always use the EXACT price ({price_str}), rating ({rating_str}), and product name from above.
8. Never write "INR " or empty brackets. Use the real values.

PAGE TEXT SAMPLE:
{exc[:600]}
""".strip()



def technical_auditor(state: GEOState) -> GEOState:
    facts = extract_facts(state["llm_context"])
    wa    = state["llm_context"].get("weak_areas", {})
    bd    = state["llm_context"].get("breakdowns", {})

    # Build a specific list of only truly failing signals
    failing = []
    for section, signals in wa.items():
        for sig in signals:
            failing.append(f"{section}.{sig}")

    system = """You are a senior technical GEO (Generative Engine Optimization) engineer.
Audit ONLY the signals that score 0. Do not mention or recommend fixing anything that already has a score > 0.
Be surgical: every fix must be a copy-paste-ready HTML or JSON-LD snippet using the ACTUAL product data provided.
Never invent data. Never use placeholder values like YOUR_PRICE or YOUR_SKU — use the real values from the facts."""

    user = f"""Audit this product page for AI/GEO technical readiness.

{facts}

FAILING SIGNALS TO FIX (score = 0): {failing}

For EACH failing signal above, write EXACTLY:

## [Signal Name]
1. **Why it matters for AI/LLMs:** [1 sentence — specific to this product]
2. **Current state:** [what is actually on this page right now — reference the facts above]
3. **Exact fix:** [complete, copy-paste ready HTML or JSON-LD using the real product name, brand, price, etc.]
4. **Score impact:** +X points in [section]

STOP after covering all failing signals. Do NOT add extra sections for things that already pass.
Do NOT say canonical URL is missing — it scores {bd.get("extractability",{}).get("canonical_url",0)} (exists).
Do NOT say schema is missing — it scores {bd.get("schema",{}).get("schema_markup",0)} (exists).
Do NOT say specs are missing — specification_count is in the facts above.

TRUST SIGNAL GUIDANCE:
- has_contact_page = False means the site has no /contact page linked from navigation/footer.
  Fix: create a contact page at /contact or /contact-us and link it from the footer.
  Provide the exact <a> tag and JSON-LD ContactPage schema to add.
- has_return_policy, has_warranty_info etc: only flag these if they score 0 in breakdowns above.
- For each trust fix, provide the exact HTML/schema — not generic advice."""

    state["technical_analysis"] = call_llm(system, user)
    return state



def content_strategist(state: GEOState) -> GEOState:
    facts = extract_facts(state["llm_context"])
    ctx   = state["llm_context"]
    ps    = ctx.get("product_summary", {})
    bd    = ctx.get("breakdowns", {})
    wa    = ctx.get("weak_areas", {})
    faqs  = ctx.get("faqs", [])
    specs = ctx.get("specifications", {})

    curr     = ps.get("currency", "INR")
    sym      = {"INR": "₹", "USD": "$", "GBP": "£", "EUR": "€"}.get(curr, curr)
    price_str = f"{sym}{ps.get('price', 'N/A')}"
    rating_str = f"{ps.get('rating', 'N/A')} ({ps.get('review_count', '0')} reviews)"

    faq_score   = bd.get("content", {}).get("faq", 0)
    spec_score  = bd.get("content", {}).get("specifications", 0)
    spec_count  = ctx.get("content_metrics", {}).get("specification_count", 0)
    faq_count   = len(faqs)
    trust_score = ctx.get("section_scores", {}).get("trust") or 0
    ts          = ctx.get("trust_signals", {})
    # Build trust status string for content prompt
    trust_status = "\n".join(
        f"  {k}: {'EXISTS' if v else 'MISSING'}"
        for k, v in ts.items()
    ) if ts else "  No trust data"

    system = """You are a GEO content strategist who makes product pages get cited by AI search engines.
Use ONLY the exact product data provided — never invent specs, prices, or features.
Do not recommend adding content that already exists (check scores before recommending)."""

    user = f"""Analyze this product page for content gaps that prevent AI engines from citing it.

{facts}

PRODUCT: {ps.get("name","this product")} by {ps.get("brand","this brand")}
PRICE: {price_str} | RATING: {rating_str}

CONTENT STATUS:
- Specifications: {"EXISTS ({} rows extracted)".format(spec_count) if spec_score > 0 else "MISSING — score 0"}
- FAQs: {"EXISTS ({} Q&As extracted)".format(faq_count) if faq_score > 0 else "MISSING — score 0"}
- Trust signals detail:
{trust_status}
- Weak areas: {json.dumps(wa)}

## Deliver ONLY these sections:

### 1. Missing Content Sections
Only list sections that are ACTUALLY missing (score = 0 in weak_areas).
For each: explain why AI needs it, then write the EXACT HTML to add.
Use real values: price = {price_str}, rating = {rating_str}.
{"Skip specifications section — it already exists." if spec_score > 0 else "Write a specifications table using the spec data in the facts."}
{"Skip FAQ section — it already exists." if faq_score > 0 else "Write a FAQ section with real Q&As from the facts."}
{"Skip trust section — trust score is {}/20, passes.".format(trust_score) if trust_score >= 14 else "Address missing trust signals: " + ", ".join(k for k, v in ts.items() if not v and "has_" in k)}

### 2. FAQ Schema (JSON-LD)
{"FAQs already exist. Just verify the JSON-LD FAQPage schema is in <head> and provide the exact block." if faq_score > 0 else "Write 5 real Q&As using actual product features. Include complete JSON-LD FAQPage schema."}
Use real product data — NOT placeholders.

### 3. Semantic Gap Analysis
List 4 topics this page doesn't cover. For each write a ready-to-paste paragraph (2-3 sentences) using real product data.

### 4. Meta Description Rewrite
Current: "{ctx.get("page_identity",{}).get("meta_description","(missing)")}"
Rewrite to under 160 chars. Include: key specs, exact price, brand, and main differentiator.

Never write "INR " or empty values. Use: {price_str}, {rating_str}."""

    state["content_analysis"] = call_llm(system, user)
    return state




def prioritizer(state: GEOState) -> GEOState:
    facts = extract_facts(state["llm_context"])
    ctx   = state["llm_context"]
    wa    = ctx.get("weak_areas", {})
    av    = ctx.get("ai_visibility_summary", {})
    po    = ctx.get("priority_order", [])

    system = """You are a GEO implementation consultant.
Build an action plan using ONLY the failing signals (score=0).
Do not add rows for things that already pass. Be specific about exact page location and change."""

    user = f"""Build a prioritized GEO action plan.

{facts}

ONLY these signals need fixing (all others already pass):
{json.dumps(wa, indent=2)}

TECHNICAL AUDIT:
{state["technical_analysis"]}

CONTENT AUDIT:
{state["content_analysis"]}

## Output this exact format:

### Quick Wins (under 2 hours each)
| # | Exact change | Where on page | Signal fixed | Score gain | Effort |
|---|-------------|---------------|--------------|------------|--------|
Only include rows for signals in weak_areas above.

### Structural Improvements (1-5 days)
| # | Change | Implementation detail | Signal fixed | Score gain | Effort |
|---|--------|----------------------|--------------|------------|--------|
Only if there are multi-day fixes needed.

### Implementation Order
For each step: "Go to [exact location] → [exact change] → Fixes: [signal name] → +X points"

### Score Projection
Current: {av.get("final_score","?")} / 100
After quick wins: [calculate] / 100
After all changes: [calculate] / 100
New band: [name]

Do not add phantom fixes. Every row must map to a signal in weak_areas."""

    state["prioritized_plan"] = call_llm(system, user)
    return state



def report_builder(state: GEOState) -> GEOState:
    ctx = state["llm_context"]
    av  = ctx.get("ai_visibility_summary", {})
    ps  = ctx.get("product_summary", {})
    pi  = ctx.get("page_identity", {})
    ss  = ctx.get("section_scores", {})
    po  = ctx.get("priority_order", [])
    wa  = ctx.get("weak_areas", {})

    curr      = ps.get("currency", "INR")
    sym       = {"INR": "₹", "USD": "$", "GBP": "£", "EUR": "€"}.get(curr, curr)
    price_str = f"{sym}{ps.get('price', 'N/A')}"

    system = """You are a GEO advisor writing an executive report for a product manager.
Use ONLY the exact scores and data provided. Do not invent gaps or hallucinate scores.
If a section scores > 0, it PASSES — do not say it is missing or broken.
Keep the report grounded, specific, and under 500 words."""

    user = f"""Write an executive GEO report for this product page.

PAGE: {pi.get("url","")}
PRODUCT: {ps.get("name","")}
BRAND: {ps.get("brand","")} | PRICE: {price_str} | RATING: {ps.get("rating","N/A")} ({ps.get("review_count","0")} reviews)
AI READINESS: {av.get("final_score","?")} / {av.get("max_possible","100")} — {av.get("readiness_band","")}

ACTUAL SECTION SCORES (use these exact numbers):
- Schema markup:  {ss.get("schema","?")} / 20   {"(strong)" if (ss.get("schema") or 0) >= 16 else "(room to improve)"}
- Entity clarity: {ss.get("entity","?")} / 15   {"(strong)" if (ss.get("entity") or 0) >= 12 else "(room to improve)"}
- Content depth:  {ss.get("content","?")} / 25  {"(strong)" if (ss.get("content") or 0) >= 20 else "(room to improve)"}
- Trust signals:  {ss.get("trust","?")} / 20    {"(strong)" if (ss.get("trust") or 0) >= 16 else "(room to improve)"}
- Extractability: {ss.get("extractability","?")} / 20 {"(strong)" if (ss.get("extractability") or 0) >= 16 else "(room to improve)"}

ONLY THESE SIGNALS SCORE 0 (everything else already passes):
{json.dumps(wa, indent=2)}

TECHNICAL AUDIT FINDINGS:
{state["technical_analysis"]}

CONTENT AUDIT FINDINGS:
{state["content_analysis"]}

PRIORITY PLAN:
{state["prioritized_plan"]}

## Write this structure:

## Executive Summary
State the score, band, and what it means in 2-3 sentences. Use the exact score.
Name the only {len(wa)} missing signals and why they matter.

## Current AI Readiness
One line per section using the EXACT scores above.
Never say a section "scores 0" unless it actually does.

## Top Priority Fixes
Only the signals in weak_areas. For each: exact fix, score gain, time estimate.

## Expected Uplift
After fixes: [score] / 100 — [band]

Under 400 words. No filler. Reference real product name, price, and brand."""

    state["executive_summary"] = call_llm(system, user)
    return state



def build_geo_graph():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")

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