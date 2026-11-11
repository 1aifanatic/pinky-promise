import { chromium } from "@playwright/test";
import fs from "node:fs";
const base =
  process.env.TEST_URL ||
  "https://pinky-promise.aiconic-innovations.workers.dev";
fs.mkdirSync("test-results", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  console.log("Loading landing page");
  await page.goto(base);
  await page.getByRole("heading", { name: "Good on your word." }).waitFor();
  await page.screenshot({ path: "test-results/landing.png", fullPage: true });
  await page.goto(base + "/sell");
  await page.getByLabel("Workspace passcode").fill("pinky-demo");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await page.getByRole("heading", { name: "Good on your word." }).waitFor();
  console.log("Compiling a real AI rule");
  await page
    .getByRole("button", { name: "Create a promise", exact: true })
    .click();
  await page.getByRole("button", { name: "Preview my promise" }).click();
  await page
    .getByRole("button", { name: "Confirm & publish" })
    .waitFor({ timeout: 90000 });
  await page.getByRole("button", { name: "Confirm & publish" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await page.getByRole("link", { name: "View offer" }).first().waitFor();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await page.getByRole("link", { name: "View offer" }).first().click();
  await page
    .getByRole("heading", { name: "Golden Gate walking tour", exact: true })
    .waitFor();
  await page.screenshot({ path: "test-results/checkout.png", fullPage: true });
  console.log("Running labeled demo checkout");
  await page.getByRole("button", { name: "Try demo checkout" }).click();
  await page.waitForURL("**/p/**");
  await page.getByRole("heading", { name: "Go enjoy the moment." }).waitFor();
  const receipt = page.url();
  const pid = receipt.split("/").pop();
  console.log("Simulating rainfall through workflow");
  const response = await page.request.post(
    `${base}/api/promises/${pid}/simulate`,
    { data: { value: 12 } },
  );
  if (!response.ok()) throw new Error(await response.text());
  await page
    .getByRole("heading", { name: "Promise broken. Trust kept." })
    .waitFor({ timeout: 120000 });
  await page.getByRole("heading", { name: "Demo refund recorded" }).waitFor();
  await page.screenshot({ path: "test-results/receipt.png", fullPage: true });
  const data = await (
    await page.request.get(base + "/api/promises/" + pid)
  ).json();
  if (
    data.refund_cents !== 1000 ||
    data.mode !== "demo" ||
    !data.evidence.simulated
  )
    throw new Error("Wrong settlement result");
  const duplicate = await page.request.post(
    `${base}/api/promises/${pid}/simulate`,
    { data: { value: 12 } },
  );
  if (duplicate.status() !== 409)
    throw new Error("Duplicate settlement was not rejected");
  console.log("Verifying mobile layout");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/sell");
  await page.getByRole("link", { name: "View offer" }).first().waitFor();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  if (overflow) throw new Error("Mobile overflow");
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    JSON.stringify({
      result: "PASS",
      receipt,
      refundCents: data.refund_cents,
      duplicateStatus: duplicate.status(),
      browserErrors: errors,
      mobileOverflow: overflow,
    }),
  );
} catch (e) {
  await page.screenshot({ path: "test-results/failure.png", fullPage: true });
  throw e;
} finally {
  await browser.close();
}
