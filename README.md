# SPAM Deck Lab

A React companion for SPAM with a searchable card library, detailed card views,
and a lightweight deck builder.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Card data

The app reads the latest English card catalogue from the public JSON files
linked by `https://spamgame.com/data/index.json`. Card information and artwork
are served by the official SpamDex; source and data-terms links are included in
the app.

The catalogue does not include deck lists or meta rankings. The Meta Watch page
states this limitation rather than displaying unverified deck recommendations.
Decks in the builder stay in the current browser session. Use **Share Link** to
copy a URL containing the deck name and card slugs/counts; opening that link
reconstructs the shared deck without a backend. **Copy List** exports a
plain-text card list.

## Project structure

- `src/components/cards` contains the reusable card face, card tile, and full
  card details view.
- `src/components/layout` contains the shared application shell and navigation.
- `src/components/ui.tsx` contains shared interface primitives.
- `src/features` contains the overview, card library, deck builder, and Meta
  Watch views.
- `src/hooks` contains catalogue loading, card filtering, and deck state.
- `src/lib` contains shared card asset and formatting helpers.
- `src/types.ts` defines shared application and catalogue types.

The card face presents the card art, name, HP, Spamton, attacks, and passive
skills. Hover an attack, element, or Spamton value for its explanation; select
a card in the library or deck builder to open its full details.
