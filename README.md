# Points or Cash

A calculator for deciding whether to redeem airline points or pay cash for a flight.

## Running it locally

Static site, no build step. From this folder:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080`. (Opening `index.html` directly won't work — the `fetch()` calls for the JSON data need a real HTTP server, not `file://`.)

## Updating the data

Edit the JSON files in `/data` directly — no code changes needed:

- `valuations.json` — cents-per-point value per program. Update monthly from TPG.
- `award-fees.json` — cash fees on award tickets, including partner booking fees. Update quarterly.
- `cash-earning.json` — points earned per dollar on paid tickets, by fare type. Update quarterly.
- `transfer-partners.json`, `partner-booking.json`, `transfer-bonuses.json` — not wired into the UI yet, reserved for later phases (see below).

Each entry's `verification` field (`primary` / `secondary` / `general` / `unverified`) and `sourceUrl` show up as badges in the UI — keep them accurate when you update a number.

See `RESEARCH-README.md` for what each file covers and open research items.

## Deploying to Netlify

1. Push this folder to a GitHub repo.
2. In Netlify: "Add new site" → "Import an existing project" → pick the repo.
3. Build command: none. Publish directory: `/` (repo root).
4. Deploy. Every push to the connected branch redeploys automatically.

## Later phases (not built yet)

- Transfer partners: "I have Chase/Amex/etc. points, what's my best option for this flight?"
- Partner booking comparison: booking through the airline vs. a partner program.
- Transfer bonuses: user-entered bonus percent, with the snapshot in `transfer-bonuses.json` as a reference.
- Shareable result links.
- Hotel programs.

## Known v1 limitations

- The calculator treats "airline program" as a single axis. For the 13 partner/international programs, the reference table shows their value/point and multiplier, but the award-tax default and earn-back-on-cash-ticket math only have real data for the 7 U.S. programs that fly the ticket directly — everywhere else those fields say "not available" rather than guessing.
- Alaska's cash-ticket earning is distance-based (per mile flown), not per-dollar, and isn't in this calculator's earn-back feature.
- Aeroplan's CAD 39 partner fee isn't auto-added to the (USD) award-tax default; a note flags it instead.
