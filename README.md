# The Relational River

The website for the Relational River, a Source offered through the Institute of Relational Being. It lives at https://relationalriver.org.

## How it's put together

- `source/` holds the River's pages as exported from the clickable mockup (`*.dc.html`).
- `build.py` turns them into plain web pages in `site/`, with clean addresses (`/flow`, `/source`, `/waterfall` and so on).
- `js/river-runtime.js` is the small engine that brings each page to life in the browser.
- `assets/` holds the images: the IRB badge, the Beings of the arrival, torn-paper textures and the River art.

After changing anything in `source/`, `js/` or `assets/`, rebuild with:

```
python3 build.py
```

## Hosting

Cloudflare Pages serves the `site/` folder. In the Pages project settings:

- Build command: *(leave empty)*
- Build output directory: `site`

Every push to `main` goes live automatically.

## Pages

| Address | Page |
| --- | --- |
| `/` | The arrival |
| `/flow` | Follow the flow (the whole River) |
| `/source` | The source: a few gentle questions |
| `/my-river` | My river |
| `/local-currents` | Local currents |
| `/ocean` | Ocean and confluences |
| `/hylo` | Gather on Hylo |
| `/waterfall` | The waterfall |
| `/channels` | Channels |
| `/tributaries` | Tributaries |
| `/capital-journey` | The capital journey |

While the River is being tested, every page asks search engines not to list it (`noindex`). Remove that line from `build.py` before public launch.
