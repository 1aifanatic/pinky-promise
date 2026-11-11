import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  Plus,
  CloudRain,
  ShieldCheck,
  Clock3,
  MapPin,
  Sparkles,
  X,
  Copy,
  ExternalLink,
  CircleHelp,
  LayoutDashboard,
  FileHeart,
  Activity,
  Settings2,
  HeartHandshake,
  LoaderCircle,
  Menu,
  CheckCircle2,
  RotateCcw,
  LockKeyhole,
  Sun,
  Wind,
  Thermometer,
  BookOpen,
} from "lucide-react";
import type { Rule } from "../server/rules";
import { units, metricNames, refundCents } from "../server/rules";
import "./styles.css";
type Offer = {
  id: string;
  title: string;
  price_cents: number;
  promise_text: string;
  window_start: string;
  window_end: string;
  rule: Rule;
};
type PromiseRow = {
  id: string;
  title: string;
  status: string;
  mode: string;
  captured_cents: number;
  refund_cents: number;
  paypal_refund_id: string;
  rule: Rule;
  created_at: string;
  explanation_buyer: string;
  events: {
    id: number;
    kind: string;
    created_at: string;
    detail: { message: string; reference?: string };
  }[];
  evidence?: {
    value: number;
    simulated: boolean;
    source: string;
    sourceUrl?: string;
  };
};
const money = (c: number = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(c / 100);
const date = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const time = (d: string) =>
  new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
const statusLabel: Record<string, string> = {
  pending: "Awaiting payment",
  watching: "Watching",
  settling: "Checking evidence",
  broken_refunded: "Refunded",
  kept: "Promise kept",
  needs_review: "Needs review",
  failed: "Failed",
};
async function api(path: string, body?: unknown) {
  const res = await fetch("/api" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: any = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Something went wrong. Please retry.");
  return data;
}
function Mark() {
  return (
    <span className="mark">
      <HeartHandshake size={24} strokeWidth={1.8} />
    </span>
  );
}
function Brand() {
  return (
    <a href="/" className="brand">
      <Mark />
      <span>
        pinky promise<span className="brand-dot">.</span>
      </span>
    </a>
  );
}
function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status}`}>
      <i />
      {statusLabel[status] || status}
    </span>
  );
}
function Busy() {
  return <LoaderCircle className="spin" size={18} />;
}
function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div role="alert" className="error-box">
      {message}
    </div>
  ) : null;
}
function TourArt({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`tour-art ${small ? "small" : ""}`}
      aria-label="Illustration of a sunny Golden Gate Bridge over San Francisco Bay"
      role="img"
    >
      <svg viewBox="0 0 600 310" preserveAspectRatio="xMidYMid slice">
        <rect width="600" height="310" fill="#e9eee5" />
        <circle cx="462" cy="75" r="37" fill="#f6c369" />
        <path d="M0 163Q74 102 153 158T325 152T600 164V310H0Z" fill="#a9b8a0" />
        <path d="M0 196Q90 164 170 205T390 184T600 210V310H0Z" fill="#87a78e" />
        <path d="M0 236Q170 214 310 230T600 217V310H0Z" fill="#9fbdbb" />
        <path
          d="M0 271Q135 242 280 263T600 258M100 291H216M330 284H467"
          fill="none"
          stroke="#d9e4d9"
          strokeWidth="3"
        />
        <g stroke="#b55742" fill="none">
          <path d="M135 243V87h18v156M405 245V109h16v136" strokeWidth="8" />
          <path
            d="M144 92Q281 266 413 113M144 92Q80 190 0 195M413 113Q490 217 600 201"
            strokeWidth="4"
          />
          <path d="M0 222L600 237" strokeWidth="12" />
          <path
            d="M173 124V224M205 162V225M239 186V226M272 199V227M307 201V229M340 186V230M376 154V231M450 159V232M490 187V234M530 201V236M90 156V224M48 184V224"
            strokeWidth="2"
          />
          <path d="M135 123h18m-18 39h18m252-24h16m-16 39h16" strokeWidth="5" />
        </g>
        <path
          d="M0 295Q62 257 121 310H0M510 310Q555 257 600 277V310"
          fill="#435e50"
        />
        <path
          d="M310 64q8-8 16 0q8-8 16 0M351 85q6-6 12 0q6-6 12 0"
          stroke="#687967"
          fill="none"
          strokeWidth="2"
        />
      </svg>
      <span className="art-label">
        <MapPin size={12} /> San Francisco, CA
      </span>
    </div>
  );
}
function RuleCard({
  rule,
  price,
  compact = false,
}: {
  rule: Rule;
  price: number;
  compact?: boolean;
}) {
  const Metric =
    rule.metric === "precipitation_mm"
      ? CloudRain
      : rule.metric === "wind_kmh"
        ? Wind
        : Thermometer;
  return (
    <div className={`rule-card ${compact ? "compact" : ""}`}>
      <div className="rule-top">
        <span>
          <ShieldCheck size={16} /> THE PINKY PROMISE
        </span>
        <span className="rule-verified">
          <Check size={12} /> Verified rule
        </span>
      </div>
      <div className="rule-body">
        <div className="rule-icon">
          <Metric size={25} />
        </div>
        <div>
          <h3>{rule.plain_summary}</h3>
          <p>Checked automatically. No claim needed.</p>
        </div>
      </div>
      <div className="rule-facts">
        <div>
          <span>THE CONDITION</span>
          <strong>
            {metricNames[rule.metric]} {rule.operator} {rule.threshold}{" "}
            {units[rule.metric]}
          </strong>
        </div>
        <ArrowRight size={17} />
        <div>
          <span>THE GUARANTEE</span>
          <strong>
            {money(refundCents(price, rule.refund))} back{" "}
            <small>
              {rule.refund.kind === "percent" ? `(${rule.refund.value}%)` : ""}
            </small>
          </strong>
        </div>
      </div>
      {!compact && (
        <div className="rule-source">
          <Activity size={13} /> Open-Meteo ·{" "}
          {rule.aggregation === "sum"
            ? "Total"
            : rule.aggregation === "max"
              ? "Maximum"
              : "Minimum"}{" "}
          over your window
        </div>
      )}
    </div>
  );
}
function App() {
  const [config, setConfig] = useState<any>(null);
  useEffect(() => {
    api("/config")
      .then(setConfig)
      .catch(() => setConfig({ mode: "demo" }));
  }, []);
  const path = location.pathname;
  if (path.startsWith("/o/"))
    return <Checkout id={path.split("/")[2]} config={config} />;
  if (path.startsWith("/p/"))
    return <Receipt id={path.split("/")[2]} config={config} />;
  if (path === "/sell") return <Dashboard config={config} />;
  return <Landing />;
}
function Landing() {
  return (
    <>
      <header className="public-header">
        <Brand />
        <nav>
          <a href="#how-it-works">How it works</a>
          <a href="/sell" className="btn dark">
            Open workspace <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>
      <main className="landing">
        <div className="landing-copy">
          <span className="eyebrow">
            <span className="tiny-dot" /> A LITTLE PROMISE. A LOT OF TRUST.
          </span>
          <h1>
            Good on
            <br />
            your <em>word.</em>
          </h1>
          <p>
            Give your customers a promise they can count on. If it breaks, their
            money finds its way back. Automatically.
          </p>
          <a className="btn coral large" href="/sell">
            Make your first promise <ArrowUpRight size={19} />
          </a>
          <div className="landing-note">
            <ShieldCheck size={16} /> Built with PayPal sandbox & Cloudflare
          </div>
        </div>
        <div className="landing-visual">
          <div className="floating-note">
            a guarantee that actually guarantees ↘
          </div>
          <div className="landing-ticket">
            <TourArt />
            <div className="ticket-content">
              <span className="eyebrow">
                EXPERIENCES WITH A LITTLE EXTRA TRUST
              </span>
              <h2>A walk on the bright side.</h2>
              <p>Golden Gate walking tour · San Francisco</p>
              <div className="mini-promise">
                <CloudRain size={25} />
                <div>
                  Rain gets in the way?<strong>You get 50% back.</strong>
                </div>
                <ShieldCheck size={21} />
              </div>
              <div className="ticket-bottom">
                <span>
                  We check the weather.
                  <br />
                  <b>You enjoy the moment.</b>
                </span>
                <span className="seal">
                  pinky
                  <br />
                  promised ✓
                </span>
              </div>
            </div>
          </div>
          <div className="refund-toast">
            <span>
              <Check size={20} />
            </span>
            <div>
              Promise broken. Trust kept.
              <small>Illustration · $10.00 returned automatically</small>
            </div>
          </div>
        </div>
      </main>
      <section id="how-it-works" className="how">
        <div>
          <span className="eyebrow">LESS FINE PRINT. MORE FOLLOW-THROUGH.</span>
          <h2>Your word, with a little backup.</h2>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>Say what you mean.</h3>
            <p>
              Write your guarantee in plain English. AI turns it into a clear,
              measurable rule.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Make it a promise.</h3>
            <p>
              Your customer sees the exact guarantee before checking out with
              PayPal.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Let us keep watch.</h3>
            <p>
              We check the evidence. If the promise breaks, the agreed refund
              goes back.
            </p>
          </article>
        </div>
      </section>
      <footer>
        <Brand />
        <span>A hackathon demo. Sandbox money only.</span>
        <a href="/sell">
          Try it yourself <ArrowRight size={14} />
        </a>
      </footer>
    </>
  );
}
function Dashboard({ config }: { config: any }) {
  const [auth, setAuth] = useState(false),
    [checked, setChecked] = useState(false),
    [passcode, setPasscode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(false),
    [tab, setTab] = useState("overview"),
    [data, setData] = useState<{ offers: Offer[]; promises: PromiseRow[] }>({
      offers: [],
      promises: [],
    }),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(""),
    [sim, setSim] = useState<PromiseRow | null>(null),
    [simValue, setSimValue] = useState("12"),
    [notice, setNotice] = useState("");
  const refresh = () =>
    api("/seller/promises")
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    api("/seller/session")
      .then(() => setAuth(true))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);
  useEffect(() => {
    if (!auth) return;
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [auth]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/login", { passcode });
      setAuth(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function simulate(e: React.FormEvent) {
    e.preventDefault();
    if (!sim) return;
    setBusy(true);
    setError("");
    try {
      await api(`/promises/${sim.id}/simulate`, { value: Number(simValue) });
      setNotice("Evidence submitted. Open the receipt to watch it settle.");
      setSim(null);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const active = data.promises.filter(
    (p) => p.status === "watching" || p.status === "settling",
  );
  const exposure = active.reduce(
    (sum, p) => sum + refundCents(p.captured_cents, p.rule.refund),
    0,
  );
  const refunded = data.promises.reduce(
    (sum, p) => sum + (p.refund_cents || 0),
    0,
  );
  if (!checked)
    return (
      <div className="page-loading">
        <Busy /> Opening your workspace…
      </div>
    );
  if (!auth)
    return (
      <>
        <header className="public-header">
          <Brand />
          <a href="/">Back home</a>
        </header>
        <div className="login">
          <div className="icon-tile">
            <LockKeyhole size={25} />
          </div>
          <span className="eyebrow">THE SELLER WORKSPACE</span>
          <h1>Good to have you here.</h1>
          <p>A little more trust starts with you.</p>
          <form onSubmit={login}>
            <label>
              Workspace passcode
              <input
                autoFocus
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter the demo passcode"
                required
              />
            </label>
            <ErrorBox message={error} />
            <button className="btn coral full" disabled={busy}>
              {busy ? (
                <Busy />
              ) : (
                <>
                  Open workspace <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <div className="demo-hint">
            Just exploring? Demo passcode:{" "}
            <button onClick={() => setPasscode("pinky-demo")}>
              pinky-demo <Copy size={12} />
            </button>
          </div>
        </div>
      </>
    );
  return (
    <div className="workspace">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <Brand />
        <span className="nav-label">YOUR WORKSPACE</span>
        <nav>
          {[
            ["overview", "Overview", LayoutDashboard],
            ["offers", "Your offers", FileHeart],
            ["activity", "Promise activity", Activity],
          ].map(([key, label, Icon]: any) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => {
                setTab(key);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              {label}
              {key === "offers" && (
                <span className="nav-count">{data.offers.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-story">
          <span className="tiny-heart">♡</span>
          <h3>
            Small promise.
            <br />
            Big difference.
          </h3>
          <p>You're giving customers one less thing to worry about.</p>
          <a href="/#how-it-works">
            How it works <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setTab("guide")}>
            <CircleHelp size={17} /> Demo guide <ArrowUpRight size={14} />
          </button>
          <div className="profile">
            <span>Y</span>
            <div>
              Your workspace<small>Independent seller</small>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle menu"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={22} />
          </button>
          <span>
            Workspace <ChevronRight size={13} />{" "}
            <b>
              {tab === "overview"
                ? "Overview"
                : tab === "offers"
                  ? "Your offers"
                  : tab === "activity"
                    ? "Promise activity"
                    : "Demo guide"}
            </b>
          </span>
          <div>
            <span className="sandbox-pill">
              <span />{" "}
              {config?.mode === "sandbox"
                ? "PayPal sandbox"
                : "Interactive demo"}
            </span>
            <span className="avatar">Y</span>
          </div>
        </header>
        <main className="dashboard">
          <div className="page-heading">
            <div>
              <div className="eyebrow">A LITTLE TRUST GOES A LONG WAY</div>
              <h1>
                {tab === "overview"
                  ? "Good on your word."
                  : tab === "offers"
                    ? "Promises start here."
                    : tab === "activity"
                      ? "Every promise, accounted for."
                      : "Your two-minute demo."}
              </h1>
              <p>
                {tab === "overview"
                  ? "Your promises are in good hands. Here’s how they’re doing."
                  : tab === "offers"
                    ? "Create an experience your customers can book with confidence."
                    : tab === "activity"
                      ? "Follow the evidence, the decisions, and the money."
                      : "Write it. Book it. Break it. Watch the refund happen."}
              </p>
            </div>
            <button className="btn coral" onClick={() => setModal(true)}>
              <Plus size={18} /> Create a promise
            </button>
          </div>
          <ErrorBox message={error} />
          {notice && (
            <div className="success-box">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {tab === "guide" ? (
            <div className="guide panel">
              <h2>Three clicks closer to trust.</h2>
              <ol>
                <li>
                  <b>Create a promise.</b> Use the walking tour example, compile
                  it with AI, and confirm the exact rule.
                </li>
                <li>
                  <b>Open the checkout link.</b> Use demo checkout, or the
                  PayPal sandbox button when connected.
                </li>
                <li>
                  <b>Simulate 12 mm of rain.</b> In Promise activity, select
                  Simulate. The receipt updates automatically.
                </li>
              </ol>
              <p>
                Demo checkout never moves money. PayPal sandbox transactions are
                test money. Simulated evidence is always labeled.
              </p>
              <p>
                Numeric conditions are checked in code. AI translates your words
                and explains the result.
              </p>
              <button className="btn coral" onClick={() => setModal(true)}>
                Let's make a promise <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <div className="stats">
                    <Stat
                      title="Active promises"
                      value={String(active.length).padStart(2, "0")}
                      note="A little peace of mind, in progress"
                      icon={<ShieldCheck size={20} />}
                      color="sage"
                    />
                    <Stat
                      title="Money on the line"
                      value={money(exposure)}
                      note="Maximum refund on active promises"
                      icon={<HeartHandshake size={20} />}
                      color="peach"
                    />
                    <Stat
                      title="Trust returned"
                      value={money(refunded)}
                      note={`${data.promises.filter((p) => p.status === "broken_refunded").length} promises made right`}
                      icon={<RotateCcw size={20} />}
                      color="lavender"
                    />
                  </div>
                  <section className="welcome-banner">
                    <div>
                      <span className="eyebrow">
                        YOUR WORD. NOW WITH FOLLOW-THROUGH.
                      </span>
                      <h2>
                        Turn “what if” into
                        <br />
                        “we’ve got you.”
                      </h2>
                      <p>
                        Write a promise. We'll watch the evidence.
                        <br />
                        If it breaks, the refund takes care of itself.
                      </p>
                      <button onClick={() => setModal(true)}>
                        Make your first promise <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="banner-art">
                      <div className="rain-doodle">
                        <CloudRain size={61} strokeWidth={1.2} />
                        <span>rain happens.</span>
                      </div>
                      <div className="connector-doodle">⤳</div>
                      <div className="promise-note">
                        <HeartHandshake size={25} />
                        <b>We've got you.</b>
                        <span>50% back, automatically.</span>
                        <div>
                          pinky promised <Check size={12} />
                        </div>
                      </div>
                      <span className="banner-star">✳</span>
                    </div>
                  </section>
                </>
              )}
              {(tab === "overview" || tab === "offers") && (
                <section className="offers-section">
                  <div className="section-heading">
                    <h2>
                      Your offers <span>{data.offers.length}</span>
                    </h2>
                    {tab === "overview" ? (
                      <button onClick={() => setTab("offers")}>
                        View all offers <ArrowRight size={14} />
                      </button>
                    ) : (
                      <input
                        className="search"
                        aria-label="Search offers"
                        placeholder="Find an offer…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="offers-grid">
                    {data.offers
                      .filter((o) =>
                        o.title.toLowerCase().includes(query.toLowerCase()),
                      )
                      .slice(0, tab === "overview" ? 2 : 50)
                      .map((o) => (
                        <OfferCard
                          key={o.id}
                          offer={o}
                          onCopy={() => {
                            navigator.clipboard
                              .writeText(location.origin + "/o/" + o.id)
                              .then(() =>
                                setNotice(
                                  "Checkout link copied. Ready to share.",
                                ),
                              )
                              .catch(() =>
                                setNotice(location.origin + "/o/" + o.id),
                              );
                          }}
                        />
                      ))}
                    <button
                      className="create-card"
                      onClick={() => setModal(true)}
                    >
                      <span>
                        <Plus size={23} />
                      </span>
                      <h3>
                        {data.offers.length
                          ? "Another promise, another possibility."
                          : "Your first promise starts here."}
                      </h3>
                      <p>
                        More confidence for your customers.
                        <br />
                        One sentence from you.
                      </p>
                      <b>
                        Create a new offer <ArrowRight size={14} />
                      </b>
                    </button>
                  </div>
                </section>
              )}
              {(tab === "overview" || tab === "activity") && (
                <section className="activity-section">
                  <div className="section-heading">
                    <h2>Promise activity</h2>
                    <span className="live-note">
                      <i /> Updates automatically
                    </span>
                  </div>
                  <div className="activity-table">
                    <div className="table-head">
                      <span>OFFER & PROMISE</span>
                      <span>AMOUNT</span>
                      <span>STATUS</span>
                      <span>DETAILS</span>
                    </div>
                    {data.promises.length ? (
                      data.promises
                        .slice(0, tab === "overview" ? 4 : 100)
                        .map((p) => (
                          <div className="table-row" key={p.id}>
                            <div>
                              <span className="table-icon">
                                <CloudRain size={19} />
                              </span>
                              <div>
                                <strong>{p.title}</strong>
                                <small>
                                  {date(p.created_at)} ·{" "}
                                  {p.mode === "demo"
                                    ? "Demo payment"
                                    : "PayPal sandbox"}
                                </small>
                              </div>
                            </div>
                            <span>{money(p.captured_cents)}</span>
                            <Badge status={p.status} />
                            <div className="row-actions">
                              {p.status === "watching" && (
                                <button
                                  onClick={() => {
                                    setSim(p);
                                    setSimValue("12");
                                  }}
                                >
                                  Simulate
                                </button>
                              )}
                              <a
                                href={"/p/" + p.id}
                                aria-label={"Open receipt for " + p.title}
                              >
                                <ArrowUpRight size={18} />
                              </a>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="empty-activity">
                        <Activity size={25} />
                        <div>
                          <strong>A quiet start. A good promise ahead.</strong>
                          <p>
                            When someone books an offer, their promise will
                            appear here.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
              <div className="trust-footer">
                <ShieldCheck size={15} />
                <span>
                  AI writes the rule. Code checks the facts. PayPal handles the
                  money.
                </span>
                <span className="demo-text">
                  {config?.mode === "sandbox"
                    ? "Sandbox only · No live money"
                    : "Demo mode · No money moves"}
                </span>
              </div>
            </>
          )}
        </main>
      </div>
      {modal && (
        <CreateModal
          onClose={() => setModal(false)}
          onCreated={() => {
            setModal(false);
            refresh();
            setNotice(
              "Promise published. Your checkout link is ready to share.",
            );
          }}
        />
      )}
      {sim && (
        <Modal
          title="A little rain. A promise kept."
          onClose={() => setSim(null)}
        >
          <p>
            Inject evidence for <b>{sim.title}</b>. It runs through the same
            settlement workflow and is labeled simulated on the receipt.
          </p>
          <form onSubmit={simulate}>
            <label>
              {metricNames[sim.rule.metric]} ({units[sim.rule.metric]})
              <input
                type="number"
                step="0.1"
                required
                min={sim.rule.metric === "temperature_c" ? -100 : 0}
                max="1000"
                value={simValue}
                onChange={(e) => setSimValue(e.target.value)}
              />
            </label>
            <ErrorBox message={error} />
            <div className="demo-hint">
              {sim.mode === "demo"
                ? "Demo payment: no money will move."
                : "This may issue an actual PayPal sandbox refund."}
            </div>
            <button className="btn coral full" disabled={busy}>
              {busy ? (
                <Busy />
              ) : (
                <>
                  <CloudRain size={18} /> Simulate conditions
                </>
              )}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function Stat({
  title,
  value,
  note,
  icon,
  color,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="stat">
      <div>
        <span>{title}</span>
        <span className={`stat-icon ${color}`}>{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}
function OfferCard({ offer: o, onCopy }: { offer: Offer; onCopy: () => void }) {
  return (
    <article className="offer-card">
      <TourArt small />
      <div className="offer-content">
        <div className="offer-title">
          <h3>{o.title}</h3>
          <span>{money(o.price_cents)}</span>
        </div>
        <p className="offer-meta">
          <Clock3 size={12} />
          {date(o.window_start)} · {time(o.window_start)} UTC
        </p>
        <div className="offer-promise">
          <CloudRain size={17} />
          <span>
            {o.rule.refund.kind === "percent"
              ? `${o.rule.refund.value}%`
              : money(o.rule.refund.value * 100)}{" "}
            back if {metricNames[o.rule.metric].toLowerCase()} {o.rule.operator}{" "}
            {o.rule.threshold} {units[o.rule.metric]}
          </span>
        </div>
        <div className="offer-actions">
          <Badge
            status={
              Date.parse(o.window_end) > Date.now() ? "Live offer" : "Closed"
            }
          />
          <div>
            <button aria-label="Copy checkout link" onClick={onCopy}>
              <Copy size={15} />
            </button>
            <a href={"/o/" + o.id}>
              View offer <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const first = ref.current?.querySelector<HTMLElement>("button,input");
    first?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,textarea,select,a[href]",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <span className="eyebrow">A PROMISE WORTH MAKING</span>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
        </div>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
const cities = [
  { label: "San Francisco, CA", lat: 37.7749, lon: -122.4194 },
  { label: "Austin, TX", lat: 30.2672, lon: -97.7431 },
  { label: "New York, NY", lat: 40.7128, lon: -74.006 },
  { label: "Seattle, WA", lat: 47.6062, lon: -122.3321 },
  { label: "Miami, FL", lat: 25.7617, lon: -80.1918 },
];
function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [title, setTitle] = useState("Golden Gate walking tour"),
    [price, setPrice] = useState("20"),
    [day, setDay] = useState(tomorrow),
    [start, setStart] = useState("17:00"),
    [end, setEnd] = useState("20:00"),
    [city, setCity] = useState("0"),
    [text, setText] = useState(
      "If more than 5 mm of rain falls during the tour, you get 50% back.",
    ),
    [result, setResult] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function compile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/promises/compile", {
        title,
        price_cents: Math.round(Number(price) * 100),
        window_start: new Date(day + "T" + start + ":00Z").toISOString(),
        window_end: new Date(day + "T" + end + ":00Z").toISOString(),
        location: cities[Number(city)],
        tz: "UTC",
        promise_text: text,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setBusy(true);
    setError("");
    try {
      await api("/offers", { token: result.token });
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        result?.status === "compiled"
          ? "Your words. Set in a rule."
          : "What’s your promise?"
      }
      onClose={onClose}
    >
      {result?.status === "compiled" ? (
        <>
          <p>
            Make sure this is exactly what you mean. Once someone books, their
            rule is locked in.
          </p>
          <RuleCard
            rule={result.rule}
            price={Math.round(Number(price) * 100)}
          />
          <div className="assumptions">
            <strong>A few things we're agreeing on</strong>
            <ul>
              <li>
                {cities[Number(city)].label} · {day}, {start}–{end} UTC
              </li>
              {result.rule.assumptions.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
              <li>
                Open-Meteo model data is the source of truth; readings can
                differ from the conditions at your exact location.
              </li>
            </ul>
          </div>
          <ErrorBox message={error} />
          <div className="modal-actions">
            <button
              className="btn outline"
              disabled={busy}
              onClick={() => setResult(null)}
            >
              Edit promise
            </button>
            <button className="btn coral" disabled={busy} onClick={publish}>
              {busy ? (
                <Busy />
              ) : (
                <>
                  <Check size={17} /> Confirm & publish
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={compile}>
          <p>
            Give your customers something to count on. We'll handle the
            follow-through.
          </p>
          <div className="form-grid">
            <label className="wide">
              Offer name
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
                maxLength={120}
              />
            </label>
            <label>
              Price (USD)
              <input
                type="number"
                min="1"
                max="1000"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label>
              Location
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c, i) => (
                  <option key={i} value={i}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                max={new Date(Date.now() + 13 * 86400000)
                  .toISOString()
                  .slice(0, 10)}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                required
              />
            </label>
            <div className="time-fields">
              <label>
                From (UTC)
                <input
                  type="time"
                  step="3600"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </label>
              <label>
                To (UTC)
                <input
                  type="time"
                  step="3600"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </label>
            </div>
          </div>
          <label className="promise-label">
            Your promise, in your words{" "}
            <span>
              <Sparkles size={13} /> AI-powered
            </span>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
              }}
              required
              minLength={12}
              maxLength={1000}
            />
          </label>
          <div className="example-row">
            Try a promise about{" "}
            <button
              type="button"
              onClick={() =>
                setText(
                  "If more than 5 mm of rain falls during the tour, you get 50% back.",
                )
              }
            >
              rain
            </button>
            <button
              type="button"
              onClick={() =>
                setText(
                  "If the temperature exceeds 35 degrees Celsius during the tour, you get 100% back.",
                )
              }
            >
              heat
            </button>
            <button
              type="button"
              onClick={() =>
                setText(
                  "If wind speed exceeds 40 km/h during the tour, you get $10 back.",
                )
              }
            >
              wind
            </button>
          </div>
          {result && (
            <div className="clarification">
              <b>
                {result.status === "needs_clarification"
                  ? "One little clarification."
                  : "Let’s make that measurable."}
              </b>
              <p>{result.reason}</p>
              <button
                type="button"
                onClick={() => {
                  setText(result.suggestion);
                  setResult(null);
                }}
              >
                Use suggested rewrite <ArrowRight size={14} />
              </button>
            </div>
          )}
          <ErrorBox message={error} />
          <button className="btn coral full" disabled={busy}>
            {busy ? (
              <>
                <Busy /> Turning your words into a rule…
              </>
            ) : (
              <>
                <Sparkles size={17} /> Preview my promise{" "}
                <ArrowRight size={16} />
              </>
            )}
          </button>
          <div className="form-note">
            <LockKeyhole size={12} /> Nothing goes live until you confirm the
            rule.
          </div>
        </form>
      )}
    </Modal>
  );
}
function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="public-header">
        <Brand />
        <a className="back-workspace" href="/sell">
          Seller workspace <ArrowUpRight size={15} />
        </a>
      </header>
      {children}
      <footer>
        <Brand />
        <span>Small promises. Real peace of mind.</span>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Weather data by Open-Meteo
        </a>
      </footer>
    </>
  );
}
function Checkout({ id, config }: { id: string; config: any }) {
  const [offer, setOffer] = useState<Offer | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api("/offers/" + id)
      .then(setOffer)
      .catch((e) => setError(e.message));
  }, [id]);
  async function demo() {
    setBusy(true);
    setError("");
    try {
      const o = await api("/checkout/" + id + "/order", { mode: "demo" });
      const p = await api("/checkout/" + o.id + "/capture", {});
      location.href = "/p/" + p.promiseId;
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <PublicShell>
      {!offer ? (
        <div className="page-loading">{error || <Busy />}</div>
      ) : (
        <main className="checkout">
          <div className="checkout-story">
            <span className="eyebrow">
              BOOK SOMETHING GOOD. EXPECT SOMETHING BETTER.
            </span>
            <h1>{offer.title}</h1>
            <p className="location-line">
              <MapPin size={16} />
              {offer.rule.location.label} <span>·</span> <Clock3 size={16} />
              {date(offer.window_start)}
            </p>
            <TourArt />
            <h2>
              A little adventure.
              <br />A little extra reassurance.
            </h2>
            <p>
              Some things you can't control. Standing by your word isn't one of
              them. Book with a clear guarantee, checked automatically.
            </p>
            <div className="checkout-meta">
              <div>
                <Clock3 size={18} />
                <span>
                  Your experience
                  <strong>
                    {time(offer.window_start)}–{time(offer.window_end)} UTC
                  </strong>
                </span>
              </div>
              <div>
                <ShieldCheck size={18} />
                <span>
                  Your peace of mind
                  <strong>No forms. No claims. No chasing.</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="checkout-panel panel">
            <div className="checkout-price">
              <div>
                Your experience<small>One booking · USD</small>
              </div>
              <strong>{money(offer.price_cents)}</strong>
            </div>
            <RuleCard rule={offer.rule} price={offer.price_cents} />
            <div className="checkout-agreement">
              <CheckCircle2 size={16} />
              <p>
                This rule is locked in when you book. If the condition is met,
                your refund is sent automatically.
              </p>
            </div>
            <ErrorBox message={error} />
            {Date.parse(offer.window_end) < Date.now() ? (
              <div className="error-box">This offer has closed.</div>
            ) : (
              <>
                {config?.paypal && (
                  <PayPalButtons
                    clientId={config.clientId}
                    offerId={id}
                    onError={setError}
                  />
                )}
                <button
                  className={`btn full ${config?.paypal ? "outline" : "coral"}`}
                  disabled={busy}
                  onClick={demo}
                >
                  {busy ? (
                    <Busy />
                  ) : (
                    <>
                      Try demo checkout <ArrowRight size={17} />
                    </>
                  )}
                </button>
                <div className="checkout-disclosure">
                  {config?.paypal
                    ? "PayPal sandbox uses test money. Demo checkout simulates payment."
                    : "Demo checkout simulates payment. No PayPal payment is made and no money moves."}
                </div>
              </>
            )}
            <div className="powered">
              <LockKeyhole size={13} />{" "}
              {config?.paypal
                ? "PayPal sandbox · Secure test checkout"
                : "Interactive preview · No payment details needed"}
            </div>
          </div>
        </main>
      )}
    </PublicShell>
  );
}
declare global {
  interface Window {
    paypal: any;
  }
}
function PayPalButtons({
  clientId,
  offerId,
  onError,
}: {
  clientId: string;
  offerId: string;
  onError: (s: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let buttons: any;
    let active = true;
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    script.onload = () => {
      if (!active) return;
      buttons = window.paypal.Buttons({
        createOrder: async () => {
          const o = await api(`/checkout/${offerId}/order`, {
            mode: "sandbox",
          });
          return o.id;
        },
        onApprove: async (data: any) => {
          try {
            const p = await api(`/checkout/${data.orderID}/capture`, {});
            location.href = "/p/" + p.promiseId;
          } catch (e: any) {
            onError(e.message);
          }
        },
        onCancel: () =>
          onError("Checkout was cancelled. No payment was captured."),
        onError: () =>
          onError("PayPal checkout could not finish. Please try again."),
      });
      buttons.render(ref.current);
    };
    script.onerror = () =>
      onError("PayPal could not load. Try again or use the demo checkout.");
    document.head.appendChild(script);
    return () => {
      active = false;
      buttons?.close();
      script.remove();
    };
  }, [clientId, offerId]);
  return <div ref={ref} className="paypal-buttons" />;
}
function Receipt({ id }: { id: string; config: any }) {
  const [p, setP] = useState<PromiseRow | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const load = () =>
      api("/promises/" + id)
        .then((d) => {
          setP(d);
          setError("");
        })
        .catch((e) => setError(e.message));
    load();
    const timer = setInterval(load, 2500);
    return () => clearInterval(timer);
  }, [id]);
  const settled = p?.status === "broken_refunded" || p?.status === "kept";
  return (
    <PublicShell>
      {!p ? (
        <div className="page-loading">{error || <Busy />}</div>
      ) : (
        <main className="receipt">
          <div className="receipt-heading">
            <span className={`receipt-icon ${settled ? "settled" : ""}`}>
              {settled ? <Check size={32} /> : <ShieldCheck size={32} />}
            </span>
            <span className="eyebrow">YOUR PINKY PROMISE RECEIPT</span>
            <h1>
              {p.status === "broken_refunded"
                ? "Promise broken. Trust kept."
                : p.status === "kept"
                  ? "A promise made. And kept."
                  : p.status === "needs_review"
                    ? "A little extra attention needed."
                    : "Go enjoy the moment."}
            </h1>
            <p>
              {p.status === "broken_refunded"
                ? `${money(p.refund_cents)} ${p.mode === "demo" ? "in simulated refunds. No money moved." : "returned through PayPal sandbox."}`
                : p.status === "kept"
                  ? "The evidence checked out. No refund was due."
                  : p.status === "needs_review"
                    ? "Your seller can review the evidence and payment status."
                    : "We’re keeping an eye on your promise. You don’t have to."}
            </p>
            <Badge status={p.status} />
          </div>
          <ErrorBox message={error} />
          <div className="receipt-grid">
            <div>
              <section className="panel receipt-details">
                <div className="receipt-offer">
                  <span>
                    <MapPin size={17} />
                    {p.rule.location.label}
                  </span>
                  <h2>{p.title}</h2>
                  <p>
                    {date(p.rule.window.start)} · {time(p.rule.window.start)}–
                    {time(p.rule.window.end)} UTC
                  </p>
                </div>
                <RuleCard rule={p.rule} price={p.captured_cents} />
                <div className="receipt-amount">
                  <span>
                    Payment {p.mode === "demo" ? "(simulated)" : "(sandbox)"}
                  </span>
                  <b>{money(p.captured_cents)}</b>
                </div>
                {settled && (
                  <div className="receipt-amount">
                    <span>
                      {p.mode === "demo" ? "Simulated refund" : "Refund"}
                    </span>
                    <b>{money(p.refund_cents)}</b>
                  </div>
                )}
              </section>
              {p.explanation_buyer && (
                <div className="explanation">
                  <Sparkles size={19} />
                  <div>
                    <h3>The why, in plain English.</h3>
                    <p>{p.explanation_buyer}</p>
                  </div>
                </div>
              )}
              <div className="demo-receipt-note">
                <BookOpen size={17} />
                <p>
                  {p.mode === "demo"
                    ? "Demo receipt — payment and refund are simulated. No money has moved."
                    : "PayPal sandbox receipt — test money only."}
                  {p.evidence?.simulated &&
                    " Evidence was injected by the seller for this demonstration."}
                </p>
              </div>
            </div>
            <section className="panel timeline-panel">
              <div className="section-heading">
                <h2>The whole story</h2>
                <span className="live-note">
                  <i /> Live
                </span>
              </div>
              <div className="timeline">
                {p.events?.map((e) => (
                  <div className={`timeline-item ${e.kind}`} key={e.id}>
                    <span className="timeline-dot">
                      {e.kind === "refund" ? (
                        <RotateCcw size={15} />
                      ) : e.kind === "evidence" ? (
                        <CloudRain size={15} />
                      ) : e.kind === "watching" ? (
                        <Clock3 size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                    </span>
                    <div>
                      <h3>
                        {{
                          paid: "Booking confirmed",
                          watching: "Keeping watch",
                          evidence: "Evidence is in",
                          decision: "Rule checked",
                          refund:
                            p.mode === "demo"
                              ? "Demo refund recorded"
                              : "Refund completed",
                          kept: "Promise kept",
                          error: "Review needed",
                          webhook: "PayPal confirmed",
                        }[e.kind] || e.kind}
                      </h3>
                      <p>{e.detail.message}</p>
                      {e.detail.reference && <code>{e.detail.reference}</code>}
                      <time>{time(e.created_at)} UTC</time>
                    </div>
                  </div>
                ))}
              </div>
              {!settled && p.status === "watching" && (
                <div className="watching-note">
                  <Clock3 size={18} />
                  <p>
                    Next check: {date(p.rule.window.end)} at{" "}
                    {time(p.rule.window.end)} UTC.
                    <br />
                    For the demo, simulate conditions in the{" "}
                    <a href="/sell">seller workspace</a>.
                  </p>
                </div>
              )}
              {p.evidence?.sourceUrl && (
                <a
                  className="evidence-link"
                  href={p.evidence.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View original weather evidence <ExternalLink size={13} />
                </a>
              )}
            </section>
          </div>
          <p className="receipt-id">
            Promise {p.id} · Keep this private link as your receipt.
          </p>
        </main>
      )}
    </PublicShell>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
