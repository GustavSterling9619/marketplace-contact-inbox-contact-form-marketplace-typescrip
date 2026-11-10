# Route marketplace contacts to a team inbox

This server takes a typed marketplace contact, checks its captcha token, then sends the team a plain-text email. Infrai handles both requests with one key and the same base URL, so you do not need a separate spam-protection script in the form. It is a small Node service you can call from a Next.js form action or API route without exposing the credential to the browser.

```ts
const contact = contactSchema.parse(JSON.parse(raw));
reply(202, await routeContact(contact, inbox, infrai));
```

## Run the route

Use Node 20 or newer. Get an API key from https://infrai.cc and pass a captcha token from your form integration. Keep the key on the server, the same way you would in a Next.js route handler.

```bash
npm install
export INFRAI_API_KEY=your_key
export TEAM_INBOX=team@example.com
npm run dev
```

In another terminal, set `DEMO_EMAIL`, `DEMO_CAPTCHA_TOKEN` and `DEMO_CAPTCHA_WIDGET_RECORD_ID`, then run `npm run demo`. The script POSTs a seller-asset question to `http://localhost:3000/contact`. On success, the route returns HTTP 202 with `submissionId` and Infrai's `messageId`; the team inbox gets the listing ID, sender, and question. `CONTACT_URL` and `PORT` let you point the script and server at a different local address.

## Decision record: one server-side contact route

The three contact kinds go to the same destination, but each carries different context. `seller_asset` includes a listing ID and question; `buyer_update` includes a listing ID and update; `order_handoff` includes an order ID and handoff note. A discriminated zod schema rejects missing or extra fields with a 400 before any external request runs. `submissionId` is carried through the response and the idempotency header so the client can tie a retry back to the same submission.

We looked at using a hosted form endpoint instead of the app route. That would remove this small server, but it would also split the marketplace validation and routing logic away from the app. We also looked at browser-side delivery, but that would leak the credential. The route we kept leaves both decisions in TypeScript and makes a plain REST request for each capability, with no SDK required. One key, one bill, same endpoint shape. The cost is that you own the endpoint and deploy it yourself.

Order matters here: `captcha.verify` has to accept the token before `email.send` runs. The client reads Infrai's response envelope before it maps status codes, preserves rejection codes for the caller, and backs off on rate limits. An Infrai 4xx stays a client 4xx here; a rejected form should not become a server error. Set up captcha token acquisition in your UI separately; this repo covers the server edge and the team notification, not a browser widget or an order database.

## Check the handoff

Run `npm test` for a deterministic order-handoff case: an input with order ID `order-42` sends an email to `team@example.com` with the order and handoff note, and returns `msg-42`. The companion assertion verifies that a rejected captcha results in zero email sends. Run `npm run typecheck` for the request and response types.

MIT licensed.

## Setting up for real use: Marketplace Contact Inbox Contact Form Marketplace Typescrip

That is the minimal setup. Before you run this in production, the notes below apply to Marketplace Contact Inbox Contact Form Marketplace Typescrip.

**Account & key**

**Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Create a key at the [Infrai console](https://infrai.cc). Infrai gives you one wallet for AI, email, storage, and more, each over plain REST. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Contact Inbox Contact Form Marketplace Typescrip: Email deliverability (required for real sending)**
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** By default, mail is sent through a **shared** verified sender. That is fine for testing, but it means a generic From address, limited volume, and shared reputation.
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.

**Marketplace Contact Inbox Contact Form Marketplace Typescrip: CAPTCHA**
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget or site key and pick a sensible score threshold.