-- AssetMind Database Schema
-- PostgreSQL + TimescaleDB
-- Version: 1.0

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Asset Universe
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    asset_class VARCHAR(20) NOT NULL, -- STOCK, CRYPTO, FOREX, COMMODITY, BOND, ETF, INDEX
    asset_type VARCHAR(30), -- Sub-type
    exchange VARCHAR(50),
    country VARCHAR(10),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, DELISTED
    metadata JSONB DEFAULT '{}',
    twin_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_symbol ON assets(symbol);
CREATE INDEX idx_assets_class ON assets(asset_class);
CREATE INDEX idx_assets_exchange ON assets(exchange);

-- Asset Twins
CREATE TABLE asset_twins (
    asset_id UUID PRIMARY KEY REFERENCES assets(id),
    symbol VARCHAR(20) NOT NULL,

    -- Market Layer
    current_price DECIMAL(18, 6),
    price_change_24h DECIMAL(10, 4),
    price_change_pct_24h DECIMAL(10, 4),
    volume_24h DECIMAL(18, 2),
    market_cap DECIMAL(18, 2),
    market_dominance DECIMAL(6, 4),

    -- Financial Data (JSON for flexibility)
    income_statement JSONB DEFAULT '{}',
    balance_sheet JSONB DEFAULT '{}',
    cash_flow JSONB DEFAULT '{}',
    financial_ratios JSONB DEFAULT '{}',
    financial_score INTEGER DEFAULT 50,
    financial_score_confidence INTEGER DEFAULT 50,
    financial_score_trend VARCHAR(20) DEFAULT 'STABLE',

    -- Sentiment
    sentiment_social DECIMAL(5, 2) DEFAULT 50,
    sentiment_news DECIMAL(5, 2) DEFAULT 50,
    sentiment_institutional DECIMAL(5, 2) DEFAULT 50,
    sentiment_analyst DECIMAL(5, 2) DEFAULT 50,
    sentiment_overall DECIMAL(5, 2) DEFAULT 50,
    sentiment_trend VARCHAR(20) DEFAULT 'STABLE',

    -- Risk
    risk_financial DECIMAL(5, 2) DEFAULT 50,
    risk_market DECIMAL(5, 2) DEFAULT 50,
    risk_operational DECIMAL(5, 2) DEFAULT 50,
    risk_regulatory DECIMAL(5, 2) DEFAULT 50,
    risk_geopolitical DECIMAL(5, 2) DEFAULT 50,
    risk_liquidity DECIMAL(5, 2) DEFAULT 50,
    risk_overall DECIMAL(5, 2) DEFAULT 50,

    -- Prediction
    prediction_bullish DECIMAL(5, 2) DEFAULT 33.33,
    prediction_neutral DECIMAL(5, 2) DEFAULT 33.33,
    prediction_bearish DECIMAL(5, 2) DEFAULT 33.33,
    prediction_confidence INTEGER DEFAULT 50,
    prediction_reasoning JSONB DEFAULT '[]',

    -- Health Scores
    health_market INTEGER DEFAULT 50,
    health_financial INTEGER DEFAULT 50,
    health_sentiment INTEGER DEFAULT 50,
    health_risk INTEGER DEFAULT 50,
    health_institutional INTEGER DEFAULT 50,
    health_technical INTEGER DEFAULT 50,
    health_momentum INTEGER DEFAULT 50,
    health_growth INTEGER DEFAULT 50,
    health_overall INTEGER DEFAULT 50,

    -- Opportunity
    opportunity_score INTEGER DEFAULT 50,
    opportunity_confidence INTEGER DEFAULT 50,

    -- Conviction
    conviction_score INTEGER DEFAULT 50,
    conviction_confidence INTEGER DEFAULT 50,

    -- Institutional
    institutional_score INTEGER DEFAULT 50,
    institutional_confidence INTEGER DEFAULT 50,

    -- Updated timestamp
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    twin_created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_twin_symbol ON asset_twins(symbol);

-- ============================================================================
-- MARKET TWINS
-- ============================================================================

CREATE TABLE market_twins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(20) NOT NULL, -- GLOBAL, US, EU, ASIA, EM, INDIA, CHINA
    regime VARCHAR(30) DEFAULT 'SIDEWAYS', -- BULL, BEAR, HIGH_VOL, LOW_VOL, CRISIS
    global_score INTEGER DEFAULT 50,
    fear_greed_index INTEGER DEFAULT 50,
    volatility_index DECIMAL(8, 4) DEFAULT 20,

    -- Rates
    rate_environment VARCHAR(20) DEFAULT 'HOLDING',
    inflation_environment VARCHAR(20) DEFAULT 'MODERATE',
    gdp_growth VARCHAR(20) DEFAULT 'STABLE',

    -- Scores
    market_score INTEGER DEFAULT 50,
    crypto_score INTEGER DEFAULT 50,

    -- Data
    sector_rankings JSONB DEFAULT '[]',
    rotation_signals JSONB DEFAULT '[]',
    capital_flow_direction VARCHAR(30),

    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(region)
);

