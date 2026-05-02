from __future__ import annotations
import re
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
from dotenv import load_dotenv
import os
from vector_store import retrieve_chunks, retrieve_by_role

load_dotenv()


def _call_llm(system: str, user: str, temperature: float = 0.2) -> str:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return response.choices[0].message.content


def parse_recommendations(geo_report: Dict[str, Any]) -> List[Dict[str, str]]:
    system = """You are a parser. Extract individual actionable fixes from a GEO report.
Return ONLY a JSON array. Each item must have:
  - "title": short name of the fix (e.g. "Add FAQ schema", "Fix missing GTIN")
  - "description": what exactly needs to change (1-2 sentences)
  - "section_type": which part of the page this affects. Use ONLY these values:
    header, navigation, product-info, pricing, specs, faq, reviews, media, trust, description, footer, schema, meta, unknown
  - "priority": "high" | "medium" | "low"

Return valid JSON array only. No markdown, no explanation."""

    combined_text = "\n\n---\n\n".join([
        f"TECHNICAL ANALYSIS:\n{geo_report.get('technical_analysis', '')}",
        f"CONTENT ANALYSIS:\n{geo_report.get('content_analysis', '')}",
        f"PRIORITIZED PLAN:\n{geo_report.get('prioritized_plan', '')}",
    ])

    user = f"""Extract all individual actionable fixes from this GEO report:

{combined_text[:6000]}

Return JSON array only."""

    raw = _call_llm(system, user)
    raw = re.sub(r'^```json\s*', '', raw.strip())
    raw = re.sub(r'\s*```$', '', raw.strip())

    try:
        recommendations = json.loads(raw)
        if isinstance(recommendations, list):
            return recommendations
    except json.JSONDecodeError:
        pass

    return []


def match_recommendation_to_chunks(recommendation: Dict[str, str], page_url: str) -> List[Dict[str, Any]]:
    query = f"{recommendation['title']}: {recommendation['description']}"
    semantic_hits = retrieve_chunks(query, page_url, top_k=3, score_threshold=0.25)
    section_to_role = {
        "header": "header", "navigation": "navigation",
        "product-info": "product-info", "pricing": "pricing",
        "specs": "specs", "faq": "faq", "reviews": "reviews",
        "media": "media", "trust": "trust", "description": "description",
        "footer": "footer",
    }
    role = section_to_role.get(recommendation.get("section_type", ""), "")
    role_hits = retrieve_by_role(page_url, role, top_k=2) if role else []

    seen_ids: set = set()
    merged: List[Dict[str, Any]] = []
    for hit in semantic_hits + role_hits:
        if hit["chunk_id"] not in seen_ids:
            seen_ids.add(hit["chunk_id"])
            merged.append(hit)

    return merged[:2]


