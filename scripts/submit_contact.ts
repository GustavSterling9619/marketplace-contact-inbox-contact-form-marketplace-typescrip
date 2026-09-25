const endpoint = process.env.CONTACT_URL ?? "http://localhost:3000/contact";
const email = process.env.DEMO_EMAIL;
const captchaToken = process.env.DEMO_CAPTCHA_TOKEN;
const captchaWidgetRecordId = process.env.DEMO_CAPTCHA_WIDGET_RECORD_ID;
if (!email || !captchaToken || !captchaWidgetRecordId) {
  throw new Error("DEMO_EMAIL, DEMO_CAPTCHA_TOKEN and DEMO_CAPTCHA_WIDGET_RECORD_ID are required");
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    kind: "seller_asset",
    submissionId: crypto.randomUUID(),
    captchaWidgetRecordId,
    captchaToken,
    email,
    name: "Morgan",
    assetId: "listing-42",
    question: "Is the source file included?"
  })
});
console.log(response.status, await response.json());