-- ============================================================================
-- PORTFOLIO TWINS
-- ============================================================================

CREATE TABLE portfolio_twins (
    portfolio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) DEFAULT 'Main Portfolio',
    cash_balance DECIMAL(18, 4) DEFAULT 0,

    -- Analytics
    total_value DECIMAL(18, 4) DEFAULT 0,
    total_cost DECIMAL(18, 4) DEFAULT 0,
    total_return DECIMAL(18, 4) DEFAULT 0,
    total_return_pct DECIMAL(10, 4) DEFAULT 0,
    day_pnl DECIMAL(18, 4) DEFAULT 0,
    day_pnl_pct DECIMAL(10, 4) DEFAULT 0,

    -- Risk
    portfolio_beta DECIMAL(8, 4) DEFAULT 1.0,
    portfolio_volatility DECIMAL(8, 4) DEFAULT 20,
    sharpe_ratio DECIMAL(8, 4),
    max_drawdown DECIMAL(10, 4),
    var_95 DECIMAL(10, 4),

    -- Exposure
    sector_exposure JSONB DEFAULT '{}',
    asset_class_exposure JSONB DEFAULT '{}',
    geo_exposure JSONB DEFAULT '{}',
    theme_exposure JSONB DEFAULT '{}',

    -- Scores
    diversification_score INTEGER DEFAULT 50,
    risk_score INTEGER DEFAULT 50,
    health_score INTEGER DEFAULT 50,

    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_user ON portfolio_twins(user_id);

-- Portfolio Holdings
CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolio_twins(portfolio_id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id),
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    avg_entry_price DECIMAL(18, 6) NOT NULL,
    current_price DECIMAL(18, 6),
    current_value DECIMAL(18, 4),
    unrealized_pnl DECIMAL(18, 4) DEFAULT 0,
    unrealized_pnl_pct DECIMAL(10, 4) DEFAULT 0,
    weight DECIMAL(6, 4) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_holdings_portfolio ON portfolio_holdings(portfolio_id);

-- ============================================================================
-- INVESTOR TWINS
-- ============================================================================

