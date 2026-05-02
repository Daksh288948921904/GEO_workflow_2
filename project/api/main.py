from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
import uvicorn
import json
import os
import io
from datetime import datetime
from urllib.parse import urlparse

from product_crawler import ProductCrawler
from scoring import AIScoringEngine
from llm_context import LLMContextBuilder
from geo import build_geo_graph
from report_builder import build_report_docx

from dotenv import load_dotenv
load_dotenv()

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from rag_pipeline import index_page, apply_recommendations, search_page_chunks
app = FastAPI(title="Product Crawler Webpage")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FOLDER = "data"
os.makedirs(DATA_FOLDER, exist_ok=True)
class SearchRequest(BaseModel):
    page_url: str
    query: str
    top_k: int = 5

class CrawlRequest(BaseModel):
    url: str

class ScoreRequest(BaseModel):
    filename: str

class IndexPageRequest(BaseModel):
    page_url: str | None = None
    html: str | None = None
    filename: str | None = None   # alternative: load HTML from a saved crawl file


def generate_filename(url: str):
    parsed    = urlparse(url)
    domain    = parsed.netloc.replace(".", "-")
    path      = parsed.path.strip("/").replace("/", "-")
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename  = f"{domain}-{path}-{timestamp}.json"
    return os.path.join(DATA_FOLDER, filename)


# ─── helpers ──────────────────────────────────────────────────────────────────

def _load_json(filepath: str) -> dict:
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"File not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_json(filepath: str, data: dict):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# =============================================================
# Crawl
# =============================================================
@app.post("/crawl_product")
def crawl_product_page(request: CrawlRequest):
    try:
        crawler = ProductCrawler(request.url)
        result  = crawler.build()

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        file_path = generate_filename(request.url)
        _save_json(file_path, result)

        return {
            "message":  "Crawl successful",
            "saved_to": file_path,
            "data":     result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================
# Score
# =============================================================
@app.post("/score_product")
def score_product(request: ScoreRequest):
    file_path  = os.path.join(DATA_FOLDER, request.filename)
    crawl_data = _load_json(file_path)
    score_result = AIScoringEngine(crawl_data).compute_score()
    return {"ai_visibility_score": score_result}


# =============================================================
# LLM Context
# =============================================================
@app.post("/geo_context")
def geo_context(request: ScoreRequest):
    file_path  = os.path.join(DATA_FOLDER, request.filename)
    crawl_data = _load_json(file_path)

    score_result = AIScoringEngine(crawl_data).compute_score()
    llm_context  = LLMContextBuilder(crawl_data, score_result).build_context()

    # save context for reference
    context_path = os.path.join(DATA_FOLDER, request.filename.replace(".json", ".context.json"))
    _save_json(context_path, llm_context)

    return {"llm_context": llm_context}


# =============================================================
# GEO Recommendation   ← FIXED
# =============================================================
@app.post("/geo_recommendation")
def geo_recommendation(request: ScoreRequest):
    # ── Load crawl data and rebuild context fresh ──────────────────────────
    file_path  = os.path.join(DATA_FOLDER, request.filename)
    crawl_data = _load_json(file_path)

    score_result = AIScoringEngine(crawl_data).compute_score()
    llm_context  = LLMContextBuilder(crawl_data, score_result).build_context()

    # ── Run the LangGraph pipeline ─────────────────────────────────────────
    graph = build_geo_graph()

   
    result = graph.invoke({
        "llm_context":        llm_context,
        "technical_analysis": "",
        "content_analysis":   "",
        "prioritized_plan":   "",
        "executive_summary":  "",    
    })

    
    executive_summary  = result.get("executive_summary")  or ""
    technical_analysis = result.get("technical_analysis") or ""
    content_analysis   = result.get("content_analysis")   or ""
    prioritized_plan   = result.get("prioritized_plan")   or ""

    
    if not executive_summary.strip():
        av    = llm_context.get("ai_visibility_summary", {})
        ps    = llm_context.get("product_summary", {})
        wa    = llm_context.get("weak_areas", {})
        po    = llm_context.get("priority_order", [])
        pct   = av.get("ai_readiness_pct", 0)
        band  = av.get("readiness_band", "Unknown")
        name  = ps.get("name", "this product")
        brand = ps.get("brand", "")
        curr  = ps.get("currency", "INR")
        price = ps.get("price", "")
        sym   = {"INR": "₹", "USD": "$", "GBP": "£"}.get(curr, curr)
        worst = ", ".join(po[:3]) if po else "multiple dimensions"
        missing = "; ".join(
            f"{sec} ({', '.join(str(f) for f in fields[:2])})"
            for sec, fields in list(wa.items())[:3]
        ) or "minor gaps"

        executive_summary = (
            f"## Executive Summary\n\n"
            f"**{name}**{f' by {brand}' if brand else ''}"
            f"{f' — {sym}{price}' if price else ''} "
            f"scored **{pct}/100** ({band}) in AI/LLM visibility analysis.\n\n"
            f"The page has critical gaps in {worst}. "
            f"Specifically, these signals score zero: {missing}.\n\n"
            f"Implementing the Quick Wins below (under 2 hours) is projected to reach "
            f"**{min(pct + 10, 100)}/100**. Full implementation could reach "
            f"**{min(pct + 20, 100)}/100**."
        )

    
    geo_report = {
        "executive_summary":  executive_summary,
        "technical_analysis": technical_analysis,
        "content_analysis":   content_analysis,
        "prioritized_plan":   prioritized_plan,
        "ai_readiness_pct":   llm_context.get("ai_visibility_summary", {}).get("ai_readiness_pct"),
        "readiness_band":     llm_context.get("ai_visibility_summary", {}).get("readiness_band"),
    }
    geo_filename = request.filename.replace(".json", ".geo.json")
    geo_path     = os.path.join(DATA_FOLDER, geo_filename)
    _save_json(geo_path, geo_report)

    # ── Return response ────────────────────────────────────────────────────
    return {
        "message":            "GEO recommendation generated successfully",
        "geo_report_file":    geo_filename,
        "executive_summary":  executive_summary,    
        "technical_analysis": technical_analysis,
        "content_analysis":   content_analysis,
        "prioritized_plan":   prioritized_plan,
        "ai_readiness_pct":   llm_context.get("ai_visibility_summary", {}).get("ai_readiness_pct"),
        "readiness_band":     llm_context.get("ai_visibility_summary", {}).get("readiness_band"),
        "product_name":       llm_context.get("product_summary", {}).get("name"),
        "product_brand":      llm_context.get("product_summary", {}).get("brand"),
        "llm_context":        llm_context,
    }


# =============================================================
# Download Report (.docx)
# =============================================================
@app.post("/download_report")
async def download_report(body: ScoreRequest):
    crawl_path = os.path.join(DATA_FOLDER, body.filename)
    crawl_data = _load_json(crawl_path)

    geo_filename = body.filename.replace(".json", ".geo.json")
    geo_path     = os.path.join(DATA_FOLDER, geo_filename)
    if not os.path.exists(geo_path):
        raise HTTPException(status_code=400, detail="GEO report not generated yet. Run /geo_recommendation first.")

    geo_result = _load_json(geo_path)
    score_data = AIScoringEngine(crawl_data).compute_score()
    context    = LLMContextBuilder(crawl_data, score_data).build_context()

    doc = build_report_docx(context, score_data, geo_result)
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="GENY_Report.docx"'}
    )
    
