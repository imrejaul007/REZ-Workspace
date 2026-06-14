"""
AssetMind News Service
Financial news aggregation and sentiment analysis
Port: 5030
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind News Service",
    version="1.0.0",
    docs_url="/docs",
    description="Financial news aggregation, sentiment analysis, and entity extraction"
)


class SentimentType(str, Enum):
    VERY_BULLISH = "very_bullish"
    BULLISH = "bullish"
    NEUTRAL = "neutral"
    BEARISH = "bearish"
    VERY_BEARISH = "very_bearish"


class NewsArticle(BaseModel):
    article_id: str
    title: str
    summary: str
    source: str
    url: str
    published_at: datetime
    symbols: List[str] = Field(default_factory=list)
    sentiment: SentimentType
    sentiment_score: float = Field(..., ge=-1, le=1)
    entities: List[Dict[str, str]] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)
    relevance_score: float = Field(default=0.5, ge=0, le=1)


class SentimentSummary(BaseModel):
    symbol: str
    overall_sentiment: SentimentType
    sentiment_score: float
    positive_count: int
    negative_count: int
    neutral_count: int
    total_articles: int
    avg_published: Optional[str] = None
    key_themes: List[str] = Field(default_factory=list)
    impact_assessment: str


class AnalysisRequest(BaseModel):
    text: str
    extract_entities: bool = True
    extract_topics: bool = True
    include_sentiment: bool = True


class NewsService:
    """Financial news aggregation and sentiment analysis service"""

    def __init__(self):
        self.name = "News Service"
        self.port = 5030
        self.version = "1.0.0"
        self._news_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._article_count = 0
        self._news_sources = [
            "Reuters", "Bloomberg", "CNBC", "WSJ", "Financial Times",
            "MarketWatch", "Yahoo Finance", "Seeking Alpha", "Barrons"
        ]

    def _generate_article_id(self) -> str:
        """Generate unique article ID"""
        self._article_count += 1
        return f"article_{datetime.utcnow().timestamp()}_{self._article_count}"

    def _generate_news_for_symbol(self, symbol: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Generate simulated news articles for a symbol"""
        articles = []
        base_titles = [
            f"{symbol} Reports Strong Quarterly Earnings",
            f"{symbol} Announces Strategic Partnership",
            f"Analysts Upgrade {symbol} Price Target",
            f"{symbol} Stock Surges on Innovation News",
            f"{symbol} Faces Regulatory Scrutiny",
            f"Why {symbol} Could Be a Buy Right Now",
            f"{symbol} Expands Into New Markets",
            f"Q2 Results: {symbol} Exceeds Expectations",
            f"{symbol} CEO Discusses Future Plans",
            f"Market Watch: {symbol} Technical Analysis"
        ]

        for i in range(min(limit, len(base_titles))):
            sentiment_choice = random.random()
            if sentiment_choice > 0.7:
                sentiment = SentimentType.VERY_BULLISH
                sentiment_score = random.uniform(0.7, 1.0)
            elif sentiment_choice > 0.55:
                sentiment = SentimentType.BULLISH
                sentiment_score = random.uniform(0.2, 0.7)
            elif sentiment_choice > 0.45:
                sentiment = SentimentType.NEUTRAL
                sentiment_score = random.uniform(-0.2, 0.2)
            elif sentiment_choice > 0.3:
                sentiment = SentimentType.BEARISH
                sentiment_score = random.uniform(-0.7, -0.2)
            else:
                sentiment = SentimentType.VERY_BEARISH
                sentiment_score = random.uniform(-1.0, -0.7)

            # Generate entities
            entities = [
                {"type": "ORG", "name": f"{symbol} Inc.", "role": "subject"},
                {"type": "PERSON", "name": f"CEO of {symbol}", "role": "mentioned"}
            ]

            if "partnership" in base_titles[i].lower():
                entities.append({"type": "ORG", "name": "Partner Corp", "role": "object"})
            if "analyst" in base_titles[i].lower():
                entities.append({"type": "ORG", "name": "Goldman Sachs", "role": "analyst"})

            # Generate topics
            topics = ["Earnings", "Markets", "Technology"]
            if "regulatory" in base_titles[i].lower():
                topics.append("Regulation")
            if "strategic" in base_titles[i].lower():
                topics.append("Business Strategy")
            if "technical" in base_titles[i].lower():
                topics.append("Technical Analysis")

            article = {
                "article_id": self._generate_article_id(),
                "title": base_titles[i],
                "summary": f"Latest news and analysis for {symbol}. "
                          f"Market sentiment remains {sentiment.value.replace('_', ' ')} "
                          f"with a score of {sentiment_score:.2f}.",
                "source": random.choice(self._news_sources),
                "url": f"https://example.com/news/{self._article_count}",
                "published_at": (datetime.utcnow() - timedelta(hours=random.randint(1, 72))).isoformat(),
                "symbols": [symbol.upper()],
                "sentiment": sentiment.value,
                "sentiment_score": round(sentiment_score, 3),
                "entities": entities,
                "topics": topics[:random.randint(2, 4)],
                "relevance_score": round(random.uniform(0.5, 0.95), 2)
            }
            articles.append(article)

        return articles

    async def get_news(
        self,
        symbol: str,
        limit: int = 20,
        hours: int = 72
    ) -> List[Dict[str, Any]]:
        """Get news articles for a symbol"""
        cache_key = symbol.upper()

        if cache_key not in self._news_cache or len(self._news_cache[cache_key]) < limit:
            self._news_cache[cache_key] = self._generate_news_for_symbol(symbol, limit)

        return self._news_cache[cache_key][:limit]

    async def get_sentiment(self, symbol: str) -> Dict[str, Any]:
        """Get aggregated sentiment for a symbol"""
        articles = await self.get_news(symbol, limit=20)

        positive = sum(1 for a in articles if a["sentiment_score"] > 0.2)
        negative = sum(1 for a in articles if a["sentiment_score"] < -0.2)
        neutral = len(articles) - positive - negative

        avg_score = sum(a["sentiment_score"] for a in articles) / len(articles) if articles else 0

        if avg_score > 0.6:
            overall = SentimentType.VERY_BULLISH
            impact = "Strong positive momentum expected"
        elif avg_score > 0.2:
            overall = SentimentType.BULLISH
            impact = "Positive sentiment, favorable conditions"
        elif avg_score > -0.2:
            overall = SentimentType.NEUTRAL
            impact = "Mixed signals, await clarity"
        elif avg_score > -0.6:
            overall = SentimentType.BEARISH
            impact = "Negative sentiment, caution warranted"
        else:
            overall = SentimentType.VERY_BEARISH
            impact = "Significant bearish pressure"

        # Extract key themes
        all_topics = []
        for article in articles:
            all_topics.extend(article.get("topics", []))
        key_themes = list(set(all_topics))[:5]

        return {
            "symbol": symbol.upper(),
            "overall_sentiment": overall.value,
            "sentiment_score": round(avg_score, 3),
            "positive_count": positive,
            "negative_count": negative,
            "neutral_count": neutral,
            "total_articles": len(articles),
            "avg_published": articles[0]["published_at"] if articles else None,
            "key_themes": key_themes,
            "impact_assessment": impact,
            "generated_at": datetime.utcnow().isoformat()
        }

    async def get_trending(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get trending topics and symbols"""
        trending_symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "AMD", "INTC"]
        trending = []

        for symbol in trending_symbols[:limit]:
            articles = await self.get_news(symbol, limit=5)
            total_articles = len(articles)
            avg_sentiment = sum(a["sentiment_score"] for a in articles) / total_articles if articles else 0

            trending.append({
                "symbol": symbol,
                "article_count": total_articles,
                "avg_sentiment": round(avg_sentiment, 3),
                "trend_direction": "UP" if avg_sentiment > 0.2 else "DOWN" if avg_sentiment < -0.2 else "STABLE",
                "top_topics": list(set(sum([a.get("topics", []) for a in articles], [])))[:3]
            })

        return sorted(trending, key=lambda x: x["article_count"], reverse=True)[:limit]

    async def analyze_text(self, request: AnalysisRequest) -> Dict[str, Any]:
        """Analyze raw text for sentiment, entities, and topics"""
        result = {
            "analyzed_at": datetime.utcnow().isoformat(),
            "input_length": len(request.text),
            "entities": [],
            "topics": [],
            "sentiment": None
        }

        # Simulated sentiment analysis
        if request.include_sentiment:
            # Simulate based on keywords
            positive_words = ["growth", "profit", "surge", "bullish", "upgrade", "strong", "positive"]
            negative_words = ["loss", "decline", "bearish", "downgrade", "weak", "negative", "risk"]

            score = 0
            text_lower = request.text.lower()

            for word in positive_words:
                if word in text_lower:
                    score += 0.15
            for word in negative_words:
                if word in text_lower:
                    score -= 0.15

            score = max(-1, min(1, score + random.uniform(-0.1, 0.1)))

            if score > 0.5:
                sentiment = SentimentType.VERY_BULLISH
            elif score > 0.2:
                sentiment = SentimentType.BULLISH
            elif score > -0.2:
                sentiment = SentimentType.NEUTRAL
            elif score > -0.5:
                sentiment = SentimentType.BEARISH
            else:
                sentiment = SentimentType.VERY_BEARISH

            result["sentiment"] = {
                "type": sentiment.value,
                "score": round(score, 3),
                "confidence": round(random.uniform(0.6, 0.9), 2)
            }

        # Simulated entity extraction
        if request.extract_entities:
            # Look for common patterns
            result["entities"] = [
                {"type": "ORG", "name": "Company", "confidence": 0.85},
                {"type": "PERSON", "name": "Executive", "confidence": 0.75},
                {"type": "MONEY", "name": "$1B", "confidence": 0.90}
            ]

        # Simulated topic extraction
        if request.extract_topics:
            topic_keywords = {
                "Earnings": ["earnings", "revenue", "profit", "quarterly", "results"],
                "M&A": ["acquisition", "merger", "deal", "buy"],
                "Regulatory": ["regulation", "compliance", "sec", "监管"],
                "Innovation": ["ai", "technology", "innovation", "launch"],
                "Markets": ["stock", "market", "trading", "index"]
            }

            text_lower = request.text.lower()
            detected_topics = []
            for topic, keywords in topic_keywords.items():
                if any(kw in text_lower for kw in keywords):
                    detected_topics.append(topic)

            result["topics"] = detected_topics if detected_topics else ["General"]

        return result

    async def search_news(
        self,
        query: str,
        limit: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search news articles"""
        # Simulate search by generating matching articles
        results = []
        for symbol in ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]:
            articles = await self.get_news(symbol, limit=3)
            for article in articles:
                article["search_query"] = query
                results.append(article)

        return results[:limit]


# Initialize service
service = NewsService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "articles_cached": service._article_count
    }


@app.get("/api/v1/news/{symbol}")
async def get_news(
    symbol: str,
    limit: int = Query(20, le=100),
    hours: int = Query(72, le=168)
):
    """Get news articles for a symbol"""
    return await service.get_news(symbol.upper(), limit, hours)


@app.get("/api/v1/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    """Get aggregated sentiment for a symbol"""
    return await service.get_sentiment(symbol.upper())


@app.get("/api/v1/trending")
async def get_trending(limit: int = Query(10, le=50)):
    """Get trending topics and symbols"""
    return await service.get_trending(limit)


@app.post("/api/v1/analyze")
async def analyze_text(request: AnalysisRequest):
    """Analyze raw text for sentiment, entities, and topics"""
    return await service.analyze_text(request)


@app.get("/api/v1/search")
async def search_news(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=100),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Search news articles"""
    return await service.search_news(q, limit, start_date, end_date)


@app.get("/api/v1/sources")
async def get_sources():
    """Get available news sources"""
    return {
        "sources": service._news_sources,
        "count": len(service._news_sources)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5030)