CREATE TABLE investor_twins (
    twin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,

    -- Profile
    goals JSONB DEFAULT '[]',
    risk_tolerance VARCHAR(20) DEFAULT 'MODERATE',
    investment_horizon VARCHAR(20) DEFAULT 'MEDIUM',
    preferred_sectors JSONB DEFAULT '[]',
    preferred_asset_classes JSONB DEFAULT '[]',
    strategy_type VARCHAR(30) DEFAULT 'GROWTH',

    -- Behavior
    total_trades INTEGER DEFAULT 0,
    avg_holding_period_days DECIMAL(10, 2) DEFAULT 30,
    avg_position_size_pct DECIMAL(6, 2) DEFAULT 10,
    trade_frequency_per_week DECIMAL(6, 2) DEFAULT 2,
    win_rate DECIMAL(5, 2) DEFAULT 50,
    loss_rate DECIMAL(5, 2) DEFAULT 50,
    avg_win_pct DECIMAL(10, 4) DEFAULT 0,
    avg_loss_pct DECIMAL(10, 4) DEFAULT 0,

    -- Mistakes
    revenge_trading_count INTEGER DEFAULT 0,
    overtrading_count INTEGER DEFAULT 0,
    fomo_entries INTEGER DEFAULT 0,
    panic_exits INTEGER DEFAULT 0,
    position_sizing_errors INTEGER DEFAULT 0,

    -- Best/Worst Strategies
    best_strategies JSONB DEFAULT '[]',
    worst_strategies JSONB DEFAULT '[]',

    -- Coaching
    coaching_tips JSONB DEFAULT '[]',
    pre_trade_checks JSONB DEFAULT '[]',
    recent_mistakes JSONB DEFAULT '[]',

    -- Personality Scores
    patience_score INTEGER DEFAULT 50,
    discipline_score INTEGER DEFAULT 50,
    emotional_control_score INTEGER DEFAULT 50,
    conviction_score INTEGER DEFAULT 50,

    -- Learning
    mistakes_improved INTEGER DEFAULT 0,
    coaching_sessions_completed INTEGER DEFAULT 0,

    last_updated TIMESTAMPTZ DEFAULT NOW(),
    twin_created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investor_user ON investor_twins(user_id);

-- ============================================================================
-- PREDICTIONS & INTELLIGENCE
-- ============================================================================

CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id),
    symbol VARCHAR(20) NOT NULL,
    prediction_type VARCHAR(30) NOT NULL, -- DIRECTION, SCORE, EVENT, EARNINGS
    time_horizon VARCHAR(10) NOT NULL, -- 1D, 7D, 30D, 90D, 1Y

    -- Probabilities
    bullish_probability DECIMAL(5, 2),
    neutral_probability DECIMAL(5, 2),
    bearish_probability DECIMAL(5, 2),
    confidence INTEGER DEFAULT 50,

    -- Analysis
    reasoning_chain JSONB DEFAULT '[]',
    supporting_factors JSONB DEFAULT '[]',
    contradicting_factors JSONB DEFAULT '[]',

    -- Model
    model_used VARCHAR(50),
    model_scores JSONB DEFAULT '{}',

    -- Outcome (filled later)
    actual_outcome DECIMAL(10, 4),
    prediction_correct BOOLEAN,
    error DECIMAL(10, 4),

    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_symbol ON predictions(symbol);
CREATE INDEX idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX idx_predictions_asset ON predictions(asset_id);

-- Intelligence Learning Events
CREATE TABLE intelligence_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(30) NOT NULL, -- MAJOR, PATTERN, MODEL_UPDATE
    description TEXT,
    affected_symbols JSONB DEFAULT '[]',
    impact_score INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_type ON intelligence_events(event_type);
CREATE INDEX idx_events_timestamp ON intelligence_events(timestamp DESC);

-- Model Performance
CREATE TABLE model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(50) NOT NULL,
    prediction_type VARCHAR(30),
    accuracy DECIMAL(5, 2) DEFAULT 50,
    avg_confidence DECIMAL(5, 2) DEFAULT 50,
    predictions_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_name, prediction_type)
);

-- ============================================================================
-- NEWS & SENTIMENT
-- ============================================================================

CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    source VARCHAR(100),
    url TEXT,
    published_at TIMESTAMPTZ,
    sentiment_score DECIMAL(5, 2) DEFAULT 0,
    sentiment_label VARCHAR(20) DEFAULT 'NEUTRAL',
    impact_score INTEGER DEFAULT 0,
    relevance_score INTEGER DEFAULT 0,
    categories JSONB DEFAULT '[]',
    asset_symbols JSONB DEFAULT '[]',
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_symbols ON news_articles USING GIN(asset_symbols);
CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_sentiment ON news_articles(sentiment_score);

