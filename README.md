# LegacyMart Makers

LegacyMart Makers is the Izakhono-owned multi-seller marketplace foundation: an African-born marketplace for handmade, creative, personalised, digital and independent products.

## Marketplace foundation

- Maker-focused home page and category discovery
- Search and category filtering
- Product detail pages
- Buyer favourites
- Founding seller application flow
- Existing vendor review/admin flow preserved
- Configurable commercial model
- Existing payment handoff preserved for payment-enabled listings
- Automatic third-party payouts remain blocked until verified
- IZAKHONO-owned deployment metadata remains supported
- Production marketplace data model is active in IZAKHONO WebStart with RLS

## Launch economics defaults

```text
LISTING_FEE=0
MARKETPLACE_FEE_PERCENT=8
PAYOUT_HOLD_DAYS=7
```

These settings are configurable. The 8% commission is a launch target, not a hard-coded permanent commercial commitment.

## Production data model

The marketplace core now has dedicated tables for:

- shops
- listings
- favourites
- orders
- order items
- reviews
- payouts
- platform configuration

Seller moderation and payout status are server-controlled. Client-facing database access uses row-level security.

## Payment boundary

The marketplace records the intended marketplace commission and seller amount separately, but it must not automatically remit third-party seller funds until the selected gateway, KYC/KYB, refunds, disputes, settlement and accounting model are verified end to end.

## Existing LegacyMart checkout

The current repository still contains the original Faith Personified checkout and PayFast handoff. The maker marketplace UI deliberately labels non-live catalogue items as demo listings so they cannot be mistaken for products available for purchase.

## Next production layer

Connect marketplace pages to the production database/auth layer, add seller image storage, shipping options, seller storefront URLs, moderation tooling, messaging, tax/VAT handling and verified payout orchestration.