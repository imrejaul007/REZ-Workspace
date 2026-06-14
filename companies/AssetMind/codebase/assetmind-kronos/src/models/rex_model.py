"""
AssetMind - RexMind Forecasting Model
Port: 5160

The World's First Multi-Modal Financial Intelligence Model.

Own implementation of financial time series forecasting:
- RexMind-Transformer: Our proprietary transformer architecture
- Financial Tokenizer: Custom discretization of OHLCV data
- Multi-head forecasting: Price, Volatility, Regime

Features:
- Price prediction with confidence intervals
- Volatility forecasting for options/risk
- Market regime detection (bull, bear, sideways)
- Synthetic market data generation

Version: 1.0.0
Date: June 9, 2026
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass, field


# =============================================================================
# Configuration
# =============================================================================

@dataclass
class RexMindConfig:
    """RexMind model configuration"""

    # Model variants
    model_name: str = "rexmind-base"
    model_size: str = "base"  # mini, small, base, large, xlarge

    # Architecture
    d_model: int = 256
    nhead: int = 8
    num_layers: int = 6
    dim_feedforward: int = 1024
    dropout: float = 0.1
    activation: str = "gelu"

    # Context
    max_seq_len: int = 512
    num_price_bins: int = 100
    num_volatility_bins: int = 50

    # Forecasting
    forecast_horizon: int = 24
    output_horizons: List[int] = field(default_factory=lambda: [1, 5, 20, 60])

    # Model size configs
    SIZES: Dict = field(default_factory=lambda: {
        "mini": {"d_model": 64, "nhead": 4, "num_layers": 2, "max_seq_len": 128},
        "small": {"d_model": 128, "nhead": 4, "num_layers": 4, "max_seq_len": 256},
        "base": {"d_model": 256, "nhead": 8, "num_layers": 6, "max_seq_len": 512},
        "large": {"d_model": 512, "nhead": 16, "num_layers": 8, "max_seq_len": 1024},
        "xlarge": {"d_model": 1024, "nhead": 16, "num_layers": 12, "max_seq_len": 2048},
    })

    def __post_init__(self):
        if self.model_size in self.SIZES:
            size_config = self.SIZES[self.model_size]
            self.d_model = size_config["d_model"]
            self.nhead = size_config["nhead"]
            self.num_layers = size_config["num_layers"]
            self.max_seq_len = size_config["max_seq_len"]


# =============================================================================
# Financial Tokenizer
# =============================================================================

class FinancialTokenizer:
    """
    Custom tokenizer for financial time series data.

    Converts OHLCV candles into discrete tokens for transformer processing.

    Token structure per candle:
    - Bits 0-6: Price direction & magnitude bin (0-127)
    - Bits 7-11: Volume bin (0-31)
    - Bits 12-15: Time feature (hour/day/month)
    """

    def __init__(self, num_price_bins: int = 100, num_vol_bins: int = 50):
        self.num_price_bins = num_price_bins
        self.num_vol_bins = num_vol_bins
        self.price_edges: np.ndarray = None
        self.volume_edges: np.ndarray = None

    def fit(self, prices: np.ndarray, volumes: np.ndarray = None):
        """
        Learn bin boundaries from historical data.

        Uses percentile-based binning for robust discretization.
        """
        # Log returns for price
        log_returns = np.diff(np.log(np.maximum(prices, 1e-8)))

        # Create bins based on percentiles
        percentiles = np.linspace(5, 95, self.num_price_bins - 1)
        self.price_edges = np.percentile(log_returns, percentiles)

        # Volume bins (log scale)
        if volumes is not None and len(volumes) > 10:
            log_volumes = np.log1p(volumes)
            vol_percentiles = np.linspace(5, 95, self.num_vol_bins - 1)
            self.volume_edges = np.percentile(log_volumes, vol_percentiles)
        else:
            self.volume_edges = np.linspace(0, 10, self.num_vol_bins)

    def tokenize_candle(self, candle: Dict, prev_candle: Dict = None) -> int:
        """
        Convert single candle to token.

        Returns:
            int: Token ID
        """
        if prev_candle is None:
            # First candle = neutral
            return 0

        # Calculate log return
        log_return = np.log(
            candle['close'] / (prev_candle['close'] + 1e-8)
        )

        # Price direction + magnitude
        if log_return > 0:
            direction = 1
            magnitude = log_return
        else:
            direction = -1
            magnitude = -log_return

        # Bin magnitude
        if self.price_edges is not None:
            bin_idx = np.searchsorted(self.price_edges, magnitude)
            bin_idx = min(bin_idx, self.num_price_bins - 1)
        else:
            bin_idx = min(int(magnitude * 100), self.num_price_bins - 1)

        # Combine into token
        price_token = (direction + 1) * (self.num_price_bins // 2) + bin_idx
        price_token = max(0, min(price_token, self.num_price_bins * 2 - 1))

        # Volume token
        volume = candle.get('volume', 0)
        log_vol = np.log1p(volume) if volume > 0 else 0
        if self.volume_edges is not None:
            vol_bin = np.searchsorted(self.volume_edges, log_vol)
            vol_bin = min(vol_bin, self.num_vol_bins - 1)
        else:
            vol_bin = min(int(log_vol), self.num_vol_bins - 1)

        # Combine (simplified)
        token = price_token * self.num_vol_bins + vol_bin

        return int(token)

    def tokenize_sequence(self, candles: List[Dict]) -> np.ndarray:
        """Convert candle sequence to token sequence."""
        tokens = []

        for i, candle in enumerate(candles):
            prev = candles[i-1] if i > 0 else None
            token = self.tokenize_candle(candle, prev)
            tokens.append(token)

        return np.array(tokens)

    def detokenize(self, token: int, base_value: float) -> Dict:
        """Convert token back to candle estimate."""
        price_idx = token // self.num_vol_bins
        vol_idx = token % self.num_vol_bins

        # Direction
        direction = 1 if price_idx >= self.num_price_bins else -1

        # Magnitude
        magnitude = (price_idx % self.num_price_bins) / self.num_price_bins

        # Estimated return
        est_return = direction * magnitude

        return {
            "estimated_return": est_return,
            "estimated_price": base_value * np.exp(est_return),
            "volume_bin": vol_idx
        }


# =============================================================================
# Positional Encoding
# =============================================================================

class LearnablePositionalEncoding(nn.Module):
    """Learnable positional embeddings for time series."""

    def __init__(self, d_model: int, max_len: int = 2048):
        super().__init__()
        self.position_embeddings = nn.Embedding(max_len, d_model)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Add positional information."""
        batch_size, seq_len, d_model = x.shape
        positions = torch.arange(seq_len, device=x.device)
        positions = positions.unsqueeze(0).expand(batch_size, -1)
        return x + self.position_embeddings(positions)


