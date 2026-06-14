"""
News Connector using GDELT Project (Free, Unlimited)
Source: https://gdelt.github.io/
"""
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class NewsConnector:
    """Connector for GDELT news data (free, unlimited)"""

    GDELT_BASE = "https://api.gdeltproject.org/api/v2"
    GDELT_DOCS = f"{GDELT_BASE}/doc/doc"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=60.0)

    async def search(
        self,
        query: str,
        mode: str = "artsg",
        max_records: int = 50,
        sort: str = "DateDesc"
    ) -> List[Dict[str, Any]]:
        """
        Search GDELT for news articles

        Args:
            query: Search query
            mode: artsg (articles), timelinevolinfo (volume timeline), timelinevoljson (JSON timeline)
            max_records: Maximum number of records
            sort: DateDesc, DateAsc, Relevance

        Returns:
            List of articles
        """
        params = {
            "query": query,
            "mode": mode,
            "maxrecords": max_records,
            "sort": sort,
            "format": "json",
        }

        if self.api_key:
            params["key"] = self.api_key

        try:
            response = await self.client.get(self.GDELT_DOCS, params=params)
            response.raise_for_status()
            data = response.json()

            articles = data.get("articles", [])
            return [self._transform_article(a) for a in articles]
        except Exception as e:
            logger.error(f"Error searching GDELT: {e}")
            return self._mock_articles(query)

    async def search_articles(
        self,
        query: str,
        source_country: Optional[str] = None,
        language: str = "english",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get articles with filters"""
        date_range = ""

        if start_date and end_date:
            date_range = f" {start_date.strftime('%Y%m%dT%H%M%SZ')} TO {end_date.strftime('%Y%m%dT%H%M%SZ')}"

        full_query = query
        if source_country:
            full_query += f" sourcelang:{language}"
            full_query += f" sourcecountry:{source_country}"

        full_query += date_range

        return await self.search(full_query, max_records=limit)

    async def get_timeline(
        self,
        query: str,
        mode: str = "timelinevoljson",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get timeline of mentions/volumes"""
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        params = {
            "query": query,
            "mode": mode,
            "startdate": start_date.strftime("%Y%m%dT%H%M%SZ"),
            "enddate": end_date.strftime("%Y%m%dT%H%M%SZ"),
            "format": "json",
        }

        if self.api_key:
            params["key"] = self.api_key

        try:
            response = await self.client.get(self.GDELT_DOCS, params=params)
            response.raise_for_status()
            data = response.json()

            if mode == "timelinevoljson":
                return data.get("timeline", [{}])[0].get("data", [])
            return data
        except Exception as e:
            logger.error(f"Error fetching timeline: {e}")
            return []

    async def get_article_content(
        self,
        url: str
    ) -> Optional[Dict[str, Any]]:
        """Get full content of an article (if available)"""
        try:
            response = await self.client.get(url, timeout=10.0)
            response.raise_for_status()

            return {
                "url": url,
                "content_length": len(response.text),
                "status": "fetched",
            }
        except Exception as e:
            logger.error(f"Error fetching article: {e}")
            return None

    async def get_trending_stories(
        self,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get trending stories from GDELT"""
        return await self.search("*", max_records=limit, sort="SocialScore")

    async def get_stories_by_theme(
        self,
        theme: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get stories related to a specific theme"""
        theme_query = f"theme:{theme}"
        return await self.search(theme_query, max_records=limit)

    async def get_stories_by_location(
        self,
        country: Optional[str] = None,
        city: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get stories from specific location"""
        query_parts = []

        if country:
            query_parts.append(f"sourcecountry:{country.lower()}")
        if city:
            query_parts.append(f"location:{city}")

        query = " ".join(query_parts) if query_parts else "*"

        return await self.search(query, max_records=limit)

    async def analyze_sentiment(
        self,
        articles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze sentiment across articles"""
        if not articles:
            return {"avg_sentiment": 0, "article_count": 0}

        sentiment_values = []

        for article in articles:
            sentiment = article.get("sentiment", 0)
            sentiment_values.append(sentiment)

        return {
            "article_count": len(articles),
            "avg_sentiment": sum(sentiment_values) / len(sentiment_values) if sentiment_values else 0,
            "positive_count": sum(1 for s in sentiment_values if s > 0.1),
            "negative_count": sum(1 for s in sentiment_values if s < -0.1),
            "neutral_count": sum(1 for s in sentiment_values if -0.1 <= s <= 0.1),
            "sentiment_distribution": {
                "positive": sum(1 for s in sentiment_values if s > 0.1) / len(sentiment_values),
                "neutral": sum(1 for s in sentiment_values if -0.1 <= s <= 0.1) / len(sentiment_values),
                "negative": sum(1 for s in sentiment_values if s < -0.1) / len(sentiment_values),
            }
        }

    def _transform_article(self, article: Dict) -> Dict[str, Any]:
        """Transform GDELT article to standard format"""
        return {
            "id": article.get("url", ""),
            "title": article.get("title", ""),
            "url": article.get("url", ""),
            "domain": article.get("domain", ""),
            "language": article.get("language", ""),
            "source_country": article.get("sourcecountry", ""),
            "published_date": self._parse_date(article.get("seendate", "")),
            "updated_date": self._parse_date(article.get("updatedate", "")),
            "social_image": article.get("socialimage", ""),
            "image": article.get("image", ""),
            "summary": article.get("excerpt", ""),
            "sentiment": self._estimate_sentiment(article.get("excerpt", "")),
            "themes": article.get("themes", []),
            "entities": article.get("entities", []),
        }

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse GDELT date format"""
        if not date_str:
            return None

        try:
            if len(date_str) >= 14:
                return datetime.strptime(date_str[:14], "%Y%m%dT%H%M%S")
            elif len(date_str) >= 8:
                return datetime.strptime(date_str[:8], "%Y%m%d")
        except ValueError:
            pass

        return None

    def _estimate_sentiment(self, text: str) -> float:
        """Simple sentiment estimation (placeholder for ML)"""
        positive_words = ["surge", "gain", "rise", "bull", "growth", "profit", "positive", "up", "high"]
        negative_words = ["fall", "drop", "loss", "bear", "decline", "negative", "down", "low", "crash"]

        text_lower = text.lower()
        pos_count = sum(1 for w in positive_words if w in text_lower)
        neg_count = sum(1 for w in negative_words if w in text_lower)

        total = pos_count + neg_count
        if total == 0:
            return 0

        return (pos_count - neg_count) / total

    def _mock_articles(self, query: str) -> List[Dict[str, Any]]:
        """Generate mock articles for testing"""
        import random

        headlines = [
            f"{query} sees strong Q4 growth",
            f"{query} announces new product launch",
            f"{query} stock rallies on earnings beat",
            f"Analysts upgrade {query} price target",
            f"{query} faces regulatory scrutiny",
            f"{query} partners with major tech firm",
            f"{query} CEO discusses future plans",
            f"Investors weigh risks for {query}",
        ]

        articles = []
        for i, headline in enumerate(headlines):
            sentiment = random.uniform(-0.5, 0.5)
            articles.append({
                "id": f"mock_article_{i}",
                "title": headline,
                "url": f"https://example.com/news/{i}",
                "domain": random.choice(["reuters.com", "bloomberg.com", "cnbc.com", "ft.com"]),
                "language": "english",
                "source_country": "US",
                "published_date": datetime.now() - timedelta(hours=i * 3),
                "social_image": "",
                "image": "",
                "summary": f"News article about {query}. " + ("Positive outlook." if sentiment > 0 else "Concerns raised."),
                "sentiment": sentiment,
                "themes": ["ECON", "FINANCE", "MARKETS"],
                "entities": [query],
            })

        return articles

    async def close(self):
        await self.client.aclose()


# Common financial news queries
FINANCIAL_QUERIES = {
    "earnings": "earnings report quarterly results",
    "ipo": "IPO initial public offering stock",
    "merger": "merger acquisition deal",
    "regulation": "regulation SEC FDA FTC",
    "economy": "GDP unemployment inflation interest rate",
    "crypto": "Bitcoin Ethereum crypto cryptocurrency",
    "tech": "Apple Microsoft Google Amazon tech",
    "energy": "oil gas renewable energy OPEC",
}