-- Social Sentiment
CREATE TABLE social_sentiment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    source VARCHAR(30) NOT NULL, -- TWITTER, REDDIT, YOUTUBE
    sentiment_score DECIMAL(5, 2) DEFAULT 50,
    volume INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_symbol ON social_sentiment(symbol);
CREATE INDEX idx_social_timestamp ON social_sentiment(timestamp DESC);

-- ============================================================================
-- WATCHLISTS & ALERTS
-- ============================================================================

CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watchlist_user ON watchlists(user_id);

CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id),
    symbol VARCHAR(20) NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watchlist_items ON watchlist_items(watchlist_id);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    asset_id UUID REFERENCES assets(id),
    symbol VARCHAR(20),
    alert_type VARCHAR(30) NOT NULL, -- PRICE, SENTIMENT, NEWS, SCORE, EVENT
    condition VARCHAR(50) NOT NULL, -- ABOVE, BELOW, CHANGE
    threshold DECIMAL(18, 6),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(is_active);

-- ============================================================================
-- RESEARCH REPORTS
-- ============================================================================

CREATE TABLE research_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    subject VARCHAR(255) NOT NULL,
    report_type VARCHAR(30) NOT NULL, -- COMPANY, SECTOR, THEME, COMPARATIVE

    -- Investment Thesis
    rating VARCHAR(10), -- BUY, HOLD, SELL
    price_target DECIMAL(18, 4),
    current_price DECIMAL(18, 4),
    upside_pct DECIMAL(10, 4),
    time_horizon VARCHAR(20),
    conviction VARCHAR(10), -- HIGH, MEDIUM, LOW

    -- Committee Views
    committee_views JSONB DEFAULT '{}',

    -- Cases
    bull_case JSONB DEFAULT '{}',
    bear_case JSONB DEFAULT '{}',
    base_case JSONB DEFAULT '{}',

    -- Content
    executive_summary TEXT,
    thesis_points JSONB DEFAULT '[]',
    risk_factors JSONB DEFAULT '[]',
    monitoring_points JSONB DEFAULT '[]',

    -- Metadata
    confidence INTEGER DEFAULT 50,
    data_sources JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_subject ON research_reports(subject);
CREATE INDEX idx_reports_type ON research_reports(report_type);
CREATE INDEX idx_reports_created ON research_reports(created_at DESC);

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),

    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'FREE', -- FREE, PRO, TRADER, INSTITUTIONAL
    subscription_expires_at TIMESTAMPTZ,

    -- API
    api_key VARCHAR(100) UNIQUE,
    api_requests_today INTEGER DEFAULT 0,

    -- Stats
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- API Usage Logs
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(100),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_logs_user ON api_logs(user_id);
CREATE INDEX idx_api_logs_timestamp ON api_logs(timestamp DESC);

-- ============================================================================
-- FUNCTION: Update timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_timestamp
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Top Opportunities View
CREATE VIEW v_top_opportunities AS
SELECT
    symbol,
    opportunity_score,
    opportunity_confidence,
    prediction_bullish,
    prediction_confidence,
    current_price,
    risk_overall,
    sentiment_overall,
    last_updated
FROM asset_twins
WHERE opportunity_score > 60
ORDER BY opportunity_score DESC;

-- Top Risks View
CREATE VIEW v_top_risks AS
SELECT
    symbol,
    risk_overall,
    risk_financial,
    risk_market,
    risk_regulatory,
    risk_geopolitical,
    last_updated
FROM asset_twins
WHERE risk_overall > 60
ORDER BY risk_overall DESC;

-- User Portfolio Summary
CREATE VIEW v_portfolio_summary AS
SELECT
    pt.user_id,
    pt.name,
    pt.total_value,
    pt.total_return_pct,
    pt.diversification_score,
    pt.risk_score,
    COUNT(ph.id) as holding_count
FROM portfolio_twins pt
LEFT JOIN portfolio_holdings ph ON pt.portfolio_id = ph.portfolio_id
GROUP BY pt.portfolio_id;
