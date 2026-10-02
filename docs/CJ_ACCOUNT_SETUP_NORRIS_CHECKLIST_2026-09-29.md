# CJdropshipping Account Setup — Norris Checklist

Date: 2026-09-29

## Do this only when the CJ offline qualification build is green

This is the first human step for connecting CJ to Norvana.

### In CJdropshipping

1. Sign in to your CJdropshipping account.
2. Open **Apps** in the left menu.
3. Open **Install App**.
4. Find **API** under the app store and install it if it is not already installed.
5. Open the CJ **API** page.
6. Click **Add API**.
7. Use a clear name such as:
   `Norvana Read Only Proving`
8. Choose type:
   `API Key`
9. Confirm the new API entry.

## Important

Do **not** paste the API key into:

- ChatGPT
- GitHub
- Slack
- screenshots
- source code
- a text file

The key will be entered directly into the approved Norvana backend secret store when the connector is ready.

## What happens after that

Norvana will use the key only to obtain a backend CJ access token.

The first real test will only read:

- a small product search;
- one product;
- variants;
- stock;
- warehouse information;
- a freight quote.

Then Norvana stops.

No product is published.
No order is placed.
No money is spent.

## If anything on the CJ screen differs

Stop and show the screen before creating or copying the key.

CJ's account UI can change even when the API itself remains compatible.
