"""Conservative display decisions; original depths are never replaced or capped."""
import math
import re

DIRECTIONAL = re.compile(r'horizontal|deviated|directional|inclined|\b(?:leg|branch|sidetrack|inseam|lateral)\b|\bST\s*\d+', re.I)


def depth_quality(depth, name='', comment='', suspect=False, family=False):
    if suspect or depth == 9999:
        return dict(eligible=False, status='suspect', reason='Reported 9,999 m is unverified and isolated in the GSNSW coal dataset. Trace withheld pending original-report validation; no replacement depth assigned.')
    if not isinstance(depth, (int, float)) or not math.isfinite(depth) or depth <= 0:
        return dict(eligible=False, status='missing', reason='No finite positive reported total depth.')
    if family or DIRECTIONAL.search(name + ' ' + comment):
        return dict(eligible=False, status='directional', reason='Directional or branched drilling indicated by name, comment or associated parent well. No surveyed trajectory is supplied; vertical trace withheld.')
    return dict(eligible=True, status='schematic-md', reason='Reported drilling distance shown schematically from terrain. Trajectory and drilling datum are not verified; this is not measured vertical penetration.')


def select_bores(features):
    cells, retained = {}, []
    for f in features:
        p = f['properties']; x, y = f['geometry']['coordinates']
        q = depth_quality(p.get('end_depth'), p.get('hole_name') or '', suspect=p.get('gsnsw_drill_id') == 'COAL_004298')
        if q['status'] == 'suspect':
            retained.append(f)
        key = (round(x / .02), round(y / .02))
        rank = (q['eligible'], p.get('end_depth') or 0 if q['eligible'] else 0)
        if key not in cells or rank > cells[key][0]:
            cells[key] = (rank, f)
    return list({f['properties']['gsnsw_drill_id']: f for f in [*(v[1] for v in cells.values()), *retained]}.values())


def mark_directional_families(bores):
    roots = {re.split(r'\s+(?:Bulli\s+)?(?:leg|branch|ST\d|sidetrack|inseam|lateral)', b.get('name', ''), flags=re.I)[0].strip().lower() for b in bores if DIRECTIONAL.search(b.get('name', ''))}
    for b in bores:
        b['directionalFamily'] = b.get('name', '').strip().lower() in roots
    return bores
