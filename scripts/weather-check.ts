import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { summary, type Rule } from "../server/rules";
const end = new Date(
  Math.floor(Date.now() / 3600000) * 3600000 - 3600000,
).toISOString();
const start = new Date(Date.parse(end) - 3 * 3600000).toISOString();
const oid = randomUUID(),
  pid = randomUUID();
const rule: Rule = {
  metric: "precipitation_mm",
  aggregation: "sum",
  operator: ">",
  threshold: 5,
  refund: { kind: "percent", value: 50 },
  assumptions: ["Weather integration verification; demo payment only."],
  location: { lat: 37.7749, lon: -122.4194, label: "San Francisco, CA" },
  window: { start, end, tz: "UTC" },
  plain_summary: "",
};
rule.plain_summary = summary(rule);
const quote = (s: string) => "'" + s.replaceAll("'", "''") + "'";
fs.mkdirSync("test-results", { recursive: true });
fs.writeFileSync(
  "test-results/weather-fixture.sql",
  `INSERT INTO offers(id,title,price_cents,promise_text,rule_json,window_start,window_end) VALUES('${oid}','Weather evidence check (demo)',2000,'${rule.plain_summary}',${quote(JSON.stringify(rule))},'${start}','${end}');
INSERT INTO promises(id,offer_id,paypal_order_id,paypal_capture_id,captured_cents,status,mode) VALUES('${pid}','${oid}','DEMO-${pid}','DEMO-CAPTURE-${pid}',2000,'watching','demo');
INSERT INTO events(promise_id,kind,detail_json) VALUES('${pid}','paid','{"message":"Integration test fixture: simulated payment, no money moved."}');`,
);
function run(args: string[]) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", ...args],
    { encoding: "utf8" },
  );
  if (result.status) throw new Error(result.stderr || result.stdout);
  console.log(result.stdout);
}
run([
  "d1",
  "execute",
  "pinky-promise",
  "--remote",
  "--file",
  "test-results/weather-fixture.sql",
]);
run([
  "workflows",
  "trigger",
  "pinky-settle-promise",
  JSON.stringify({ promiseId: pid }),
]);
console.log(
  "Real weather receipt: https://pinky-promise.aiconic-innovations.workers.dev/p/" +
    pid,
);
fs.writeFileSync(
  "test-results/weather-receipt.json",
  JSON.stringify({ promiseId: pid, offerId: oid }),
);
