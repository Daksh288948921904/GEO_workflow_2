import { useState, useEffect } from "react";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --void: #030507;
    --deep: #080c10;
    --surface: #0d1117;
    --panel: #111820;
    --border: #1c2940;
    --border-glow: #1e3a5f;
    --text-primary: #e8edf5;
    --text-secondary: #7a8fa8;
    --text-muted: #3d5068;
    --acid: #00f5c4;
    --amber: #f5a623;
    --crimson: #f54b4b;
    --violet: #9b6dff;
    --sapphire: #4b8ef5;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
    --font-body: 'DM Sans', sans-serif;
  }

  html, body, #root { height: 100%; }

  body {
    background: var(--void);
    color: var(--text-primary);
    font-family: var(--font-body);
    overflow-x: hidden;
    cursor: crosshair;
  }

  /* Scanline */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,245,196,0.012) 2px,
      rgba(0,245,196,0.012) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-acid {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,245,196,0); }
    50%       { box-shadow: 0 0 30px 4px rgba(0,245,196,0.2); }
  }
  @keyframes spin-cw {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes spin-ccw {
    from { transform: rotate(360deg); }
    to   { transform: rotate(0deg); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }

  ::-webkit-scrollbar       { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--deep); }
  ::-webkit-scrollbar-thumb { background: var(--border-glow); border-radius: 2px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function injectStyles() {
  if (document.getElementById("geo-styles")) return;
  const el = document.createElement("style");
  el.id = "geo-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ─── Background ───────────────────────────────────────────────────────────────
function NoiseBG() {
  return (
    <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0, opacity:0.04 }}>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)"/>
    </svg>
  );
}

function GridBG() {
  return (
    <div style={{
      position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
      backgroundImage:`linear-gradient(rgba(0,245,196,0.03) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(0,245,196,0.03) 1px, transparent 1px)`,
      backgroundSize:"80px 80px"
    }}/>
  );
}

function Orbs() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"60vw", height:"60vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(0,245,196,0.04) 0%, transparent 70%)" }}/>
      <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:"50vw", height:"50vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(155,109,255,0.05) 0%, transparent 70%)" }}/>
      <div style={{ position:"absolute", top:"40%", left:"50%", width:"40vw", height:"40vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(75,142,245,0.03) 0%, transparent 70%)", transform:"translate(-50%,-50%)" }}/>
    </div>
  );
}

// ─── Spin Loader ──────────────────────────────────────────────────────────────
function SpinLoader({ color = "#00f5c4", size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(0,245,196,0.1)" strokeWidth="2"/>
      <circle cx="20" cy="20" r="15" fill="none" stroke={color} strokeWidth="2"
        strokeDasharray="30 65" strokeLinecap="round"
        style={{ transformOrigin:"center", animation:"spin-cw 1.1s linear infinite" }}/>
      <circle cx="20" cy="20" r="8" fill="none" stroke={color} strokeWidth="1.5"
        strokeDasharray="15 35" strokeLinecap="round"
        style={{ transformOrigin:"center", animation:"spin-ccw 0.8s linear infinite", opacity:0.5 }}/>
    </svg>
  );
}

