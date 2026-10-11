# SPAM Deck Lab

A React companion for SPAM with a searchable card library, detailed card views,
and a lightweight deck builder.

The interface is available in French and English (French by default). Card
names, descriptions, elements, and rarities follow the selected language using
the corresponding official catalogue.

Each menu page has a shareable hash route (`#/overview`, `#/cards`, `#/builder`,
`#/meta`, and `#/tips`). The root URL defaults to the home page and is normalized
to `#/overview`. Hash routing keeps direct links and browser refreshes working
on GitHub Pages without a server-side fallback. Browser back and forward
navigation also restore the selected page.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Deploy to GitHub Pages

The `Build and deploy to GitHub Pages` workflow builds the site and deploys it
whenever a commit is pushed to `main`. The production build uses the repository
base path `/spam-deck-lab/`; local development remains at the Vite root.

To enable deployment, open the repository's **Settings → Pages** and set
**Build and deployment → Source** to **GitHub Actions**. The published site is
then available at <https://flogrepro01.github.io/spam-deck-lab/>.

## Card data

The app reads the latest English card catalogue from the public JSON files
linked by `https://spamgame.com/data/index.json`. Card information and artwork
are served by the official SpamDex; source and data-terms links are included in
the app.

The catalogue does not include deck lists or meta rankings. The **Deck ideas**
page therefore presents community-suggested compositions rather than verified
rankings. It supports card, element, and rarity filters, sorting, and a modal
for viewing and choosing composition alternatives. The separate **Strategy
tips** page collects the submitted gameplay advice.

Decks in the builder stay in the current browser session. Build up to four
cards and set optional alternatives for each slot. Use **Share Link** to copy
a compact URL containing short card-number codes and optional alternatives;
opening that link reconstructs the deck without a backend. Older shared links
using card slugs remain supported. **Copy List** exports a plain-text card list.

## Project structure

- `src/components/cards` contains the reusable card face, card tile, and full
  card details view.
- `src/components/layout` contains the shared application shell and navigation.
- `src/components/ui.tsx` contains shared interface primitives.
- `src/features` contains the overview, card library, deck builder, community
  deck ideas, and strategy tips views.
- `src/hooks` contains catalogue loading, card filtering, and deck state.
- `src/lib` contains shared card asset and formatting helpers.
- `src/types.ts` defines shared application and catalogue types.

The card face presents the card art, name, HP, Spamton, attacks, and passive
skills. Hover an attack, element, or Spamton value for its explanation; select
a card in the library or deck builder to open its full details.
