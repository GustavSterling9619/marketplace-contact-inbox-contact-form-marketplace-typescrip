import { z } from "zod";

export const contactSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("seller_asset"),
    submissionId: z.string().uuid(),
    captchaWidgetRecordId: z.string().min(1),
    captchaToken: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    assetId: z.string().min(1).max(100),
    question: z.string().min(1).max(2000)
  }).strict(),
  z.object({
    kind: z.literal("buyer_update"),
    submissionId: z.string().uuid(),
    captchaWidgetRecordId: z.string().min(1),
    captchaToken: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    assetId: z.string().min(1).max(100),
    update: z.string().min(1).max(2000)
  }).strict(),
  z.object({
    kind: z.literal("order_handoff"),
    submissionId: z.string().uuid(),
    captchaWidgetRecordId: z.string().min(1),
    captchaToken: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    orderId: z.string().min(1).max(100),
    handoff: z.string().min(1).max(2000)
  }).strict()
]);

export type Contact = z.infer<typeof contactSchema>;

export function inboxMessage(contact: Contact) {
  const detail = contact.kind === "seller_asset"
    ? `Asset: ${contact.assetId}\nQuestion: ${contact.question}`
    : contact.kind === "buyer_update"
      ? `Asset: ${contact.assetId}\nUpdate: ${contact.update}`
      : `Order: ${contact.orderId}\nHandoff: ${contact.handoff}`;
  const subject = contact.kind === "seller_asset" ? "Seller asset inquiry"
    : contact.kind === "buyer_update" ? "Buyer update" : "Order handoff";
  return {
    subject: `[Marketplace] ${subject}`,
    body: `From: ${contact.name} <${contact.email}>\nSubmission: ${contact.submissionId}\n${detail}`
  };
}

export type InfraiPort = {
  captcha: { verify: (body: { widget_record_id: string; token: string }) => Promise<unknown> };
  email: { send: (body: { to: string; subject: string; body: string }, id: string) => Promise<{ message_id: string }> };
};

export async function routeContact(contact: Contact, inbox: string, infrai: InfraiPort) {
  await infrai.captcha.verify({
    widget_record_id: contact.captchaWidgetRecordId,
    token: contact.captchaToken
  });
  const message = inboxMessage(contact);
  const sent = await infrai.email.send({ to: inbox, ...message }, contact.submissionId);
  return { submissionId: contact.submissionId, messageId: sent.message_id };
}
