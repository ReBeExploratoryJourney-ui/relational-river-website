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
  "name": "The BioFi Project",
  "place": "Southern Blue Ridge Mountains of Appalachia, working across the Americas",
  "text": "A think-and-do tank partnering with communities to build place-based economies that regenerate, rather than deplete, the ecological and social systems they are part of. Home of Bioregional Financing Facilities, a growing resource library and monthly Deep Dives.",
  "theme": "Economies that work with life",
  "k": "money",
  "href": "https://thebiofiproject.substack.com/",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Unearthodox",
  "place": "Versoix, near Geneva, Switzerland, working worldwide",
  "text": "Grown from the legacy of the Luc Hoffmann Institute, Unearthodox drives systems change through social innovation, so that nature and people can thrive together. It supports edge-walking innovators through its Exploration Co-Lab, rethinks innovation with the Post Growth Institute, and shares essays from the people it convenes in its Deep Dives.",
  "theme": "Regenerative innovation",
  "k": "see",
  "href": "https://unearthodox.substack.com",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Becoming Crew",
  "place": "England, with gatherings on the land near Bath and online",
  "text": "An action learning collective guiding Earth-centred learning journeys and gatherings, in service to life: connection, cooperation and creativity, lived through ongoing practice. Home of The Spaceship Earth Podcast, hosted by Dan Burgess.",
  "theme": "Earth-centred learning",
  "k": "see",
  "href": "https://www.becomingcrew.com/",
  "founder": "",
  "shaped": False
 },
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
  "name": "Bioregional Earth",
  "place": "Worldwide, rippling out from the Greater Tkaronto Bioregion",
  "text": "A pathway for regenerating Earth one bioregion at a time, from Joe Brewer's Design Pathway for Regenerating Earth and the many people weaving with him. Living Flows, a Design School, and a hope for a thousand Bioregional Learning Centres by 2035.",
  "theme": "Bioregional",
  "k": "bio",
  "href": "https://www.bioregionalearth.org",
  "founder": "",
  "shaped": False
 },
 {
  "name": "Ecological Design Collective",
  "place": "Roots in Baltimore, relations around the world",
  "text": "A community for radical ecological imagination and collaboration: talks, workshops, exhibitions, an opportunities board, and Litter, its journal of essays and conversations.",
  "theme": "Ways of seeing",
  "k": "see",
  "href": "https://ecodesigncollective.org",
  "founder": "",
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
 },
 {
  "name": "The Xerces Society for Invertebrate Conservation",
  "place": "Portland, Oregon, working across North America and beyond",
  "text": "Protecting the natural world through the conservation of invertebrates and their habitats: bees, butterflies, fireflies, freshwater mussels and the many small Beings who hold food webs together. Science-led, with community science, habitat restoration, pesticide reduction and advocacy, and plenty of ways to help close to home.",
  "theme": "Woodland and land",
  "k": "land",
  "href": "https://xerces.org/",
  "founder": "",
  "shaped": False
 },
 {
  "name": "otherWise",
  "place": "Rooted near Joe's Pond in Danville, Vermont, on unceded Abenaki land, with a cosmolocal community far beyond",
  "text": "A cosmolocal learning community of wisdom-seekers and reVillagers, for people living through endings who want to reach for what still matters without doing it alone. Small place-rooted gatherings and slow virtual inquiry: otherWisdom Circles that follow the new Moon, goodGrief, otherGardens, reVillaging, edgeWork, and Feeding Complexity, a self-paced journey through food systems.",
  "theme": "Grief and care",
  "k": "grief",
  "href": "https://otherwise.one/",
  "founder": "Founded by Nicole Civita, and run as a worker self-directed nonprofit",
  "shaped": False
 },
 {
  "name": "ProSocial World",
  "place": "A worldwide community of scientists, facilitators and groups",
  "text": "A nonprofit bringing evolutionary and behavioural science together with Elinor Ostrom’s core design principles, so that groups of every kind can cooperate well. Its ProSocial process, facilitator community and open-access tools help a group find shared purpose, share contributions and benefits fairly, decide together, work through conflict and relate well to other groups.",
  "theme": "Cooperation and group life",
  "k": "see",
  "href": "https://www.prosocial.world/",
  "founder": "Begun in 2011 as an initiative of the Evolution Institute; its own nonprofit since 2020",
  "shaped": False
 },
 {
  "name": "Kincentric Leadership",
  "place": "Based in the UK, with leaders and communities around the world",
  "text": "A not-for-profit laying foundations for leadership rooted in kinship with all life, recognising the more-than-human world as kin with its own intelligence. Its open toolkit gathers eight principles, thirty-four capacities, twelve case studies and more than a hundred practices, alongside retreats, online courses and talks.",
  "theme": "Kinship in leadership",
  "k": "see",
  "href": "https://www.kincentricleadership.org/",
  "founder": "Co-founded by Justine Huxley and Anna Kovasna",
  "shaped": False
 },
 {
  "name": "The Repatterning Collective",
  "place": "A small practitioner collective, gathering online",
  "text": "Asks two questions: what if our approach to the polycrisis is part of the crisis, and what if we can repattern towards radically different regenerative futures? With Kincentric Leadership it hosts the Co-creation with the More-than-Human sandbox, monthly dialogues on rights of nature, interspecies councils, nature on the board and more, with written syntheses of each.",
  "theme": "Co-creation with the more-than-human",
  "k": "see",
  "href": "https://repatterningcollective.substack.com/",
  "founder": "Tended by Renilde Becqué",
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
