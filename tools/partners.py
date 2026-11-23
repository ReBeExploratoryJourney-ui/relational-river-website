#!/usr/bin/env python3
"""The River's living partner index.

One list of partner organisations, used by the Ocean page (and ready for other
waters). Add or correct a partner here once, then run:

    python3 tools/partners.py

It writes data/partners.json (which the pages load) and refreshes the copy
embedded in each page that shows partners. 'shaped' marks entries a partner
has reviewed and shaped themselves.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PARTNERS = [
 {
  "name": "Regenesis Institute for Regenerative Practice",
  "place": "Santa Fe, New Mexico, with cohorts around the world",
  "text": "Education and support for practitioners of regenerative development: bringing human activity back into alignment with the living systems that sustain it, by understanding the uniqueness of each place.",
  "theme": "Regenerative development",
  "k": "see",
  "href": "https://www.regenerat.es/",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Post Growth Institute",
  "place": "Collectively governed across 18 countries",
  "text": "Exploring a just and livable world beyond capitalism, and nurturing ideas, programmes and alliances that help money, power and resources circulate in local communities and the global economy.",
  "theme": "Economies beyond growth",
  "k": "money",
  "href": "https://postgrowth.org/",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Hometree",
  "place": "Co. Clare, Ireland",
  "text": "Restoring native woodland and temperate rainforest in the west of Ireland.",
  "theme": "Woodland and land",
  "k": "land",
  "href": "https://www.hometree.ie/",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Bioregional Learning Centre",
  "place": "South Devon, England",
  "text": "Bioregioning and learning journeys toward a resilient region.",
  "theme": "Bioregional",
  "k": "bio",
  "href": "https://www.bioregion.org.uk/about",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Good Grief Network",
  "place": "Worldwide",
  "text": "Peer support for people overwhelmed by the state of the world.",
  "theme": "Grief and care",
  "k": "grief",
  "href": "https://www.goodgriefnetwork.org/",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Regenerative Communities Network",
  "place": "Worldwide",
  "text": "Place-based transformation toward regenerative economies.",
  "theme": "Economics and finance",
  "k": "money",
  "href": "https://capitalinstitute.org/regenerative-communities/",
  "founder": "Convened by Capital Institute, now run by its members",
  "shaped": False
 },
 {
  "name": "Transition Network",
  "place": "Worldwide",
  "text": "Local groups working on food, energy, repair and community.",
  "theme": "Bioregional",
  "k": "bio",
  "href": "https://maps.transitionnetwork.org/",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Siendo Naturaleza",
  "place": "Peruvian Amazon",
  "text": "A learning centre for land-based learning and regeneration, with short courses in regenerative agriculture, systems thinking and deep ecology.",
  "theme": "Woodland and land",
  "k": "land",
  "href": "https://www.siendonaturaleza.com/",
  "founder": "Founded by Eliane Cohen, a Schumacher College alumna and a longtime collaborator of IRB",
  "shaped": False
 },
 {
  "name": "Third Horizon Earth",
  "place": "Geneva and worldwide",
  "text": "A nonpartisan knowledge and practice platform connecting regenerative pioneers to accelerate regenerative development.",
  "theme": "Ways of seeing",
  "k": "see",
  "href": "https://thirdhorizon.earth/",
  "founder": "",
  "shaped": False
 },
 {
  "name": "The Emergence Network",
  "place": "Worldwide",
  "text": "A planetary network of care and inquiry, exploring postactivism and making sanctuary.",
  "theme": "Ways of seeing",
  "k": "see",
  "href": "https://emergencenetwork.org/",
  "founder": "Founded by Báyò Akómoláfé",
  "shaped": False
 },
 {
  "name": "Institute for Practical ekoPhilosophy",
  "place": "Europe and online",
  "text": "Philosophy as a practical response to the crises of our time: PhilosophyGyms and the Life as Lab Fellowship.",
  "theme": "Ways of seeing",
  "k": "see",
  "href": "https://www.institute-pep.com/",
  "founder": "Founded and led by Dr Jessica Böhme",
  "shaped": False
 },
 {
  "name": "Dark Matter Labs",
  "place": "Worldwide",
  "text": "Optionality, risk-in capital and bioregional finance.",
  "theme": "Economics and finance",
  "k": "money",
  "href": "https://optionality.darkmatterlabs.org/",
  "founder": "",
  "shaped": False
 }
]


def main():
    data = {'partners': PARTNERS}
    out = ROOT / 'data' / 'partners.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    block = '/*PARTNERS*/' + json.dumps(PARTNERS, ensure_ascii=False) + '/*END PARTNERS*/'
    pages = []
    for page in sorted((ROOT / 'source').glob('*.dc.html')):
        t = page.read_text()
        t2, n = re.subn(r'/\*PARTNERS\*/.*?/\*END PARTNERS\*/', lambda m: block, t, flags=re.S)
        if n:
            page.write_text(t2)
            pages.append(page.name.split('.')[0])
    print(f'{len(PARTNERS)} partners written to data/partners.json and', ', '.join(pages))


if __name__ == '__main__':
    main()
