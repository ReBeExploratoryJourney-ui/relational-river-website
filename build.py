#!/usr/bin/env python3
"""Build the Relational River website from the design mockup pages.

Reads source/*.dc.html (exported from the clickable mockup) and writes plain
web pages into site/, which Cloudflare Pages serves as relationalriver.org.

    python3 build.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / 'source'
OUT = ROOT / 'site'

# mockup file -> (output file, clean URL, page description)
PAGES = {
    'Arrival': ('index.html', '/', 'Arrive at the Relational River, a Source offered through the Institute of Relational Being.'),
    'Welcome': ('flow.html', '/flow', 'Follow the flow of the Relational River, from source to ocean.'),
    'Main': ('source.html', '/source', 'Arrive wherever you are: a few gentle questions to find your way into the River.'),
    'Journey': ('my-river.html', '/my-river', 'Your private place on the Relational River.'),
    'LocalCurrents': ('local-currents.html', '/local-currents', 'Groups and circles already tending the place you live, by bioregion.'),
    'Ocean': ('ocean.html', '/ocean', 'Place-based projects and collaborators around the world.'),
    'Hylo': ('hylo.html', '/hylo', 'Where Relational River circles meet and organise, on Hylo.'),
    'Waterfall': ('waterfall.html', '/waterfall', 'Offer an idea to the falls and see which streams it might feed.'),
    'Channels': ('channels.html', '/channels', 'Ways to act, from small to large.'),
    'Tributary': ('tributaries.html', '/tributaries', 'Films, talks and readings that help the moment make sense.'),
    'CapitalJourney': ('capital-journey.html', '/capital-journey', 'A journey about money as part of the living world.'),
}

EXT = {}
for f in (ROOT / 'assets').iterdir():
    EXT[f.stem] = f.name

HEAD = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://relationalriver.org/assets/e8c0fc7b44ab44f6fd08f8a17c9a0149.png">
<link rel="icon" href="/assets/e8c0fc7b44ab44f6fd08f8a17c9a0149.png">
<meta name="theme-color" content="#0E2849">
'''


def convert(name, text):
    out_file, url, desc = PAGES[name]
    title = re.search(r'<title>(.*?)</title>', text, re.S).group(1).strip()
    title = title.replace('Relational River: ', 'Relational River · ').strip()
    helmet = re.search(r'<helmet>(.*?)</helmet>', text, re.S)
    helmet_html = helmet.group(1).strip() if helmet else ''
    body = re.search(r'<x-dc>(.*?)</x-dc>', text, re.S).group(1)
    if helmet:
        body = body.replace(helmet.group(0), '')
    script = re.search(r'(<script type="text/x-dc".*?</script>)', text, re.S)
    script_html = script.group(1) if script else ''
    page = (
        '<!doctype html>\n<html lang="en">\n<head>\n'
        + HEAD.format(title=title, desc=desc)
        + helmet_html + '\n'
        + '<style>body{background:#0E2849}</style>\n'
        + '</head>\n<body>\n'
        + '<noscript><p style="color:#EDEDED;font-family:sans-serif;padding:24px">The Relational River needs JavaScript turned on to flow.</p></noscript>\n'
        + '<template id="rr-template">' + body + '</template>\n'
        + script_html + '\n'
        + '<script src="/js/river-runtime.js"></script>\n'
        + '</body>\n</html>\n'
    )
    # links between pages -> clean URLs
    for src_name, (_, u, _) in PAGES.items():
        page = page.replace(src_name + '.dc.html', u)
    # mockup assets -> /assets/<id>.<ext>
    page = re.sub(r'/_blob/', '/assets/', page)
    for stem, fname in EXT.items():
        page = re.sub(r'(?<![0-9a-f])' + stem + r'(?![0-9a-f.])', fname, page)
    return out_file, page


def main():
    OUT.mkdir(exist_ok=True)
    for name in PAGES:
        text = (SRC / (name + '.dc.html')).read_text()
        out_file, page = convert(name, text)
        (OUT / out_file).write_text(page)
        print('built', out_file)
    # copy shared files
    for sub in ('assets', 'js'):
        dest = OUT / sub
        dest.mkdir(exist_ok=True)
        for f in (ROOT / sub).iterdir():
            (dest / f.name).write_bytes(f.read_bytes())
    (OUT / '404.html').write_text((OUT / 'index.html').read_text())


if __name__ == '__main__':
    main()
