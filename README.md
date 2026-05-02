# GEO Workflow — AI Visibility Optimizer

A full-stack tool that crawls product pages, scores their AI visibility, generates LLM-powered recommendations, and produces downloadable DOCX reports.

---

## Architecture

```
frontend/          React 19 SPA (Vercel)
project/api/       FastAPI backend (Railway / any host)
  ├── main.py          API entrypoint
  ├── product_crawler.py   Web scraper (requests + Playwright fallback)
  ├── scoring.py           AI visibility scoring engine
  ├── llm_context.py       Context builder for LLM prompts
  ├── geo.py               LangGraph GEO recommendation pipeline
  ├── html_chunker.py      Semantic HTML parser
  ├── vector_store.py      Qdrant vector DB client
  ├── rag_pipeline.py      RAG indexing orchestrator
  ├── rag_rewriter.py      Content rewriting engine
  └── report_builder.py    DOCX report generator
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Create React App |
| Backend | FastAPI, Uvicorn |
| AI / LLM | OpenAI GPT-4o-mini, text-embedding-3-large |
| Orchestration | LangGraph |
| Vector DB | Qdrant |
| Scraping | requests, BeautifulSoup, Playwright (fallback) |
| Reports | python-docx |

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Qdrant](https://qdrant.tech/documentation/quick-start/) running locally or a Qdrant Cloud URL

### Backend

```bash
cd project/api
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium       # for JS-rendered page fallback

# create .env
echo "OPENAI_API_KEY=sk-..." > .env
echo "QDRANT_URL=http://localhost:6333" >> .env

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
# create .env.local
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
npm start
```

---

## Environment Variables

### Backend (`project/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `QDRANT_URL` | No | Qdrant endpoint (default: `http://localhost:6333`) |
| `PORT` | No | Server port (set automatically by hosting platforms) |

### Frontend (`.env.local` or Vercel dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes | Full URL of the deployed backend (e.g. `https://your-api.railway.app`) |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/crawl_product` | Crawl a product page by URL |
| POST | `/score_product` | Score AI visibility for a crawled file |
| POST | `/geo_context` | Build LLM context from crawl data |
| POST | `/geo_recommendation` | Run LangGraph GEO analysis pipeline |
| POST | `/apply_rewrites` | Generate RAG-powered content rewrites |
| POST | `/index_page` | Index a page into Qdrant |
| POST | `/index_page_file` | Index a page via file upload |
| POST | `/search_chunks` | Semantic search over indexed chunks |
| POST | `/download_report` | Download DOCX report |

---

## Deployment

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable `REACT_APP_API_URL` pointing to your deployed backend
4. Vercel auto-detects Create React App — no extra config needed

Or deploy via CLI:

```bash
cd frontend
npx vercel --prod
```

### Backend → Railway

The backend is pre-configured for Railway via `project/api/nixpacks.toml`.

1. Create a new Railway project
2. Set root directory to `project/api`
3. Add environment variables: `OPENAI_API_KEY`, `QDRANT_URL`
4. Railway auto-detects nixpacks and runs `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Vector DB → Qdrant Cloud

1. Create a free cluster at [cloud.qdrant.io](https://cloud.qdrant.io)
2. Copy the cluster URL and API key
3. Set `QDRANT_URL=https://your-cluster.qdrant.io` in your backend environment

---

## Workflow

```
1. Paste product URL → /crawl_product  → saves domain-path-TIMESTAMP.json
2. Score page       → /score_product  → AI visibility score (schema, EEAT, content)
3. Build context    → /geo_context    → structured LLM context (.context.json)
4. GEO analysis     → /geo_recommendation → LangGraph pipeline (.geo.json)
5. Index page       → /index_page     → embed chunks → Qdrant
6. Apply rewrites   → /apply_rewrites → RAG-powered recommendations (.rewrites.json)
7. Download report  → /download_report → DOCX file
```
