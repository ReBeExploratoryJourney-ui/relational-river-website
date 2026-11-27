#!/usr/bin/env python3
"""Murmurations profiles: the River's offerings, shared in an open format.

Murmurations (https://murmurations.network) is an open protocol for sharing
data between platforms and networks. Each profile is a small JSON file the
River hosts itself; the Murmurations index keeps a pointer to it, and maps
and directories (Catalist among them) can then find it.

This writes murmurations/*.json, served at /murmurations/:
  - relational-river.json  the River itself (organizations_schema-v1.0.0)
  - canal.json             the Canal, a guided path (organizations_schema-v1.0.0)
  - spring-<id>.json       each open Spring, as an offer (offers_wants_schema-v0.1.0)

Only schemas in the live Murmurations library are used, so every profile can
be accepted by the live index (catalist_object exists only in the test library).
  - index.json             a plain list of the profiles above

Care: every Spring is someone else's offering. A spring profile describes
the River's listing of it, names and links the makers, and never claims
their identity.
If a maker publishes their own Murmurations profile, the River can stop
listing theirs. Spring profiles carry 'expires_at' (the closing date), so the
index lets them go on its own once a spring closes.

Run after tools/springs.py:

    python3 tools/murmurations.py
"""
import datetime as dt
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'murmurations'
SITE = 'https://relationalriver.org'
LOGO = SITE + '/assets/e8c0fc7b44ab44f6fd08f8a17c9a0149.png'
IRB = 'https://instituteofrelationalbeing.org'
HYLO = 'https://www.hylo.com/groups/institute-of-relational-being'
ORG = 'organizations_schema-v1.0.0'
OFFER = 'offers_wants_schema-v0.1.0'

THEME_TAGS = {
    'land': ['land', 'regenerative practice', 'bioregional'],
    'money': ['regenerative economics', 'finance'],
    'work': ['regenerative business', 'leadership'],
    'grief': ['grief', 'care'],
    'see': ['ways of seeing', 'learning'],
}

RIVER = {
    'linked_schemas': [ORG],
    'name': 'Relational River',
    'primary_url': SITE,
    'tags': ['relational being', 'remembrance', 'kinship with the living world', 'bioregional',
             'regenerative culture', 'commons', 'open source', 'more-than-human'],
    'description': ('An open commons tended by the Institute of Relational Being: a global remembrance '
                    'and relational development meshwork. Small practices, circles, local currents and '
                    'offerings that help people slow down and build real relationships with the Beings '
                    'and places around them. Every offering links to its makers.'),
    'mission': ('To help people remember that they can find belonging through relationship with the rest '
                'of nature and the cosmos, navigating mystery with curiosity and humility, in service of '
                'life, love, kindness and care for all.'),
    'status': 'active',
    'image': LOGO,
    'geographic_scope': 'international',
    'contact_details': {'contact_form': HYLO},
    'relationships': [{'predicate_url': 'https://schema.org/parentOrganization', 'object_url': IRB}],
}

CANAL = {
    'linked_schemas': [ORG],
    'name': 'The Canal: from relational practice to relational business',
    'primary_url': SITE + '/canal',
    'urls': [{'name': 'The Canal', 'url': SITE + '/canal'}],
    'tags': ['regenerative business', 'leadership', 'founders', 'inner development', 'relational being'],
    'description': ('A guided path in the Relational River, kept by Joe Culhane of the Institute of '
                    'Relational Being, for founders and leaders ready to let relational practice change how '
                    'they lead. Four locks, climbed only when ready, toward offerings from ESSENSE Business '
                    'School. No partnership, referral or commission is involved.'),
    'status': 'active',
    'image': LOGO,
    'geographic_scope': 'international',
    'contact_details': {'contact_form': HYLO},
    'relationships': [{'predicate_url': 'https://schema.org/isPartOf', 'object_url': SITE},
                      {'predicate_url': 'https://schema.org/mentions', 'object_url': 'https://essense.school'}],
}


def end_of_day(date_str):
    d = dt.datetime.strptime(date_str, '%Y-%m-%d').replace(tzinfo=dt.timezone.utc)
    return int((d + dt.timedelta(days=1)).timestamp()) - 1


def spring_profile(s):
    fmt = s.get('fmt', '')
    tags = ['relational river spring'] + THEME_TAGS.get(s.get('theme'), []) + [s.get('kind', '').lower()]
    tags += {'online': ['online'], 'hybrid': ['online', 'in person'], 'in person': ['in person']}.get(fmt, [])
    tags = [t for i, t in enumerate(tags) if t and t not in tags[:i]]
    when = '; '.join(x for x in [s.get('when'), s.get('where'), s.get('costNote') or s.get('cost')] if x)
    desc = (s.get('text', '') + ' ' + (when + '.' if when else '')).strip()
    desc += f" Offered by {s['host']}. Listed in the Relational River's Springs; join through the makers' own page."
    p = {
        'linked_schemas': [OFFER],
        'exchange_type': 'offer',
        'item_type': 'service',
        'transaction_type': ['buy-sell'] if s.get('cost') == 'paid' else ['receive-donate'],
        'title': s['title'],
        'description': desc,
        'details_url': s['href'],
        'tags': tags,
        'image': LOGO,
        'geographic_scope': 'international',
        'contact_details': {'contact_form': s['href']},
        'expires_at': end_of_day(s['closes']),
    }
    return p


def main():
    today = dt.date.today().isoformat()
    springs = json.loads((ROOT / 'data' / 'springs.json').read_text())['springs']
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob('*.json'):
        old.unlink()
    profiles = {'relational-river.json': RIVER, 'canal.json': CANAL}
    for s in springs:
        if s.get('closes', '9999') >= today:
            profiles[f"spring-{s['id']}.json"] = spring_profile(s)
    for name, p in profiles.items():
        (OUT / name).write_text(json.dumps(p, ensure_ascii=False, indent=2) + '\n')
    index = {'about': 'Murmurations profiles published by the Relational River (https://murmurations.network).',
             'updated': today,
             'profiles': [f'{SITE}/murmurations/{n}' for n in profiles]}
    (OUT / 'index.json').write_text(json.dumps(index, indent=2) + '\n')
    print('wrote', len(profiles), 'profiles')


if __name__ == '__main__':
    main()