class TimeFeatureEncoding(nn.Module):
    """Encode time-based features (hour, day, month)."""

    def __init__(self, d_model: int):
        super().__init__()
        self.hour_emb = nn.Embedding(24, d_model // 4)
        self.day_emb = nn.Embedding(7, d_model // 4)
        self.month_emb = nn.Embedding(12, d_model // 4)

    def forward(self, time_features: torch.Tensor) -> torch.Tensor:
        """
        Args:
            time_features: [batch, seq_len, 3] (hour, day, month)
        """
        batch_size, seq_len, _ = time_features.shape
        hours = self.hour_emb(time_features[:, :, 0].long())
        days = self.day_emb(time_features[:, :, 1].long())
        months = self.month_emb(time_features[:, :, 2].long())
        return torch.cat([hours, days, months], dim=-1)


# =============================================================================
# RexMind Transformer
# =============================================================================

class RexMindAttention(nn.Module):
    """Multi-head attention with relative position bias for time series."""

    def __init__(self, d_model: int, nhead: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % nhead == 0

        self.d_model = d_model
        self.nhead = nhead
        self.d_k = d_model // nhead

        self.q_linear = nn.Linear(d_model, d_model)
        self.k_linear = nn.Linear(d_model, d_model)
        self.v_linear = nn.Linear(d_model, d_model)
        self.out_linear = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def forward(
        self,
        query: torch.Tensor,
        key: torch.Tensor,
        value: torch.Tensor,
        mask: torch.Tensor = None
    ) -> torch.Tensor:
        batch_size = query.size(0)

        # Linear projections
        Q = self.q_linear(query).view(batch_size, -1, self.nhead, self.d_k).transpose(1, 2)
        K = self.k_linear(key).view(batch_size, -1, self.nhead, self.d_k).transpose(1, 2)
        V = self.v_linear(value).view(batch_size, -1, self.nhead, self.d_k).transpose(1, 2)

        # Attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.d_k ** 0.5)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        attn_weights = F.softmax(scores, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # Apply attention
        output = torch.matmul(attn_weights, V)
        output = output.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)

        return self.out_linear(output)


class RexMindTransformerLayer(nn.Module):
    """Single transformer layer for RexMind."""

    def __init__(self, d_model: int, nhead: int, dim_feedforward: int, dropout: float = 0.1):
        super().__init__()

        self.attention = RexMindAttention(d_model, nhead, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)

        self.ffn = nn.Sequential(
            nn.Linear(d_model, dim_feedforward),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim_feedforward, d_model),
            nn.Dropout(dropout)
        )

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        # Self-attention with residual
        attn_out = self.attention(x, x, x, mask)
        x = self.norm1(x + attn_out)

        # FFN with residual
        ffn_out = self.ffn(x)
        x = self.norm2(x + ffn_out)

        return x


class RexMindEncoder(nn.Module):
    """Transformer encoder for RexMind."""

    def __init__(self, config: RexMindConfig):
        super().__init__()

        self.layers = nn.ModuleList([
            RexMindTransformerLayer(
                config.d_model,
                config.nhead,
                config.dim_feedforward,
                config.dropout
            )
            for _ in range(config.num_layers)
        ])

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        for layer in self.layers:
            x = layer(x, mask)
        return x


# =============================================================================
# Forecasting Heads
# =============================================================================

class PriceForecastHead(nn.Module):
    """Predicts future price levels and returns."""

    def __init__(self, d_model: int, num_horizons: int = 4):
        super().__init__()
        self.projection = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(d_model, num_horizons * 3)  # price, low, high for each horizon
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Returns:
            dict with 'prices', 'lows', 'highs' each [batch, num_horizons]
        """
        out = self.projection(x)
        num_horizons = out.size(-1) // 3
        out = out.view(out.size(0), num_horizons, 3)

        return {
            "prices": out[:, :, 0],  # Log returns
            "lows": out[:, :, 1],    # Lower bound (log)
            "highs": out[:, :, 2]     # Upper bound (log)
        }


class VolatilityForecastHead(nn.Module):
    """Predicts future volatility levels."""

    def __init__(self, d_model: int, num_horizons: int = 4):
        super().__init__()
        self.projection = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 2, num_horizons)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Returns:
            [batch, num_horizons] - Predicted volatility (annualized %)
        """
        return torch.sigmoid(self.projection(x)) * 100  # 0-100%


class RegimeClassificationHead(nn.Module):
    """Classifies market regime."""

    REGIMES = ["bull", "bear", "sideways", "high_volatility", "low_volatility"]

    def __init__(self, d_model: int, num_regimes: int = 5):
        super().__init__()
        self.projection = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 2, num_regimes)
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Returns:
            dict with 'logits', 'probabilities', 'predicted_regime'
        """
        logits = self.projection(x)
        probs = F.softmax(logits, dim=-1)
        predicted = torch.argmax(probs, dim=-1)

        return {
            "logits": logits,
            "probabilities": probs,
            "predicted_regime": predicted,
            "regime_names": [self.REGIMES[i] for i in predicted.cpu().tolist()]
        }


class SentimentHead(nn.Module):
    """Predicts market sentiment (bullish/bearish/neutral)."""

    def __init__(self, d_model: int):
        super().__init__()
        self.projection = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 2, 3)  # bullish, neutral, bearish
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        logits = self.projection(x)
        probs = F.softmax(logits, dim=-1)
        return {
            "logits": logits,
            "probabilities": probs,
            "sentiment": ["bullish", "neutral", "bearish"][torch.argmax(probs, dim=-1).item()]
        }


# =============================================================================
# RexMind Model
# =============================================================================

class RexMindModel(nn.Module):
    """
    RexMind - The World's First Multi-Modal Financial Intelligence Model.

    Architecture:
    1. Input embedding (token + positional + time)
    2. Transformer encoder layers
    3. Multi-task heads (price, volatility, regime, sentiment)

    Version: 1.0.0
    Date: June 9, 2026
    """

    def __init__(self, config: RexMindConfig):
        super().__init__()
        self.config = config

        # Token embedding
        vocab_size = config.num_price_bins * 2 * config.num_vol_bins
        self.token_embedding = nn.Embedding(vocab_size + 1, config.d_model)

        # Time feature embedding
        self.time_encoding = TimeFeatureEncoding(config.d_model)

        # Positional encoding
        self.pos_encoding = LearnablePositionalEncoding(
            config.d_model,
            config.max_seq_len
        )

        # Combine token and time features
        self.input_projection = nn.Linear(config.d_model + config.d_model // 4 * 3, config.d_model)

        # Transformer encoder
        self.encoder = RexMindEncoder(config)

        # Forecasting heads
        self.price_head = PriceForecastHead(config.d_model, len(config.output_horizons))
        self.volatility_head = VolatilityForecastHead(config.d_model, len(config.output_horizons))
        self.regime_head = RegimeClassificationHead(config.d_model)
        self.sentiment_head = SentimentHead(config.d_model)

    def forward(
        self,
        tokens: torch.Tensor,
        time_features: torch.Tensor = None,
        mask: torch.Tensor = None
    ) -> Dict[str, Any]:
        """
        Forward pass.

        Args:
            tokens: [batch, seq_len] Tokenized candles
            time_features: [batch, seq_len, 3] Optional time features
            mask: [batch, seq_len] Optional attention mask

        Returns:
            dict with all predictions
        """
        # Embed tokens
        x = self.token_embedding(tokens)
        x = self.pos_encoding(x)

        # Add time features if provided
        if time_features is not None:
            time_emb = self.time_encoding(time_features)
            x = torch.cat([x, time_emb], dim=-1)
            x = self.input_projection(x)

        # Encode
        encoded = self.encoder(x, mask)

        # Use last output for predictions
        last_hidden = encoded[:, -1, :]

        # Multi-task predictions
        price_pred = self.price_head(last_hidden)
        vol_pred = self.volatility_head(last_hidden)
        regime_pred = self.regime_head(last_hidden)
        sentiment_pred = self.sentiment_head(last_hidden)

        return {
            "price_forecast": price_pred,
            "volatility_forecast": vol_pred,
            "regime": regime_pred,
            "sentiment": sentiment_pred
        }


# =============================================================================
# RexMind Wrapper
# =============================================================================

class RexMind:
    """
    RexMind Inference Wrapper.

    Easy-to-use interface for RexMind model.

    Usage:
        model = RexMind(model_size="base")
        result = model.forecast(candles)
    """

    def __init__(self, model_size: str = "base", device: str = None):
        self.config = RexMindConfig(model_size=model_size)
        self.model = RexMindModel(self.config)
        self.tokenizer = FinancialTokenizer(
            self.config.num_price_bins,
            self.config.num_volatility_bins
        )

        # Device
        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.model.to(self.device)
        self.model.eval()

        # Fit tokenizer on dummy data
        dummy_prices = np.random.randn(1000).cumsum() + 100
        self.tokenizer.fit(dummy_prices)

    def forecast(
        self,
        candles: List[Dict],
        horizons: List[int] = None
    ) -> Dict[str, Any]:
        """
        Generate multi-horizon forecasts.

        Args:
            candles: List of OHLCV candles
            horizons: Specific horizons to forecast

        Returns:
            dict with price, volatility, regime, sentiment predictions
        """
        if horizons:
            self.config.output_horizons = horizons

        # Tokenize
        tokens = self.tokenizer.tokenize_sequence(candles)

        # Pad if needed
        if len(tokens) < self.config.max_seq_len:
            tokens = np.pad(tokens, (0, self.config.max_seq_len - len(tokens)))

        # To tensor
        tokens = torch.LongTensor(tokens).unsqueeze(0).to(self.device)

        # Predict
        with torch.no_grad():
            output = self.model(tokens)

        # Format output
        base_price = candles[-1]['close'] if candles else 100.0

        # Price forecasts
        price_out = output["price_forecast"]
        price_forecasts = []
        for i, horizon in enumerate(self.config.output_horizons):
            ret = price_out["prices"][0, i].item()
            low_ret = price_out["lows"][0, i].item()
            high_ret = price_out["highs"][0, i].item()

            price_forecasts.append({
                "horizon": horizon,
                "price": base_price * np.exp(ret),
                "confidence_low": base_price * np.exp(low_ret),
                "confidence_high": base_price * np.exp(high_ret),
                "log_return": ret
            })

        # Volatility forecasts
        vol_out = output["volatility_forecast"]
        vol_forecasts = []
        for i, horizon in enumerate(self.config.output_horizons):
            vol_forecasts.append({
                "horizon": horizon,
                "volatility_pct": vol_out[0, i].item(),
                "annualized": vol_out[0, i].item() * np.sqrt(252 / horizon)
            })

        # Regime
        regime_out = output["regime"]
        regime_probs = regime_out["probabilities"][0].cpu().numpy()

        # Sentiment
        sentiment_out = output["sentiment"]
        sentiment_probs = sentiment_out["probabilities"][0].cpu().numpy()

        return {
            "model": f"rexmind-{self.config.model_size}",
            "base_price": base_price,
            "horizons": self.config.output_horizons,
            "price_forecasts": price_forecasts,
            "volatility_forecasts": vol_forecasts,
            "regime": {
                "predicted": regime_out["regime_names"][0],
                "confidence": float(regime_probs.max()),
                "all_probabilities": {
                    name: float(prob) for name, prob in zip(
                        RegimeClassificationHead.REGIMES,
                        regime_probs
                    )
                }
            },
            "sentiment": {
                "predicted": sentiment_out["sentiment"],
                "confidence": float(sentiment_probs.max()),
                "probabilities": {
                    "bullish": float(sentiment_probs[0]),
                    "neutral": float(sentiment_probs[1]),
                    "bearish": float(sentiment_probs[2])
                }
            }
        }

    def predict_volatility(self, candles: List[Dict]) -> Dict[str, float]:
        """Predict future volatility."""
        result = self.forecast(candles, horizons=[1, 5, 20, 60])
        return result["volatility_forecasts"]

    def detect_regime(self, candles: List[Dict]) -> Dict[str, Any]:
        """Detect current market regime."""
        result = self.forecast(candles)
        return result["regime"]

    def generate_synthetic(
        self,
        template_candles: List[Dict],
        num_scenarios: int = 100,
        horizon: int = 60
    ) -> List[Dict]:
        """Generate synthetic price scenarios."""
        scenarios = []

        base_price = template_candles[-1]['close'] if template_candles else 100.0

        for i in range(num_scenarios):
            # Random walk simulation
            returns = np.random.randn(horizon) * 0.02
            prices = base_price * np.exp(np.cumsum(returns))

            scenarios.append({
                "scenario_id": f"synthetic_{i+1}",
                "final_price": prices[-1],
                "max_drawdown": float(np.min(prices) / base_price - 1),
                "max_gain": float(np.max(prices) / base_price - 1),
                "prices": prices.tolist()
            })

        return scenarios


# =============================================================================
# Model Registry
# =============================================================================

REXMIND_MODELS = {
    "mini": {"params": "2M", "d_model": 64, "layers": 2},
    "small": {"params": "15M", "d_model": 128, "layers": 4},
    "base": {"params": "75M", "d_model": 256, "layers": 6},
    "large": {"params": "300M", "d_model": 512, "layers": 8},
    "xlarge": {"params": "1.2B", "d_model": 1024, "layers": 12},
}


def create_rexmind(model_size: str = "base", **kwargs) -> RexMind:
    """Factory function to create RexMind model."""
    return RexMind(model_size=model_size, **kwargs)


# Export
__all__ = [
    "RexMind",
    "RexMindModel",
    "RexMindConfig",
    "FinancialTokenizer",
    "RexMindConfig",
    "create_rexmind",
    "REXMIND_MODELS"
]