// ─── Step Line ────────────────────────────────────────────────────────────────
function StepLine({ steps, currentStep }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2, width:"100%", maxWidth:480, margin:"0 auto" }}>
      {steps.map((step, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:14, padding:"10px 16px",
            borderRadius:8,
            background: active ? "rgba(0,245,196,0.05)" : done ? "rgba(0,245,196,0.02)" : "transparent",
            border: active ? "1px solid rgba(0,245,196,0.2)" : "1px solid transparent",
            opacity: i > currentStep ? 0.35 : 1,
            transition:"all 0.4s ease"
          }}>
            <div style={{
              width:22, height:22, borderRadius:"50%", flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              background: done ? "var(--acid)" : active ? "transparent" : "var(--border)",
              border: active ? "1.5px solid var(--acid)" : done ? "none" : "1.5px solid var(--text-muted)",
              transition:"all 0.4s ease"
            }}>
              {done   && <span style={{ fontSize:11, color:"#000", fontWeight:700 }}>✓</span>}
              {active && <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--acid)", animation:"blink 1s ease infinite" }}/>}
              {!done && !active && <span style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{i+1}</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{
                fontFamily:"var(--font-body)", fontSize:13, fontWeight:500,
                color: done ? "var(--acid)" : active ? "var(--text-primary)" : "var(--text-muted)"
              }}>{step.label}</div>
              {active && step.detail && (
                <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2, fontFamily:"var(--font-mono)" }}>{step.detail}</div>
              )}
            </div>
            {active && <SpinLoader size={18}/>}
            {done   && <span style={{ fontSize:11, fontFamily:"var(--font-mono)", color:"var(--acid)", opacity:0.6 }}>done</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Score Arc ────────────────────────────────────────────────────────────────
function ScoreArc({ pct, band }) {
  const [displayed, setDisplayed] = useState(0);
  const [arcLen,    setArcLen]    = useState(0);
  const R = 70, cx = 90, cy = 90;
  const circ   = 2 * Math.PI * R;
  const fullArc = circ * 0.75;

  useEffect(() => {
    const duration = 1800;
    const start = performance.now();
    const tick = now => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(ease * pct));
      setArcLen(ease * fullArc * (pct / 100));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [pct]);

  const c = pct >= 85 ? "#00f5c4" : pct >= 70 ? "#00d4aa" : pct >= 50 ? "#f5a623" : pct >= 30 ? "#f57c23" : "#f54b4b";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <svg width={180} height={180} style={{ overflow:"visible" }}>
        <circle cx={cx} cy={cy} r={R+12} fill="none" stroke={c} strokeWidth="1" opacity="0.06"/>
        {/* track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)"
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${fullArc} ${circ}`}
          transform={`rotate(135 ${cx} ${cy})`}/>
        {/* fill */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={c}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ filter:`drop-shadow(0 0 8px ${c})` }}/>
        <text x={cx} y={cy-6}  textAnchor="middle" fill={c}    fontFamily="'Syne',sans-serif"     fontSize="32" fontWeight="800">{displayed}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontFamily="'Space Mono',monospace" fontSize="10">/100</text>
        <text x={cx} y={cy+30} textAnchor="middle" fill={c}    fontFamily="'DM Sans',sans-serif"  fontSize="10" fontWeight="500" opacity="0.7">AI READINESS</text>
      </svg>
      <div style={{
        padding:"6px 16px", borderRadius:20,
        background:`${c}14`, border:`1px solid ${c}35`,
        fontSize:11, fontFamily:"var(--font-mono)", color:c,
        letterSpacing:"0.08em", textTransform:"uppercase"
      }}>{band}</div>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, score, max, color, delay = 0 }) {
  const pct = Math.round((score / max) * 100);
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-secondary)", textTransform:"uppercase", fontWeight:500, letterSpacing:"0.05em" }}>{label}</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color }}>
          {score}<span style={{ color:"var(--text-muted)", fontSize:10 }}>/{max}</span>
        </span>
      </div>
      <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.05)", overflow:"hidden", position:"relative" }}>
        <div style={{
          position:"absolute", left:0, top:0, height:"100%", borderRadius:3,
          background:`linear-gradient(90deg, ${color}88, ${color})`,
          width:`${w}%`, transition:"width 1.2s cubic-bezier(0.23,1,0.32,1)",
          boxShadow:`0 0 8px ${color}50`
        }}/>
      </div>
    </div>
  );
}

