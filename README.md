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

Cloudflare serves the `site/` folder, using the settings in `wrangler.jsonc`. In the Cloudflare project:

- Build command: *(leave empty)*
- Deploy command: `npx wrangler deploy`

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
| `/streams` | Streams: small practices for ordinary days |
| `/lakes` | Lakes: circles, fellowships and retreats |
| `/eddies` | Eddies: grief, gratitude and returning |
| `/estuary` | Estuary: workplaces, schools and councils |
| `/groundwater` | Groundwater: the River as a living system |
| `/moon` | Moon: tides and Making with Moon |

While the River is being tested, every page asks search engines not to list it (`noindex`). Remove that line from `build.py` before public launch.

## The Well: keeping offerings

`worker/index.js` serves the site and answers `/api/well/...`. Offerings are kept in a
Cloudflare D1 database bound as `WELL_DB` (the table is created on first use). Until the
binding exists, the Well says it isn't open yet and nothing is saved.

To open the Well:

1. In Cloudflare, go to Storage & Databases > D1 and create a database named
   `relational-river-well`. Copy its database ID.
2. Add it to `wrangler.jsonc`:
   `"d1_databases": [{ "binding": "WELL_DB", "database_name": "relational-river-well", "database_id": "<id>" }]`
3. For stewards: in the Worker's Settings > Variables and Secrets, add a secret named
   `STEWARD_KEY`. Offerings can then be read at `/api/well/steward` with the header
   `Authorization: Bearer <key>`. Never commit the key.

Each person gets a private link (`/well/#manage=...`) to read or withdraw their offering;
withdrawing deletes it. No IP addresses, device identifiers or tracking are stored.
