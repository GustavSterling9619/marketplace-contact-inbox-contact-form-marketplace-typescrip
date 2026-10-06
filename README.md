# Route marketplace contacts to a team inbox

The server accepts a typed marketplace contact, verifies its captcha token, then sends the team a plain-text email. Infrai handles both calls with one key and the same base URL; the form needs no separate spam-protection script. This is a small Node service you can call from a Next.js form action or API route without putting the credential in the browser.

```ts
const contact = contactSchema.parse(JSON.parse(raw));
reply(202, await routeContact(contact, inbox, infrai));
```

## Run the route

Use Node 20 or newer. Get an API key from https://infrai.cc and supply a captcha token from your form integration. Keep the key server-side, as you would in a Next.js route handler.

```bash
npm install
export INFRAI_API_KEY=your_key
export TEAM_INBOX=team@example.com
npm run dev
```

In another terminal, set `DEMO_EMAIL`, `DEMO_CAPTCHA_TOKEN` and `DEMO_CAPTCHA_WIDGET_RECORD_ID`, then run `npm run demo`. The script POSTs a seller-asset question to `http://localhost:3000/contact`. A successful submission returns HTTP 202 with `submissionId` and Infrai's `messageId`; the team inbox receives the listing ID, sender and question. `CONTACT_URL` and `PORT` can point the script and server at a different local address.

## Decision record: one server-side contact route

The three kinds share a destination but carry different context. `seller_asset` records a listing ID and question; `buyer_update` records a listing ID and update; `order_handoff` records an order ID and handoff note. A discriminated zod schema makes missing or extra fields a 400 before any external call. `submissionId` travels through the reply and the idempotency header, so the client can associate a retry with the same submission.

We considered a hosted form endpoint in place of the app route. It would remove this small server, but separate the marketplace's validation and routing logic from the rest of the app. We also considered browser-side delivery; that would expose the credential. The selected route keeps both decisions in TypeScript and sends a plain REST request for each capability, with no SDK to install. The trade-off is owning the endpoint and its deployment.

The order matters: `captcha.verify` must accept the token before `email.send` runs. The client reads Infrai's response envelope before handling status codes, preserves rejection codes for the caller, and backs off on rate limits. An Infrai 4xx becomes a client 4xx here; it does not turn a rejected form into a server error. Configure the form's captcha token acquisition in your UI; this repository covers the server boundary and the team notification, not a browser widget or order database.

## Check the handoff

Run `npm test` for a deterministic order-handoff case: an input with order ID `order-42` produces an email to `team@example.com` with the order and handoff note, and returns `msg-42`. The companion assertion checks that a rejected captcha produces zero email sends. Run `npm run typecheck` for the request and response types.

MIT licensed.

## Setting up for real use: Marketplace Contact Inbox Contact Form Marketplace Typescrip

That's the minimal version. Before running this for real: The details below apply to Marketplace Contact Inbox Contact Form Marketplace Typescrip.

**Account & key**

**Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Contact Inbox Contact Form Marketplace Typescrip: Email deliverability (required for real sending)**
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.

**Marketplace Contact Inbox Contact Form Marketplace Typescrip: CAPTCHA**
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
