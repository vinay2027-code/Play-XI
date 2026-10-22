# Play XI Gameweek unlock

Play XI offers three transfer ideas for free and up to five additional ideas for ₹29 per FPL Gameweek. An unlock belongs to the signed-in Play XI account, public FPL Team ID, and target Gameweek. It does not renew.

## Current status

- The Dodo merchant is in **Test Mode**. The ₹29 one-time test product is `pdt_0NqHbIkAB8EiTRSA7AVwZ`.
- The test webhook for `payment.succeeded` and `refund.succeeded` points to `https://playfpl.digital/api/payments/dodo-webhook`. It is disabled until the endpoint is deployed and its private credentials are configured.
- The production checkout remains unavailable until Dodo approves merchant verification and a separate live product, API key, and webhook are configured. Never use test credentials for live checkout.
- Google Search Console has verified `https://playfpl.digital/`, and `sitemap.xml` was submitted.

## Server setup

Run `supabase/migrations/20261022000000_add_gameweek_payment_orders.sql` in the Play XI Supabase project. The `gameweek_payment_orders` table grants signed-in managers read access only to their own purchases. The server uses the Supabase secret key to create and update orders.

Set these variables **only** in the server's private environment. Do not prefix them with `VITE_` or commit values:

```text
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase secret key>
PLAYXI_PUBLIC_URL=https://playfpl.digital
DODO_ENVIRONMENT=live_mode
DODO_PAYMENTS_API_KEY=<live key with Checkout Sessions write and Payments read>
DODO_PAYMENTS_WEBHOOK_KEY=<live endpoint signing secret>
DODO_GAMEWEEK_PRODUCT_ID=<approved live INR 29 one-time product>
```

Until all of these are present and `DODO_ENVIRONMENT=live_mode`, `/api/payments/config` reports `checkoutAvailable: false` and the paid button is hidden. Creating a checkout requires a Supabase access token. The server records a pending order, creates a Dodo checkout session, and links it to the order. A signed Dodo `payment.succeeded` webhook retrieves the payment from Dodo and checks its status, INR amount, order ID, and checkout session before granting access. A signed `refund.succeeded` webhook revokes access. Browser return URLs never grant access by themselves.

## Live activation

1. Complete Dodo merchant verification and obtain approval for live payments.
2. Create the same ₹29 one-time product in **Live Mode**. Check taxes and the final customer price in Dodo.
3. Create a least-privilege **live** API key and webhook subscribed to `payment.succeeded` and `refund.succeeded`.
4. Add the live credentials and product ID to Render's private server environment. Confirm `/api/payments/config` reports checkout available only after all requirements are in place.
5. Enable the live webhook endpoint. Confirm a successful payment grants the correct account/team/Gameweek, and a refund removes it, before announcing payments to users.

Dodo's test and live modes have separate products, keys, and webhooks. The test key and webhook secret currently live only in the ignored local `.env` file.