def generate_console_js(
    chunk: Dict[str, Any],
    recommendation: Dict[str, str],
    product_context: Optional[Dict[str, Any]] = None,
    is_new_addition: bool = False,
) -> str:
    ps = (product_context or {}).get("product_summary", {})
    product_str = f"""Product name : {ps.get('name', '')}
Brand        : {ps.get('brand', '')}
Price        : {ps.get('price', '')} {ps.get('currency', '')}
Rating       : {ps.get('rating', '')} ({ps.get('review_count', '')} reviews)
Description  : {ps.get('description', '')[:300] if ps.get('description') else ''}"""

    element_id   = chunk.get("element_id") or ""
    css_classes  = chunk.get("css_classes") or []
    dom_path     = chunk.get("dom_path") or ""
    tag_name     = chunk.get("tag_name") or "div"
    section_type = recommendation.get("section_type", "unknown")
    original_html = chunk.get("html", "<!-- no existing HTML -->")

    # Build selector hints for the prompt
    selector_hints = []
    if element_id:
        selector_hints.append(f'By ID            : document.getElementById("{element_id}")')
    if css_classes:
        class_chain = "." + ".".join(css_classes[:4])
        selector_hints.append(f'By classes       : document.querySelector("{tag_name}{class_chain}")')
    if dom_path:
        selector_hints.append(f'By DOM path      : document.querySelector("{dom_path}")')
    selector_hints.append(f'By tag+text      : Array.from(document.querySelectorAll("{tag_name}")).find(el => el.textContent.includes("..."))')

    selectors_block = "\n".join(selector_hints) if selector_hints else "No selector hints — derive from the HTML structure."

    system = """You are a JavaScript expert writing browser-console scripts for GEO (Generative Engine Optimization).

OUTPUT CONTRACT — violating any rule makes the script unusable:
1. Output ONLY raw JavaScript. Zero markdown, zero code fences (no ```), zero prose.
2. The entire script must be ONE self-contained IIFE:  (function() { 'use strict'; ... })();
3. SELECTOR STRATEGY — try each in order, stop at the first non-null result:
     a. document.getElementById('<id>')           — if an element ID is known
     b. document.querySelector('<tag.class1.class2>')  — combine tag + up to 4 classes
     c. document.querySelector('<full > dom > path>')  — use the exact DOM path provided
     d. Array.from(document.querySelectorAll('<tag>')).find(el => el.textContent.trim().includes('<distinctive_text>'))
   Assign the winner to `const el = ...`.  If el is null after all attempts → console.error and return.
4. APPLYING THE CHANGE:
     - Content modification  → el.outerHTML = `<improved HTML here>`;
     - New <script type="application/ld+json"> (schema) → document.head.insertAdjacentHTML('beforeend', `...`);
     - New <meta> tag        → document.head.insertAdjacentHTML('beforeend', `<meta ...>`);
     - New visible section   → el.insertAdjacentHTML('afterend', `<improved HTML>`);  or use document.body.appendChild.
5. The improved HTML goes inside a JS template literal (backtick string).
   Escape every backtick inside the HTML as \\` and every backslash as \\\\.
6. Use ONLY real product data supplied below — never write placeholders like "Product Name", "Brand Name", "123".
7. After a successful change: console.log('[GEO] ✅ Applied: <fix title>');
8. Wrap the whole body in try { ... } catch(e) { console.error('[GEO] ❌ Error in <fix title>:', e); }
9. Do NOT use document.write(), eval(), or innerHTML on user-supplied strings.
10. The script must be copy-paste-ready and execute without errors on the first try."""

    user = f"""FIX TO APPLY
Title       : {recommendation['title']}
Description : {recommendation['description']}
Section     : {section_type}
New addition: {is_new_addition}

SELECTOR HINTS (use these to build your selector chain)
{selectors_block}

PRODUCT DATA (use these exact values — no placeholders)
{product_str}

ORIGINAL HTML OF THE TARGET ELEMENT
{original_html[:6000]}

Write the console JavaScript now. Raw JS only — no markdown, no explanation."""

    return _call_llm(system, user, temperature=0.1)


def generate_rewrites(
    geo_report: Dict[str, Any],
    page_url: str,
    product_context: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    recommendations = parse_recommendations(geo_report)
    print(f"[RAG] Parsed {len(recommendations)} recommendations")

    rewrites = []

    for i, rec in enumerate(recommendations):
        print(f"[RAG] Processing {i + 1}/{len(recommendations)}: {rec['title']}")

        matched_chunks = match_recommendation_to_chunks(rec, page_url)

        if not matched_chunks:
            console_js = generate_console_js(
                chunk={"html": "<!-- No existing element — this is a new addition -->"},
                recommendation=rec,
                product_context=product_context,
                is_new_addition=True,
            )
            rewrites.append({
                "recommendation": rec,
                "original_html":  None,
                "console_js":     console_js,
                "chunk_meta": {
                    "type": "new_addition",
                    "note": "No matching section found — script injects new HTML",
                },
                "match_score": 0.0,
            })
            continue

        best = matched_chunks[0]
        console_js = generate_console_js(
            chunk=best,
            recommendation=rec,
            product_context=product_context,
            is_new_addition=False,
        )

        rewrites.append({
            "recommendation": rec,
            "original_html":  best["html"],
            "console_js":     console_js,
            "chunk_meta": {
                "chunk_id":      best["chunk_id"],
                "semantic_role": best["semantic_role"],
                "dom_path":      best["dom_path"],
                "css_classes":   best.get("css_classes", []),
                "element_id":    best.get("element_id"),
                "word_count":    best.get("word_count", 0),
                "type":          "modification",
            },
            "match_score": best.get("score", 0.0),
        })

    return rewrites
