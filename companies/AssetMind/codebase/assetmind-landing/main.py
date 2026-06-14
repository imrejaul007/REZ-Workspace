"""
AssetMind Landing - Landing Page Service
FastAPI Main Application
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(title="AssetMind Landing", description="Landing Page Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ============================================================================
# Enums
# ============================================================================


class PricingTier(str, Enum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class FeatureCategory(str, Enum):
    CORE = "core"
    TRADING = "trading"
    ANALYTICS = "analytics"
    TWINS = "twins"


class TestimonialIndustry(str, Enum):
    HEDGE_FUND = "hedge_fund"
    ASSET_MANAGEMENT = "asset_management"
    FAMILY_OFFICE = "family_office"


# ============================================================================
# Pydantic Models
# ============================================================================


class HeroSection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    headline: str
    subheadline: str
    cta_primary: str
    cta_secondary: str


class FeatureItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    description: str
    icon: str
    category: FeatureCategory
    highlight: bool = False


class PricingPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    tier: PricingTier
    name: str
    description: str
    price_monthly: Optional[float] = None
    features: list[str] = []
    highlighted: bool = False
    cta: str


class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    title: str
    company: str
    industry: TestimonialIndustry
    quote: str
    rating: float = Field(default=5.0, ge=0.0, le=5.0)


class LandingPageConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    hero: HeroSection
    features: list[FeatureItem] = []
    pricing_plans: list[PricingPlan] = []
    testimonials: list[Testimonial] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class NewsletterSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    email: str
    first_name: Optional[str] = None
    interest: str = "general"
    subscribed_at: datetime = Field(default_factory=datetime.utcnow)


class DemoRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    email: str
    company: str
    phone: Optional[str] = None
    company_size: str
    use_case: str
    status: str = "pending"
    requested_at: datetime = Field(default_factory=datetime.utcnow)


class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    email: str
    subject: str
    message: str
    status: str = "unread"
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# In-Memory Storage
# ============================================================================

page_configs: dict[str, LandingPageConfig] = {}
subscriptions_db: list[NewsletterSubscription] = []
demo_requests_db: list[DemoRequest] = []
contact_messages_db: list[ContactMessage] = []


# ============================================================================
# Health Check
# ============================================================================


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-landing",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"total_subscriptions": len(subscriptions_db), "total_demo_requests": len(demo_requests_db)},
    }


# ============================================================================
# Page Content Endpoints
# ============================================================================


@app.get("/page", response_model=LandingPageConfig)
async def get_landing_page():
    config_id = "default_en"
    if config_id not in page_configs:
        return get_default_config()
    return page_configs[config_id]


@app.put("/page", response_model=LandingPageConfig)
async def update_landing_page(config: LandingPageConfig):
    config.id = "default_en"
    page_configs["default_en"] = config
    return config


def get_default_config() -> LandingPageConfig:
    return LandingPageConfig(
        id="default_en",
        hero=HeroSection(
            headline="Financial Intelligence, Reimagined",
            subheadline="The Bloomberg-like platform powered by AI twins. Make smarter investment decisions.",
            cta_primary="Start Free Trial",
            cta_secondary="Watch Demo",
        ),
        features=[
            FeatureItem(title="Digital Twins", description="Create digital replicas of assets and portfolios.", icon="twin", category=FeatureCategory.TWINS),
            FeatureItem(title="Real-time Analytics", description="Process millions of data points in real-time.", icon="chart", category=FeatureCategory.ANALYTICS),
            FeatureItem(title="Smart Trading", description="AI-driven recommendations and risk management.", icon="trade", category=FeatureCategory.TRADING),
        ],
        pricing_plans=[
            PricingPlan(tier=PricingTier.STARTER, name="Starter", description="Perfect for individual investors", price_monthly=99, features=["Real-time data", "Basic analytics", "5 portfolios"], cta="Start Trial"),
            PricingPlan(tier=PricingTier.PROFESSIONAL, name="Professional", description="For active traders", price_monthly=299, features=["Everything in Starter", "AI recommendations", "Unlimited portfolios"], highlighted=True, cta="Start Trial"),
            PricingPlan(tier=PricingTier.ENTERPRISE, name="Enterprise", description="For institutions", features=["Everything in Professional", "Custom integrations", "Dedicated support"], cta="Contact Sales"),
        ],
    )


# ============================================================================
# Subscription Endpoints
# ============================================================================


@app.post("/subscribe", response_model=NewsletterSubscription, status_code=201)
async def subscribe_newsletter(subscription: NewsletterSubscription):
    for sub in subscriptions_db:
        if sub.email == subscription.email:
            return sub
    subscriptions_db.append(subscription)
    return subscription


@app.get("/subscribers/count")
async def get_subscriber_count():
    return {"count": len(subscriptions_db)}


# ============================================================================
# Demo Request Endpoints
# ============================================================================


@app.post("/demo", response_model=DemoRequest, status_code=201)
async def request_demo(request: DemoRequest):
    demo_requests_db.append(request)
    return request


@app.get("/demo", response_model=list[DemoRequest])
async def list_demo_requests(status: Optional[str] = Query(None)):
    requests = demo_requests_db.copy()
    if status:
        requests = [r for r in requests if r.status == status]
    return sorted(requests, key=lambda x: x.requested_at, reverse=True)


# ============================================================================
# Contact Endpoints
# ============================================================================


@app.post("/contact", response_model=ContactMessage, status_code=201)
async def submit_contact(message: ContactMessage):
    contact_messages_db.append(message)
    return message


@app.get("/contact", response_model=list[ContactMessage])
async def list_contact_messages(status: Optional[str] = Query(None)):
    messages = contact_messages_db.copy()
    if status:
        messages = [m for m in messages if m.status == status]
    return sorted(messages, key=lambda x: x.created_at, reverse=True)


# ============================================================================
# Static Page Endpoints
# ============================================================================


@app.get("/", response_class=HTMLResponse)
async def home_page():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AssetMind - Financial Intelligence Platform</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: -apple-system, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%); color: #fff; min-height: 100vh; }
            .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
            .hero { text-align: center; padding: 80px 0; }
            .hero h1 { font-size: 3.5rem; margin-bottom: 20px; background: linear-gradient(90deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .hero p { font-size: 1.25rem; color: #94a3b8; max-width: 700px; margin: 0 auto 40px; }
            .cta-button { display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 8px; color: #fff; text-decoration: none; font-weight: 600; }
            .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 60px; }
            .feature-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; }
            .feature-card h3 { margin: 0 0 12px; color: #a855f7; }
            .feature-card p { color: #94a3b8; margin: 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="hero">
                <h1>AssetMind</h1>
                <p>The Bloomberg-like platform powered by AI twins. Make smarter investment decisions with real-time insights, predictive analytics, and intelligent automation.</p>
                <a href="/demo" class="cta-button">Start Free Trial</a>
            </div>
            <div class="features">
                <div class="feature-card"><h3>Digital Twins</h3><p>Create digital replicas of assets, portfolios, and markets for predictive analysis.</p></div>
                <div class="feature-card"><h3>Real-time Analytics</h3><p>Process millions of data points in real-time with our AI-powered engine.</p></div>
                <div class="feature-card"><h3>Smart Trading</h3><p>Execute trades with AI-driven recommendations and risk management.</p></div>
            </div>
        </div>
    </body>
    </html>
    """


