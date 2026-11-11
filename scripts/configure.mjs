import fs from "node:fs";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";
const env = fs.existsSync(".env.local")
  ? parseEnv(fs.readFileSync(".env.local", "utf8"))
  : {};
const secrets = {
  DASHBOARD_PASSCODE: env.DASHBOARD_PASSCODE || "pinky-demo",
  PAYPAL_CLIENT_ID: env.PAYPAL_CLIENT_ID || env.CLIENT_ID,
  PAYPAL_CLIENT_SECRET: env.PAYPAL_CLIENT_SECRET || env.CLIENT_SECRET,
  PAYPAL_WEBHOOK_ID: env.PAYPAL_WEBHOOK_ID,
};
for (const key of Object.keys(secrets)) if (!secrets[key]) delete secrets[key];
if (secrets.PAYPAL_CLIENT_ID && secrets.PAYPAL_CLIENT_SECRET) {
  const r = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          secrets.PAYPAL_CLIENT_ID + ":" + secrets.PAYPAL_CLIENT_SECRET,
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok)
    throw new Error("PayPal sandbox authentication failed: " + r.status);
  console.log("PayPal sandbox credentials verified.");
  const auth = await r.json();
  if (!secrets.PAYPAL_WEBHOOK_ID) {
    const wh = await fetch(
      "https://api-m.sandbox.paypal.com/v1/notifications/webhooks",
      { headers: { Authorization: "Bearer " + auth.access_token } },
    );
    if (wh.ok) {
      const data = await wh.json();
      const existing = data.webhooks?.find(
        (w) =>
          w.url ===
          "https://pinky-promise.aiconic-innovations.workers.dev/api/paypal/webhook",
      );
      if (existing) {
        secrets.PAYPAL_WEBHOOK_ID = existing.id;
        console.log("Found matching PayPal webhook.");
      }
    }
    if (!secrets.PAYPAL_WEBHOOK_ID && process.argv.includes("--webhook")) {
      const res = await fetch(
        "https://api-m.sandbox.paypal.com/v1/notifications/webhooks",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + auth.access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: "https://pinky-promise.aiconic-innovations.workers.dev/api/paypal/webhook",
            event_types: [
              { name: "PAYMENT.CAPTURE.COMPLETED" },
              { name: "PAYMENT.CAPTURE.REFUNDED" },
            ],
          }),
        },
      );
      if (!res.ok)
        throw new Error("Webhook registration failed: " + res.status);
      secrets.PAYPAL_WEBHOOK_ID = (await res.json()).id;
      console.log("PayPal webhook registered for capture and refund events.");
    }
  }
}
if (process.argv.includes("--local")) {
  fs.writeFileSync(
    ".dev.vars",
    Object.entries(secrets)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join("\n"),
  );
  console.log("Local Worker secrets written to ignored .dev.vars.");
} else {
  const result = spawnSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", "secret", "bulk"],
    { input: JSON.stringify(secrets), encoding: "utf8" },
  );
  console.log(result.stdout);
  if (result.status) {
    console.error(result.stderr);
    process.exit(result.status);
  }
}
