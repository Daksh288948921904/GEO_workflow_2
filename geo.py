
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

client = OpenAI()

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


# ==============================================================
# Technical Auditor
# ==============================================================

def technical_auditor(state: GEOState) -> GEOState:

    context = json.dumps(state["llm_context"], indent=2)

    user_prompt = f"""
Analyze this structured AI-readiness context.

Focus on:
- Schema completeness
- Extractability
- Entity clarity
- Trust signals
- Metadata
- Structured markup

Provide:
1. Clear weaknesses
2. Why they matter for AI systems (LLMs, search engines)
3. Concrete technical implementation fixes

Context:
{context}
"""

    state["technical_analysis"] = call_llm(
        "You are a senior AI SEO technical auditor.",
        user_prompt
    )

    return state


# ==============================================================
# Content Strategist
# ==============================================================

def content_strategist(state: GEOState) -> GEOState:

    context = json.dumps(state["llm_context"], indent=2)

    user_prompt = f"""
Analyze this page for Generative Engine Optimization (GEO).

Focus on:
- Content depth
- FAQ opportunities
- Semantic coverage
- LLM answerability
- Search intent alignment
- Information completeness

Provide:
1. Missing content opportunities
2. Suggested FAQ questions and answers
3. Structured content improvements
4. Improvements to make this page highly AI-answerable

Context:
{context}
"""

    state["content_analysis"] = call_llm(
        "You are a world-class AI content strategist.",
        user_prompt
    )

    return state


# ==============================================================
# Prioritization Strategist
# ==============================================================

def prioritizer(state: GEOState) -> GEOState:

    user_prompt = f"""
Based on the following:

TECHNICAL ANALYSIS:
{state["technical_analysis"]}

CONTENT ANALYSIS:
{state["content_analysis"]}

Create:

1. A priority roadmap (High / Medium / Low)
2. Quick wins vs structural improvements
3. Estimated impact level
4. Clear implementation order
5. Business impact explanation

Be structured and practical.
"""

    state["prioritized_plan"] = call_llm(
        "You are a senior AI visibility consultant.",
        user_prompt
    )

    return state


# ==============================================================
# Executive GEO Report Builder
# ==============================================================

def report_builder(state: GEOState) -> GEOState:

    user_prompt = f"""
Create a concise executive-level GEO optimization report.

Include:

- Executive summary
- Current AI readiness assessment
- Top weaknesses
- Strategic recommendations
- Tactical action list
- Expected AI visibility uplift
- Estimated readiness improvement range

Make it professional, clear, and actionable.
"""

    state["final_report"] = call_llm(
        "You are a strategic AI optimization advisor presenting to a CMO.",
        user_prompt
    )

    return state


# ==============================================================
# Build LangGraph Workflow
# ==============================================================

def build_geo_graph():

    builder = StateGraph(GEOState)

    builder.add_node("technical_audit", technical_auditor)
    builder.add_node("content_strategy", content_strategist)
    builder.add_node("prioritize", prioritizer)
    builder.add_node("report", report_builder)

    builder.set_entry_point("technical_audit")

    builder.add_edge("technical_audit", "content_strategy")
    builder.add_edge("content_strategy", "prioritize")
    builder.add_edge("prioritize", "report")
    builder.add_edge("report", END)

    return builder.compile()