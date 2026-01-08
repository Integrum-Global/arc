"""
EODHD integration for market data.

Provides:
- Historical OHLCV prices
- Real-time quotes
- Fundamental data
- Dividend and split history
- Bulk exchange data
"""

from arc.integrations.eodhd.client import EODHDClient, RateLimiter

__all__ = ["EODHDClient", "RateLimiter"]
