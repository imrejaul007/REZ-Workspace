"""
AssetMind Semantic Search Service
AlphaSense-style natural language search for financial documents
Port: 5170
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("assetmind-semantic-search")


class DocumentType(str, Enum):
    EARNINGS_TRANSCRIPT = "earnings_transcript"
    SEC_FILING = "sec_filing"
    NEWS_ARTICLE = "news_article"
    RESEARCH_REPORT = "research_report"
    ANALYST_NOTE = "analyst_note"


class RelevanceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    content: str
    document_type: DocumentType
    symbols: List[str] = Field(default_factory=list)
    source: str
    url: Optional[str] = None
    published_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)


class DocumentCreate(BaseModel):
    title: str
    content: str
    document_type: DocumentType
    symbols: List[str] = Field(default_factory=list)
    source: str
    url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)


class SearchQuery(BaseModel):
    query: str
    symbols: Optional[List[str]] = None
    document_types: Optional[List[DocumentType]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = Field(default=20, ge=1, le=100)


class SearchResult(BaseModel):
    document: Document
    relevance_score: float = Field(ge=0.0, le=1.0)
    relevance_level: RelevanceLevel
    matched_segments: List[str] = Field(default_factory=list)
    snippet: str


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResult]
    execution_time_ms: float


class SemanticSearchState:
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.start_time = datetime.utcnow()

    def create_document(self, request: DocumentCreate) -> Document:
        doc = Document(title=request.title, content=request.content, document_type=request.document_type,
                       symbols=request.symbols, source=request.source, url=request.url,
                       metadata=request.metadata, tags=request.tags)
        self.documents[doc.id] = doc
        logger.info(f"Created document: {doc.id}")
        return doc

    def calculate_relevance(self, doc: Document, query: str) -> tuple[float, List[str]]:
        query_words = query.lower().split()
        title_matches = sum(1 for w in query_words if w in doc.title.lower())
        content_matches = sum(1 for w in query_words if w in doc.content.lower())
        tag_matches = sum(1 for w in query_words if any(w in t.lower() for t in doc.tags))
        symbol_matches = sum(1 for w in query_words if any(w in s.lower() for s in doc.symbols))

        score = title_matches * 3.0 + content_matches * 1.0 + tag_matches * 2.0 + symbol_matches * 4.0
        max_possible = len(query_words) * 10.0
        normalized = min(1.0, score / max_possible) if max_possible > 0 else 0.0

        segments = []
        content_lower = doc.content.lower()
        for word in query_words:
            if word in content_lower:
                idx = content_lower.find(word)
                start, end = max(0, idx - 50), min(len(doc.content), idx + len(word) + 50)
                segments.append(f"...{doc.content[start:end]}...")
        return normalized, segments[:3]

    def search(self, search: SearchQuery) -> SearchResponse:
        start_time = datetime.utcnow()
        results = []

        for doc in self.documents.values():
            if search.symbols and not any(s in doc.symbols for s in search.symbols):
                continue
            if search.document_types and doc.document_type not in search.document_types:
                continue
            if search.date_from and doc.published_at < search.date_from:
                continue
            if search.date_to and doc.published_at > search.date_to:
                continue

            relevance, segments = self.calculate_relevance(doc, search.query)
            if relevance > 0.1:
                level = RelevanceLevel.HIGH if relevance >= 0.7 else RelevanceLevel.MEDIUM if relevance >= 0.4 else RelevanceLevel.LOW
                idx = doc.content.lower().find(search.query.lower())
                snippet = doc.content[max(0, idx - 100):min(len(doc.content), idx + 300)] + "..." if idx >= 0 else doc.content[:300] + "..."
                results.append(SearchResult(document=doc, relevance_score=relevance, relevance_level=level,
                                           matched_segments=segments, snippet=snippet))

        results.sort(key=lambda r: r.relevance_score, reverse=True)
        results = results[:search.limit]
        exec_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        return SearchResponse(query=search.query, total_results=len(results), results=results, execution_time_ms=exec_time)


state = SemanticSearchState()

app = FastAPI(title="AssetMind Semantic Search", description="Natural language search for financial documents", version="1.0.0")


@app.get("/health")
async def health_check():
    return {"service": "assetmind-semantic-search", "status": "healthy", "version": "1.0.0", "port": 5170,
            "total_documents": len(state.documents)}


@app.get("/health/live")
async def liveness():
    return {"status": "alive"}


@app.get("/health/ready")
async def readiness():
    return {"status": "ready", "documents_loaded": len(state.documents)}


@app.post("/api/documents", response_model=Document, status_code=201)
async def create_document(request: DocumentCreate):
    return state.create_document(request)


@app.get("/api/documents", response_model=List[Document])
async def list_documents(document_type: Optional[DocumentType] = None, symbol: Optional[str] = None, limit: int = Query(50, ge=1, le=200)):
    results = list(state.documents.values())
    if document_type:
        results = [d for d in results if d.document_type == document_type]
    if symbol:
        results = [d for d in results if symbol in d.symbols]
    return sorted(results, key=lambda d: d.published_at, reverse=True)[:limit]


@app.post("/api/search", response_model=SearchResponse)
async def search_documents(search: SearchQuery):
    return state.search(search)


@app.get("/api/aggregations/{field}")
async def get_aggregations(field: str):
    values = {}
    if field == "document_type":
        for doc in state.documents.values():
            values[doc.document_type.value] = values.get(doc.document_type.value, 0) + 1
    elif field == "source":
        for doc in state.documents.values():
            values[doc.source] = values.get(doc.source, 0) + 1
    elif field == "symbol":
        for doc in state.documents.values():
            for sym in doc.symbols:
                values[sym] = values.get(sym, 0) + 1
    return {"field": field, "values": sorted(values.items(), key=lambda x: x[1], reverse=True)[:20], "total_count": len(state.documents)}


@app.get("/")
async def root():
    return {"service": "AssetMind Semantic Search", "version": "1.0.0", "port": 5170}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5170)