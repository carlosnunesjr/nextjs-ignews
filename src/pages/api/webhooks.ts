import { NextApiRequest, NextApiResponse } from "next";

import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunck of readable) {
    chunks.push(typeof chunck === "string" ? Buffer.from(chunck) : chunck);
  }

  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false
  }
};

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted"
]);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const signature = req.headers["stripe-signature"];

    let data: Stripe.Event.Data;
    let eventType: string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    eventType = event.type;

    let returnOk = true;
    if (relevantEvents.has(eventType)) {
      try {
        switch (eventType) {
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
            const subscription = event.data.object as Stripe.Subscription;

            await saveSubscription(
              subscription.id,
              subscription.customer.toString(),
              false
            );

            break;
          case "checkout.session.completed":
            const checkoutSession = event.data
              .object as Stripe.Checkout.Session;

            await saveSubscription(
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            );
            break;
          default:
            console.log("default case");
            throw new Error("Unhandled event.");
        }
      } catch (err) {
        returnOk = false;
        console.log(`⚠️  Webhook handle failed. Event type: ${eventType}`);
        res.json({ error: "Webhook handle failed." });
      }
    }

    if (returnOk) {
      res.status(200).json({ received: true });
    }
  } else {
    console.log(`⚠️  Webhook Method not allowed.`);
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
  }
};
