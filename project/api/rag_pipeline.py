
from __future__ import annotations
from typing import Dict, Any, List, Optional

from html_chunker import chunk_html, HTMLChunk, print_chunk_summary
from vector_store import index_chunks, retrieve_chunks, retrieve_by_role
from rag_rewriter import generate_rewrites, parse_recommendations



def index_page(html: str, page_url: str, debug: bool = False) -> Dict[str, Any]:
    

    chunks = chunk_html(html, page_url=page_url)

    if debug:
        print_chunk_summary(chunks)


    indexed_count = index_chunks(chunks, page_url)


    role_counts: Dict[str, int] = {}
    for c in chunks:
        role_counts[c.semantic_role] = role_counts.get(c.semantic_role, 0) + 1

    result = {
        "page_url":       page_url,
        "total_chunks":   indexed_count,
        "chunks_by_role": role_counts,
    }

    if debug:
        result["chunks"] = [c.to_dict() for c in chunks]

    return result



def apply_recommendations(
    geo_report: Dict[str, Any],
    page_url: str,
    llm_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    
    rewrites = generate_rewrites(
        geo_report=geo_report,
        page_url=page_url,
        product_context=llm_context,
    )

    return {
        "page_url":        page_url,
        "total_rewrites":  len(rewrites),
        "rewrites":        rewrites,
    }



def search_page_chunks(
    page_url: str,
    query: str,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    
    return retrieve_chunks(query, page_url, top_k=top_k)


def get_chunks_by_role(
    page_url: str,
    role: str,
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    
    return retrieve_by_role(page_url, role, top_k=top_k)