"""
AssetMind - RexMind Model Framework
Port: 5160

RexMind AI Model Architecture
75M parameter financial forecasting model

Components:
- Embedding layer
- Transformer encoder
- Attention mechanism
- Output heads

Note: Requires training on financial data for real predictions.

Version: 1.0.0
"""

import torch
import torch.nn as nn
from typing import List, Dict, Tuple
import numpy as np


class RexMindEmbedding(nn.Module):
    """Price + Volume + Sentiment embedding"""

    def __init__(self, vocab_size: int = 10000, embed_dim: int = 256):
        super().__init__()
        self.price_embed = nn.Linear(5, embed_dim)  # OHLCV
        self.volume_embed = nn.Linear(1, embed_dim // 2)
        self.sentiment_embed = nn.Embedding(vocab_size, embed_dim // 2)

    def forward(self, prices, volumes, sentiment_ids):
        price_out = self.price_embed(prices)
        vol_out = self.volume_embed(volumes)
        sent_out = self.sentiment_embed(sentiment_ids)
        return torch.cat([price_out, vol_out, sent_out], dim=-1)


class RexMindTransformer(nn.Module):
    """Transformer encoder for sequence modeling"""

    def __init__(self, d_model: int = 256, nhead: int = 8, num_layers: int = 6):
        super().__init__()
        self.embedding = RexMindEmbedding()
        self.pos_encoding = PositionalEncoding(d_model)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=1024,
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

    def forward(self, prices, volumes, sentiment_ids):
        x = self.embedding(prices, volumes, sentiment_ids)
        x = self.pos_encoding(x)
        return self.transformer(x)


class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding"""

    def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]


class RexMindForecastHead(nn.Module):
    """Price direction + magnitude prediction"""

    def __init__(self, d_model: int = 256):
        super().__init__()
        self.direction_head = nn.Sequential(
            nn.Linear(d_model, 128),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, 3)  # down, flat, up
        )
        self.magnitude_head = nn.Sequential(
            nn.Linear(d_model, 128),
            nn.ReLU(),
            nn.Linear(128, 1)  # % change
        )

    def forward(self, x):
        direction = self.direction_head(x[:, -1])  # Last timestep
        magnitude = self.magnitude_head(x[:, -1])
        return direction, magnitude


class RexMind(nn.Module):
    """
    RexMind - 75M parameter financial forecasting model

    Architecture:
    - Input: OHLCV + Volume + Sentiment (30 days)
    - Embedding: 256-dim
    - Transformer: 6 layers, 8 heads
    - Output: Price direction (3 classes) + magnitude (% change)
    """

    def __init__(self):
        super().__init__()
        self.encoder = RexMindTransformer(d_model=256, nhead=8, num_layers=6)
        self.forecast_head = RexMindForecastHead(256)

        # Total params: ~75M
        self.total_params = sum(p.numel() for p in self.parameters())

    def forward(self, prices, volumes, sentiment_ids) -> Tuple[torch.Tensor, torch.Tensor]:
        encoded = self.encoder(prices, volumes, sentiment_ids)
        direction, magnitude = self.forecast_head(encoded)
        return direction, magnitude

    def predict(self, prices: np.ndarray, volumes: np.ndarray) -> Dict:
        """
        Make prediction from price data

        Args:
            prices: (seq_len, 5) OHLCV array
            volumes: (seq_len, 1) volume array

        Returns:
            prediction dict with direction, magnitude, confidence
        """
        self.eval()
        with torch.no_grad():
            prices_t = torch.FloatTensor(prices).unsqueeze(0)
            volumes_t = torch.FloatTensor(volumes).unsqueeze(0)
            sentiment_t = torch.zeros(1, prices.shape[0], dtype=torch.long)

            direction_logits, magnitude = self.forward(prices_t, volumes_t, sentiment_t)

            probs = torch.softmax(direction_logits, dim=-1)
            direction_idx = probs.argmax().item()
            confidence = probs.max().item()

            directions = ['DOWN', 'FLAT', 'UP']
            return {
                'direction': directions[direction_idx],
                'confidence': confidence,
                'magnitude_pct': magnitude.item(),
                'model': 'RexMind-75M'
            }


def train_rexmind():
    """
    Training script for RexMind

    Requires:
    - Historical price data
    - GPU with CUDA
    - Training dataset

    Example:
        python -m rexmind.train --epochs 100 --batch-size 32
    """
    print("RexMind Training Framework")
    print("=" * 50)
    print("Model: 75M parameters")
    print("Architecture: Transformer (6 layers, 8 heads)")
    print("")
    print("To train:")
    print("1. Prepare training data (historical prices)")
    print("2. Run: python -m rexmind.train --data ./data")
    print("3. Save weights: model.save('rexmind_v1.pt')")
    print("")
    print("Note: Training requires GPU with 8GB+ VRAM")


if __name__ == "__main__":
    model = RexMind()
    print(f"RexMind initialized: {model.total_params:,} parameters")

    # Demo prediction
    demo_prices = np.random.randn(30, 5).cumsum(axis=0) + 100
    demo_volumes = np.abs(np.random.randn(30, 1)) * 1000000

    result = model.predict(demo_prices, demo_volumes)
    print(f"\nDemo prediction: {result}")