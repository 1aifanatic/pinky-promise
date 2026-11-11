# Validation — November 11, 2026

Deployed on Cloudflare Workers at https://pinky-promise.aiconic-innovations.workers.dev.

| Check | Result |
| --- | --- |
| TypeScript + Vite production build | Pass |
| Numeric rules, strict/inclusive boundaries, cents, caps, incomplete weather | 6 tests pass |
| Workers AI rain, temperature, wind compilation | Pass against live model |
| Subjective and multi-condition guarantees | Rejected with explanation/rewrite |
| Missing details | Safely rejected with rewrite (model may reject rather than ask a question) |
| Seller login, offer confirmation, shareable checkout | Pass in Chrome |
| Demo payment → durable workflow → 50% refund | Pass: 2000 cents captured, 1000 cents simulated refund |
| Duplicate simulation after settlement | HTTP 409; no second refund |
| Real weather workflow | Pass: three hourly samples, 0 mm, promise kept |
| Unauthorized seller API access | HTTP 401 |
| Unsigned webhook | HTTP 400 |
| PayPal sandbox OAuth and Orders creation | Pass |
| PayPal JS SDK and approval popup | Loaded successfully |
| PayPal capture/refund with personal buyer | Pending separate personal buyer; provided account is merchant |
| PayPal webhook subscription | Registered for capture and refund, ID installed as secret |
| Signed webhook delivery | Pending actual sandbox capture/refund |
| AI Gateway provisioning | Cloudflare OAuth returned 403; optional routing is implemented but disabled |
| Mobile 390px | No horizontal overflow |
| Browser JavaScript exceptions | None in the full demo flow |

Evidence receipts (test data; no real money):

- [Simulated rain and refund](https://pinky-promise.aiconic-innovations.workers.dev/p/e055ce18-d578-443a-ae32-11003fc82fbd)
- [Actual Open-Meteo evidence](https://pinky-promise.aiconic-innovations.workers.dev/p/4a05f1bd-8a77-4231-abd3-cc3906899a24)

Screenshots are in ignored `test-results/`. Commands to reproduce checks are in the README. No claim is made that a real PayPal sandbox refund has completed until the personal-buyer flow is verified.