@app.post("/index_page")
def index_page_endpoint(request: IndexPageRequest):
    html     = request.html
    page_url = request.page_url

    # --- fallback: load from saved crawl file --------------------------------
    if not html and request.filename:
        file_path  = os.path.join(DATA_FOLDER, request.filename)
        crawl_data = _load_json(file_path)
        html       = crawl_data.get("raw_html") or crawl_data.get("html")
        if not html:
            raise HTTPException(
                status_code=400,
                detail="Crawl file has no stored HTML. Provide raw HTML directly via the 'html' field.",
            )
        if not page_url:
            page_url = crawl_data.get("page_info", {}).get("url", "")

    if not html or not html.strip():
        raise HTTPException(status_code=400, detail="html cannot be empty")
    if not page_url or not page_url.strip():
        raise HTTPException(status_code=400, detail="page_url cannot be empty")

    result = index_page(html, page_url, debug=False)

    return {
        "message":        f"Indexed {result['total_chunks']} chunks",
        "page_url":        result["page_url"],
        "total_chunks":    result["total_chunks"],
        "chunks_by_role":  result["chunks_by_role"],
    }
@app.post("/index_page_file")
async def index_page_file_endpoint(
    page_url: str = Form(...),
    html_file: UploadFile = File(...),
):
    """Upload HTML as a file — use this in Swagger UI to avoid JSON encoding issues."""
    html = (await html_file.read()).decode("utf-8", errors="replace")
    if not html.strip():
        raise HTTPException(status_code=400, detail="html file is empty")
    if not page_url.strip():
        raise HTTPException(status_code=400, detail="page_url cannot be empty")

    result = index_page(html, page_url, debug=False)
    return {
        "message":        f"Indexed {result['total_chunks']} chunks",
        "page_url":        result["page_url"],
        "total_chunks":    result["total_chunks"],
        "chunks_by_role":  result["chunks_by_role"],
    }

@app.post("/apply_rewrites")
def apply_rewrites_endpoint(request: ScoreRequest):
    # Load crawl data
    file_path  = os.path.join(DATA_FOLDER, request.filename)
    crawl_data = _load_json(file_path)
    page_url   = crawl_data.get("page_info", {}).get("url", "")
 
    # Load GEO report
    geo_filename = request.filename.replace(".json", ".geo.json")
    geo_path     = os.path.join(DATA_FOLDER, geo_filename)
    if not os.path.exists(geo_path):
        raise HTTPException(
            status_code=400,
            detail="GEO report not found. Run /geo_recommendation first."
        )
    geo_report = _load_json(geo_path)
 
    # Load LLM context for product data
    context_filename = request.filename.replace(".json", ".context.json")
    context_path     = os.path.join(DATA_FOLDER, context_filename)
    llm_context = _load_json(context_path) if os.path.exists(context_path) else None
 
    # Run RAG rewrite pipeline
    result = apply_recommendations(
        geo_report=geo_report,
        page_url=page_url,
        llm_context=llm_context,
    )
 
    # Save rewrites
    rewrite_filename = request.filename.replace(".json", ".rewrites.json")
    rewrite_path     = os.path.join(DATA_FOLDER, rewrite_filename)
    _save_json(rewrite_path, result)
 
    return {
        "message":        f"Generated {result['total_rewrites']} console scripts",
        "rewrite_file":   rewrite_filename,
        "total_rewrites": result["total_rewrites"],
        "rewrites":       result["rewrites"],
    }
@app.post("/search_chunks")
def search_chunks_endpoint(request: SearchRequest):
    results = search_page_chunks(
        page_url=request.page_url,
        query=request.query,
        top_k=request.top_k,
    )
    return {
        "query":   request.query,
        "results": results,
    }