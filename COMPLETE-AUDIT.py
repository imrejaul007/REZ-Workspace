#!/usr/bin/env python3
"""
COMPLETE Voice + AssetMind Audit
"""

import os
import json

def audit_directory(base_path, name):
    """Audit a directory for missing files"""
    results = {
        'total': 0,
        'with_readme': 0,
        'with_req': 0,
        'missing': []
    }

    for item in os.listdir(base_path):
        item_path = os.path.join(base_path, item)
        if not os.path.isdir(item_path):
            continue
        if item.startswith('.') or item.startswith('__'):
            continue

        results['total'] += 1

        has_readme = os.path.exists(os.path.join(item_path, 'README.md'))
        has_req = os.path.exists(os.path.join(item_path, 'requirements.txt'))
        has_pkg = os.path.exists(os.path.join(item_path, 'package.json'))

        if has_readme:
            results['with_readme'] += 1
        if has_req or has_pkg:
            results['with_req'] += 1

        if not has_readme or (not has_req and not has_pkg):
            results['missing'].append({
                'name': item,
                'readme': has_readme,
                'req': has_req or has_pkg
            })

    return results

# Audit Voice Services
print("=" * 60)
print("VOICE SERVICES AUDIT")
print("=" * 60)

voice_paths = [
    ("/Users/rejaulkarim/Documents/ReZ Full App/hojai-voice-os", "HOJAI VoiceOS"),
    ("/Users/rejaulkarim/Documents/ReZ Full App/hojai-voice-commerce", "Voice Commerce"),
    ("/Users/rejaulkarim/Documents/ReZ Full App/voice-service", "Voice Service"),
    ("/Users/rejaulkarim/Documents/ReZ Full App/voice-training", "Voice Training"),
    ("/Users/rejaulkarim/Documents/ReZ Full App/HOJAI-VOICE-PLATFORM", "Voice Platform"),
    ("/Users/rejaulkarim/Documents/ReZ Full App/Razo/razo-voice", "Razo Voice"),
]

total_voice = {'total': 0, 'readme': 0, 'req': 0}

for path, name in voice_paths:
    if os.path.exists(path):
        r = audit_directory(path, name)
        print(f"\n{name}:")
        print(f"  Services: {r['total']}")
        print(f"  README: {r['with_readme']}")
        print(f"  Requirements: {r['with_req']}")
        if r['missing']:
            print(f"  Missing: {len(r['missing'])}")
            for m in r['missing'][:3]:
                print(f"    - {m['name']}")
        total_voice['total'] += r['total']
        total_voice['readme'] += r['with_readme']
        total_voice['req'] += r['with_req']

# Audit HOJAI Industry AI
print("\n" + "=" * 60)
print("HOJAI AI - Industry AI AUDIT")
print("=" * 60)

hojai_path = "/Users/rejaulkarim/Documents/ReZ Full App/hojai-ai/industry-ai"
hojai_results = audit_directory(hojai_path, "HOJAI")

print(f"Total industry AI services: {hojai_results['total']}")
print(f"With README: {hojai_results['with_readme']}")
print(f"With requirements: {hojai_results['with_req']}")
if hojai_results['missing']:
    print(f"Missing: {len(hojai_results['missing'])}")

# Audit AssetMind
print("\n" + "=" * 60)
print("ASSETMIND AUDIT")
print("=" * 60)

assetmind_path = "/Users/rejaulkarim/Documents/ReZ Full App/AssetMind/codebase"
assetmind_results = audit_directory(assetmind_path, "AssetMind")

print(f"Total services: {assetmind_results['total']}")
print(f"With README: {assetmind_results['with_readme']}")
print(f"With requirements: {assetmind_results['with_req']}")
if assetmind_results['missing']:
    print(f"Missing: {len(assetmind_results['missing'])}")
    for m in assetmind_results['missing'][:5]:
        print(f"  - {m['name']}")

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"Voice Services: {total_voice['total']}")
print(f"HOJAI Industry AI: {hojai_results['total']}")
print(f"AssetMind: {assetmind_results['total']}")
print(f"\nTotal: {total_voice['total'] + hojai_results['total'] + assetmind_results['total']} services")
