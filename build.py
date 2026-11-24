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
    'Boat': ('boat.html', '/boat', 'My Boat: your own vessel on the Relational River, carrying where you began, the practices you tend and your constellation.'),
    'LocalCurrents': ('local-currents.html', '/local-currents', 'Groups and circles already tending the place you live, by bioregion.'),
    'Ocean': ('ocean.html', '/ocean', 'Place-based projects and collaborators around the world.'),
    'Hylo': ('hylo.html', '/hylo', 'Where Relational River circles meet and organise, on Hylo.'),
    'Waterfall': ('waterfall.html', '/waterfall', 'Offer an idea to the falls and see which streams it might feed.'),
    'Channels': ('channels.html', '/channels', 'Ways to act, from small to large.'),
    'Tributary': ('tributaries.html', '/tributaries', 'Films, talks and readings that help the moment make sense.'),
    'CapitalJourney': ('capital-journey.html', '/capital-journey', 'A journey about money as part of the living world.'),
    'Streams': ('streams.html', '/streams', 'Small practices for ordinary days: Sit Spots, listening to water, making pictures with Beings.'),
    'Lakes': ('lakes.html', '/lakes', 'Circles, fellowships and retreats where we slow down together.'),
    'Eddies': ('eddies.html', '/eddies', 'Grief, gratitude and practices that return at turning points.'),
    'Estuary': ('estuary.html', '/estuary', 'Where personal change meets workplaces, schools and councils.'),
    'Groundwater': ('groundwater.html', '/groundwater', 'The hidden water that connects everything: the River as a living system.'),
    'Seeing': ('ways-of-seeing.html', '/ways-of-seeing', 'Ways of seeing: short lessons on three horizons, emergence, philosophy as practice and learning on the land, with partners who live this work.'),
    'AI': ('ai.html', '/ai', 'How the Relational River uses AI: where it helps behind the scenes, where it does not, what it costs, and our commitments.'),
    'Springs': ('springs.html', '/springs', 'Springs: offerings with a closing date, bubbling up now, from cohorts and courses to gatherings you can join soon.'),
    'Islands': ('islands.html', '/islands', 'Islands of coherence: steady, well-related places in turbulent times, and how they connect into archipelagos.'),
    'Privacy': ('privacy.html', '/privacy', 'How the Relational River cares for your information: what is kept, why, for how long, and your rights under GDPR.'),
    'Well': ('well.html', '/well', 'The Well of Wonder, Wit, Wisdom and Wealth: pour in what you can offer, and draw on others to bring projects to life.'),
    'LunarPage': ('lunar-journal.html', '/lunar-journal', 'A lunar journal page to print: twenty-nine nights with Moon, with a space to sketch each night.'),
    'Moon': ('moon.html', '/moon', 'Moon moves the waters, and we are water too: tides, turning points and Making with Moon.'),
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


NOT_FOUND = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Relational River · this way</title>
<link rel="icon" href="/assets/e8c0fc7b44ab44f6fd08f8a17c9a0149.png">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#231C4D 0%,#0E2849 42%,#174A5B 100%);color:#EDEDED;font-family:Georgia,serif;text-align:center}a{color:#9FD3DC}</style>
</head><body><main><img src="/assets/e8c0fc7b44ab44f6fd08f8a17c9a0149.png" alt="" width="96" height="96">
<h1 style="font-weight:400">This part of the River hasn't formed yet.</h1>
<p><a href="/flow">Follow the flow</a> &nbsp;·&nbsp; <a href="/">Return to the arrival</a></p></main></body></html>
'''


REDIRECTS = {'my-river': '/boat'}
REDIRECT = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url={url}"><link rel="canonical" href="{url}"><title>Relational River</title>
<script>location.replace("{url}" + location.hash)</script></head><body><p><a href="{url}">This part of the River has moved.</a></p></body></html>
'''


def convert(name, text):
    # Self-hosted fonts instead of Google Fonts, so no visitor data goes to Google (GDPR).
    text = re.sub(r'<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>\n?', '', text)
    text = re.sub(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">', '<link href="/fonts/fonts.css" rel="stylesheet">', text)
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
        + '<script src="/js/boat-sync.js"></script>\n'
        + '<script src="/js/river-runtime.js"></script>\n'
        + '</body>\n</html>\n'
    )
    # links between pages -> clean URLs
    # longest names first, so a short name is never caught inside a longer one
    for src_name in sorted(PAGES, key=len, reverse=True):
        page = page.replace(src_name + '.dc.html', PAGES[src_name][1])
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
        if out_file == 'index.html':
            target = OUT / 'index.html'
        else:
            folder = OUT / out_file[:-5]
            folder.mkdir(exist_ok=True)
            target = folder / 'index.html'
        target.write_text(page)
        print('built', target.relative_to(OUT))
    # copy shared files
    for sub in ('assets', 'js', 'data', 'fonts'):
        dest = OUT / sub
        dest.mkdir(exist_ok=True)
        for f in (ROOT / sub).iterdir():
            (dest / f.name).write_bytes(f.read_bytes())
    (OUT / '404.html').write_text(NOT_FOUND)
    # old addresses that moved
    for old, new in REDIRECTS.items():
        folder = OUT / old
        folder.mkdir(exist_ok=True)
        (folder / 'index.html').write_text(REDIRECT.format(url=new))


if __name__ == '__main__':
    main()
