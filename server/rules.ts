import { z } from "zod";
export const metricNames = {
  precipitation_mm: "Rainfall",
  temperature_c: "Temperature",
  wind_kmh: "Wind speed",
};
export const units = {
  precipitation_mm: "mm",
  temperature_c: "°C",
  wind_kmh: "km/h",
};
export const ruleSchema = z.object({
  metric: z.enum(["precipitation_mm", "temperature_c", "wind_kmh"]),
  aggregation: z.enum(["sum", "max", "min"]),
  operator: z.enum([">", ">=", "<", "<="]),
  threshold: z.number().finite().min(-100).max(1000),
  refund: z.object({
    kind: z.enum(["percent", "fixed"]),
    value: z.number().positive().max(100000),
  }),
  assumptions: z.array(z.string().max(300)).max(5).default([]),
});
export const offerSchema = z.object({
  title: z.string().trim().min(3).max(120),
  price_cents: z.number().int().min(100).max(100000),
  promise_text: z.string().trim().min(12).max(1000),
  window_start: z.iso.datetime(),
  window_end: z.iso.datetime(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    label: z.string().min(2).max(120),
  }),
  tz: z.string().max(80),
});
export type Rule = z.infer<typeof ruleSchema> & {
  location: { lat: number; lon: number; label: string };
  window: { start: string; end: string; tz: string };
  plain_summary: string;
};
export function validateRule(raw: unknown, price: number) {
  const r = ruleSchema.parse(raw);
  if (r.refund.kind === "percent" && r.refund.value > 100)
    throw new Error("A refund cannot exceed 100%.");
  if (r.refund.kind === "fixed" && Math.round(r.refund.value * 100) > price)
    throw new Error("A refund cannot exceed the offer price.");
  if (refundCents(price, r.refund) < 1)
    throw new Error("A refund must be at least one cent.");
  if (
    r.metric === "precipitation_mm" &&
    (r.aggregation !== "sum" || r.threshold < 0)
  )
    throw new Error("Rainfall must be a non-negative total.");
  if (r.metric !== "precipitation_mm" && r.aggregation === "sum")
    throw new Error("Temperature and wind use minimum or maximum, not totals.");
  return r;
}
export function refundCents(captured: number, refund: Rule["refund"]) {
  return Math.min(
    captured,
    Math.max(
      0,
      Math.round(
        refund.kind === "percent"
          ? (captured * refund.value) / 100
          : refund.value * 100,
      ),
    ),
  );
}
export function compare(
  value: number,
  rule: Pick<Rule, "operator" | "threshold">,
) {
  if (!Number.isFinite(value))
    throw new Error("Evidence must be a finite number.");
  switch (rule.operator) {
    case ">":
      return value > rule.threshold;
    case ">=":
      return value >= rule.threshold;
    case "<":
      return value < rule.threshold;
    case "<=":
      return value <= rule.threshold;
  }
}
export function summary(r: z.infer<typeof ruleSchema>) {
  return `If ${r.aggregation === "sum" ? "total" : r.aggregation === "max" ? "maximum" : "minimum"} ${metricNames[r.metric].toLowerCase()} is ${{ ">": "more than", ">=": "at least", "<": "less than", "<=": "at most" }[r.operator]} ${r.threshold} ${units[r.metric]}, you get ${r.refund.kind === "percent" ? r.refund.value + "%" : "$" + r.refund.value.toFixed(2)} back.`;
}
export function aggregateWeather(
  times: number[],
  values: (number | null)[],
  rule: Rule,
) {
  const start = Date.parse(rule.window.start) / 1000,
    end = Date.parse(rule.window.end) / 1000;
  // Open-Meteo precipitation describes the preceding hour, so include (start, end].
  const selected = times
    .map((t, i) => ({ t, v: values[i] }))
    .filter(({ t }) =>
      rule.metric === "precipitation_mm"
        ? t > start && t <= end
        : t >= start && t < end,
    );
  const expected = (end - start) / 3600;
  if (
    !selected.length ||
    selected.length !== expected ||
    selected.some(({ v }) => v === null || !Number.isFinite(v))
  )
    throw new Error("Weather evidence is incomplete; no money was moved.");
  const nums = selected.map((x) => x.v as number);
  const value =
    rule.aggregation === "sum"
      ? nums.reduce((a, b) => a + b, 0)
      : rule.aggregation === "max"
        ? Math.max(...nums)
        : Math.min(...nums);
  return { value: Math.round(value * 100) / 100, samples: selected };
}
