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
  @keyframes particle-rise {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.5; }
    100% { transform: translateY(-140px) translateX(var(--dx, 0px)) scale(0.4); opacity: 0; }
  }
  @keyframes scan-down {
    0%   { top: -4px; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes insight-cycle {
    0%   { opacity: 0; transform: translateY(12px); }
    12%  { opacity: 1; transform: translateY(0); }
    80%  { opacity: 1; transform: translateY(0); }
    95%  { opacity: 0; transform: translateY(-12px); }
    100% { opacity: 0; transform: translateY(-12px); }
  }
  @keyframes radar-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes hex-pulse {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(1.04); }
  }
  @keyframes data-stream {
    0%   { opacity: 0; transform: translateY(-6px); }
    20%  { opacity: 1; transform: translateY(0); }
    80%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes progress-fill {
    from { stroke-dashoffset: 314; }
    to   { stroke-dashoffset: 0; }
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

// ─── Section title (used in ScoreView breakdown) ─────────────────────────────
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

// ─── Markdown Parser ──────────────────────────────────────────────────────────
function parseMarkdown(raw) {
  if (!raw) return [];
  const lines = raw.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    // Fenced code block  ```lang ... ```
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "code";
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      i++; continue;
    }

    // Markdown table — collect header + separator + rows
    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // parse header, skip separator row, parse data rows
      const parseRow = r => r.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const [headerRow, , ...dataRows] = tableLines;
      if (headerRow) {
        blocks.push({
          type: "table",
          headers: parseRow(headerRow),
          rows: dataRows.filter(r => !r.match(/^\|[-| :]+\|$/)).map(parseRow)
        });
      }
      continue;
    }

    // Headings
    if (line.startsWith("### ")) { blocks.push({ type:"h3", text:line.replace(/^###\s*/,"") }); i++; continue; }
    if (line.startsWith("## "))  { blocks.push({ type:"h2", text:line.replace(/^##\s*/,"")  }); i++; continue; }
    if (line.startsWith("# "))   { blocks.push({ type:"h1", text:line.replace(/^#\s*/,"")   }); i++; continue; }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s*/, "");
      const m = content.match(/^\*\*(.+?)\*\*[:\s]*(.*)/);
      blocks.push(m
        ? { type:"numbered", title:m[1], body:m[2] }
        : { type:"numbered", title:"", body:content.replace(/\*\*/g,"") }
      );
      i++; continue;
    }

    // Bullet
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.replace(/^[-•]\s*/, "");
      const m = content.match(/^\*\*(.+?)\*\*[:\s]*(.*)/);
      blocks.push(m
        ? { type:"bullet", title:m[1], body:m[2] }
        : { type:"bullet", title:"", body:content.replace(/\*\*/g,"") }
      );
      i++; continue;
    }

    if (/^---+$/.test(line)) { blocks.push({ type:"hr" }); i++; continue; }

    blocks.push({ type:"para", text:line });
    i++;
  }
  return blocks;
}

// ─── Inline Bold renderer ─────────────────────────────────────────────────────
function InlineText({ text, color }) {
  if (!text) return null;
  // Also strip backtick inline code and render as mono
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <span key={i} style={{ color: color || "var(--text-primary)", fontWeight:700 }}>{p.slice(2,-2)}</span>;
        if (p.startsWith("`") && p.endsWith("`"))
          return <code key={i} style={{ fontFamily:"var(--font-mono)", fontSize:"0.9em", color:"var(--acid)", background:"rgba(0,245,196,0.08)", padding:"1px 5px", borderRadius:3 }}>{p.slice(1,-1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ─── Collapsible Code Block ───────────────────────────────────────────────────
function CodeBlock({ lang, code, accentColor }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const color = accentColor || "var(--acid)";

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      border:`1px solid ${color}25`, borderRadius:10, overflow:"hidden",
      marginTop:4, marginBottom:4
    }}>
      {/* Toggle bar */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 16px", cursor:"pointer",
          background:`${color}0a`,
          transition:"background 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.background=`${color}14`}
        onMouseLeave={e => e.currentTarget.style.background=`${color}0a`}
      >
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color, letterSpacing:"0.08em", textTransform:"uppercase" }}>
            {lang} code
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {open && (
            <button
              onClick={e => { e.stopPropagation(); copy(); }}
              style={{
                background: copied ? `${color}20` : "transparent",
                border:`1px solid ${color}30`, borderRadius:5,
                padding:"3px 10px", fontFamily:"var(--font-mono)", fontSize:10,
                color, cursor:"pointer", transition:"all 0.2s"
              }}
            >{copied ? "✓ copied" : "copy"}</button>
          )}
          <span style={{
            fontFamily:"var(--font-mono)", fontSize:12, color,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            display:"inline-block", transition:"transform 0.25s ease"
          }}>▾</span>
        </div>
      </div>

      {/* Code content */}
      {open && (
        <div style={{
          background:"rgba(0,0,0,0.4)", padding:"16px 18px",
          borderTop:`1px solid ${color}15`,
          animation:"fadeIn 0.2s ease both"
        }}>
          <pre style={{
            fontFamily:"var(--font-mono)", fontSize:12, color:"#c9d1d9",
            lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-all",
            margin:0
          }}>{code}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Markdown Table ───────────────────────────────────────────────────────────
function MarkdownTable({ headers, rows, accentColor }) {
  const color = accentColor || "var(--acid)";
  return (
    <div style={{ overflowX:"auto", marginTop:6, marginBottom:6, borderRadius:10, border:`1px solid ${color}20` }}>
      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:400 }}>
        <thead>
          <tr style={{ background:`${color}10` }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding:"10px 14px", textAlign:"left",
                fontFamily:"var(--font-mono)", fontSize:11,
                color, letterSpacing:"0.08em", textTransform:"uppercase",
                borderBottom:`1px solid ${color}25`,
                fontWeight:700,
                whiteSpace:"nowrap"
              }}>
                <InlineText text={h} color={color}/>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
              transition:"background 0.15s"
            }}
              onMouseEnter={e => e.currentTarget.style.background=`${color}07`}
              onMouseLeave={e => e.currentTarget.style.background= ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)"}
            >
              {row.map((cell, ci) => {
                // Detect priority badges in first-ish col
                const isHigh = cell.toUpperCase() === "HIGH";
                const isMed  = cell.toUpperCase() === "MEDIUM" || cell.toUpperCase() === "MED";
                const isLow  = cell.toUpperCase() === "LOW";
                const isBadge = isHigh || isMed || isLow;
                const badgeColor = isHigh ? "#f54b4b" : isMed ? "#f5a623" : "#4b8ef5";

                // Detect score gain patterns like "+5", "+2 points"
                const isGain = /^\+\d/.test(cell.trim());

                return (
                  <td key={ci} style={{
                    padding:"10px 14px",
                    fontFamily: isBadge || isGain ? "var(--font-mono)" : "var(--font-body)",
                    fontSize:13,
                    color: isGain ? "#00f5c4" : "var(--text-primary)",
                    borderBottom:"1px solid rgba(255,255,255,0.04)",
                    verticalAlign:"top",
                    lineHeight:1.6
                  }}>
                    {isBadge ? (
                      <span style={{
                        padding:"2px 10px", borderRadius:20,
                        background:`${badgeColor}15`, border:`1px solid ${badgeColor}35`,
                        color:badgeColor, fontSize:11, fontWeight:700,
                        letterSpacing:"0.06em"
                      }}>{cell}</span>
                    ) : (
                      <InlineText text={cell} color={color}/>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────
function MarkdownRenderer({ blocks, accentColor }) {
  const color = accentColor || "var(--acid)";
  let numberedIdx = 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {blocks.map((b, i) => {

        if (b.type === "code") return (
          <CodeBlock key={i} lang={b.lang} code={b.code} accentColor={color}/>
        );

        if (b.type === "table") return (
          <MarkdownTable key={i} headers={b.headers} rows={b.rows} accentColor={color}/>
        );

        if (b.type === "h1") return (
          <div key={i} style={{
            fontFamily:"var(--font-display)", fontSize:20, fontWeight:800,
            color:"var(--text-primary)", paddingBottom:8,
            borderBottom:`1px solid rgba(255,255,255,0.06)`,
            marginTop: i > 0 ? 14 : 0, marginBottom:4
          }}>{b.text}</div>
        );

        if (b.type === "h2") return (
          <div key={i} style={{
            fontFamily:"var(--font-display)", fontSize:15, fontWeight:700,
            color, letterSpacing:"0.03em",
            display:"flex", alignItems:"center", gap:10,
            marginTop: i > 0 ? 18 : 0, marginBottom:2
          }}>
            <span style={{ width:3, height:16, background:color, borderRadius:2, display:"inline-block", flexShrink:0, boxShadow:`0 0 6px ${color}` }}/>
            {b.text}
          </div>
        );

        if (b.type === "h3") return (
          <div key={i} style={{
            fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700,
            color:"var(--text-secondary)", textTransform:"uppercase",
            letterSpacing:"0.1em", marginTop:10, marginBottom:2
          }}>{b.text}</div>
        );

        if (b.type === "hr") return (
          <div key={i} style={{ height:1, background:`linear-gradient(90deg, ${color}30, transparent)`, margin:"10px 0" }}/>
        );

        if (b.type === "numbered") {
          numberedIdx++;
          const n = numberedIdx;
          return (
            <div key={i} style={{
              display:"flex", gap:14, alignItems:"flex-start",
              background:`${color}07`, border:`1px solid ${color}18`,
              borderRadius:10, padding:"12px 16px",
              animation:`fadeUp 0.4s ease ${Math.min(i*30, 300)}ms both`
            }}>
              <div style={{
                width:28, height:28, borderRadius:"50%", flexShrink:0,
                background:`${color}18`, border:`1px solid ${color}40`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"var(--font-mono)", fontSize:12, color, fontWeight:800
              }}>{n}</div>
              <div style={{ flex:1 }}>
                {b.title && (
                  <div style={{
                    fontFamily:"var(--font-display)", fontSize:14, fontWeight:700,
                    color:"var(--text-primary)", marginBottom: b.body ? 5 : 0
                  }}>{b.title}</div>
                )}
                {b.body && (
                  <div style={{
                    fontFamily:"var(--font-body)", fontSize:14,
                    color:"var(--text-secondary)", lineHeight:1.75
                  }}>
                    <InlineText text={b.body} color={color}/>
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (b.type === "bullet") return (
          <div key={i} style={{
            display:"flex", gap:12, alignItems:"flex-start",
            padding:"7px 4px",
            borderBottom:"1px solid rgba(255,255,255,0.03)"
          }}>
            <div style={{
              width:7, height:7, borderRadius:"50%", flexShrink:0,
              background:color, boxShadow:`0 0 7px ${color}`,
              marginTop:8
            }}/>
            <div style={{ flex:1 }}>
              {b.title && (
                <span style={{
                  fontFamily:"var(--font-display)", fontSize:14,
                  fontWeight:700, color:"var(--text-primary)", marginRight:6
                }}>{b.title}: </span>
              )}
              <span style={{
                fontFamily:"var(--font-body)", fontSize:14,
                color:"var(--text-secondary)", lineHeight:1.75
              }}>
                <InlineText text={b.body} color={color}/>
              </span>
            </div>
          </div>
        );

        if (b.type === "para") return (
          <p key={i} style={{
            fontFamily:"var(--font-body)", fontSize:14,
            color:"var(--text-primary)", lineHeight:1.85,
            fontWeight:300, opacity:0.88
          }}>
            <InlineText text={b.text} color={color}/>
          </p>
        );

        return null;
      })}
    </div>
  );
}

// ─── Glowing Section Card ─────────────────────────────────────────────────────
function GeoCard({ label, icon, accentColor, children, delay = 0, glowBg }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{
      background: glowBg || "var(--panel)",
      border:`1px solid ${accentColor}22`,
      borderRadius:16, overflow:"hidden",
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)",
      transition:"opacity 0.7s ease, transform 0.7s ease",
      position:"relative"
    }}>
      {/* Top accent bar */}
      <div style={{ height:2, background:`linear-gradient(90deg, ${accentColor}, ${accentColor}00)` }}/>

      {/* Glow orb top-right */}
      <div style={{
        position:"absolute", top:"-30%", right:"-10%",
        width:200, height:200, borderRadius:"50%",
        background:`radial-gradient(circle, ${accentColor}08, transparent 70%)`,
        pointerEvents:"none"
      }}/>

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"18px 24px 14px",
        borderBottom:`1px solid rgba(255,255,255,0.04)`
      }}>
        <div style={{
          width:34, height:34, borderRadius:10,
          background:`${accentColor}14`, border:`1px solid ${accentColor}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16
        }}>{icon}</div>
        <div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:accentColor, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:2 }}>
            {label}
          </div>
        </div>
        <div style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%", background:accentColor, boxShadow:`0 0 8px ${accentColor}`, animation:"blink 2s ease infinite" }}/>
      </div>

      {/* Body */}
      <div style={{ padding:"20px 24px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Mini Score Arc (used in geo_done product banner) ────────────────────────
function MiniScoreArc({ pct, color }) {
  const [displayed, setDisplayed] = useState(0);
  const [arcLen,    setArcLen]    = useState(0);
  const R = 32, cx = 40, cy = 40;
  const circ    = 2 * Math.PI * R;
  const fullArc = circ * 0.75;

  useEffect(() => {
    const dur = 1400, start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(e * pct));
      setArcLen(e * fullArc * (pct / 100));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [pct]);

  return (
    <svg width={80} height={80} style={{ overflow:"visible" }}>
      <circle cx={cx} cy={cy} r={R+6} fill="none" stroke={color} strokeWidth="1" opacity="0.08"/>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)"
        strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${fullArc} ${circ}`}
        transform={`rotate(135 ${cx} ${cy})`}/>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color}
        strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circ}`}
        transform={`rotate(135 ${cx} ${cy})`}
        style={{ filter:`drop-shadow(0 0 5px ${color})` }}/>
      <text x={cx} y={cy+1} textAnchor="middle" fill={color}
        fontFamily="'Syne',sans-serif" fontSize="15" fontWeight="800">{displayed}</text>
      <text x={cx} y={cy+13} textAnchor="middle" fill="rgba(255,255,255,0.3)"
        fontFamily="'Space Mono',monospace" fontSize="7">/100</text>
    </svg>
  );
}

// ─── Score Projection Card ────────────────────────────────────────────────────
// Parses "Score Projection" section text and renders it as animated score cards
function ScoreProjectionCard({ text }) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Extract patterns like "Current: 60 / 100", "After quick wins: 70 / 100", "New band: Good"
  const entries = [];
  lines.forEach(line => {
    const scoreMatch = line.match(/^(.+?):\s*(\d+)\s*\/\s*(\d+)/);
    const bandMatch  = line.match(/^New band[:\s]+(.+)/i);
    if (scoreMatch) entries.push({ label: scoreMatch[1].replace(/[-–]/g,"").trim(), score: +scoreMatch[2], max: +scoreMatch[3], isBand: false });
    else if (bandMatch) entries.push({ label:"New Band", value: bandMatch[1].trim(), isBand: true });
    else if (line && !line.startsWith("|")) entries.push({ label: line, isFree: true });
  });

  if (!entries.length) return null;

  const colors = ["#7a8fa8","#f5a623","#00f5c4","#9b6dff"];

  return (
    <div style={{
      background:"linear-gradient(135deg, rgba(0,245,196,0.05), rgba(155,109,255,0.04))",
      border:"1px solid rgba(0,245,196,0.2)", borderRadius:14,
      padding:"20px 24px", marginTop:8
    }}>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--acid)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:16 }}>
        ◈ Score Projection
      </div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
        {entries.filter(e => !e.isBand && !e.isFree).map((e, i) => {
          const color = colors[i] || "#7a8fa8";
          const pct   = Math.round((e.score / e.max) * 100);
          return (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <MiniScoreArc pct={pct} color={color}/>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", textAlign:"center", maxWidth:80 }}>{e.label}</div>
            </div>
          );
        })}

        {/* Band pill */}
        {entries.filter(e => e.isBand).map((e, i) => (
          <div key={i} style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:6,
            padding:"12px 18px", borderRadius:12,
            background:"rgba(155,109,255,0.08)", border:"1px solid rgba(155,109,255,0.25)"
          }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Projected Band</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, color:"var(--violet)", textAlign:"center" }}>{e.value}</div>
          </div>
        ))}
      </div>

      {/* Arrow progression line */}
      {entries.filter(e => !e.isBand && !e.isFree).length > 1 && (
        <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:8, overflow:"hidden" }}>
          {entries.filter(e => !e.isBand && !e.isFree).map((e, i, arr) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
              <div style={{
                flex:1, height:2, borderRadius:1,
                background:`linear-gradient(90deg, ${colors[i]}60, ${colors[Math.min(i+1,3)]}60)`
              }}/>
              <div style={{
                fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700,
                color: colors[i], whiteSpace:"nowrap"
              }}>
                {e.score}/{e.max}
              </div>
              {i < arr.length - 1 && (
                <span style={{ color:"var(--text-muted)", fontSize:12 }}>→</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GEO Report ───────────────────────────────────────────────────────────────
function GeoReport({ data, scoreData }) {
  const [section, setSection] = useState(0);

  useEffect(() => {
    const timers = [0, 300, 700, 1100, 1500].map((d, i) =>
      setTimeout(() => setSection(i + 1), d)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!data) return null;

  const summary      = data.executive_summary  || data.summary         || "";
  const technical    = data.technical_analysis || "";
  const content      = data.content_analysis   || "";
  const priority     = data.prioritized_plan   || "";
  const readinessPct = data.ai_readiness_pct;
  const band         = data.readiness_band;

  // Parse all markdown sections upfront
  const summaryBlocks   = parseMarkdown(summary);
  const technicalBlocks = parseMarkdown(technical);
  const contentBlocks   = parseMarkdown(content);

  // For priority: split out Score Projection section for special rendering
  const priorityRaw = priority;
  const projectionMatch = priorityRaw.match(/#{0,3}\s*Score Projection\s*\n([\s\S]+?)(?=\n#{1,3}\s|\n\n#{1,3}\s|$)/i);
  const projectionText  = projectionMatch ? projectionMatch[1] : "";
  const priorityClean   = projectionMatch
    ? priorityRaw.replace(projectionMatch[0], "").trim()
    : priorityRaw;
  const priorityBlocks  = parseMarkdown(priorityClean);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Executive Summary ── */}
      {section >= 1 && (
        <GeoCard
          label="Executive Summary"
          icon="◈"
          accentColor="#00f5c4"
          delay={0}
          glowBg="linear-gradient(135deg, rgba(0,245,196,0.06) 0%, var(--panel) 60%)"
        >
          {/* Score arc + band pill */}
          {(readinessPct != null || band) && (
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center", marginBottom:20, paddingBottom:18, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              {readinessPct != null && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <MiniScoreArc pct={readinessPct} color={readinessPct>=70?"#00f5c4":readinessPct>=50?"#f5a623":"#f54b4b"}/>
                  <div style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Current Score</div>
                </div>
              )}
              {band && (
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Readiness Band</div>
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    padding:"8px 16px", borderRadius:10,
                    background:"rgba(155,109,255,0.08)", border:"1px solid rgba(155,109,255,0.25)"
                  }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--violet)", boxShadow:"0 0 6px var(--violet)", animation:"blink 2s ease infinite" }}/>
                    <div style={{ fontSize:14, fontFamily:"var(--font-display)", fontWeight:700, color:"var(--violet)" }}>{band}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Typewriter for first paragraph, then rest rendered normally */}
          {summaryBlocks.length > 0 && summaryBlocks[0].type === "para" ? (
            <>
              <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text-primary)", lineHeight:1.85, fontWeight:300, marginBottom: summaryBlocks.length > 1 ? 14 : 0 }}>
                <TypeWriter text={summaryBlocks[0].text} speed={8}/>
              </p>
              {summaryBlocks.length > 1 && (
                <MarkdownRenderer blocks={summaryBlocks.slice(1)} accentColor="#00f5c4"/>
              )}
            </>
          ) : (
            <MarkdownRenderer blocks={summaryBlocks} accentColor="#00f5c4"/>
          )}
        </GeoCard>
      )}

      {/* ── Technical Audit ── */}
      {section >= 2 && technicalBlocks.length > 0 && (
        <GeoCard label="Technical Audit Findings" icon="⬡" accentColor="#f54b4b" delay={100}>
          <MarkdownRenderer blocks={technicalBlocks} accentColor="#f54b4b"/>
        </GeoCard>
      )}

      {/* ── Content Strategy ── */}
      {section >= 3 && contentBlocks.length > 0 && (
        <GeoCard label="Content Strategy Gaps" icon="◎" accentColor="#f5a623" delay={200}>
          <MarkdownRenderer blocks={contentBlocks} accentColor="#f5a623"/>
        </GeoCard>
      )}

      {/* ── Priority Roadmap ── */}
      {section >= 4 && (priorityBlocks.length > 0 || projectionText) && (
        <GeoCard label="Priority Implementation Roadmap" icon="◆" accentColor="#9b6dff" delay={300}>
          {priorityBlocks.length > 0 && (
            <MarkdownRenderer blocks={priorityBlocks} accentColor="#9b6dff"/>
          )}
          {/* Score Projection — rendered as animated arcs, not plain text */}
          {projectionText && (
            <ScoreProjectionCard text={projectionText}/>
          )}
        </GeoCard>
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

// ─── GEO Loading Screen ───────────────────────────────────────────────────────
const INSIGHTS = [
  "LLMs cite pages with structured FAQ schema 3× more often",
  "Missing canonical URL causes duplicate indexing in AI crawlers",
  "Product pages with specs tables rank 40% higher in AI search",
  "JSON-LD markup is the #1 signal for Google SGE product cards",
  "Pages with <800 words are rarely cited by Perplexity AI",
  "Adding GTIN enables knowledge graph entity matching",
  "Aggregate rating schema unlocks rich snippets in ChatGPT browse",
  "Hreflang tags prevent AI engines from splitting authority signals",
  "Image alt text contributes to multimodal AI search indexing",
  "Trust signals like warranty info increase AI citation confidence",
];

const STREAM_ITEMS = [
  "schema.org/Product → parsed",
  "extractability_score → 6/20",
  "weak_areas.faq → flagged",
  "canonical_url → missing",
  "entity.gtin → null",
  "content.specifications → 0",
  "trust.warranty → absent",
  "priority_order computed",
  "llm_context → serialized",
  "agents.technical → queued",
  "agents.content → queued",
  "agents.prioritizer → queued",
  "agents.report → queued",
  "openai.gpt-4o-mini → called",
  "technical_analysis → streaming",
  "content_analysis → streaming",
  "prioritized_plan → streaming",
  "final_report → streaming",
];

function Particle({ color, delay, dx }) {
  return (
    <div style={{
      position:"absolute", bottom:0,
      left:`${Math.random()*100}%`,
      width:4, height:4, borderRadius:"50%",
      background:color, boxShadow:`0 0 6px ${color}`,
      "--dx": `${dx}px`,
      animation:`particle-rise ${2 + Math.random()*2}s ease-out ${delay}s infinite`,
      pointerEvents:"none"
    }}/>
  );
}

function RadarRing({ size, color, duration, delay }) {
  return (
    <div style={{
      position:"absolute", top:"50%", left:"50%",
      width:size, height:size, borderRadius:"50%",
      border:`1px solid ${color}`,
      transform:"translate(-50%,-50%)",
      animation:`hex-pulse ${duration}s ease-in-out ${delay}s infinite`,
      pointerEvents:"none"
    }}/>
  );
}

function GeoLoadingScreen({ currentStep, totalSteps, url }) {
  const [insightIdx, setInsightIdx]       = useState(0);
  const [streamIdx,  setStreamIdx]        = useState(0);
  const [elapsed,    setElapsed]          = useState(0);
  const [particles,  setParticles]        = useState([]);

  // Cycle insights every 3.5s
  useEffect(() => {
    const iv = setInterval(() => setInsightIdx(i => (i + 1) % INSIGHTS.length), 3500);
    return () => clearInterval(iv);
  }, []);

  // Stream data items every 0.9s
  useEffect(() => {
    const iv = setInterval(() => setStreamIdx(i => (i + 1) % STREAM_ITEMS.length), 900);
    return () => clearInterval(iv);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Spawn particles
  useEffect(() => {
    const ps = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      color: ["#00f5c4","#9b6dff","#4b8ef5","#f5a623"][i % 4],
      delay: i * 0.3,
      dx: (Math.random() - 0.5) * 60
    }));
    setParticles(ps);
  }, []);

  const pct = Math.round((currentStep / totalSteps) * 100);
  const agentColors = ["#f54b4b","#f5a623","#9b6dff","#00f5c4"];
  const agentLabels = ["Technical\nAuditor","Content\nStrategist","Prioritizer","Report\nBuilder"];
  const agentActive = Math.min(Math.floor((currentStep / totalSteps) * 4), 3);

  return (
    <div style={{
      position:"relative", zIndex:1, width:"100%", maxWidth:680,
      display:"flex", flexDirection:"column", alignItems:"center", gap:24,
      animation:"fadeIn 0.5s ease both"
    }}>

      {/* ── Central Radar Visual ── */}
      <div style={{ position:"relative", width:260, height:260, flexShrink:0 }}>
        {/* Particle emitter */}
        <div style={{ position:"absolute", inset:0, overflow:"hidden", borderRadius:"50%", pointerEvents:"none" }}>
          {particles.map(p => <Particle key={p.id} {...p}/>)}
        </div>

        {/* Radar rings */}
        <RadarRing size={260} color="rgba(155,109,255,0.12)" duration={3.2} delay={0}/>
        <RadarRing size={200} color="rgba(0,245,196,0.15)"  duration={2.8} delay={0.4}/>
        <RadarRing size={140} color="rgba(75,142,245,0.18)" duration={2.4} delay={0.8}/>
        <RadarRing size={80}  color="rgba(0,245,196,0.25)"  duration={2.0} delay={1.2}/>

        {/* Rotating sweep arm */}
        <svg style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          animation:"radar-spin 4s linear infinite"
        }} viewBox="0 0 260 260">
          <defs>
            <linearGradient id="sweep" x1="130" y1="130" x2="260" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9b6dff" stopOpacity="0"/>
              <stop offset="100%" stopColor="#9b6dff" stopOpacity="0.4"/>
            </linearGradient>
          </defs>
          <path d="M130,130 L260,130 A130,130 0 0,0 130,0 Z" fill="url(#sweep)"/>
          <line x1="130" y1="130" x2="260" y2="130" stroke="#9b6dff" strokeWidth="1.5" opacity="0.6"/>
        </svg>

        {/* Progress ring */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", transform:"rotate(-90deg)" }} viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="50" fill="none" stroke="rgba(0,245,196,0.08)" strokeWidth="6"/>
          <circle cx="130" cy="130" r="50" fill="none" stroke="#00f5c4" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="314"
            strokeDashoffset={314 - (314 * pct / 100)}
            style={{ transition:"stroke-dashoffset 0.8s ease", filter:"drop-shadow(0 0 6px #00f5c4)" }}
          />
        </svg>

        {/* Center content */}
        <div style={{
          position:"absolute", inset:0,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:4
        }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:32, fontWeight:800, color:"#00f5c4", lineHeight:1 }}>
            {pct}%
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase" }}>
            processing
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--violet)", marginTop:2 }}>
            {elapsed}s
          </div>
        </div>

        {/* Scanning line */}
        <div style={{
          position:"absolute", left:0, right:0, height:1,
          background:"linear-gradient(90deg, transparent, rgba(0,245,196,0.6), transparent)",
          animation:"scan-down 3s ease-in-out infinite",
          pointerEvents:"none"
        }}/>
      </div>

      {/* ── Title ── */}
      <div style={{ textAlign:"center" }}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"4px 14px", borderRadius:20,
          background:"rgba(155,109,255,0.08)", border:"1px solid rgba(155,109,255,0.25)",
          marginBottom:10
        }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--violet)", boxShadow:"0 0 6px var(--violet)", animation:"blink 1s ease infinite" }}/>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--violet)", letterSpacing:"0.14em", textTransform:"uppercase" }}>Multi-Agent AI Pipeline Active</span>
        </div>
        <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:4 }}>
          Generating GEO Recommendations
        </div>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-muted)", wordBreak:"break-all", maxWidth:420 }}>
          {url}
        </div>
      </div>

      {/* ── 4-Agent Pipeline ── */}
      <div style={{
        width:"100%", background:"var(--panel)", border:"1px solid var(--border)",
        borderRadius:16, padding:"20px 24px"
      }}>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>
          Agent Pipeline
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {agentLabels.map((label, i) => {
            const done   = i < agentActive;
            const active = i === agentActive;
            const color  = agentColors[i];
            return (
              <div key={i} style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                padding:"12px 8px", borderRadius:10,
                background: active ? `${color}0f` : done ? `${color}08` : "rgba(255,255,255,0.02)",
                border: active ? `1px solid ${color}35` : done ? `1px solid ${color}20` : "1px solid rgba(255,255,255,0.04)",
                transition:"all 0.5s ease",
                opacity: i > agentActive ? 0.3 : 1
              }}>
                {/* Icon circle */}
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background: done ? color : active ? `${color}20` : "rgba(255,255,255,0.04)",
                  border: active ? `2px solid ${color}` : done ? "none" : "1px solid rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.5s ease",
                  boxShadow: active ? `0 0 16px ${color}40` : done ? `0 0 8px ${color}30` : "none",
                  animation: active ? "hex-pulse 1.5s ease infinite" : "none"
                }}>
                  {done
                    ? <span style={{ fontSize:14, color:"#000" }}>✓</span>
                    : active
                      ? <SpinLoader size={18} color={color}/>
                      : <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)" }}>{i+1}</span>
                  }
                </div>
                <div style={{
                  fontFamily:"var(--font-mono)", fontSize:9, textAlign:"center",
                  color: active ? color : done ? color : "var(--text-muted)",
                  letterSpacing:"0.06em", textTransform:"uppercase",
                  lineHeight:1.4, whiteSpace:"pre-line"
                }}>{label}</div>
                {active && (
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color, animation:"blink 0.8s ease infinite" }}>
                    running...
                  </div>
                )}
                {done && (
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color, opacity:0.6 }}>
                    complete
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop:16, height:3, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden" }}>
          <div style={{
            height:"100%", borderRadius:2,
            background:"linear-gradient(90deg, #9b6dff, #00f5c4)",
            width:`${pct}%`, transition:"width 0.8s ease",
            boxShadow:"0 0 8px rgba(0,245,196,0.4)"
          }}/>
        </div>
      </div>

      {/* ── Live Data Stream + Insight ── */}
      <div style={{ width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

        {/* Data Stream */}
        <div style={{
          background:"var(--panel)", border:"1px solid var(--border)",
          borderRadius:12, padding:"16px", overflow:"hidden",
          position:"relative"
        }}>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            ▸ Data Stream
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {[...Array(6)].map((_, i) => {
              const idx = (streamIdx - i + STREAM_ITEMS.length) % STREAM_ITEMS.length;
              const item = STREAM_ITEMS[idx];
              const isActive = i === 0;
              const [key, val] = item.split("→").map(s => s.trim());
              return (
                <div key={i} style={{
                  display:"flex", gap:6, alignItems:"center",
                  opacity: isActive ? 1 : Math.max(0.08, 1 - i * 0.18),
                  transition:"opacity 0.3s ease",
                  animation: isActive ? "data-stream 0.4s ease both" : "none"
                }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color: isActive ? "#00f5c4" : "var(--text-muted)", flexShrink:0 }}>
                    {isActive ? "►" : "·"}
                  </span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color: isActive ? "var(--text-primary)" : "var(--text-muted)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {key}
                  </span>
                  {val && (
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color: isActive ? "#00f5c4" : "var(--text-muted)", flexShrink:0 }}>
                      {val}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Insight Card */}
        <div style={{
          background:"linear-gradient(135deg, rgba(155,109,255,0.06), rgba(0,245,196,0.03))",
          border:"1px solid rgba(155,109,255,0.2)",
          borderRadius:12, padding:"16px",
          display:"flex", flexDirection:"column", justifyContent:"space-between",
          position:"relative", overflow:"hidden"
        }}>
          <div style={{ position:"absolute", top:"-20%", right:"-10%", width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle, rgba(155,109,255,0.1), transparent 70%)", pointerEvents:"none" }}/>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--violet)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            ◈ Did You Know
          </div>
          <div key={insightIdx} style={{
            fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-primary)",
            lineHeight:1.7, fontWeight:300, flex:1,
            animation:"insight-cycle 3.5s ease both"
          }}>
            {INSIGHTS[insightIdx]}
          </div>
          {/* Dot indicators */}
          <div style={{ display:"flex", gap:4, marginTop:12 }}>
            {INSIGHTS.map((_, i) => (
              <div key={i} style={{
                width: i === insightIdx ? 16 : 4,
                height:4, borderRadius:2,
                background: i === insightIdx ? "var(--violet)" : "rgba(255,255,255,0.1)",
                transition:"all 0.4s ease"
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step Tracker ── */}
      <div style={{
        width:"100%", background:"var(--panel)", border:"1px solid var(--border)",
        borderRadius:12, padding:"16px 20px"
      }}>
        <StepLine steps={GEO_STEPS} currentStep={currentStep}/>
      </div>

    </div>
  );
}

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
      const crawlRes = await fetch("https://geo-workflow-git-main-dakshsingh791-3753s-projects.vercel.app", {
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
      padding:"48px 20px 100px"
    }}>
      <NoiseBG/>
      <GridBG/>
      <Orbs/>

      {/* ── GENY Navbar ── */}
      <div style={{
        position:"relative", zIndex:1, width:"100%", maxWidth:900,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:64, animation:"fadeIn 0.6s ease both"
      }}>
        {/* GENY Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:38, height:38, borderRadius:10,
            background:"linear-gradient(135deg, #00f5c4, #00c9a2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 20px rgba(0,245,196,0.35)",
            flexShrink:0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#030507" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily:"var(--font-display)", fontSize:22, fontWeight:800,
              letterSpacing:"-0.02em", lineHeight:1,
              background:"linear-gradient(135deg, #e8edf5, #00f5c4)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
            }}>GENY</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--text-muted)", letterSpacing:"0.14em", textTransform:"uppercase", marginTop:1 }}>
              GEO Intelligence
            </div>
          </div>
        </div>

        {/* Nav status pill */}
        <div style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"6px 14px", borderRadius:20,
          background:"rgba(0,245,196,0.05)", border:"1px solid rgba(0,245,196,0.12)"
        }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--acid)", boxShadow:"0 0 6px var(--acid)", animation:"blink 2s ease infinite" }}/>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--acid)", letterSpacing:"0.12em", textTransform:"uppercase" }}>AI Engine Active</span>
        </div>
      </div>

      {/* ── Hero Header ── */}
      <div style={{ position:"relative", zIndex:1, textAlign:"center", marginBottom:52, animation:"fadeUp 0.8s ease both", maxWidth:720 }}>

        {/* GENY large wordmark */}
        <div style={{ position:"relative", marginBottom:16, display:"inline-block" }}>
          {/* Ghost glow behind GENY */}
          <div style={{
            position:"absolute", inset:"-20px -30px",
            background:"radial-gradient(ellipse, rgba(0,245,196,0.12) 0%, transparent 70%)",
            pointerEvents:"none", zIndex:0
          }}/>
          <div style={{
            fontFamily:"var(--font-display)",
            fontSize:"clamp(72px, 14vw, 130px)",
            fontWeight:800, lineHeight:0.9,
            letterSpacing:"-0.04em",
            background:"linear-gradient(135deg, #ffffff 0%, #00f5c4 40%, #9b6dff 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            position:"relative", zIndex:1,
            filter:"drop-shadow(0 0 40px rgba(0,245,196,0.2))"
          }}>GENY</div>
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily:"var(--font-display)",
          fontSize:"clamp(16px, 2.5vw, 22px)",
          fontWeight:600, lineHeight:1.3,
          color:"var(--text-secondary)",
          marginBottom:16, letterSpacing:"-0.01em"
        }}>
          AI Visibility <span style={{ color:"var(--acid)" }}>Optimizer</span> for Product Pages
        </div>

        <p style={{
          fontFamily:"var(--font-body)", fontSize:15,
          color:"var(--text-muted)", maxWidth:460, margin:"0 auto",
          lineHeight:1.75, fontWeight:300
        }}>
          Crawl any product page · Score AI readiness across 5 dimensions · Get an executive GEO report
        </p>

        {/* Trust badges row */}
        <div style={{ marginTop:24, display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          {[
            { icon:"⬡", label:"Schema Analysis" },
            { icon:"◎", label:"Entity Scoring" },
            { icon:"◈", label:"Trust Signals" },
            { icon:"◆", label:"Extractability" },
            { icon:"⚡", label:"GEO Report" },
          ].map((f, i) => (
            <div key={f.label} style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"5px 12px", borderRadius:20,
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
              fontFamily:"var(--font-body)", fontSize:11, color:"var(--text-muted)",
              animation:`fadeUp 0.4s ease ${0.3 + i * 0.08}s both`,
              transition:"all 0.2s"
            }}>
              <span style={{ fontSize:10, color:"var(--acid)", opacity:0.7 }}>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── INPUT ── */}
      {phase === "input" && (
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:620, animation:"fadeUp 0.6s ease 0.3s both" }}>

          {/* Input card */}
          <div style={{
            background:"var(--panel)",
            border:"1px solid rgba(0,245,196,0.14)",
            borderRadius:20, overflow:"hidden",
            boxShadow:"0 0 80px rgba(0,245,196,0.06), 0 0 0 1px rgba(255,255,255,0.04), 0 32px 60px rgba(0,0,0,0.5)"
          }}>
            {/* Card top accent */}
            <div style={{ height:2, background:"linear-gradient(90deg, #00f5c4, #9b6dff, #00f5c400)" }}/>

            <div style={{ padding:"28px 28px 24px" }}>
              {/* Card header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{
                  width:28, height:28, borderRadius:8,
                  background:"linear-gradient(135deg, #00f5c4, #00c9a2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 0 12px rgba(0,245,196,0.3)"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#030507" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.01em" }}>
                    GENY Analysis
                  </div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
                    Powered by Multi-Agent AI
                  </div>
                </div>
              </div>

              <label style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", display:"block", marginBottom:8 }}>
                Target Product URL
              </label>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{
                  flex:1, display:"flex", alignItems:"center",
                  background:"var(--surface)", border:"1px solid var(--border)",
                  borderRadius:12, overflow:"hidden",
                  transition:"border-color 0.2s",
                }}
                  onFocusCapture={e => e.currentTarget.style.borderColor="rgba(0,245,196,0.35)"}
                  onBlurCapture={e => e.currentTarget.style.borderColor="var(--border)"}
                >
                  <span style={{ padding:"0 14px", color:"var(--text-muted)", fontFamily:"var(--font-mono)", fontSize:12, flexShrink:0 }}>https://</span>
                  <input
                    value={url.replace(/^https?:\/\//, "")}
                    onChange={e => setUrl("https://" + e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                    placeholder="amazon.com/dp/B0XXXXXXX..."
                    style={{
                      flex:1, background:"transparent", border:"none", outline:"none",
                      fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-primary)",
                      padding:"15px 14px 15px 0", caretColor:"var(--acid)"
                    }}
                  />
                </div>
                <button onClick={handleAnalyze} style={{
                  background:"linear-gradient(135deg, #00f5c4, #00c9a2)",
                  border:"none", borderRadius:12, padding:"15px 22px",
                  fontFamily:"var(--font-display)", fontSize:13, fontWeight:700,
                  color:"#030507", cursor:"pointer", whiteSpace:"nowrap",
                  transition:"all 0.2s ease",
                  boxShadow:"0 0 24px rgba(0,245,196,0.25), 0 4px 12px rgba(0,0,0,0.3)",
                  display:"flex", alignItems:"center", gap:8
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px) scale(1.02)"; e.currentTarget.style.boxShadow="0 0 40px rgba(0,245,196,0.4), 0 8px 20px rgba(0,0,0,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 24px rgba(0,245,196,0.25), 0 4px 12px rgba(0,0,0,0.3)"; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Analyze
                </button>
              </div>

              <ErrorBanner/>

              {/* Example URLs */}
              <div style={{ marginTop:14, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginRight:4 }}>Try:</span>
                {["amazon.com/dp/B0C9X", "gymshark.com/products/", "ikea.com/us/en/p/"].map(ex => (
                  <button key={ex} onClick={() => setUrl("https://" + ex)} style={{
                    background:"transparent", border:"1px solid rgba(255,255,255,0.07)", borderRadius:6,
                    padding:"4px 10px", fontFamily:"var(--font-mono)", fontSize:10,
                    color:"var(--text-muted)", cursor:"pointer", transition:"all 0.2s"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,245,196,0.3)"; e.currentTarget.style.color="var(--acid)"; e.currentTarget.style.background="rgba(0,245,196,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.background="transparent"; }}
                  >{ex}</button>
                ))}
              </div>
            </div>

            {/* Card footer */}
            <div style={{
              padding:"14px 28px",
              borderTop:"1px solid rgba(255,255,255,0.04)",
              background:"rgba(0,0,0,0.15)",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8
            }}>
              <div style={{ display:"flex", gap:16 }}>
                {[["⚡","GPT-4o-mini"],["◈","5 Dimensions"],["◆","4 AI Agents"]].map(([icon, label]) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontSize:10, color:"var(--acid)", opacity:0.6 }}>{icon}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em" }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.08em" }}>
                avg. 45–90s per report
              </div>
            </div>
          </div>

          {/* Below-card stats */}
          <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {[
              { value:"100pt", label:"Max Score", color:"#00f5c4" },
              { value:"4",     label:"AI Agents",  color:"#9b6dff" },
              { value:"5",     label:"Dimensions", color:"#f5a623" },
            ].map(stat => (
              <div key={stat.label} style={{
                padding:"14px 16px", borderRadius:12,
                background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)",
                textAlign:"center", animation:"fadeUp 0.4s ease 0.5s both"
              }}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:800, color:stat.color, lineHeight:1, marginBottom:4 }}>{stat.value}</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{stat.label}</div>
              </div>
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
        <GeoLoadingScreen
          currentStep={geoStep}
          totalSteps={GEO_STEPS.length}
          url={url}
        />
      )}

      {/* ── GEO DONE ── */}
      {phase === "geo_done" && (
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:860, margin:"0 auto" }}>

          {/* Product identity hero banner */}
          {scoreResult?.llm_context?.product_summary && (() => {
            const ps  = scoreResult.llm_context.product_summary;
            const vis = scoreResult.llm_context.ai_visibility_summary || {};
            const pct = vis.ai_readiness_pct;
            const bandColor = pct >= 85 ? "#00f5c4" : pct >= 70 ? "#00d4aa" : pct >= 50 ? "#f5a623" : pct >= 30 ? "#f57c23" : "#f54b4b";
            return (
              <div style={{
                marginBottom:28, borderRadius:16, overflow:"hidden",
                background:"linear-gradient(135deg, rgba(155,109,255,0.07) 0%, var(--panel) 50%, rgba(0,245,196,0.04) 100%)",
                border:"1px solid rgba(155,109,255,0.2)",
                position:"relative", animation:"fadeUp 0.5s ease both"
              }}>
                {/* Top gradient bar */}
                <div style={{ height:2, background:"linear-gradient(90deg, #9b6dff, #00f5c4)" }}/>
                {/* BG glow */}
                <div style={{ position:"absolute", top:"-40%", right:"-5%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(155,109,255,0.06), transparent 70%)", pointerEvents:"none" }}/>

                <div style={{ padding:"22px 28px", display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
                  {/* Brand + product name */}
                  <div style={{ flex:1, minWidth:200 }}>
                    {ps.brand && (
                      <div style={{
                        display:"inline-flex", alignItems:"center", gap:6,
                        padding:"3px 12px", borderRadius:20, marginBottom:10,
                        background:"rgba(155,109,255,0.12)", border:"1px solid rgba(155,109,255,0.3)"
                      }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--violet)", boxShadow:"0 0 5px var(--violet)" }}/>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--violet)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700 }}>
                          {ps.brand}
                        </span>
                      </div>
                    )}
                    <div style={{
                      fontFamily:"var(--font-display)", fontSize:"clamp(16px,3vw,22px)",
                      fontWeight:800, color:"var(--text-primary)", lineHeight:1.2, marginBottom:8
                    }}>
                      {ps.name || "Product"}
                    </div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                      {ps.price && (
                        <span style={{
                          fontFamily:"var(--font-mono)", fontSize:15, fontWeight:700,
                          color:"var(--acid)"
                        }}>{ps.currency} {ps.price}</span>
                      )}
                      {ps.availability && (
                        <span style={{
                          padding:"2px 10px", borderRadius:6, fontSize:10,
                          fontFamily:"var(--font-mono)",
                          background:"rgba(0,245,196,0.08)", border:"1px solid rgba(0,245,196,0.2)",
                          color:"var(--acid)", textTransform:"uppercase", letterSpacing:"0.08em"
                        }}>
                          {ps.availability.includes("InStock") ? "✓ In Stock" : ps.availability}
                        </span>
                      )}
                      {ps.rating && (
                        <span style={{
                          fontFamily:"var(--font-mono)", fontSize:11, color:"var(--amber)"
                        }}>★ {ps.rating} <span style={{ color:"var(--text-muted)" }}>({ps.review_count} reviews)</span></span>
                      )}
                    </div>
                  </div>

                  {/* Mini score arc */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
                    <MiniScoreArc pct={pct || 0} color={bandColor}/>
                    <div style={{
                      fontFamily:"var(--font-mono)", fontSize:9, color:bandColor,
                      letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center",
                      maxWidth:120
                    }}>{vis.readiness_band || ""}</div>
                  </div>

                  {/* GEO report badge */}
                  <div style={{
                    display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                    padding:"14px 20px", borderRadius:12, flexShrink:0,
                    background:"rgba(155,109,255,0.08)", border:"1px solid rgba(155,109,255,0.25)"
                  }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--violet)", boxShadow:"0 0 8px var(--violet)", animation:"blink 1.5s ease infinite" }}/>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--violet)", letterSpacing:"0.12em", textTransform:"uppercase" }}>GEO Report</div>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Ready</div>
                  </div>
                </div>
              </div>
            );
          })()}

          <ErrorBanner/>
          <GeoReport data={geoResult} scoreData={scoreResult}/>

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
        display:"flex", justifyContent:"center", alignItems:"center", gap:8,
        background:"linear-gradient(transparent, var(--void))",
        pointerEvents:"none", zIndex:2
      }}>
        <div style={{
          fontFamily:"var(--font-display)", fontSize:11, fontWeight:700,
          background:"linear-gradient(135deg, #e8edf5, #00f5c4)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          letterSpacing:"0.04em"
        }}>GENY</div>
        <div style={{ width:1, height:10, background:"rgba(255,255,255,0.1)" }}/>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
          GEO Intelligence Engine · v1.0
        </div>
      </div>
    </div>
  );
}