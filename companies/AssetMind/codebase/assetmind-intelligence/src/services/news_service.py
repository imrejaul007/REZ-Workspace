"""
News Intelligence Service - Real GDELT Integration
Port: 5035

This service fetches real-time news data from GDELT Project API.
GDELT provides comprehensive global news coverage with sentiment and themes.
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import httpx
import asyncio
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind News Intelligence Service", version="2.0.0", docs_url="/docs")


class NewsCategory(str, Enum):
    """News categories"""
    BUSINESS = "business"
    TECHNOLOGY = "technology"
    POLITICS = "politics"
    WORLD = "world"
    SCIENCE = "science"
    ENTERTAINMENT = "entertainment"
    SPORTS = "sports"


class NewsArticle(BaseModel):
    """News article"""
    article_id: str
    title: str
    content: str
    source: str
    url: Optional[str] = None
    image_url: Optional[str] = None
    published_at: datetime
    fetched_at: datetime = Field(default_factory=datetime.utcnow)

    # GDELT data
    themes: List[str] = Field(default_factory=list)
    entities: List[str] = Field(default_factory=list)
    tone: float = 0  # -1 to 1
    sentiment_score: float = 0  # -1 to 1

    # Classification
    categories: List[NewsCategory] = Field(default_factory=list)
    language: str = "en"

    # Impact metrics
    social_sentiment: float = 0
    virality_score: float = 0


class NewsSearchResult(BaseModel):
    """News search result"""
    articles: List[NewsArticle]
    total_count: int
    query: str
    fetched_at: datetime


class NewsSummary(BaseModel):
    """News summary"""
    timestamp: datetime
    top_themes: List[Dict[str, Any]]
    top_sources: List[Dict[str, Any]]
    sentiment_overview: Dict[str, float]
    breaking_news: List[NewsArticle]


class NewsIntelligenceService:
    """
    News intelligence service with real GDELT integration.

    Key capabilities:
    - Real-time news from GDELT Project
    - Theme extraction and tracking
    - Sentiment analysis
    - Entity recognition
    - Breaking news detection
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "News Intelligence"
        self.port = 5035
        self.version = "2.0.0"

        # GDELT API
        self.gdelt_base_url = "https://api.gdeltproject.org/api/v2"
        self._http_client: Optional[httpx.AsyncClient] = None

        # Cache
        self._article_cache: Dict[str, List[NewsArticle]] = defaultdict(list)
        self._cache_duration = timedelta(minutes=15)

        # Store articles
        self.articles: List[NewsArticle] = []

        # Theme keywords for classification
        self._initialize_theme_keywords()

    def _initialize_theme_keywords(self):
        """Initialize theme keywords"""
        self.theme_keywords = {
            "AI": ["artificial intelligence", "AI", "machine learning", "ChatGPT", "OpenAI", "LLM"],
            "CRYPTO": ["bitcoin", "ethereum", "crypto", "blockchain", "NFT"],
            "FED": ["Federal Reserve", "Fed", "interest rates", "monetary policy", "Jerome Powell"],
            "GEOPOLITICAL": ["Russia", "Ukraine", "China", "Taiwan", "NATO", "sanctions"],
            "EARNINGS": ["earnings", "revenue", "EPS", "quarterly results"],
            "M&A": ["acquisition", "merger", "takeover", "deal", "buyout"],
            "CLIMATE": ["climate change", "carbon", "ESG", "renewable energy", "sustainability"],
            "HEALTH": ["COVID", "vaccine", "FDA", "pandemic", "healthcare"],
            "ENERGY": ["oil", "gas", "OPEC", "energy prices", "renewable"],
            "DEFENSE": ["defense", "military", "Pentagon", "weapons", "defense spending"],
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=60.0)
        return self._http_client

    async def fetch_gdelt_articles(
        self,
        query: str,
        max_articles: int = 50,
        mode: str = "artlist"
    ) -> List[Dict[str, Any]]:
        """
        Fetch articles from GDELT Project API.

        API: https://api.gdeltproject.org/api/v2/search/search

        Args:
            query: Search query
            max_articles: Maximum number of articles
            mode: artlist or timelinevol
        """
        try:
            client = await self._get_client()
            url = f"{self.gdelt_base_url}/search/search"

            params = {
                "query": query,
                "mode": mode,
                "maxarticles": max_articles,
                "format": "json",
                "sort": "DateDesc"
            }

            response = await client.get(url, params=params, timeout=90.0)

            if response.status_code == 200:
                data = response.json()
                return data.get("articles", [])

            logger.warning(f"GDELT returned status {response.status_code}")

        except Exception as e:
            logger.error(f"Error fetching from GDELT: {e}")

        return []

    def _parse_gdelt_article(self, article_data: Dict[str, Any]) -> NewsArticle:
        """Parse GDELT article data into NewsArticle"""
        article_id = f"gdelt_{article_data.get('seendate', '')}_{hash(article_data.get('url', ''))}"

        # Parse published date
        try:
            published_str = article_data.get("seendate", "")
            if published_str:
                published_at = datetime.strptime(published_str[:14], "%Y%m%d%H%M%S")
            else:
                published_at = datetime.utcnow()
        except:
            published_at = datetime.utcnow()

        # Extract themes from GDELT themes
        gdelt_themes = article_data.get("themes", "").split(",")
        themes = [t.strip() for t in gdelt_themes if t.strip()]

        # Extract entities
        entities = []
        if article_data.get("persons"):
            entities.extend(article_data["persons"].split(","))
        if article_data.get("locations"):
            entities.extend(article_data["locations"].split(","))
        if article_data.get("organizations"):
            entities.extend(article_data["organizations"].split(","))
        entities = [e.strip() for e in entities if e.strip()]

        # Calculate sentiment from tone
        tone = 0.0
        try:
            tone = float(article_data.get("tone", 0)) / 10  # GDELT tone is 0-100
        except:
            pass

        return NewsArticle(
            article_id=article_id,
            title=article_data.get("title", ""),
            content=article_data.get("socialimage", "") + " " + article_data.get("title", ""),
            source=article_data.get("domain", "unknown"),
            url=article_data.get("url"),
            image_url=article_data.get("socialimage"),
            published_at=published_at,
            themes=themes,
            entities=entities,
            tone=tone,
            sentiment_score=tone  # Simplified
        )

    async def search_news(
        self,
        query: str,
        max_articles: int = 50,
        use_cache: bool = True
    ) -> NewsSearchResult:
        """
        Search for news articles.

        Args:
            query: Search query
            max_articles: Maximum number of articles
            use_cache: Whether to use cached results
        """
        # Check cache
        cache_key = query.lower()
        if use_cache and cache_key in self._article_cache:
            cached = self._article_cache[cache_key]
            cache_age = datetime.utcnow() - cached[0].fetched_at if cached else timedelta(hours=1)
            if cache_age < self._cache_duration:
                return NewsSearchResult(
                    articles=cached[:max_articles],
                    total_count=len(cached),
                    query=query,
                    fetched_at=cached[0].fetched_at
                )

        # Fetch from GDELT
        raw_articles = await self.fetch_gdelt_articles(query, max_articles)

        articles = []
        for raw in raw_articles:
            try:
                article = self._parse_gdelt_article(raw)
                articles.append(article)
                self.articles.append(article)
            except Exception as e:
                logger.warning(f"Error parsing article: {e}")

        # Update cache
        self._article_cache[cache_key] = articles

        return NewsSearchResult(
            articles=articles,
            total_count=len(articles),
            query=query,
            fetched_at=datetime.utcnow()
        )

    async def get_news_by_theme(
        self,
        theme: str,
        max_articles: int = 50
    ) -> List[NewsArticle]:
        """Get news articles by theme"""
        keywords = self.theme_keywords.get(theme.upper(), [theme])
        query = " OR ".join(f'"{k}"' for k in keywords[:3])

        result = await self.search_news(query, max_articles)
        return result.articles

    async def get_breaking_news(self, limit: int = 10) -> List[NewsArticle]:
        """Get breaking news (most recent articles)"""
        # Sort by published time
        sorted_articles = sorted(
            self.articles,
            key=lambda x: x.published_at,
            reverse=True
        )

        return sorted_articles[:limit]

    async def get_sentiment_overview(self) -> Dict[str, Any]:
        """Get sentiment overview of recent news"""
        if not self.articles:
            return {
                "avg_sentiment": 0,
                "positive_count": 0,
                "negative_count": 0,
                "neutral_count": 0,
                "by_theme": {}
            }

        sentiments = [a.sentiment_score for a in self.articles]
        avg_sentiment = sum(sentiments) / len(sentiments)

        positive = len([s for s in sentiments if s > 0.1])
        negative = len([s for s in sentiments if s < -0.1])
        neutral = len(sentiments) - positive - negative

        # Sentiment by theme
        theme_sentiments = defaultdict(list)
        for article in self.articles:
            for theme in article.themes:
                theme_sentiments[theme].append(article.sentiment_score)

        by_theme = {
            theme: sum(scores) / len(scores)
            for theme, scores in theme_sentiments.items()
            if scores
        }

        return {
            "avg_sentiment": avg_sentiment,
            "positive_count": positive,
            "negative_count": negative,
            "neutral_count": neutral,
            "total_articles": len(self.articles),
            "by_theme": by_theme
        }

    async def get_top_themes(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top themes from recent news"""
        theme_counts = defaultdict(int)

        for article in self.articles:
            for theme in article.themes:
                theme_counts[theme] += 1

        sorted_themes = sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)

        return [
            {"theme": t[0], "count": t[1]}
            for t in sorted_themes[:limit]
        ]

    async def get_news_summary(self) -> NewsSummary:
        """Get comprehensive news summary"""
        themes = await self.get_top_themes()
        sentiment = await self.get_sentiment_overview()

        # Get top sources
        source_counts = defaultdict(int)
        for article in self.articles:
            source_counts[article.source] += 1

        top_sources = [
            {"source": s, "count": c}
            for s, c in sorted(source_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        breaking = await self.get_breaking_news(5)

        return NewsSummary(
            timestamp=datetime.utcnow(),
            top_themes=themes,
            top_sources=top_sources,
            sentiment_overview=sentiment,
            breaking_news=breaking
        )

    async def analyze_article_sentiment(self, article: NewsArticle) -> Dict[str, Any]:
        """Analyze sentiment of an article"""
        # Simple sentiment analysis based on keywords
        positive_words = ["surge", "soar", "gain", "rise", "growth", "boom", "rally", "beat", "exceed", "strong"]
        negative_words = ["fall", "drop", "crash", "loss", "decline", "plunge", "miss", "concern", "fear", "weak"]

        content_lower = (article.title + " " + article.content).lower()

        pos_count = sum(1 for w in positive_words if w in content_lower)
        neg_count = sum(1 for w in negative_words if w in content_lower)

        # Calculate score
        total = pos_count + neg_count
        if total > 0:
            sentiment = (pos_count - neg_count) / total
        else:
            sentiment = article.sentiment_score

        return {
            "article_id": article.article_id,
            "title": article.title,
            "sentiment_score": sentiment,
            "sentiment_label": "positive" if sentiment > 0.1 else "negative" if sentiment < -0.1 else "neutral",
            "positive_signals": pos_count,
            "negative_signals": neg_count
        }

    async def get_related_articles(
        self,
        article_id: str,
        limit: int = 10
    ) -> List[NewsArticle]:
        """Get articles related to a given article"""
        # Find source article
        source = None
        for a in self.articles:
            if a.article_id == article_id:
                source = a
                break

        if not source:
            return []

        # Find related by shared themes or entities
        related = []
        for article in self.articles:
            if article.article_id == article_id:
                continue

            # Check shared themes
            shared_themes = set(source.themes) & set(article.themes)
            # Check shared entities
            shared_entities = set(source.entities) & set(article.entities)

            if shared_themes or shared_entities:
                score = len(shared_themes) + len(shared_entities)
                related.append((article, score))

        # Sort by relevance
        related.sort(key=lambda x: x[1], reverse=True)

        return [a[0] for a in related[:limit]]


# Initialize service
service = NewsIntelligenceService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "total_articles": len(service.articles),
        "cached_queries": len(service._article_cache)
    }


@app.get("/search")
async def search_news(
    query: str,
    max_articles: int = Query(50, le=100)
):
    """Search for news articles"""
    return await service.search_news(query, max_articles)


@app.get("/theme/{theme}")
async def get_news_by_theme(
    theme: str,
    max_articles: int = Query(50, le=100)
):
    """Get news by theme"""
    articles = await service.get_news_by_theme(theme, max_articles)
    return {"theme": theme, "articles": articles, "count": len(articles)}


@app.get("/breaking")
async def get_breaking_news(limit: int = Query(10, le=50)):
    """Get breaking news"""
    articles = await service.get_breaking_news(limit)
    return {"articles": articles, "count": len(articles)}


@app.get("/summary")
async def get_summary():
    """Get news summary"""
    return await service.get_news_summary()


@app.get("/sentiment")
async def get_sentiment_overview():
    """Get sentiment overview"""
    return await service.get_sentiment_overview()


@app.get("/themes")
async def get_top_themes(limit: int = Query(10, le=50)):
    """Get top themes"""
    themes = await service.get_top_themes(limit)
    return {"themes": themes}


@app.get("/related/{article_id}")
async def get_related_articles(article_id: str, limit: int = Query(10, le=50)):
    """Get related articles"""
    articles = await service.get_related_articles(article_id, limit)
    return {"article_id": article_id, "related": articles, "count": len(articles)}


@app.get("/articles/{article_id}/sentiment")
async def analyze_article_sentiment(article_id: str):
    """Analyze sentiment of an article"""
    # Find article
    article = None
    for a in service.articles:
        if a.article_id == article_id:
            article = a
            break

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return await service.analyze_article_sentiment(article)


@app.post("/refresh")
async def refresh_news(queries: Optional[List[str]] = None):
    """Refresh news from GDELT"""
    if queries is None:
        queries = ["AI", "Federal Reserve", "Stock market", "Earnings"]

    articles = []
    for query in queries:
        result = await service.search_news(query, 20)
        articles.extend(result.articles)

    return {
        "status": "refreshed",
        "total_articles": len(articles)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5035)