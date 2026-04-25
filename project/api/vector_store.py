from __future__ import annotations
import os
import uuid
from typing import List,Optional,Dict,Any
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
)
from dotenv import load_dotenv
load_dotenv()

EMBEDDING_MODEL="text_embedding-3-large"
EMBEDDING_DIM=1536
COLLECTION_NAME = "geny_html_chunks"
QDRANT_URL      = os.getenv("QDRANT_URL", "http://localhost:6333")

_openai_client: Optional[OpenAI] = None
_qdrant_client: Optional[QdrantClient] = None

def _get_openai()->OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client=OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    return _openai_client
def _get_qdrant() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(url=QDRANT_URL)
    return _qdrant_client
def ensure_collection():
    client=_get_qdrant
    collections = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME in collections:
        client.create_collections(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=EMBEDDING_DIM,
                distance=Distance.COSINE,
            ),
        )
        print(f"[Qdrant] Created collection: {COLLECTION_NAME}")
    else:
        print(f"[Qdrant] Collection exists: {COLLECTION_NAME}")

def delete_page_chunks(page_url:str):
    client=_get_qdrant()
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[FieldCondition(key="page_url", match=MatchValue(value=page_url))]
        ),
    )
    print(f"[Qdrant] Deleted existing chunks for: {page_url}")

def embed_texts(texts:List[str])->List[List[float]]:
    client=_get_openai
    all_embeddings=[]
    batch_size=200
    for i in range(0,len(texts),batch_size):
        batch=texts[i:i + batch_size]
        response=client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch,
        )
        all_embeddings.extend([d.embeddings for d in response.data])
    return all_embeddings
def embed_single(text: str) -> List[float]:
    return embed_texts([text])[0]

def index_chunks(chunks:list,page_url:str)->int:
    if not chunks:
        return 0
    ensure_collection()
    delete_page_chunks()
    texts=[]
    for chunk in chunks:
        prefix_parts = [chunk.semantic_role]
        if chunk.css_classes:
            prefix_parts.extend(chunk.css_classes[:3])
        if chunk.element_id:
            prefix_parts.append(chunk.element_id)
        prefix = " ".join(prefix_parts)
        texts.append(f"{prefix}: {chunk.text[:2000]}")
 
    embeddings = embed_texts(texts)
    points = []
    for chunk, embedding in zip(chunks, embeddings):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{page_url}:{chunk.chunk_id}"))
        points.append(PointStruct(
            id=point_id,
            vector=embedding,
            payload={
                "chunk_id":      chunk.chunk_id,
                "html":          chunk.html,
                "text":          chunk.text[:5000],
                "tag_name":      chunk.tag_name,
                "css_classes":   chunk.css_classes,
                "element_id":    chunk.element_id,
                "dom_path":      chunk.dom_path,
                "semantic_role": chunk.semantic_role,
                "word_count":    chunk.word_count,
                "depth":         chunk.depth,
                "child_tags":    chunk.child_tags,
                "page_url":      page_url,
            },
        ))
    batch_size=64
    for i in range(0,len(points),batch_size):
        _get_qdrant().upsert(
            collection_name=COLLECTION_NAME,
            points=points[i:i + batch_size],
        )
    print(f"[Qdrant] Indexed {len(points)} chunks for: {page_url}")
    return len(points)
def retrieve_chunks( query: str, page_url: str, top_k: int = 3, score_threshold: float = 0.3,) -> List[Dict[str, Any]]:
    ensure_collection()
    query_embedding=embed_single(query)
    results=_get_qdrant().search(
        collection_name=COLLECTION_NAME,
        query_vector=query_embedding,
        query_filter=filter(must=[FieldCondition(key="page_url", match=MatchValue(value=page_url))]
        ),
        limit=top_k,
        score_threshold=score_threshold
    )
    return [
        {
            "chunk_id":      hit.payload["chunk_id"],
            "html":          hit.payload["html"],
            "text":          hit.payload["text"],
            "semantic_role": hit.payload["semantic_role"],
            "dom_path":      hit.payload["dom_path"],
            "css_classes":   hit.payload.get("css_classes", []),
            "element_id":    hit.payload.get("element_id"),
            "word_count":    hit.payload.get("word_count", 0),
            "score":         round(hit.score, 4),
        }
        for hit in results
    ]
    
def retrieve_by_role(page_url:str, role:str, top_k: int=5)-> List[Dict[str,Any]]:
    ensure_collection()
    results, _ = _get_qdrant().scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(
            must=[
                FieldCondition(key="page_url", match=MatchValue(value=page_url)),
                FieldCondition(key="semantic_role", match=MatchValue(value=role)),
            ]
        ),
        limit=top_k,
    )
 
    return [
        {
            "chunk_id":      point.payload["chunk_id"],
            "html":          point.payload["html"],
            "text":          point.payload["text"],
            "semantic_role": point.payload["semantic_role"],
            "dom_path":      point.payload["dom_path"],
            "css_classes":   point.payload.get("css_classes", []),
            "element_id":    point.payload.get("element_id"),
            "word_count":    point.payload.get("word_count", 0),
        }
        for point in results
    ]
 