@app.get("/pricing", response_class=HTMLResponse)
async def pricing_page():
    return """
    <!DOCTYPE html>
    <html>
    <head><title>Pricing - AssetMind</title>
    <style>body { font-family: -apple-system, sans-serif; margin: 0; padding: 40px; background: #0a0a1a; color: #fff; }
        .container { max-width: 1000px; margin: 0 auto; } h1 { text-align: center; margin-bottom: 40px; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .plan { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; text-align: center; }
        .plan.highlighted { border-color: #6366f1; box-shadow: 0 0 30px rgba(99,102,241,0.3); }
        .price { font-size: 2.5rem; font-weight: bold; margin: 20px 0; }
        .features-list { text-align: left; list-style: none; padding: 0; }
        .features-list li { padding: 8px 0; color: #94a3b8; }
    </style></head>
    <body>
        <div class="container">
            <h1>Choose Your Plan</h1>
            <div class="pricing-grid">
                <div class="plan"><h3>Starter</h3><div class="price">$99<span style="font-size:1rem">/mo</span></div><ul class="features-list"><li>Real-time data</li><li>Basic analytics</li><li>5 portfolios</li></ul></div>
                <div class="plan highlighted"><h3>Professional</h3><div class="price">$299<span style="font-size:1rem">/mo</span></div><ul class="features-list"><li>Everything in Starter</li><li>AI recommendations</li><li>Unlimited portfolios</li><li>API access</li></ul></div>
                <div class="plan"><h3>Enterprise</h3><div class="price">Custom</div><ul class="features-list"><li>Everything in Professional</li><li>Custom integrations</li><li>Dedicated support</li><li>SLA guarantee</li></ul></div>
            </div>
        </div>
    </body>
    </html>
    """


# ============================================================================
# Entry Point
# ============================================================================


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5053)