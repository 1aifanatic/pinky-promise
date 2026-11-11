import test from "node:test";
import assert from "node:assert/strict";
import {
  compare,
  refundCents,
  validateRule,
  aggregateWeather,
  type Rule,
} from "../server/rules";
const rule: Rule = {
  metric: "precipitation_mm",
  aggregation: "sum",
  operator: ">",
  threshold: 5,
  refund: { kind: "percent", value: 50 },
  assumptions: [],
  location: { lat: 37.8, lon: -122.4, label: "SF" },
  window: {
    start: "2026-11-12T17:00:00.000Z",
    end: "2026-11-12T20:00:00.000Z",
    tz: "UTC",
  },
  plain_summary: "",
};
test("comparison honors all four threshold boundaries", () => {
  for (const [operator, expected] of [
    [">", false],
    [">=", true],
    ["<", false],
    ["<=", true],
  ] as const)
    assert.equal(compare(5, { operator, threshold: 5 }), expected);
  assert.equal(compare(12, rule), true);
  assert.equal(compare(2, rule), false);
  assert.throws(() => compare(NaN, rule));
});
test("refund math uses captured cents, rounds fractional cents, caps fixed amounts", () => {
  assert.equal(refundCents(2000, rule.refund), 1000);
  assert.equal(refundCents(1999, { kind: "percent", value: 50 }), 1000);
  assert.equal(refundCents(2000, { kind: "fixed", value: 25 }), 2000);
  assert.equal(refundCents(2000, { kind: "fixed", value: 7.25 }), 725);
});
test("rule validation rejects AI attempts to exceed money caps or invent metrics", () => {
  assert.throws(() =>
    validateRule({ ...rule, refund: { kind: "percent", value: 500 } }, 2000),
  );
  assert.throws(() =>
    validateRule({ ...rule, refund: { kind: "fixed", value: 21 } }, 2000),
  );
  assert.throws(() =>
    validateRule({ ...rule, metric: "customer_happiness" }, 2000),
  );
  assert.throws(() => validateRule({ ...rule, aggregation: "max" }, 2000));
  assert.equal(validateRule(rule, 2000).threshold, 5);
});
test("rain totals include the hours ending inside the window, not the preceding hour", () => {
  const start = Date.parse(rule.window.start) / 1000;
  const times = [start, start + 3600, start + 7200, start + 10800];
  assert.equal(aggregateWeather(times, [100, 1, 2, 3], rule).value, 6);
});
test("missing, null, or partial evidence cannot turn into a zero or issue a refund", () => {
  const s = Date.parse(rule.window.start) / 1000;
  assert.throws(() => aggregateWeather([s + 3600], [12], rule));
  assert.throws(() =>
    aggregateWeather([s + 3600, s + 7200, s + 10800], [12, null, 1], rule),
  );
  assert.throws(() => aggregateWeather([], [], rule));
});
test("temperature max uses instantaneous samples in [start, end)", () => {
  const s = Date.parse(rule.window.start) / 1000;
  const r = { ...rule, metric: "temperature_c", aggregation: "max" } as Rule;
  assert.equal(
    aggregateWeather([s, s + 3600, s + 7200, s + 10800], [30, 35, 34, 99], r)
      .value,
    35,
  );
});
