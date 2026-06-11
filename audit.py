#!/usr/bin/env python3
"""
AssetMind + HOJAI AI - Complete Audit
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
        if item.startswith('.'):
            continue

        results['total'] += 1

        has_readme = os.path.exists(os.path.join(item_path, 'README.md'))
        has_req = os.path.exists(os.path.join(item_path, 'requirements.txt'))
        has_init = os.path.exists(os.path.join(item_path, 'src', '__init__.py'))
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

# Audit AssetMind
print("=" * 60)
print("ASSETMIND AUDIT")
print("=" * 60)

assetmind_path = "/Users/rejaulkarim/Documents/ReZ Full App/AssetMind/codebase"
assetmind_results = audit_directory(assetmind_path, "AssetMind")

print(f"Total services: {assetmind_results['total']}")
print(f"With README: {assetmind_results['with_readme']}")
print(f"With requirements.txt: {assetmind_results['with_req']}")
print(f"Missing documentation: {len(assetmind_results['missing'])}")
print("\nMissing services:")
for m in sorted(assetmind_results['missing'], key=lambda x: x['name']):
    missing = []
    if not m['readme']: missing.append('README')
    if not m['req']: missing.append('requirements.txt')
    print(f"  - {m['name']}: {', '.join(missing)}")

# Audit HOJAI Industry AI
print("\n" + "=" * 60)
print("HOJAI AI - Industry AI AUDIT")
print("=" * 60)

hojai_path = "/Users/rejaulkarim/Documents/ReZ Full App/hojai-ai/industry-ai"
hojai_results = audit_directory(hojai_path, "HOJAI")

print(f"Total industry AI services: {hojai_results['total']}")
print(f"With README: {hojai_results['with_readme']}")
print(f"With requirements.txt: {hojai_results['with_req']}")
print(f"Missing documentation: {len(hojai_results['missing'])}")
print("\nMissing services:")
for m in sorted(hojai_results['missing'], key=lambda x: x['name']):
    missing = []
    if not m['readme']: missing.append('README')
    if not m['req']: missing.append('requirements.txt')
    print(f"  - {m['name']}: {', '.join(missing)}")

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"AssetMind missing: {len(assetmind_results['missing'])}")
print(f"HOJAI missing: {len(hojai_results['missing'])}")
