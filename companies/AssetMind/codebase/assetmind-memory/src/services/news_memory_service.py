"""
News Memory Service
Stores and retrieves all news articles forever
Port: 5032
"""

from fastapi import FastAPI
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="News Memory Service", version="1.0.0")


class NewsMemoryService:
    """Permanent storage for all news articles"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "News Memory"
        self.port = 5032
        self.articles = {}

    async def store_article(
        self,
        article_id: str,
        title: str,
        content: str,
        source: str,
        url: str,
        published_at: str,
        entities: List[str] = None,
        sentiment: float = 0.0
    ) -> Dict[str, Any]:
        """Store a news article permanently"""
        article = {
            "article_id": article_id,
            "title": title,
            "content": content,
            "source": source,
            "url": url,
            "published_at": published_at,
            "entities": entities or [],
            "sentiment": sentiment,
            "stored_at": datetime.utcnow().isoformat(),
        }

        self.articles[article_id] = article
        return article

    async def search(
        self,
        query: str,
        entity: Optional[str] = None,
        sentiment_range: tuple = (-1, 1),
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Search stored articles"""
        results = []

        for article in self.articles.values():
            # Filter by query
            if query.lower() not in article["title"].lower() and query.lower() not in article["content"].lower():
                continue

            # Filter by entity
            if entity and entity.upper() not in [e.upper() for e in article.get("entities", [])]:
                continue

            # Filter by sentiment
            if not (sentiment_range[0] <= article["sentiment"] <= sentiment_range[1]):
                continue

            results.append(article)

        return sorted(results, key=lambda x: x["published_at"], reverse=True)[:limit]

    async def get_timeline(self, entity: str) -> Dict[str, Any]:
        """Get timeline of all news for an entity"""
        articles = await self.search("", entity=entity, limit=1000)

        return {
            "entity": entity,
            "total_articles": len(articles),
            "timeline": sorted(articles, key=lambda x: x["published_at"]),
        }


service = NewsMemoryService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "News Memory", "port": 5032}


@app.post("/api/v1/articles")
async def store_article(request: Dict[str, Any]):
    return await service.store_article(
        request["article_id"],
        request["title"],
        request.get("content", ""),
        request["source"],
        request["url"],
        request["published_at"],
        request.get("entities"),
        request.get("sentiment", 0.0)
    )


@app.get("/api/v1/search")
async def search(
    query: str,
    entity: str = None,
    min_sentiment: float = -1,
    max_sentiment: float = 1,
    limit: int = 100
):
    return await service.search(query, entity, (min_sentiment, max_sentiment), limit=limit)


@app.get("/api/v1/timeline/{entity}")
async def get_timeline(entity: str):
    return await service.get_timeline(entity)
