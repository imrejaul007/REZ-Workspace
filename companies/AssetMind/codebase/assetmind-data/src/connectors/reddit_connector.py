"""
Reddit Connector for Social Sentiment Analysis
Source: Reddit API via PRAW or HTTP
"""
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import asyncio
import re

logger = logging.getLogger(__name__)


class RedditConnector:
    """Connector for Reddit social sentiment data"""

    SUBREDDITS = {
        "stocks": "r/stocks",
        "wallstreetbets": "r/wallstreetbets",
        "investing": "r/investing",
        "cryptocurrency": "r/CryptoCurrency",
        "bitcoin": "r/Bitcoin",
        "ethereum": "r/ethereum",
        "etf": "r/ETF",
        "options": "r/options",
        "finance": "r/finance",
    }

    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.client = httpx.AsyncClient(timeout=30.0)

    async def authenticate(self) -> bool:
        """Authenticate with Reddit API"""
        if not self.client_id or not self.client_secret:
            logger.warning("Reddit credentials not provided")
            return False

        try:
            auth = httpx.BasicAuth(self.client_id, self.client_secret)
            response = await self.client.post(
                "https://www.reddit.com/api/v1/access_token",
                auth=auth,
                data={"grant_type": "client_credentials"},
                headers={"User-Agent": "AssetMind/1.0"}
            )
            response.raise_for_status()
            data = response.json()
            self.access_token = data.get("access_token")
            return True
        except Exception as e:
            logger.error(f"Reddit authentication failed: {e}")
            return False

    async def get_subreddit_posts(
        self,
        subreddit: str,
        sort: str = "hot",
        limit: int = 25,
        timeframe: str = "day"
    ) -> List[Dict[str, Any]]:
        """Get posts from a subreddit"""
        if not self.access_token:
            return self._mock_posts(subreddit)

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": "AssetMind/1.0"
        }

        url = f"https://oauth.reddit.com/r/{subreddit}/{sort}"
        params = {"limit": limit}

        if sort == "top":
            params["t"] = timeframe

        try:
            response = await self.client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

            posts = []
            for child in data.get("data", {}).get("children", []):
                post = child["data"]
                posts.append(self._transform_post(post))

            return posts
        except Exception as e:
            logger.error(f"Error fetching subreddit posts: {e}")
            return self._mock_posts(subreddit)

    async def get_post_comments(
        self,
        subreddit: str,
        post_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get comments for a post"""
        if not self.access_token:
            return self._mock_comments(post_id)

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": "AssetMind/1.0"
        }

        url = f"https://oauth.reddit.com/r/{subreddit}/comments/{post_id}"
        params = {"limit": limit, "depth": 2}

        try:
            response = await self.client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

            comments = []
            for listing in data:
                for child in listing.get("data", {}).get("children", []):
                    comment = child["data"]
                    if comment.get("body") and comment.get("body") != "[deleted]":
                        comments.append(self._transform_comment(comment))

            return comments
        except Exception as e:
            logger.error(f"Error fetching comments: {e}")
            return self._mock_comments(post_id)

    async def search_posts(
        self,
        query: str,
        subreddit: Optional[str] = None,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        """Search for posts matching a query"""
        if not self.access_token:
            return self._mock_search(query)

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": "AssetMind/1.0"
        }

        url = "https://oauth.reddit.com/search"
        params = {"q": query, "limit": limit, "sort": "relevance"}

        if subreddit:
            params["subreddit"] = subreddit

        try:
            response = await self.client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

            posts = []
            for child in data.get("data", {}).get("children", []):
                post = child["data"]
                posts.append(self._transform_post(post))

            return posts
        except Exception as e:
            logger.error(f"Error searching posts: {e}")
            return self._mock_search(query)

    async def get_trending_tickers(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get trending tickers from wallstreetbets"""
        posts = await self.get_subreddit_posts("wallstreetbets", sort="hot", limit=50)

        ticker_counts = {}
        ticker_pattern = r'\b[A-Z]{1,5}\b'

        for post in posts:
            text = f"{post.get('title', '')} {post.get('selftext', '')}"
            tickers = re.findall(ticker_pattern, text)
            for ticker in tickers:
                if ticker not in ["A", "I", "AI", "GO", "CEO", "IPO", "USA", "USD", "ETF", "GDP", "CPI"]:
                    ticker_counts[ticker] = ticker_counts.get(ticker, 0) + 1

        trending = sorted(ticker_counts.items(), key=lambda x: x[1], reverse=True)[:limit]

        return [
            {"ticker": ticker, "mentions": count, "source": "wallstreetbets"}
            for ticker, count in trending
        ]

    async def get_sentiment_metrics(
        self,
        symbols: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """Get sentiment metrics for multiple symbols"""
        results = {}

        for symbol in symbols:
            posts = await self.search_posts(symbol, subreddit="wallstreetbets", limit=25)

            total_score = sum(p.get("score", 0) for p in posts)
            total_comments = sum(p.get("num_comments", 0) for p in posts)
            bullish = sum(1 for p in posts if self._is_bullish(p))
            bearish = sum(1 for p in posts if self._is_bearish(p))

            results[symbol] = {
                "mention_count": len(posts),
                "total_score": total_score,
                "total_comments": total_comments,
                "bullish_count": bullish,
                "bearish_count": bearish,
                "sentiment_score": (bullish - bearish) / max(bullish + bearish, 1) * 100,
            }

            await asyncio.sleep(0.5)  # Rate limiting

        return results

    def _transform_post(self, post: Dict) -> Dict[str, Any]:
        """Transform Reddit post to standard format"""
        return {
            "id": post.get("id"),
            "subreddit": post.get("subreddit"),
            "title": post.get("title"),
            "selftext": post.get("selftext"),
            "author": post.get("author"),
            "created_utc": datetime.fromtimestamp(post.get("created_utc", 0)),
            "score": post.get("score", 0),
            "num_comments": post.get("num_comments", 0),
            "upvote_ratio": post.get("upvote_ratio", 0),
            "url": f"https://reddit.com{post.get('permalink', '')}",
            "flair": post.get("link_flair_text"),
        }

    def _transform_comment(self, comment: Dict) -> Dict[str, Any]:
        """Transform Reddit comment to standard format"""
        return {
            "id": comment.get("id"),
            "author": comment.get("author"),
            "body": comment.get("body"),
            "created_utc": datetime.fromtimestamp(comment.get("created_utc", 0)),
            "score": comment.get("score", 0),
            "parent_id": comment.get("parent_id"),
        }

    def _is_bullish(self, post: Dict) -> bool:
        """Simple heuristic for bullish posts"""
        bullish_words = ["moon", "call", "buy", "long", "bull", "squeeze", "🚀", "💎", "gain"]
        text = f"{post.get('title', '')} {post.get('selftext', '')}".lower()
        return any(word in text for word in bullish_words)

    def _is_bearish(self, post: Dict) -> bool:
        """Simple heuristic for bearish posts"""
        bearish_words = ["put", "short", "sell", "drop", "bear", "crash", "loss", "📉"]
        text = f"{post.get('title', '')} {post.get('selftext', '')}".lower()
        return any(word in text for word in bearish_words)

    def _mock_posts(self, subreddit: str) -> List[Dict[str, Any]]:
        """Generate mock posts for testing"""
        import random

        mock_tickers = ["NVDA", "AAPL", "TSLA", "AMD", "GME", "AMC", "BTC", "ETH"]
        posts = []

        for i in range(10):
            ticker = random.choice(mock_tickers)
            is_bullish = random.choice([True, False])

            posts.append({
                "id": f"mock_{i}",
                "subreddit": subreddit,
                "title": f"{ticker} {'🚀' if is_bullish else '📉'} {'Call' if is_bullish else 'Put'} options DD",
                "selftext": f"Analysis on {ticker}. {'Bullish' if is_bullish else 'Bearish'} outlook for the coming weeks.",
                "author": f"user_{random.randint(1000, 9999)}",
                "created_utc": datetime.now() - timedelta(hours=random.randint(1, 48)),
                "score": random.randint(10, 5000),
                "num_comments": random.randint(5, 500),
                "upvote_ratio": random.uniform(0.7, 0.99),
                "url": f"https://reddit.com/r/{subreddit}/comments/mock_{i}",
                "flair": "DD" if random.random() > 0.5 else "Discussion",
            })

        return posts

    def _mock_comments(self, post_id: str) -> List[Dict[str, Any]]:
        """Generate mock comments"""
        import random

        comments = []
        for i in range(10):
            comments.append({
                "id": f"comment_{i}",
                "author": f"user_{random.randint(1000, 9999)}",
                "body": f"This is comment number {i}. {'Bullish' if i % 2 == 0 else 'Bearish'} sentiment.",
                "created_utc": datetime.now() - timedelta(hours=random.randint(1, 24)),
                "score": random.randint(1, 200),
                "parent_id": post_id,
            })

        return comments

    def _mock_search(self, query: str) -> List[Dict[str, Any]]:
        """Generate mock search results"""
        return [
            {
                "id": f"search_{i}",
                "subreddit": "wallstreetbets",
                "title": f"{query} - Discussion #{i}",
                "selftext": f"Discussion about {query} and its potential impact.",
                "author": f"user_{i}",
                "created_utc": datetime.now() - timedelta(hours=i * 6),
                "score": 100 - i * 10,
                "num_comments": 50 - i * 5,
                "upvote_ratio": 0.85,
                "url": f"https://reddit.com/r/wallstreetbets/comments/search_{i}",
                "flair": "Discussion",
            }
            for i in range(5)
        ]

    async def close(self):
        await self.client.aclose()
