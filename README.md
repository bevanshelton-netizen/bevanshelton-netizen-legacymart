# LegacyMart Platform

LegacyMart is a purpose-driven marketplace MVP for ebooks, printed books, clothing, courses, digital products, vendor applications and future multi-vendor selling.

## What is included

- Node.js web server using only built-in Node modules
- Premium LegacyMart home page
- Shop page
- Faith Personified ebook page
- Checkout page
- PayFast checkout handoff form
- PayFast ITN endpoint
- Order tracking
- Protected ebook download route
- Vendor application form
- Admin dashboard with CSV exports
- Policy pages
- Render deployment configuration
- Go-live documentation

## Start locally

```bash
cp .env.example .env
npm start
```

Open:

```text
http://localhost:3000
```

## Admin dashboard

```text
/admin?token=change-this-long-secret
```

Change `ADMIN_TOKEN` in `.env` before going live.

## PayFast

The platform supports sandbox and live PayFast handoff.

Required environment variables:

```text
PAYFAST_MODE=sandbox
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase_if_enabled
BASE_URL=https://your-live-domain.co.za
```

## Ebook upload

Place the final PDF here:

```text
public/downloads/faith-personified-my-journey.pdf
```

The download route only unlocks when an order status is `paid`.

## Important production note

Before public launch, PayFast ITN validation must be completed according to PayFast's official developer requirements. This MVP records ITN notifications and unlocks payment when `payment_status=COMPLETE`. For a full production marketplace, add server-to-server ITN validation, email sending, database hosting and vendor payout workflows.
