from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import json
import os
from datetime import datetime
from urllib.parse import urlparse
from product_crawler import ProductCrawler
from scoring import AIScoringEngine
from llm_context import LLMContextBuilder
from geo import build_geo_graph
from dotenv import load_dotenv
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware


#app title
app = FastAPI(title="Product Crawler Webpage")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "http://localhost:3001",
        # "https://your-app.vercel.app",   
        # "https://*.vercel.app",
        "*"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
#routing to data to data folder
DATA_FOLDER="data"

#ensure data folder exists
os.makedirs(DATA_FOLDER,exist_ok=True)

class CrawlRequest(BaseModel):
    
    url:str

class ScoreRequest(BaseModel):
    filename: str

    
def generate_filename(url:str):
    
        parsed=urlparse(url)
        
        domain=parsed.netloc.replace(".","-")
        
        path=parsed.path.strip("/").replace("/","-")
        
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        
        filename = f"{domain}-{path}-{timestamp}.json"
        
        return os.path.join(DATA_FOLDER, filename)
#=============================================================
# Crawler page
#=============================================================
@app.post("/crawl_product")
def crawl_product_page(request: CrawlRequest):
    try:
        crawler = ProductCrawler(request.url)
        result = crawler.build()
        
        if "error" in result:                          
            raise HTTPException(status_code=400, detail=result["error"])
        
        file_path = generate_filename(request.url)
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        return {                                        
            "message": "Crawl successful",
            "saved_to": file_path,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
#=============================================================
# scoring result
#=============================================================
@app.post("/score_product")
def score_product(request: ScoreRequest):

    file_path = os.path.join(DATA_FOLDER, request.filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    with open(file_path, "r", encoding="utf-8") as f:
        crawl_data = json.load(f)

    scorer = AIScoringEngine(crawl_data)
    score_result = scorer.compute_score()

    return {
        "ai_visibility_score": score_result
    }
#=============================================================
# LLM context builder
#=============================================================
@app.post("/geo_context")
def geo_context(request: ScoreRequest):

    file_path = os.path.join(DATA_FOLDER, request.filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    with open(file_path, "r", encoding="utf-8") as f:
        crawl_data = json.load(f)

    scorer = AIScoringEngine(crawl_data)
    score_result = scorer.compute_score()


    context_builder = LLMContextBuilder(crawl_data, score_result)
    llm_context = context_builder.build_context()

    context_filename = request.filename.replace(".json", ".context.json")
    context_path = os.path.join(DATA_FOLDER, context_filename)
    with open(context_path, "w", encoding="utf-8") as f:
        json.dump(llm_context, f, indent=2, ensure_ascii=False)

    return {"llm_context": llm_context}

    
@app.post("/geo_recommendation")
def geo_recommendation(request: ScoreRequest):

    context_filename = request.filename.replace(".json", ".context.json")
    context_path = os.path.join(DATA_FOLDER, context_filename)
    
    if not os.path.exists(context_path):
        raise HTTPException(status_code=404, detail="Context file not found")

   
    with open(context_path, "r", encoding="utf-8") as f:
        llm_context = json.load(f)

   
    graph = build_geo_graph()

    result = graph.invoke({
        "llm_context": llm_context,
        "technical_analysis": "",
        "content_analysis": "",
        "prioritized_plan": "",
        "final_report": ""
    })

    
    geo_filename = request.filename.replace(".json", ".geo.json")
    geo_path = os.path.join(DATA_FOLDER, geo_filename)

    
    with open(geo_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    return {
    "message": "GEO recommendation generated successfully",
    "geo_report_file": geo_filename,

    # Executive summary (final_report from report_builder agent)
    "executive_summary": result.get("final_report"),

    # All 4 agent outputs — frontend renders each in its own card
    "technical_analysis": result.get("technical_analysis"),
    "content_analysis":   result.get("content_analysis"),
    "prioritized_plan":   result.get("prioritized_plan"),

    # Scores for the pill badges
    "ai_readiness_pct": llm_context.get("ai_visibility_summary", {}).get("ai_readiness_pct"),
    "readiness_band":   llm_context.get("ai_visibility_summary", {}).get("readiness_band")
}

