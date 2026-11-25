#!/usr/bin/env python3
"""Gather a few Beings of each watershed from iNaturalist for Local Currents.

Run by a scheduled GitHub Action (and by hand if needed). For each place it
asks iNaturalist for research-grade observations with openly licensed photos
(CC0, CC BY, CC BY-SA), skips threatened and captive species, keeps up to four
Beings from different groups (a plant, a bird, an insect...), saves a copy of
each photo, and writes data/beings.json with the photographer's credit.

Visitors' browsers then load everything from relationalriver.org itself, so no
visitor data goes to iNaturalist (GDPR), and the section works even when the
iNaturalist API is slow.
"""
import json
import os
import shutil
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'RelationalRiver/1.0 (relationalriver.org)'
PLACES = {
    'la': {'lat': 34.12, 'lng': -118.39, 'radius': 14},
    'clare': {'lat': 52.93, 'lng': -8.47, 'radius': 25},
}
PHOTO_HOSTS = ('inaturalist-open-data.s3.amazonaws.com', 'static.inaturalist.org')
PER_PLACE = 4


def get(url, timeout=60):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def observations(place, order_by):
    p = dict(PLACES[place])
    p.update({
        'quality_grade': 'research', 'photos': 'true', 'photo_license': 'cc0,cc-by,cc-by-sa',
        'threatened': 'false', 'captive': 'false', 'order_by': order_by, 'per_page': 100, 'locale': 'en',
    })
    url = 'https://api.inaturalist.org/v1/observations?' + urllib.parse.urlencode(p)
    return json.loads(get(url)).get('results', [])


def pick(results):
    seen, out = set(), []
    for o in results:
        t, photos = o.get('taxon'), o.get('photos') or []
        if not t or not photos or not photos[0].get('url'):
            continue
        if (photos[0].get('license_code') or '').lower() not in ('cc0', 'cc-by', 'cc-by-sa'):
            continue
        group = t.get('iconic_taxon_name') or 'other'
        if group in seen:
            continue
        seen.add(group)
        out.append(o)
        if len(out) >= PER_PLACE:
            break
    return out


def main():
    data_dir = os.path.join(ROOT, 'data')
    img_dir = os.path.join(data_dir, 'beings')
    os.makedirs(img_dir, exist_ok=True)
    old = {}
    try:
        with open(os.path.join(data_dir, 'beings.json')) as f:
            old = json.load(f).get('places', {})
    except Exception:
        pass
    places = {}
    for place in PLACES:
        chosen = []
        for order_by in ('votes', 'created_at'):
            try:
                chosen = pick(observations(place, order_by))
            except Exception as e:  # slow or busy API: try the lighter ordering
                print(place, order_by, 'failed:', e, file=sys.stderr)
                chosen = []
            if len(chosen) >= 3:
                break
            time.sleep(2)
        items = []
        for i, o in enumerate(chosen, 1):
            t, ph = o['taxon'], o['photos'][0]
            src = ph['url'].replace('/square.', '/medium.')
            if urllib.parse.urlparse(src).hostname not in PHOTO_HOSTS:
                continue
            ext = os.path.splitext(urllib.parse.urlparse(src).path)[1].lower() or '.jpg'
            fname = '%s-%d%s' % (place, i, ext)
            try:
                with open(os.path.join(img_dir, fname), 'wb') as f:
                    f.write(get(src))
            except Exception as e:
                print('photo failed:', src, e, file=sys.stderr)
                continue
            name = t.get('preferred_common_name') or t.get('name') or 'A Being'
            name = name[0].upper() + name[1:]
            who = (o.get('user') or {}).get('name') or (o.get('user') or {}).get('login') or 'an iNaturalist naturalist'
            items.append({
                'name': name,
                'img': '/data/beings/' + fname,
                'url': 'https://www.inaturalist.org/observations/%s' % o['id'],
                'credit': ph.get('attribution') or '',
                'alt': '%s, a photo by %s on iNaturalist' % (name, who),
            })
            time.sleep(1)
        if items:
            places[place] = items
        elif place in old:
            places[place] = old[place]  # keep last month's Beings rather than show none
            print(place, 'kept previous Beings', file=sys.stderr)
        time.sleep(2)
    if not places:
        print('No Beings gathered; leaving files as they were.', file=sys.stderr)
        return 1
    # Remove photos no longer listed.
    keep = {os.path.basename(b['img']) for items in places.values() for b in items}
    for fn in os.listdir(img_dir):
        if fn not in keep:
            os.remove(os.path.join(img_dir, fn))
    with open(os.path.join(data_dir, 'beings.json'), 'w') as f:
        json.dump({'updated': time.strftime('%Y-%m-%d'), 'places': places}, f, ensure_ascii=False, indent=1)
    # Mirror into the built site so it goes live without a full rebuild.
    site_data = os.path.join(ROOT, 'site', 'data')
    shutil.copy(os.path.join(data_dir, 'beings.json'), os.path.join(site_data, 'beings.json'))
    if os.path.isdir(os.path.join(site_data, 'beings')):
        shutil.rmtree(os.path.join(site_data, 'beings'))
    shutil.copytree(img_dir, os.path.join(site_data, 'beings'))
    print('Gathered:', {k: len(v) for k, v in places.items()})
    return 0


if __name__ == '__main__':
    sys.exit(main())
