-- AssetMind TimescaleDB Schema
-- Time-series data for prices, scores, sentiment

-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================================
-- PRICE HISTORY (Time-series)
-- ============================================================================

CREATE TABLE price_history (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    open DECIMAL(18, 6),
    high DECIMAL(18, 6),
    low DECIMAL(18, 6),
    close DECIMAL(18, 6),
    volume DECIMAL(18, 2),
    market_cap DECIMAL(18, 2),
    PRIMARY KEY (time, symbol)
);

-- Convert to hypertable
SELECT create_hypertable('price_history', 'time',
    chunk_time_interval => INTERVAL '1 day');

-- Indexes
CREATE INDEX idx_price_symbol ON price_history(symbol);
CREATE INDEX idx_price_close ON price_history(symbol, close DESC);

-- Continuous aggregates
CREATE MATERIALIZED VIEW price_stats_1h
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('1 hour', time) AS bucket,
    AVG(close) as avg_close,
    MIN(low) as min_low,
    MAX(high) as max_high,
    SUM(volume) as total_volume,
    COUNT(*) as candle_count
FROM price_history
GROUP BY symbol, time_bucket('1 hour', time);

CREATE MATERIALIZED VIEW price_stats_1d
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('1 day', time) AS bucket,
    AVG(close) as avg_close,
    OPEN as open_price,
    MAX(high) as high_price,
    MIN(low) as low_price,
    LAST(close, time) as close_price,
    SUM(volume) as total_volume
FROM price_history
GROUP BY symbol, time_bucket('1 day', time), open;

-- ============================================================================
-- SCORE HISTORY (Time-series)
-- ============================================================================

CREATE TABLE score_history (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    score_type VARCHAR(30) NOT NULL, -- opportunity, risk, sentiment, conviction, etc.
    value INTEGER NOT NULL,
    confidence INTEGER,
    trend VARCHAR(20),
    PRIMARY KEY (time, symbol, score_type)
);

SELECT create_hypertable('score_history', 'time',
    chunk_time_interval => INTERVAL '1 hour');

CREATE INDEX idx_score_symbol ON score_history(symbol);
CREATE INDEX idx_score_type ON score_history(score_type);

-- Continuous aggregates
CREATE MATERIALIZED VIEW score_avg_1d
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    score_type,
    time_bucket('1 day', time) AS bucket,
    AVG(value) as avg_value,
    AVG(confidence) as avg_confidence,
    COUNT(*) as sample_count
FROM score_history
GROUP BY symbol, score_type, time_bucket('1 day', time);

CREATE MATERIALIZED VIEW score_avg_7d
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    score_type,
    time_bucket('7 days', time) AS bucket,
    AVG(value) as avg_value,
    AVG(confidence) as avg_confidence,
    MIN(value) as min_value,
    MAX(value) as max_value
FROM score_history
GROUP BY symbol, score_type, time_bucket('7 days', time);

CREATE MATERIALIZED VIEW score_avg_30d
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    score_type,
    time_bucket('30 days', time) AS bucket,
    AVG(value) as avg_value,
    AVG(confidence) as avg_confidence
FROM score_history
GROUP BY symbol, score_type, time_bucket('30 days', time);

-- ============================================================================
-- SENTIMENT HISTORY (Time-series)
-- ============================================================================

CREATE TABLE sentiment_history (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    source VARCHAR(30) NOT NULL, -- social, news, institutional, analyst
    sentiment_value DECIMAL(5, 2) NOT NULL, -- -100 to 100
    volume INTEGER DEFAULT 0,
    PRIMARY KEY (time, symbol, source)
);

SELECT create_hypertable('sentiment_history', 'time',
    chunk_time_interval => INTERVAL '1 hour');

CREATE INDEX idx_sentiment_symbol ON sentiment_history(symbol);
CREATE INDEX idx_sentiment_source ON sentiment_history(source);