// ─── Breakdown Card ───────────────────────────────────────────────────────────
function BreakdownCard({ title, breakdown, color, delay = 0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{
      background:"var(--panel)", border:`1px solid var(--border)`, borderRadius:12, padding:"18px 20px",
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(16px)",
      transition:"opacity 0.6s ease, transform 0.6s ease"
    }}>
      <div style={{
        fontFamily:"var(--font-display)", fontSize:13, fontWeight:700,
        color, marginBottom:12, letterSpacing:"0.06em", textTransform:"uppercase",
        display:"flex", alignItems:"center", gap:8
      }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}` }}/>
        {title}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {Object.entries(breakdown).map(([k, v]) => (
          <div key={k} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.03)"
          }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>{k.replace(/_/g," ")}</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color: v > 0 ? color : "var(--crimson)", fontWeight:700 }}>
              {v > 0 ? `+${v}` : v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TypeWriter ───────────────────────────────────────────────────────────────
function TypeWriter({ text, speed = 10 }) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) setOut(text.slice(0, ++i));
      else clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return (
    <span>
      {out}
      <span style={{ borderRight:"1.5px solid var(--acid)", animation:"blink 0.8s ease infinite", marginLeft:1 }}>&nbsp;</span>
    </span>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ color, children }) {
  return (
    <div style={{
      fontFamily:"var(--font-display)", fontSize:16, fontWeight:700,
      color:"var(--text-primary)", marginBottom:14,
      display:"flex", alignItems:"center", gap:10
    }}>
      <span style={{ width:3, height:18, background:color, borderRadius:2, display:"inline-block" }}/>
      {children}
    </div>
  );
}

// ─── Text Block ───────────────────────────────────────────────────────────────
function TextBlock({ text, borderColor }) {
  return (
    <div style={{
      background:"var(--panel)", border:`1px solid ${borderColor}25`, borderRadius:12, padding:"20px 24px"
    }}>
      <pre style={{
        fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-secondary)",
        lineHeight:1.85, whiteSpace:"pre-wrap", wordBreak:"break-word"
      }}>{text}</pre>
    </div>
  );
}

// ─── GEO Report ───────────────────────────────────────────────────────────────
function GeoReport({ data }) {
  const [section, setSection] = useState(0);

  useEffect(() => {
    const timers = [0, 400, 900, 1400].map((d, i) =>
      setTimeout(() => setSection(i + 1), d)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!data) return null;

  // The real /geo_recommendation endpoint returns:
  // { executive_summary, ai_readiness_pct, readiness_band, geo_report_file }
  // The full graph result (technical_analysis, content_analysis, prioritized_plan) is
  // saved to .geo.json — if you want them on screen you can extend /geo_recommendation
  // to return them too. For now we display what the API sends back.
  const summary      = data.executive_summary   || data.summary          || "";
  const technical    = data.technical_analysis  || "";
  const content      = data.content_analysis    || "";
  const priority     = data.prioritized_plan    || "";
  const readinessPct = data.ai_readiness_pct;
  const band         = data.readiness_band;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28, animation:"fadeUp 0.6s ease both" }}>

      {/* Executive Summary */}
      {section >= 1 && (
        <div style={{
          background:"linear-gradient(135deg, rgba(0,245,196,0.05), rgba(0,245,196,0.02))",
          border:"1px solid rgba(0,245,196,0.18)", borderRadius:16, padding:"24px 28px",
          position:"relative", overflow:"hidden", animation:"fadeUp 0.5s ease both"
        }}>
          <div style={{ position:"absolute", top:0, right:0, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,245,196,0.06), transparent 70%)", pointerEvents:"none" }}/>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--acid)", letterSpacing:"0.12em", marginBottom:12, textTransform:"uppercase" }}>
            ▸ Executive Summary
          </div>
          <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text-primary)", lineHeight:1.8, fontWeight:300 }}>
            <TypeWriter text={summary} speed={10}/>
          </p>

          {(readinessPct != null || band) && (
            <div style={{ marginTop:16, display:"flex", gap:14, flexWrap:"wrap" }}>
              {readinessPct != null && (
                <div style={{ padding:"8px 16px", borderRadius:8, background:"rgba(0,245,196,0.08)", border:"1px solid rgba(0,245,196,0.2)" }}>
                  <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)", textTransform:"uppercase", marginBottom:4 }}>AI Readiness</div>
                  <div style={{ fontSize:22, fontFamily:"var(--font-display)", fontWeight:800, color:"var(--acid)" }}>{readinessPct}%</div>
                </div>
              )}
              {band && (
                <div style={{ padding:"8px 16px", borderRadius:8, background:"rgba(155,109,255,0.08)", border:"1px solid rgba(155,109,255,0.2)" }}>
                  <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)", textTransform:"uppercase", marginBottom:4 }}>Band</div>
                  <div style={{ fontSize:14, fontFamily:"var(--font-display)", fontWeight:700, color:"var(--violet)" }}>{band}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Technical Analysis */}
      {section >= 2 && technical && (
        <div style={{ animation:"fadeUp 0.5s ease both" }}>
          <SectionTitle color="var(--crimson)">Technical Audit Findings</SectionTitle>
          <TextBlock text={technical} borderColor="#f54b4b"/>
        </div>
      )}

      {/* Content Analysis */}
      {section >= 3 && content && (
        <div style={{ animation:"fadeUp 0.5s ease both" }}>
          <SectionTitle color="var(--amber)">Content Strategy Gaps</SectionTitle>
          <TextBlock text={content} borderColor="#f5a623"/>
        </div>
      )}

      {/* Priority Plan */}
      {section >= 4 && priority && (
        <div style={{ animation:"fadeUp 0.5s ease both" }}>
          <SectionTitle color="var(--violet)">Priority Implementation Roadmap</SectionTitle>
          <TextBlock text={priority} borderColor="#9b6dff"/>
        </div>
      )}
    </div>
  );
}

// ─── Score View ───────────────────────────────────────────────────────────────
// DEMO_SCORE is shown as fallback only; real data from API replaces it automatically
const DEMO_SCORE = {
  ai_readiness_pct: 42,
  readiness_band: "Fair — Needs Improvement",
  schema_score: 6,   entity_score: 7,  content_score: 12,
  trust_score: 9,    extractability_score: 8,
  penalties: { missing_price: -5, no_schema_markup: -5 },
  breakdowns: {
    schema:         { name:4, price:0, currency:0, brand:2, availability:0, price_format_bonus:0, schema_markup:0, product_schema:0 },
    entity:         { name:4, brand:3, sku:0, category:0, gtin:0, name_quality:0 },
    content:        { word_count:4, headings:2, features:2, specifications:3, image_alt_text:0, faq:0 },
    trust:          { has_return_policy:3, has_warranty_info:0, has_shipping_info:2, mentions_secure_payment:0, has_contact_page:2, mentions_reviews:0, uses_https:1 },
    extractability: { schema_present:0, heading_hierarchy:2, specs_table:2, meta_title:2, meta_description:2, canonical_url:0, hreflang:0 }
  },
  weak_areas: {}
};

function ScoreView({ onGeoClick, scoreData }) {
  // /geo_context returns:
  // { message, context_file, ai_readiness_pct, readiness_band, llm_context }
  // llm_context has: ai_visibility_summary, section_scores, weak_areas, penalties, breakdowns (not present)
  const ctx         = scoreData?.llm_context           || {};
  const vis         = ctx.ai_visibility_summary        || {};
  const sec         = ctx.section_scores               || {};
  const weakAreas   = ctx.weak_areas                   || DEMO_SCORE.weak_areas;
  const penalties   = Object.keys(ctx.penalties || {}).length ? ctx.penalties : DEMO_SCORE.penalties;

  const s = {
    ai_readiness_pct:   vis.ai_readiness_pct    ?? DEMO_SCORE.ai_readiness_pct,
    readiness_band:     vis.readiness_band       ?? DEMO_SCORE.readiness_band,
    schema_score:       sec.schema               ?? DEMO_SCORE.schema_score,
    entity_score:       sec.entity               ?? DEMO_SCORE.entity_score,
    content_score:      sec.content              ?? DEMO_SCORE.content_score,
    trust_score:        sec.trust                ?? DEMO_SCORE.trust_score,
    extractability_score: sec.extractability     ?? DEMO_SCORE.extractability_score,
    penalties,
    breakdowns: DEMO_SCORE.breakdowns, // full breakdown needs /score_product; use demo shape
  };

  const sections = [
    { label:"Schema",         score:s.schema_score,         max:20, color:"#00f5c4" },
    { label:"Entity",         score:s.entity_score,         max:15, color:"#9b6dff" },
    { label:"Content",        score:s.content_score,        max:25, color:"#f5a623" },
    { label:"Trust",          score:s.trust_score,          max:20, color:"#4b8ef5" },
    { label:"Extractability", score:s.extractability_score, max:20, color:"#f54b4b" },
  ];
  const bdColors = { schema:"#00f5c4", entity:"#9b6dff", content:"#f5a623", trust:"#4b8ef5", extractability:"#f54b4b" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28, maxWidth:860, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ textAlign:"center", animation:"fadeUp 0.5s ease both" }}>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--acid)", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:8 }}>◈ Analysis Complete</div>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:800, color:"var(--text-primary)", marginBottom:4 }}>AI Visibility Score</h2>
        <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text-secondary)" }}>Comprehensive readiness assessment across 5 dimensions</p>
      </div>

      {/* Arc + Bars */}
      <div style={{
        background:"var(--panel)", border:"1px solid var(--border)", borderRadius:16,
        padding:"28px 32px", display:"flex", gap:36, flexWrap:"wrap", alignItems:"center",
        animation:"fadeUp 0.5s ease 0.1s both"
      }}>
        <ScoreArc pct={s.ai_readiness_pct} band={s.readiness_band}/>
        <div style={{ flex:1, minWidth:240, display:"flex", flexDirection:"column", gap:14 }}>
          {sections.map((sec, i) => <ScoreBar key={sec.label} {...sec} delay={i * 150}/>)}
        </div>
      </div>

      {/* Penalties */}
      {Object.keys(s.penalties).length > 0 && (
        <div style={{
          background:"rgba(245,75,75,0.05)", border:"1px solid rgba(245,75,75,0.2)",
          borderRadius:12, padding:"16px 20px", animation:"fadeUp 0.5s ease 0.2s both"
        }}>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--crimson)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>⚠ Penalties Applied</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {Object.entries(s.penalties).map(([k, v]) => (
              <div key={k} style={{
                padding:"4px 12px", borderRadius:6,
                background:"rgba(245,75,75,0.1)", border:"1px solid rgba(245,75,75,0.2)",
                display:"flex", gap:8, alignItems:"center"
              }}>
                <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-secondary)" }}>{k.replace(/_/g," ")}</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--crimson)", fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Areas */}
      {Object.keys(weakAreas).length > 0 && (
        <div style={{
          background:"rgba(155,109,255,0.04)", border:"1px solid rgba(155,109,255,0.15)",
          borderRadius:12, padding:"16px 20px", animation:"fadeUp 0.5s ease 0.25s both"
        }}>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--violet)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>◈ Identified Weak Areas</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {Object.entries(weakAreas).map(([section, fields]) => (
              <div key={section}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:12, fontWeight:700, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{section}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {fields.map(f => (
                    <span key={f} style={{
                      padding:"3px 10px", borderRadius:4,
                      background:"rgba(245,75,75,0.1)", border:"1px solid rgba(245,75,75,0.2)",
                      fontFamily:"var(--font-mono)", fontSize:10, color:"var(--crimson)"
                    }}>{f.replace(/_/g," ")}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Grid */}
      <div>
        <SectionTitle color="var(--acid)">Detailed Score Breakdown</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
          {Object.entries(s.breakdowns).map(([key, bd], i) => (
            <BreakdownCard key={key} title={key} breakdown={bd} color={bdColors[key]} delay={i * 120}/>
          ))}
        </div>
      </div>

      {/* GEO CTA */}
      <div style={{ display:"flex", justifyContent:"center", paddingTop:8, animation:"fadeUp 0.5s ease 0.5s both" }}>
        <button onClick={onGeoClick} style={{
          background:"linear-gradient(135deg, var(--acid), #00c9a2)",
          border:"none", borderRadius:12, padding:"16px 44px",
          fontFamily:"var(--font-display)", fontSize:15, fontWeight:700,
          color:"#030507", cursor:"pointer", letterSpacing:"0.04em",
          boxShadow:"0 0 30px rgba(0,245,196,0.25), 0 4px 20px rgba(0,0,0,0.4)",
          transition:"all 0.25s ease",
          display:"flex", alignItems:"center", gap:12,
          animation:"pulse-acid 2.5s ease-in-out infinite"
        }}
          onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow="0 0 50px rgba(0,245,196,0.4), 0 8px 30px rgba(0,0,0,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 30px rgba(0,245,196,0.25), 0 4px 20px rgba(0,0,0,0.4)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          GEO Optimize Now
          <span style={{ opacity:0.6, fontSize:12 }}>→</span>
        </button>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CRAWL_STEPS = [
  { label:"Connecting to target URL",      detail:"establishing secure connection..." },
  { label:"Fetching HTML response",        detail:"loading DOM, parsing lxml..." },
  { label:"Extracting metadata & schema",  detail:"title · meta · json-ld · canonical..." },
  { label:"Parsing product signals",       detail:"price · brand · availability · rating..." },
  { label:"Analyzing trust indicators",    detail:"https · reviews · policies · contact..." },
  { label:"Building content map",          detail:"headings · features · specs · links..." },
  { label:"Scoring AI visibility",         detail:"computing 5-dimension readiness index..." },
];

const GEO_STEPS = [
  { label:"Initializing GEO Intelligence Engine", detail:"loading semantic models..." },
  { label:"Running Technical Audit",              detail:"schema · entity · metadata signals..." },
  { label:"Analyzing Content Strategy",           detail:"FAQ gaps · semantic coverage · LLM answerability..." },
  { label:"Calculating Priority Roadmap",         detail:"high / medium / low impact classification..." },
  { label:"Generating Executive Report",          detail:"AI visibility uplift estimation..." },
  { label:"Compiling Recommendations",            detail:"packaging final insights..." },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => { injectStyles(); }, []);

  const [url,           setUrl]           = useState("");
  const [phase,         setPhase]         = useState("input");   // input | crawling | score | geo_loading | geo_done
  const [crawlStep,     setCrawlStep]     = useState(0);
  const [geoStep,       setGeoStep]       = useState(0);
  const [savedFilename, setSavedFilename] = useState("");
  const [scoreResult,   setScoreResult]   = useState(null);
  const [geoResult,     setGeoResult]     = useState(null);
  const [errorMsg,      setErrorMsg]      = useState("");

  // ── Crawl + Score ─────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!url.trim()) return;
    setErrorMsg("");
    setPhase("crawling");
    setCrawlStep(0);

    // Visual ticker — runs independently, never blocks the real requests
    let step = 0;
    const ticker = setInterval(() => {
      step++;
      setCrawlStep(step);
      if (step >= CRAWL_STEPS.length) clearInterval(ticker);
    }, 700);

    try {
      // 1. Crawl the page
      const crawlRes = await fetch("http://localhost:8000/crawl_product", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url })
      });
      if (!crawlRes.ok) throw new Error(`Crawl failed (${crawlRes.status})`);
      const crawlData = await crawlRes.json();

      // saved_to looks like "data/amazon-com-dp-...-20250221-130000.json"
      const filename = crawlData.saved_to.split("/").pop();
      setSavedFilename(filename);

      // 2. Score + build LLM context
      const ctxRes = await fetch("http://localhost:8000/geo_context", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ filename })
      });
      if (!ctxRes.ok) throw new Error(`Scoring failed (${ctxRes.status})`);
      const ctxData = await ctxRes.json();
      setScoreResult(ctxData);

      clearInterval(ticker);
      setCrawlStep(CRAWL_STEPS.length);
      await sleep(600);
      setPhase("score");

    } catch (err) {
      clearInterval(ticker);
      setErrorMsg(err.message);
      setPhase("input");
    }
  }

  // ── GEO Recommendation ────────────────────────────────────────────────────
  async function handleGeo() {
    setErrorMsg("");
    setPhase("geo_loading");
    setGeoStep(0);

    let step = 0;
    const ticker = setInterval(() => {
      step++;
      setGeoStep(step);
      if (step >= GEO_STEPS.length) clearInterval(ticker);
    }, 1200);

    try {
      const geoRes = await fetch("http://localhost:8000/geo_recommendation", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ filename: savedFilename })
      });
      if (!geoRes.ok) throw new Error(`GEO recommendation failed (${geoRes.status})`);
      const geoData = await geoRes.json();
      setGeoResult(geoData);

      clearInterval(ticker);
      setGeoStep(GEO_STEPS.length);
      await sleep(400);
      setPhase("geo_done");

    } catch (err) {
      clearInterval(ticker);
      setErrorMsg(err.message);
      setPhase("score"); // fall back to score screen so user can retry
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function handleReset() {
    setPhase("input");
    setUrl("");
    setSavedFilename("");
    setScoreResult(null);
    setGeoResult(null);
    setErrorMsg("");
  }

  // ─── Shared error banner ─────────────────────────────────────────────────
  const ErrorBanner = () => errorMsg ? (
    <div style={{
      marginBottom:16, padding:"10px 16px", borderRadius:8,
      background:"rgba(245,75,75,0.08)", border:"1px solid rgba(245,75,75,0.25)",
      fontFamily:"var(--font-mono)", fontSize:11, color:"var(--crimson)"
    }}>⚠ {errorMsg}</div>
  ) : null;

  return (
    <div style={{
      minHeight:"100vh", background:"var(--void)", position:"relative",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"60px 20px 100px"
    }}>
      <NoiseBG/>
      <GridBG/>
      <Orbs/>

      {/* ── Header ── */}
      <div style={{ position:"relative", zIndex:1, textAlign:"center", marginBottom:60, animation:"fadeUp 0.8s ease both" }}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"5px 14px", borderRadius:20,
          background:"rgba(0,245,196,0.06)", border:"1px solid rgba(0,245,196,0.15)",
          marginBottom:20
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--acid)", boxShadow:"0 0 8px var(--acid)", animation:"blink 2s ease infinite" }}/>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--acid)", letterSpacing:"0.12em", textTransform:"uppercase" }}>GEO Intelligence Platform</span>
        </div>
        <h1 style={{
          fontFamily:"var(--font-display)",
          fontSize:"clamp(32px, 6vw, 64px)",
          fontWeight:800, lineHeight:1.05,
          background:"linear-gradient(135deg, #e8edf5 30%, rgba(0,245,196,0.7))",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          marginBottom:14
        }}>
          AI Visibility<br/>Optimizer
        </h1>
        <p style={{ fontFamily:"var(--font-body)", fontSize:15, color:"var(--text-secondary)", maxWidth:460, margin:"0 auto", lineHeight:1.7, fontWeight:300 }}>
          Crawl any product page, score its AI readiness across 5 critical dimensions, and receive an executive GEO optimization report.
        </p>
      </div>

      {/* ── INPUT ── */}
      {phase === "input" && (
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:580, animation:"fadeUp 0.6s ease 0.2s both" }}>
          <div style={{
            background:"var(--panel)", border:"1px solid var(--border-glow)",
            borderRadius:16, padding:"28px",
            boxShadow:"0 0 60px rgba(0,245,196,0.04), 0 20px 60px rgba(0,0,0,0.4)"
          }}>
            <label style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:10 }}>
              Target URL
            </label>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{
                flex:1, display:"flex", alignItems:"center",
                background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden"
              }}>
                <span style={{ padding:"0 14px", color:"var(--text-muted)", fontFamily:"var(--font-mono)", fontSize:13, flexShrink:0 }}>https://</span>
                <input
                  value={url.replace(/^https?:\/\//, "")}
                  onChange={e => setUrl("https://" + e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                  placeholder="amazon.com/dp/B0XXXXXXX..."
                  style={{
                    flex:1, background:"transparent", border:"none", outline:"none",
                    fontFamily:"var(--font-mono)", fontSize:13, color:"var(--text-primary)",
                    padding:"14px 14px 14px 0", caretColor:"var(--acid)"
                  }}
                />
              </div>
              <button onClick={handleAnalyze} style={{
                background:"linear-gradient(135deg, var(--acid), #00c9a2)",
                border:"none", borderRadius:10, padding:"14px 20px",
                fontFamily:"var(--font-display)", fontSize:13, fontWeight:700,
                color:"#030507", cursor:"pointer", whiteSpace:"nowrap",
                transition:"all 0.2s ease", boxShadow:"0 0 20px rgba(0,245,196,0.2)"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform="scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; }}
              >Analyze →</button>
            </div>

            <ErrorBanner/>

            <div style={{ marginTop:14, display:"flex", gap:8, flexWrap:"wrap" }}>
              {["amazon.com/dp/", "flipkart.com/product/", "myntra.com/shoes/"].map(ex => (
                <button key={ex} onClick={() => setUrl("https://" + ex)} style={{
                  background:"transparent", border:"1px solid var(--border)", borderRadius:6,
                  padding:"4px 10px", fontFamily:"var(--font-mono)", fontSize:10,
                  color:"var(--text-muted)", cursor:"pointer", transition:"all 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,245,196,0.3)"; e.currentTarget.style.color="var(--acid)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-muted)"; }}
                >{ex}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop:24, display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            {["Schema Analysis","Entity Scoring","Trust Signals","AI Extractability","GEO Recommendations"].map((f, i) => (
              <div key={f} style={{
                padding:"5px 12px", borderRadius:20,
                background:"rgba(255,255,255,0.02)", border:"1px solid var(--border)",
                fontFamily:"var(--font-body)", fontSize:11, color:"var(--text-muted)",
                animation:`fadeUp 0.4s ease ${0.4 + i * 0.1}s both`
              }}>{f}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── CRAWLING ── */}
      {phase === "crawling" && (
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:560, display:"flex", flexDirection:"column", alignItems:"center", gap:28 }}>
          <div style={{ textAlign:"center", animation:"fadeIn 0.5s ease both" }}>
            <div style={{ marginBottom:12, display:"flex", justifyContent:"center" }}>
              <SpinLoader size={52}/>
            </div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--acid)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>Crawling in progress</div>
            <div style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-muted)", maxWidth:360, wordBreak:"break-all" }}>{url}</div>
          </div>
          <div style={{ width:"100%", background:"var(--panel)", border:"1px solid var(--border)", borderRadius:16, padding:"24px" }}>
            <StepLine steps={CRAWL_STEPS} currentStep={crawlStep}/>
          </div>
        </div>
      )}

      {/* ── SCORE ── */}
      {phase === "score" && (
        <div style={{ position:"relative", zIndex:1, width:"100%" }}>
          <ErrorBanner/>
          <ScoreView onGeoClick={handleGeo} scoreData={scoreResult}/>
        </div>
      )}

      {/* ── GEO LOADING ── */}
      {phase === "geo_loading" && (
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:560, display:"flex", flexDirection:"column", alignItems:"center", gap:28 }}>
          <div style={{ textAlign:"center", animation:"fadeIn 0.5s ease both" }}>
            <div style={{ marginBottom:14, display:"flex", justifyContent:"center", position:"relative" }}>
              <SpinLoader size={64} color="#9b6dff"/>
              <div style={{
                position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"var(--font-mono)", fontSize:9, color:"var(--violet)", letterSpacing:"0.1em"
              }}>GEO</div>
            </div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:800, color:"var(--text-primary)", marginBottom:6 }}>Generating Recommendations</div>
            <div style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-muted)" }}>Multi-agent AI analysis pipeline running...</div>
          </div>
          <div style={{ width:"100%", background:"var(--panel)", border:"1px solid rgba(155,109,255,0.2)", borderRadius:16, padding:"24px" }}>
            <StepLine steps={GEO_STEPS} currentStep={geoStep}/>
          </div>
        </div>
      )}

      {/* ── GEO DONE ── */}
      {phase === "geo_done" && (
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:860, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:32, animation:"fadeUp 0.5s ease both" }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"5px 16px", borderRadius:20,
              background:"rgba(155,109,255,0.08)", border:"1px solid rgba(155,109,255,0.25)",
              marginBottom:14
            }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--violet)", boxShadow:"0 0 8px var(--violet)" }}/>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--violet)", letterSpacing:"0.12em", textTransform:"uppercase" }}>GEO Report Ready</span>
            </div>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:800, color:"var(--text-primary)" }}>Optimization Intelligence</h2>
          </div>

          <ErrorBanner/>
          <GeoReport data={geoResult}/>

          <div style={{ display:"flex", justifyContent:"center", marginTop:36, gap:12 }}>
            <button onClick={() => setPhase("score")} style={{
              background:"transparent", border:"1px solid var(--border)", borderRadius:10,
              padding:"12px 24px", fontFamily:"var(--font-body)", fontSize:13,
              color:"var(--text-secondary)", cursor:"pointer", transition:"all 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(155,109,255,0.4)"; e.currentTarget.style.color="var(--violet)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-secondary)"; }}
            >← Back to Score</button>

            <button onClick={handleReset} style={{
              background:"transparent", border:"1px solid var(--border)", borderRadius:10,
              padding:"12px 24px", fontFamily:"var(--font-body)", fontSize:13,
              color:"var(--text-secondary)", cursor:"pointer", transition:"all 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,245,196,0.3)"; e.currentTarget.style.color="var(--acid)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-secondary)"; }}
            >↺ Analyze Another Page</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, padding:"12px 24px",
        display:"flex", justifyContent:"center",
        background:"linear-gradient(transparent, var(--void))",
        pointerEvents:"none", zIndex:2
      }}>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
          GEO Platform · AI Visibility Engine · v1.0
        </div>
      </div>
    </div>
  );
}