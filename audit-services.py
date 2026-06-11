#!/usr/bin/env python3
"""
Comprehensive Service Audit - Check for stub/empty services
"""

import os

def check_service_content(path, name):
    """Check if service has actual implementation"""
    results = {
        'name': name,
        'has_code': False,
        'lines_of_code': 0,
        'issues': []
    }

    # Check for source files
    src_py = os.path.join(path, 'src', '__init__.py')
    src_ts = os.path.join(path, 'src', 'index.ts')
    src_js = os.path.join(path, 'src', 'index.js')

    code_files = []
    if os.path.exists(src_py):
        with open(src_py) as f:
            lines = len([l for l in f.readlines() if l.strip() and not l.strip().startswith('#')])
            results['lines_of_code'] += lines
            code_files.append(('__init__.py', lines))
    if os.path.exists(src_ts):
        with open(src_ts) as f:
            lines = len([l for l in f.readlines() if l.strip() and not l.strip().startswith('//')])
            results['lines_of_code'] += lines
            code_files.append(('index.ts', lines))
    if os.path.exists(src_js):
        with open(src_js) as f:
            lines = len([l for l in f.readlines() if l.strip() and not l.strip().startswith('//')])
            results['lines_of_code'] += lines
            code_files.append(('index.js', lines))

    results['has_code'] = results['lines_of_code'] > 0

    # Check for stubs (TODO, pass, or very minimal)
    if results['lines_of_code'] > 0 and results['lines_of_code'] < 10:
        results['issues'].append('MINIMAL_CODE')

    return results

def audit_platform(base_path, platform_name):
    """Audit all services in a platform"""
    print(f"\n{'='*60}")
    print(f"{platform_name} - SERVICE CONTENT AUDIT")
    print('='*60)

    stubs = []
    minimal = []
    good = []

    for item in sorted(os.listdir(base_path)):
        item_path = os.path.join(base_path, item)
        if not os.path.isdir(item_path):
            continue
        if item.startswith('.') or item.startswith('__'):
            continue

        result = check_service_content(item_path, item)

        if not result['has_code']:
            stubs.append(item)
        elif result['lines_of_code'] < 20:
            minimal.append((item, result['lines_of_code']))
        else:
            good.append((item, result['lines_of_code']))

    print(f"\nGOOD services ({len(good)}):")
    for name, lines in good[:10]:
        print(f"  ✓ {name} ({lines} lines)")
    if len(good) > 10:
        print(f"  ... and {len(good)-10} more")

    print(f"\nMINIMAL services ({len(minimal)}):")
    for name, lines in minimal:
        print(f"  ⚠ {name} ({lines} lines)")

    print(f"\nSTUBS/MISSING ({len(stubs)}):")
    for name in stubs:
        print(f"  ✗ {name}")

    return {'stubs': stubs, 'minimal': minimal, 'good': good}

# Audit AssetMind
assetmind_path = "/Users/rejaulkarim/Documents/ReZ Full App/AssetMind/codebase"
assetmind_results = audit_platform(assetmind_path, "ASSETMIND")

# Audit HOJAI
hojai_path = "/Users/rejaulkarim/Documents/ReZ Full App/hojai-ai/industry-ai"
hojai_results = audit_platform(hojai_path, "HOJAI AI")

# Summary
print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print(f"AssetMind stubs: {len(assetmind_results['stubs'])}")
print(f"HOJAI stubs: {len(hojai_results['stubs'])}")