-- Continuous aggregates
CREATE MATERIALIZED VIEW sentiment_agg_1d
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    source,
    time_bucket('1 day', time) AS bucket,
    AVG(sentiment_value) as avg_sentiment,
    MIN(sentiment_value) as min_sentiment,
    MAX(sentiment_value) as max_sentiment,
    SUM(volume) as total_volume
FROM sentiment_history
GROUP BY symbol, source, time_bucket('1 day', time);

-- ============================================================================
-- PREDICTION HISTORY (Time-series)
-- ============================================================================

CREATE TABLE prediction_history (
    time TIMESTAMPTZ NOT NULL,
    prediction_id UUID NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    prediction_type VARCHAR(30) NOT NULL,
    time_horizon VARCHAR(10) NOT NULL,
    bullish_probability DECIMAL(5, 2),
    neutral_probability DECIMAL(5, 2),
    bearish_probability DECIMAL(5, 2),
    confidence INTEGER,
    model_used VARCHAR(50),
    PRIMARY KEY (time, prediction_id)
);

SELECT create_hypertable('prediction_history', 'time',
    chunk_time_interval => INTERVAL '1 hour');

CREATE INDEX idx_pred_symbol ON prediction_history(symbol);
CREATE INDEX idx_pred_type ON prediction_history(prediction_type);

-- ============================================================================
-- MARKET METRICS (Time-series)
-- ============================================================================

CREATE TABLE market_metrics (
    time TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    value DECIMAL(18, 6) NOT NULL,
    region VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (time, metric_name, region)
);

SELECT create_hypertable('market_metrics', 'time',
    chunk_time_interval => INTERVAL '1 hour');

CREATE INDEX idx_market_metric ON market_metrics(metric_name);

-- Common market metrics
-- vix, fear_greed_index, market_cap_total, volume_total, etc.

-- ============================================================================
-- USER ACTIVITY (Time-series)
-- ============================================================================

CREATE TABLE user_activity (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- login, query, prediction_view, report_generated
    event_data JSONB DEFAULT '{}',
    session_id UUID,
    PRIMARY KEY (time, user_id, event_type)
);

SELECT create_hypertable('user_activity', 'time',
    chunk_time_interval => INTERVAL '1 hour');

CREATE INDEX idx_activity_user ON user_activity(user_id);
CREATE INDEX idx_activity_event ON user_activity(event_type);

-- Aggregates for analytics
CREATE MATERIALIZED VIEW user_daily_stats
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('1 day', time) AS bucket,
    COUNT(*) as event_count,
    COUNT(DISTINCT event_type) as distinct_events,
    COUNT(DISTINCT session_id) as sessions
FROM user_activity
GROUP BY user_id, time_bucket('1 day', time);

-- ============================================================================
-- API USAGE (Time-series)
-- ============================================================================

CREATE TABLE api_usage (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),
    PRIMARY KEY (time, user_id, endpoint)
);

SELECT create_hypertable('api_usage', 'time',
    chunk_time_interval => INTERVAL '1 hour');

CREATE INDEX idx_api_user ON api_usage(user_id);
CREATE INDEX idx_api_endpoint ON api_usage(endpoint);

-- Aggregate by user and day
CREATE MATERIALIZED VIEW api_user_daily
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('1 day', time) AS bucket,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_ms,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost
FROM api_usage
GROUP BY user_id, time_bucket('1 day', time);

-- ============================================================================
-- REFRESH POLICIES
-- ============================================================================

-- Refresh continuous aggregates on schedule
SELECT add_continuous_aggregate_policy('price_stats_1h',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('price_stats_1d',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('score_avg_1d',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Retention policies
SELECT add_retention_policy('price_history',
    schedule_interval => INTERVAL '1 day',
    droptime => INTERVAL '2 years');

SELECT add_retention_policy('score_history',
    schedule_interval => INTERVAL '1 day',
    droptime => INTERVAL '1 year');

SELECT add_retention_policy('sentiment_history',
    schedule_interval => INTERVAL '1 day',
    droptime => INTERVAL '1 year');
