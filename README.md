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

### A veiled place

One place on the River is left out of this table, the menus, search engines and the open data feeds on purpose. Its way opens through wandering and curiosity (see `js/wyrd.js` and `source/WyrdBay.dc.html` if you tend the code). It is a veil rather than a lock, so please keep its `noindex, nofollow` and leave it out of the menus when launching the rest of the River.

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

## Voice and language

The River's words are part of how it helps people remember they belong to the living world.

- **Humans are woven in.** Write entangled versions of reality, where people are part of nature,
  never apart from it. Humans are animals too: say "other animals", "mammals and birds" or
  "fellow Beings", not "animals" as if we were not; "the rest of nature" or "the living world",
  not "nature" as somewhere we go. Prefer "out on the land" to "in nature".
- **Beings** take a capital B and are they/them, never "it". **Moon** is a name: "Moon", not "the moon".
- **You and your.** The River is a personal experience: "Your Boat", "your lunar journal", never "my".
- **Collaborators**, not "users". **Wellsprings**, not "partners", unless a partnership is formal.
- **No one knows the way.** Guides help to reveal potentially beneficial and regenerative ways
  forward; the work is navigating mystery with curiosity and humility, in service of life, love,
  kindness and care for all.
- **Land, gently.** Rather than "whose land are you on", invite people to wonder who lived on these
  lands before they became this nation or state, and whether they still live here now. Indigenous
  sources first, credited by name.
- Never use the phrase "Earth is every human's first home".
- Warm, unhurried, plain English. No hype.
