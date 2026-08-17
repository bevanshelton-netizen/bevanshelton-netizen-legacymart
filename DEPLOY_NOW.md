# Deploy LegacyMart Now

Your GitHub repository is ready for deployment.

## Render settings

Create a new Render Web Service from this repo.

Use:

```text
Environment: Node
Build Command: npm install
Start Command: npm start
```

## Required environment variables

Add these in Render:

```text
BASE_URL=https://your-render-url.onrender.com
PAYFAST_MODE=sandbox
PAYFAST_MERCHANT_ID=your_payfast_merchant_id
PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
PAYFAST_PASSPHRASE=your_passphrase_if_enabled
ADMIN_TOKEN=choose-a-strong-secret
PRODUCT_PRICE=199.00
```

Use sandbox first. Switch `PAYFAST_MODE` to `live` only after testing.

## Ebook upload

Upload your final PDF to:

```text
public/downloads/faith-personified-my-journey.pdf
```

## Test pages

```text
/
/shop
/faith-personified
/checkout
/become-a-vendor
/admin?token=YOUR_ADMIN_TOKEN
/health
```

## Launch flow

1. Deploy on Render.
2. Add PayFast sandbox credentials.
3. Test checkout.
4. Upload final ebook PDF.
5. Switch to PayFast live credentials.
6. Run one small live payment test.
7. Announce LegacyMart.
