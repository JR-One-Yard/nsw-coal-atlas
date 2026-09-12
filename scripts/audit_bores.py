"""Rebuild the public quality inventory from unmodified raw source records."""
from pathlib import Path
import json,collections,hashlib
from bore_quality import depth_quality
R=Path(__file__).resolve().parents[1];D=R/'dist/data'
p=R/'cache/coal-bores-all.geojson';raw=json.loads(p.read_text())['features']
records=[]
for f in raw:
    a=f['properties'];q=depth_quality(a.get('end_depth'),a.get('hole_name') or '',suspect=a['gsnsw_drill_id']=='COAL_004298')
    if not q['eligible']:records.append(dict(id=a['gsnsw_drill_id'],name=a.get('hole_name'),rawDepth=a.get('end_depth'),coordinates=f['geometry']['coordinates'],quality=q))
suspect=json.loads((R/'cache/DDH083-source.json').read_text()) if (R/'cache/DDH083-source.json').exists() else json.loads((D/'borehole-quality.json').read_text())['DDH083']['originalResponse']
result=dict(reviewedAt='2026-09-13',source='GSNSW coal drilling WFS',sourceSha256=hashlib.sha256(p.read_bytes()).hexdigest(),rawCount=len(raw),units='metres',datum='Not supplied in acquisition subset',trajectory='Not supplied in acquisition subset; straight eligible traces remain schematic',depthFrequencies=[dict(value=v,count=n) for v,n in collections.Counter(f['properties'].get('end_depth') for f in raw).most_common(20)],withheld=records,DDH083=dict(originalResponse=suspect,sourceUrl='https://public-gs.geoscience.nsw.gov.au/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=drilling:drilling_drillholes_coal&outputFormat=application/json&featureID=drilling_drillholes_coal.COAL_004298',decision='Withheld pending validation. Source repeats 9999; reports, comments and deviated are null. Placeholder semantics are not confirmed.'),policy='Quality precedes spatial thinning. Suspect collar retained even when another eligible record wins its cell. No arbitrary depth cap. Known directional names and comments are withheld; other traces are schematic MD, not verified vertical depth.')
(D/'borehole-quality.json').write_text(json.dumps(result,indent=2)+'\n')
print('Raw GSNSW audit:',len(raw),'records;',len(records),'ineligible')
