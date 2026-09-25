import { createServer } from "node:http";
import { ZodError } from "zod";
import { contactSchema, routeContact } from "./marketplace_contact.ts";
import { infrai, InfraiError } from "./infrai_client.ts";

const inbox = process.env.TEAM_INBOX;
if (!inbox || !process.env.INFRAI_API_KEY) throw new Error("TEAM_INBOX and INFRAI_API_KEY are required");

createServer(async (req, res) => {
  const reply = (status: number, body: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (req.method !== "POST" || req.url !== "/contact") {
    reply(404, { error: "Route not found" });
    return;
  }
  try {
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 16000) {
        reply(413, { error: "Request too large" });
        return;
      }
    }
    const contact = contactSchema.parse(JSON.parse(raw));
    reply(202, await routeContact(contact, inbox, infrai));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      reply(400, { error: "Invalid contact form", details: error instanceof ZodError ? error.flatten() : undefined });
    } else if (error instanceof InfraiError) {
      reply(error.status >= 400 && error.status < 500 ? error.status : 502,
        { error: error.code, message: error.message });
    } else {
      reply(502, { error: "Unable to submit contact" });
    }
  }
}).listen(Number(process.env.PORT ?? 3000), () => console.log("Contact route listening"));
