"""
AssetMind - Semantic Search (AlphaSense-Style)
Port: 5170

AlphaSense-inspired enterprise search with:
- Natural language queries
- Semantic understanding
- Cross-source search
- Knowledge graph integration

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Semantic Search", version="1.0.0")


# ============================================================================
# Enums
# ============================================================================

class SearchType(str, Enum):
    SEMANTIC = "semantic"          # Natural language understanding
    KEYWORD = "keyword"           # Traditional keyword
    HYBRID = "hybrid"             # Combined approach
    KNOWLEDGE_GRAPH = "knowledge_graph"  # Graph-based


class ContentSource(str, Enum):
    NEWS = "news"
    FILINGS = "filings"           # SEC filings
    REPORTS = "reports"           # Research reports
    TRANSCRIPTS = "transcripts"   # Earnings calls
    SOCIAL = "social"              # Twitter, Reddit
    BLOGS = "blogs"               # Financial blogs
    INTERNAL = "internal"         # User's own documents


# ============================================================================
# Models
# ============================================================================

class SearchQuery(BaseModel):
    query: str
    search_type: SearchType = SearchType.SEMANTIC
    sources: Optional[List[ContentSource]] = None
    symbols: Optional[List[str]] = None
    time_range: str = "1y"  # 1d, 1w, 1m, 3m, 1y, 5y
    limit: int = Field(default=20, ge=1, le=100)


class SearchResult(BaseModel):
    id: str
    title: str
    snippet: str
    source: ContentSource
    url: Optional[str] = None
    symbol: Optional[str] = None
    published_at: datetime
    relevance_score: float
    entities: List[str] = []  # Companies, people, topics
    sentiment: Optional[str] = None
    key_findings: List[str] = []


class SemanticSearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    search_time_ms: int
    suggestions: List[str] = []


class ComparisonRequest(BaseModel):
    query: str
    entities: List[str]  # Compare multiple companies
    comparison_type: str = "fundamental"  # fundamental, technical, sentiment


class ComparisonResult(BaseModel):
    entities: List[str]
    comparison_type: str
    dimensions: List[Dict[str, Any]]
    insights: List[str]


# ============================================================================
# In-memory knowledge base
# ============================================================================

KNOWLEDGE_BASE = {
    "NVDA": {
        "name": "NVIDIA Corporation",
        "sector": "Technology",
        "market_cap": "850B",
        "description": "Leading GPU manufacturer for AI, gaming, and data centers",
        "competitors": ["AMD", "INTC", "QCOM"],
        "key_products": ["H100", "A100", "RTX 4090"],
        "recent_news": [
            "Data center revenue up 400% YoY",
            "AI chip demand exceeds supply",
            "GTC conference highlights"
        ]
    },
    "AAPL": {
        "name": "Apple Inc.",
        "sector": "Technology",
        "market_cap": "2.8T",
        "description": "Consumer electronics and software",
        "competitors": ["MSFT", "GOOGL", "AMZN"],
        "key_products": ["iPhone", "Mac", "iPad", "Watch"],
        "recent_news": [
            "Services revenue growth",
            "AI features in iOS 18",
            "Vision Pro sales"
        ]
    }
}


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-semantic-search",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5170,
        "features": [
            "Natural language search",
            "Semantic understanding",
            "Cross-source search",
            "Entity extraction",
            "Sentiment analysis"
        ]
    }


@app.post("/search", response_model=SemanticSearchResponse)
async def semantic_search(request: SearchQuery):
    """
    AlphaSense-style semantic search.

    Understands natural language queries and finds relevant content
    across multiple sources.
    """
    start_time = datetime.utcnow()

    # Simulate semantic search
    results = []

    # Parse query to find entities
    query_lower = request.query.lower()
    matched_symbols = [s for s in KNOWLEDGE_BASE.keys() if s.lower() in query_lower]

    for symbol in matched_symbols:
        data = KNOWLEDGE_BASE[symbol]
        results.append(SearchResult(
            id=str(uuid.uuid4()),
            title=f"{data['name']} Overview",
            snippet=data['description'],
            source=ContentSource.REPORTS,
            symbol=symbol,
            published_at=datetime.utcnow(),
            relevance_score=0.95,
            entities=[data['name'], data['sector']],
            sentiment="positive",
            key_findings=data['recent_news'][:2]
        ))

    # Add some generic results
    results.append(SearchResult(
        id=str(uuid.uuid4()),
        title=f"Analysis: {request.query}",
        snippet=f"Comprehensive analysis covering {request.query}",
        source=ContentSource.NEWS,
        published_at=datetime.utcnow(),
        relevance_score=0.75,
        entities=matched_symbols if matched_symbols else [],
        key_findings=["Key insight 1", "Key insight 2"]
    ))

    search_time = (datetime.utcnow() - start_time).total_seconds() * 1000

    return SemanticSearchResponse(
        query=request.query,
        results=results,
        total_results=len(results),
        search_time_ms=int(search_time),
        suggestions=[
            f"Refine search for {request.query}",
            "Try broader terms",
            "Search by company name"
        ]
    )


@app.get("/search/entities/{entity}")
async def search_entity(entity: str, limit: int = 10):
    """
    Search for specific entity (company, person, topic).

    AlphaSense-style entity search.
    """
    # Find in knowledge base
    entity_data = KNOWLEDGE_BASE.get(entity.upper())

    if entity_data:
        return {
            "entity": entity.upper(),
            "type": "company",
            "data": entity_data,
            "related_news": entity_data.get("recent_news", []),
            "competitors": entity_data.get("competitors", [])
        }

    # Generic entity search
    return {
        "entity": entity,
        "type": "unknown",
        "data": None,
        "related_news": [],
        "suggestions": ["Try specific company symbol"]
    }


@app.post("/compare", response_model=ComparisonResult)
async def compare_entities(request: ComparisonRequest):
    """
    AlphaSense-style entity comparison.

    Compare multiple companies across fundamental, technical, or sentiment dimensions.
    """
    dimensions = []

    for entity in request.entities:
        entity_data = KNOWLEDGE_BASE.get(entity.upper(), {})
        dimensions.append({
            "entity": entity,
            "name": entity_data.get("name", entity),
            "sector": entity_data.get("sector", "Unknown"),
            "market_cap": entity_data.get("market_cap", "N/A")
        })

    insights = [
        f"Compared {len(request.entities)} entities across {request.comparison_type} metrics",
        "Technology sector showing strong performance",
        "AI infrastructure companies outperforming"
    ]

    return ComparisonResult(
        entities=request.entities,
        comparison_type=request.comparison_type,
        dimensions=dimensions,
        insights=insights
    )


@app.get("/search/trending")
async def get_trending_topics():
    """
    Get trending financial topics.

    Like AlphaSense's trending insights.
    """
    return {
        "trending": [
            {"topic": "AI Infrastructure", "mentions": 12500, "sentiment": "positive"},
            {"topic": "Federal Reserve", "mentions": 8900, "sentiment": "neutral"},
            {"topic": "Earnings Season", "mentions": 6700, "sentiment": "mixed"},
            {"topic": "Cryptocurrency", "mentions": 4500, "sentiment": "volatile"},
            {"topic": "M&A Activity", "mentions": 3200, "sentiment": "positive"}
        ],
        "updated_at": datetime.utcnow().isoformat()
    }


@app.get("/search/sectors")
async def get_sector_analysis():
    """
    Get sector-level analysis.

    Like AlphaSense sector trends.
    """
    return {
        "sectors": [
            {
                "name": "Technology",
                "performance": "+2.5%",
                "trending_topics": ["AI", "Cloud", "Semiconductors"],
                "top_stocks": ["NVDA", "AAPL", "MSFT"]
            },
            {
                "name": "Healthcare",
                "performance": "+0.8%",
                "trending_topics": ["AI Drug Discovery", "GLP-1", "MedTech"],
                "top_stocks": ["LLY", "UNH", "JNJ"]
            },
            {
                "name": "Financials",
                "performance": "+0.5%",
                "trending_topics": ["Rate Cuts", "Banking", "Fintech"],
                "top_stocks": ["JPM", "BAC", "GS"]
            }
        ]
    }


@app.get("/search/alerts")
async def get_search_alerts():
    """
    Get personalized search alerts.

    Like AlphaSense alerts for tracked entities.
    """
    return {
        "alerts": [
            {
                "id": "alert-1",
                "entity": "NVDA",
                "type": "news",
                "message": "New analysis available",
                "severity": "medium",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "alert-2",
                "entity": "AAPL",
                "type": "earnings",
                "message": "Earnings in 5 days",
                "severity": "high",
                "created_at": datetime.utcnow().isoformat()
            }
        ]
    }


@app.post("/search/track")
async def track_entity(entity: str, query: str = ""):
    """
    Track an entity (company, topic, person).

    Like AlphaSense tracking for notifications.
    """
    return {
        "entity": entity,
        "query": query,
        "tracking": True,
        "alert_frequency": "daily",
        "created_at": datetime.utcnow().isoformat()
    }


@app.delete("/search/untrack/{entity}")
async def untrack_entity(entity: str):
    """Stop tracking an entity"""
    return {
        "entity": entity,
        "tracking": False,
        "message": "Entity removed from tracking"
    }


@app.get("/search/knowledge-graph/{entity}")
async def get_entity_knowledge_graph(entity: str):
    """
    Get knowledge graph for an entity.

    Shows relationships to other entities.
    """
    entity_data = KNOWLEDGE_BASE.get(entity.upper(), {})

    return {
        "entity": entity,
        "name": entity_data.get("name", entity),
        "relationships": [
            {"type": "competitor", "entities": entity_data.get("competitors", [])},
            {"type": "sector", "entities": [entity_data.get("sector", "Unknown")]},
            {"type": "product", "entities": entity_data.get("key_products", [])}
        ],
        "connections_count": len(entity_data.get("competitors", [])) + 2
    }


# ============================================================================
# Query Expansion
# ============================================================================

@app.post("/search/expand")
async def expand_query(query: str):
    """
    Expand query with related terms.

    Like AlphaSense query expansion.
    """
    query_lower = query.lower()

    expansions = {
        "ai": ["artificial intelligence", "machine learning", "neural networks"],
        "gpu": ["graphics processing", "semiconductor", "chips"],
        "cloud": ["aws", "azure", "google cloud", "infrastructure"],
        "earnings": ["revenue", "profit", "eps", "guidance"]
    }

    expanded_terms = []
    for key, terms in expansions.items():
        if key in query_lower:
            expanded_terms.extend(terms)

    return {
        "original_query": query,
        "expanded_terms": expanded_terms,
        "expanded_query": f"{query} {' '.join(expanded_terms[:5])}"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5170)