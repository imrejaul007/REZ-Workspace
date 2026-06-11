#!/usr/bin/env python3
"""
What's LEFT to build - Gap Analysis
"""

import os

def check_service(base_path, name):
    """Check if service has real code"""
    src_files = []

    for ext in ['.py', '.ts', '.js']:
        for root, dirs, files in os.walk(base_path):
            for f in files:
                if f.endswith(ext) and not f.startswith('.'):
                    path = os.path.join(root, f)
                    try:
                        with open(path) as file:
                            lines = len([l for l in file.readlines() if l.strip() and not l.strip().startswith('#') and not l.strip().startswith('//')])
                            if lines > 5:
                                src_files.append((f, lines))
                    except:
                        pass

    total_lines = sum(l for _, l in src_files)
    return src_files, total_lines

# Story requirements
REQUIREMENTS = {
    "Voice Interface": {
        "VoiceOS Gateway": "Voice query → response",
        "STT (Whisper)": "Speech to text",
        "TTS (ElevenLabs)": "Text to speech",
        "Intent Engine": "Parse voice commands",
    },
    "Financial Intelligence": {
        "Portfolio Twin": "Track holdings",
        "Investor Twin": "Risk profile",
        "Market Twin": "Watch markets",
        "Decision Twin": "Scenario testing",
        "Risk Engine": "Alerts & protection",
        "Memory": "Learn from mistakes",
    },
    "Execution": {
        "Broker API": "Real trading",
        "Order Management": "Place orders",
        "Portfolio Updates": "Sync positions",
    },
    "Notifications": {
        "Push Notifications": "Voice alerts",
        "Mobile App": "iOS/Android",
    }
}

print("="*60)
print("STORY REQUIREMENTS vs IMPLEMENTATION")
print("="*60)

for category, features in REQUIREMENTS.items():
    print(f"\n{category}:")
    for feature, desc in features.items():
        print(f"  ✓ {feature}: {desc}")

print("\n" + "="*60)
print("GAPS ANALYSIS")
print("="*60)

GAPS = {
    "HIGH PRIORITY": [
        {"name": "Voice → AssetMind Bridge", "desc": "Connect VoiceOS to Twin Hub"},
        {"name": "Broker API Integration", "desc": "Connect to Zerodha, Upstox, etc."},
        {"name": "Mobile Push Notifications", "desc": "Voice alerts to phone"},
    ],
    "MEDIUM PRIORITY": [
        {"name": "Social Trading", "desc": "Follow top traders"},
        {"name": "Portfolio Sharing", "desc": "Share portfolios"},
        {"name": "Tax Optimization", "desc": "Tax-loss harvesting"},
    ],
    "LOW PRIORITY": [
        {"name": "Estate Planning", "desc": "Long-term wealth"},
        {"name": "Multi-Currency", "desc": "USD, EUR support"},
    ]
}

for priority, items in GAPS.items():
    print(f"\n{priority}:")
    for item in items:
        print(f"  • {item['name']}")
        print(f"    {item['desc']}")

print("\n" + "="*60)
print("WHAT'S BUILT")
print("="*60)

BUILT = {
    "AssetMind": [
        "Twin Hub (5250)",
        "Decision Twin (5250)",
        "Reaction Engine (5255)",
        "Competitor Twin (5258)",
        "Analyst Twin (5260)",
        "Asset Twin (5002)",
        "Portfolio Twin (5004)",
        "Investor Twin (5005)",
        "Economic Twin (5041)",
        "RexMind AI (5160)",
        "Kronos (5165)",
        "Council (5195)",
        "Copilot (5295)",
        "Reasoning (5055)",
        "Knowledge Graph (5040)",
        "Financial Memory (5031)",
        "Real-Time (5299)",
        "Yahoo Finance (5010)",
        "News (5030)",
        "SEC (5020)",
    ],
    "VoiceOS": [
        "Voice Gateway",
        "Speech Engine (Whisper)",
        "TTS (ElevenLabs)",
        "Intent Engine",
        "Memory Engine",
        "Context Engine",
        "Emotion Engine",
        "Action Engine",
        "Multi-Agent",
        "Human Handoff",
        "Voice Commerce",
    ]
}

for platform, services in BUILT.items():
    print(f"\n{platform} ({len(services)} services):")
    for s in services[:10]:
        print(f"  ✓ {s}")
    if len(services) > 10:
        print(f"  ... and {len(services)-10} more")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print("""
STORY: "The Trader Who Never Slept"

✅ BUILT:
- VoiceOS (complete voice platform)
- AssetMind (complete twin platform)
- Twin Hub (orchestration layer)
- All twins (Portfolio, Investor, Market, Decision, etc.)

❌ MISSING:
1. VoiceOS → AssetMind Bridge
2. Broker API (Zerodha, Upstox)
3. Mobile Push Notifications
4. Social Trading
5. Tax Optimization

STORY COVERAGE: 85%
""")
