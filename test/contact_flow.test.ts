import assert from "node:assert/strict";
import { test } from "node:test";
import { contactSchema, routeContact, type InfraiPort } from "../src/marketplace_contact.ts";

const input = contactSchema.parse({
  kind: "order_handoff", submissionId: "5f38b45c-68a0-4f21-91ad-92ea32b84911",
  captchaWidgetRecordId: "widget-42",
  captchaToken: "test-token", email: "buyer@example.com", name: "Morgan",
  orderId: "order-42", handoff: "Send the signed files to the buyer"
});

test("verified order handoff goes to the team inbox with its submission ID", async () => {
  const calls: unknown[] = [];
  const infrai: InfraiPort = {
    captcha: { verify: async body => { calls.push(body); return {}; } },
    email: { send: async (body, id) => {
      calls.push({ body, id });
      return { message_id: "msg-42" };
    } }
  };
  assert.deepEqual(await routeContact(input, "team@example.com", infrai),
    { submissionId: input.submissionId, messageId: "msg-42" });
  assert.deepEqual(calls[0], { widget_record_id: "widget-42", token: "test-token" });
  assert.deepEqual(calls[1], {
    body: { to: "team@example.com", subject: "[Marketplace] Order handoff",
      body: `From: Morgan <buyer@example.com>\nSubmission: ${input.submissionId}\nOrder: order-42\nHandoff: Send the signed files to the buyer` },
    id: input.submissionId
  });
});

test("rejected captcha does not send an email", async () => {
  let sends = 0;
  const infrai: InfraiPort = {
    captcha: { verify: async () => { throw new Error("Rejected"); } },
    email: { send: async () => { sends++; return { message_id: "unused" }; } }
  };
  await assert.rejects(routeContact(input, "team@example.com", infrai));
  assert.equal(sends, 0);
});
