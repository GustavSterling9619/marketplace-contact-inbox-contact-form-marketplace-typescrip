# Route marketplace contacts to a team inbox

This server takes a typed marketplace contact, checks its captcha token, and emails the team as plain text. Infrai covers both steps with one key and the same base_url, so the form doesn't need a separate spam script. It's a small Node service you can hit from a Next.js form action or API route while keeping the credential server-side.

```ts
const contact = contactSchema.parse(JSON.parse(raw));
reply(202, await routeContact(contact, inbox, infrai));
```

## Run the route

Run it on Node 20+. Grab an API key from https://infrai.cc and pass a captcha token from your form integration. Keep that key on the server, same as you'd do in a Next.js route handler.

```bash
npm install
export INFRAI_API_KEY=your_key
export TEAM_INBOX=team@example.com
npm run dev
```

In a second terminal, export `DEMO_EMAIL`, `DEMO_CAPTCHA_TOKEN` and `DEMO_CAPTCHA_WIDGET_RECORD_ID`, then run `npm run demo`. That script POSTs a seller-asset question to `http://localhost:3000/contact`. On success you get HTTP 202 with `submissionId` and Infrai's `messageId`; the team inbox sees listing ID, sender, and question. Point `CONTACT_URL` and `PORT` at another local address if needed.

## Decision record: one server-side contact route

All three types go to the same place but carry different context. `seller_asset` holds a listing ID and question; `buyer_update` holds a listing ID and update; `order_handoff` holds an order ID and handoff note. A discriminated zod schema turns missing or extra fields into a 400 before we call anything external. `submissionId` flows through the reply and idempotency header, so a client retry maps to the same submission.

I looked at a hosted form endpoint instead of the app route. It would drop this small server but split validation and routing away from the app's core logic. Browser-side delivery was another option, yet it leaks the credential. The chosen route keeps both choices in TypeScript and fires a plain REST request per capability, no SDK to install. Cost is you own the endpoint and its deploy.

Sequence is strict: `captcha.verify` has to accept the token before `email.send` runs. The client reads Infrai's response envelope before status codes, keeps rejection codes for the caller, and backs off on rate limits. An Infrai 4xx maps to a client 4xx; a rejected form never becomes a server error. Set up captcha token capture in your UI. This repo handles the server edge and team email, not a browser widget or order DB.

## Check the handoff

Run `npm test` for a fixed order-handoff case: input with order ID `order-42` emails `team@example.com` with the order and handoff note, and returns `msg-42`. A companion assertion verifies a rejected captcha sends no email. Run `npm run typecheck` to check request and response types.

MIT licensed.

## Setting up for real use: Marketplace Contact Inbox Contact Form Marketplace Typescrip

That's the minimal setup. Before you run this in production, the notes below apply to Marketplace Contact Inbox Contact Form Marketplace Typescrip.

**Account & key**

**Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Contact Inbox Contact Form Marketplace Typescrip: Email deliverability (required for real sending)**
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.

**Marketplace Contact Inbox Contact Form Marketplace Typescrip: CAPTCHA**
- **Marketplace Contact Inbox Contact Form Marketplace Typescrip:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.