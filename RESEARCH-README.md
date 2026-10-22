# Points vs Cash: Research Data

Researched October 22, 2026. Each file is JSON that the app can read directly. Every entry has a `sourceUrl` and a `verification` level:

- **primary**: airline, card issuer, or government source
- **secondary**: points and travel publication (TPG, NerdWallet, Upgraded Points, AwardWallet, Frequent Miler)
- **general**: long-standing fact (e.g. alliance membership) not re-checked this round
- **unverified**: best available, needs a check before relying on it

## Files

| File | What it holds | Update how often |
|---|---|---|
| valuations.json | Cents-per-point value of 20 programs (TPG, Oct 2026) | Monthly |
| award-fees.json | Cash fees on award tickets, partner booking fees | Quarterly |
| cash-earning.json | Points earned per dollar on paid tickets, by fare type | Quarterly |
| transfer-partners.json | Chase, Amex, Citi, Capital One, Bilt airline partners and ratios | Quarterly |
| partner-booking.json | Which programs can book each U.S. airline's flights | Twice a year |
| transfer-bonuses.json | Active transfer bonuses (snapshot) | Monthly, or skip and let users enter a bonus |

Program `id`s match across files (e.g. `southwest`, `aeroplan`, `avios`). Eight transfer partners have no TPG valuation, so they have no entry in valuations.json: Aer Lingus, Iberia (both use Avios, so the `avios` value is a reasonable stand-in), EVA, Finnair, JAL, Qatar (also Avios), TAP and Thai.

## Key findings that affect the calculator

1. **The $5.60 September 11 Security Fee applies to every U.S.-origin one-way award** (capped at $11.20 round trip). Use it as the default award tax for domestic trips.
2. **Basic economy often earns nothing now.** American (since Dec 17, 2025), United for non-cardholders (since Apr 2, 2026), and Delta Main Basic earn 0. This matters for "points earned back on a cash ticket."
3. **Southwest earning by fare:** Basic 2, Choice 6, Choice Preferred 10, Choice Extra 14 points per dollar. Southwest says this changes in 2027.
4. **Alaska partner award fee is now $20 each way** (up from $12.50 on July 1, 2026). Alaska Saver fares no longer earn points.
5. **Aeroplan charges CAD 39 on partner awards** but no fuel surcharges on United flights.
6. **Transfer ratios are not all 1:1.** Amex to JetBlue is 1:0.8, Capital One to JetBlue is 1:0.6, and Citi's non-premium cards transfer at 1:0.7. Amex also charges a small fee on transfers to Delta and JetBlue (0.06 cents per point, max $99).

## Open items (need verification)

- Alaska's exact earning percentages by fare for 2026 (distance-based).
- United and Delta partner award surcharges (international).
- Aeroplan's CAD 39 fee basis (per passenger vs per direction).
- Citi's 16th airline partner (source lists 15).
- Whether Southwest points can be redeemed on partners yet (Icelandair, China Airlines).
- Avios domestic fees: source is from 2019 to 2021.

## Not researched yet

- Hotel programs
- International award surcharges in detail
- Elite status and co-branded card earning bonuses beyond what's listed
