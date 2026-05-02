import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const API = "http://localhost:8000";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GENY — OBSIDIAN EDITION
//  Dark luxury · Champagne gold · Surgical precision
//  Bloomberg Terminal × Swiss watchmaker × High-end fintech
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Geist+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root {
  /* Obsidian scale */
  --z9: #080807;
  --z8: #0f0f0e;
  --z7: #161614;
  --z6: #1e1e1b;
  --z5: #272724;
  --z4: #333330;
  --z3: #4a4a46;
  --z2: #6b6b66;
  --z1: #9a9a94;
  --z0: #c8c8c0;

  /* Champagne gold */
  --g5: #c8a96e;
  --g4: #d4b87c;
  --g3: #e2cc98;
  --g2: #f0e2bc;
  --g1: #faf4e6;
  --gf: rgba(200,169,110,0.07);
  --gm: rgba(200,169,110,0.14);
  --gs: rgba(200,169,110,0.28);
  --gx: rgba(200,169,110,0.5);

  /* Signal colors */
  --jade: #4d9b6f;
  --jadef: rgba(77,155,111,0.1);
  --jadeb: rgba(77,155,111,0.25);
  --crimson: #c05252;
  --crimsonf: rgba(192,82,82,0.1);
  --crimsonb: rgba(192,82,82,0.22);
  --amber: #c8883a;
  --amberf: rgba(200,136,58,0.1);
  --amberb: rgba(200,136,58,0.22);
  --cobalt: #4a7bc8;
  --cobaltf: rgba(74,123,200,0.1);
  --cobaltb: rgba(74,123,200,0.22);

  /* Type */
  --serif: 'Fraunces', Georgia, serif;
  --sans:  'Geist', system-ui, sans-serif;
  --mono:  'Geist Mono', 'Courier New', monospace;

  --r3: 3px;
  --r6: 6px;
  --r10: 10px;
  --r14: 14px;
}

html,body,#root { height:100%; }

body {
  background: var(--z8);
  color: var(--z0);
  font-family: var(--sans);
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* Grain texture overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  opacity: 0.025;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: overlay;
}

::selection { background: var(--gm); color: var(--g3); }
::-webkit-scrollbar { width: 2px; }
::-webkit-scrollbar-track { background: var(--z7); }
::-webkit-scrollbar-thumb { background: var(--z4); }

/* ── Keyframes ────────────────────────────────── */
@keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeDown  { from{opacity:0;transform:translateY(-8px)}  to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes slideL    { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideR    { from{opacity:0;transform:translateX(14px)}  to{opacity:1;transform:translateX(0)} }
@keyframes scaleIn   { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes spinR     { to{transform:rotate(-360deg)} }
@keyframes pulse     { 0%,100%{opacity:0.35} 50%{opacity:1} }
@keyframes breathe   { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.08);opacity:1} }
@keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes ticker    { from{transform:translateX(0)} to{transform:translateX(-50%)} }
@keyframes ripple    { from{transform:scale(0);opacity:0.5} to{transform:scale(4);opacity:0} }
@keyframes badgePop  { 0%{opacity:0;transform:scale(0.75) rotate(-6deg)} 65%{transform:scale(1.04) rotate(0.5deg)} 100%{opacity:1;transform:scale(1)} }
@keyframes lineGrow  { from{width:0} to{} }
@keyframes borderRun {
  0%  { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
  25% { clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); }
  50% { clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); }
  75% { clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%); }
  100%{ clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}
@keyframes scanLine  { 0%{top:-2px} 100%{top:calc(100% + 2px)} }
@keyframes numberIn  { from{opacity:0;transform:translateY(8px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes glimmer   { 0%,100%{opacity:0} 50%{opacity:1} }
@keyframes orbDrift  { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,-20px)} 66%{transform:translate(-20px,25px)} }
@keyframes shimmer   { 0%{left:-80%} 100%{left:160%} }

/* ── Card system ──────────────────────────────── */
.panel {
  background: var(--z7);
  border: 1px solid var(--z5);
  border-radius: var(--r10);
  position: relative;
  overflow: hidden;
  transition: border-color 0.25s;
}
.panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 5%, var(--z4) 40%, var(--z4) 60%, transparent 95%);
  opacity: 0.5;
  pointer-events: none;
}
.panel-gold {
  border-color: var(--gs);
  background: linear-gradient(135deg, var(--z7) 0%, rgba(200,169,110,0.04) 100%);
}
.panel-gold::before {
  background: linear-gradient(90deg, transparent 5%, var(--gs) 40%, var(--gx) 60%, transparent 95%);
  opacity: 0.8;
}
.panel:hover { border-color: var(--z4); }
.panel-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }

/* Corner accents */
.ca::after {
  content: '';
  position: absolute;
  top: -1px; right: -1px;
  width: 18px; height: 18px;
  border-top: 1px solid var(--g5);
  border-right: 1px solid var(--g5);
  border-radius: 0 var(--r10) 0 0;
  opacity: 0;
  transition: opacity 0.3s;
}
.ca:hover::after { opacity: 1; }

/* ── Typography ───────────────────────────────── */
.display { font-family: var(--serif); font-weight: 400; font-style: normal; letter-spacing: -0.01em; }
.display-i { font-family: var(--serif); font-weight: 400; font-style: italic; letter-spacing: -0.01em; }
.mono    { font-family: var(--mono); }
.label   { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--z2); }
.label-g { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--g5); }

/* ── Buttons ───────────────────────────────────── */
.btn {
  font-family: var(--sans); font-size: 13px; font-weight: 500; letter-spacing: 0.005em;
  padding: 11px 24px; border: none; border-radius: var(--r6);
  cursor: pointer; transition: all 0.18s;
  display: inline-flex; align-items: center; gap: 9px;
  white-space: nowrap; position: relative; overflow: hidden;
}
.btn-gold {
  background: var(--g5); color: var(--z8);
}
.btn-gold::before { content:''; position:absolute; top:0; left:-80%; width:40%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); animation:shimmer 3.5s ease infinite; }
.btn-gold:hover   { background: var(--g4); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(200,169,110,0.3); }
.btn-gold:active  { transform: translateY(0); }
.btn-gold:disabled{ opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-dark {
  background: var(--z6); color: var(--z0); border: 1px solid var(--z4);
}
.btn-dark:hover { background: var(--z5); border-color: var(--z3); color: var(--z0); transform: translateY(-1px); }
.btn-dark:active{ transform: translateY(0); }

.btn-ghost {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 7px 14px; background: transparent; color: var(--z2);
  border: 1px solid var(--z5); border-radius: var(--r3);
  cursor: pointer; transition: all 0.16s;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-ghost:hover { color: var(--z0); border-color: var(--z3); background: var(--z6); }

/* ── Input ─────────────────────────────────────── */
.inp {
  font-family: var(--sans); font-size: 15px; font-weight: 300;
  background: var(--z6); border: 1px solid var(--z4); color: var(--z0);
  padding: 14px 18px; outline: none; width: 100%;
  border-radius: var(--r6); transition: all 0.22s; caret-color: var(--g5);
}
.inp:focus { border-color: var(--g5); background: var(--z7); box-shadow: 0 0 0 3px var(--gf); }
.inp::placeholder { color: var(--z3); font-weight: 300; }

/* ── Tabs ──────────────────────────────────────── */
.tab-bar { display: flex; border-bottom: 1px solid var(--z5); gap: 0; }
.tab {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  padding: 11px 18px; background: transparent; color: var(--z2); border: none;
  border-bottom: 1px solid transparent; cursor: pointer; transition: all 0.18s; margin-bottom: -1px;
  white-space: nowrap;
}
.tab.on  { color: var(--g4); border-bottom-color: var(--g5); }
.tab:hover:not(.on) { color: var(--z0); }

/* ── Tags ──────────────────────────────────────── */
.tag { font-family:var(--mono); font-size:8.5px; letter-spacing:0.12em; text-transform:uppercase; padding:3px 9px; border-radius:var(--r3); display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
.tg { background:var(--gf);      color:var(--g4);     border:1px solid var(--gs); }
.tj { background:var(--jadef);   color:var(--jade);   border:1px solid var(--jadeb); }
.tc { background:var(--crimsonf);color:var(--crimson);border:1px solid var(--crimsonb); }
.ta { background:var(--amberf);  color:var(--amber);  border:1px solid var(--amberb); }
.tb { background:var(--cobaltf); color:var(--cobalt); border:1px solid var(--cobaltb); }
.tz { background:var(--z6);      color:var(--z1);     border:1px solid var(--z4); }

/* ── Row hover ─────────────────────────────────── */
.row { transition: background 0.12s; }
.row:hover { background: var(--z6) !important; }

/* ── Dividers ──────────────────────────────────── */
.div-h { height: 1px; background: var(--z5); }
.div-g { height: 1px; background: linear-gradient(90deg, transparent, var(--gs), transparent); }

/* ── Section header ────────────────────────────── */
.sec-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 20px; border-bottom: 1px solid var(--z5);
}

/* ── Glow dot ──────────────────────────────────── */
.gdot {
  width: 6px; height: 6px; border-radius: 50%;
  flex-shrink: 0; position: relative;
}
.gdot::after {
  content: ''; position: absolute; inset: -2px; border-radius: 50%;
  background: inherit; opacity: 0.25; animation: breathe 2.5s ease infinite;
}

/* ── Download modal ──────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(8,8,7,0.82); backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.18s ease both; padding: 20px;
}
.modal-card {
  background: var(--z7); border: 1px solid var(--z4);
  border-radius: var(--r14); width: 100%; max-width: 460px;
  position: relative; overflow: hidden;
  animation: scaleIn 0.26s cubic-bezier(0.16,1,0.3,1) both;
  box-shadow: 0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,169,110,0.06);
}

/* ── Console code block ──────────────────────── */
.console-block {
  background: var(--z9); border: 1px solid var(--z5);
  border-radius: var(--r10); overflow: hidden; position: relative;
}
.console-hdr {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-bottom: 1px solid var(--z5);
  background: var(--z8);
}
.console-body {
  font-family: var(--mono); font-size: 12px; color: var(--z0);
  line-height: 1.85; padding: 18px 20px;
  white-space: pre-wrap; word-break: break-all; margin: 0;
  max-height: 300px; overflow-y: auto;
}
.copy-btn {
  margin-left: auto; background: var(--z6); border: 1px solid var(--z4);
  border-radius: var(--r6); padding: 4px 12px;
  color: var(--z2); font-family: var(--mono); font-size: 8.5px;
  letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s;
  text-transform: uppercase; flex-shrink: 0;
}
.copy-btn:hover { background: var(--z4); color: var(--z0); border-color: var(--z3); }
.copy-btn.copied { background: var(--jadeb); border-color: var(--jade); color: var(--jade); }

/* ── Rec card ────────────────────────────────── */
.rec-card {
  border: 1px solid var(--z5); border-radius: var(--r10);
  overflow: hidden; transition: border-color 0.2s;
}
.rec-card:hover { border-color: var(--z4); }
`;

function injectCSS() {
  if (document.getElementById("g-css")) return;
  const s = document.createElement("style");
  s.id = "g-css"; s.textContent = CSS;
  document.head.appendChild(s);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
function currSym(c) { return c==="INR"?"₹":c==="USD"?"$":c==="EUR"?"€":c==="GBP"?"£":(c||""); }
function fmtPrice(price, currency) {
  const sym = currSym(currency);
  const num = typeof price==="number" ? price : parseFloat(String(price).replace(/[^0-9.]/g,""));
  if (isNaN(num)||num<=0) return null;
  return `${sym}${num.toLocaleString("en-IN")}`;
}
function extractFAQs(t) {
  if (!t) return [];
  const faqs = [];
  const faqStart = t.search(/FAQs?\s+Q\./i);
  const faqSection = faqStart>=0 ? t.slice(faqStart) : t;
  const chunks = faqSection.split(/(?=Q\.\s)/);
  for (const chunk of chunks) {
    if (!/^Q\.\s/.test(chunk.trim())) continue;
    const qEnd = chunk.indexOf("?"); if (qEnd<0) continue;
    const question = chunk.slice(2,qEnd+1).trim();
    const answer = chunk.slice(qEnd+1).trim().replace(/^A\.\s*/i,"");
    if (question.length>5) faqs.push({question, answer: answer.slice(0,400)});
  }
  if (faqs.length===0) {
    const lines = t.split(/\n/);
    for (let i=0; i<lines.length; i++) {
      const l = lines[i].trim();
      if (/^Q\.?\s+/.test(l)||/^Q\d+[.:]\s*/.test(l)) {
        const q = l.replace(/^Q\.?\d*[.:]\s*/i,"").trim(); let a="";
        if (i+1<lines.length){const nx=lines[i+1].trim();if(/^A\.?\s+/.test(nx)||/^(Yes|No|The|It|You|Our|All)/i.test(nx)){a=nx.replace(/^A\.?\s*/i,"").trim();i++;}}
        if (q) faqs.push({question:q, answer:a});
      }
    }
  }
  return faqs.slice(0,10);
}
function extractSpecs(t) {
  if (!t) return {};
  const specs = {};
  const m = t.match(/Product Specifications?\s*\n([\s\S]{50,1500}?)(?:\n\n|\nVerified|\nReviews|FAQs)/i);
  if (m) {
    const lines = m[1].split("\n").filter(l=>l.trim());
    for (let i=0;i<lines.length-1;i++){const k=lines[i].trim(),v=lines[i+1].trim();if(k.length<60&&v.length>0&&v.length<300&&!/^\d+$/.test(k)&&k.length>1){specs[k]=v;i++;}}
  }
  if (Object.keys(specs).length===0) {
    const si = t.search(/Product Specifications?\s/i);
    if (si>=0) {
      const ei = t.search(/Verified Reviews|Based on \d+ reviews|FAQs\s+Q\./i);
      const sec = t.slice(si,ei>0?ei:si+2000);
      const KEYS=["Name","Category","Net Content","Product Dimensions","MRP","Country Of Origin","Marketed By","Manufactured by","Net Quantity","IPX","Driver Size","Charging Time","Bluetooth","Beast Mode","ASAP Charge","Noise Cancellation","In The Box","Connectivity","Warranty","Weight","Color","Battery Life","Water Resistance","Microphone","Codec","Frequency Response","Impedance","Sensitivity","Play Time","Standby Time","Charging Port","Interface","Range","Latency","Platform"];
      const found=[];
      for (const key of KEYS){const re=new RegExp(key.replace(/[()™]/g,c=>"\\"+c),"i");const idx=sec.search(re);if(idx>=0)found.push({key,pos:idx});}
      found.sort((a,b)=>a.pos-b.pos);
      for (let i=0;i<found.length;i++){const vs=found[i].pos+found[i].key.length,ve=i+1<found.length?found[i+1].pos:sec.length;const val=sec.slice(vs,ve).trim();if(val.length>0&&val.length<300)specs[found[i].key]=val;}
    }
  }
  return specs;
}

// ─── Dual Spinner ─────────────────────────────────────────────────
function Spin({ size=22, color="var(--g5)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink:0}}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="0.75" strokeOpacity="0.15"/>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.75"
        strokeDasharray="15 41" strokeLinecap="round"
        style={{transformOrigin:"center",animation:"spin 0.9s linear infinite"}}/>
      <circle cx="12" cy="12" r="5" fill="none" stroke={color} strokeWidth="1"
        strokeDasharray="8 24" strokeLinecap="round"
        style={{transformOrigin:"center",animation:"spinR 1.2s linear infinite",opacity:0.4}}/>
    </svg>
  );
}

// ─── Live Number ──────────────────────────────────────────────────
function Num({ to, duration=1200, suffix="" }) {
  const [v, setV] = useState(0);
  useEffect(()=>{
    const s0=performance.now();
    const go=now=>{const p=Math.min((now-s0)/duration,1),e=1-Math.pow(1-p,4);setV(Math.round(e*to));if(p<1)requestAnimationFrame(go);};
    requestAnimationFrame(go);
  },[to,duration]);
  return <>{v}{suffix}</>;
}

// ─── Score Arc ────────────────────────────────────────────────────
function Arc({ pct, size=200 }) {
  const [disp, setDisp] = useState(0);
  const [offset, setOffset] = useState(null);
  const R=72, cx=size/2, cy=size/2, C=2*Math.PI*R;
  const arc = C * 0.78;
  const cf = pct>=80?"var(--jade)":pct>=50?"var(--g5)":"var(--crimson)";
  const grade = pct>=90?"S":pct>=80?"A":pct>=65?"B":pct>=50?"C":pct>=35?"D":"F";

  useEffect(()=>{
    const s0=performance.now(), dur=2200;
    const go=now=>{
      const p=Math.min((now-s0)/dur,1), e=1-Math.pow(1-p,4);
      setDisp(Math.round(e*pct));
      setOffset(arc - arc*(e*pct/100));
      if(p<1) requestAnimationFrame(go);
    };
    const t=setTimeout(()=>requestAnimationFrame(go),400);
    return()=>clearTimeout(t);
  },[pct, arc]);

  return (
    <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {/* Ambient glow */}
      <div style={{position:"absolute",inset:"20%",borderRadius:"50%",background:`radial-gradient(circle,${pct>=80?"rgba(77,155,111":pct>=50?"rgba(200,169,110":"rgba(192,82,82"},0.15) 0%,transparent 70%)`,animation:"breathe 4s ease-in-out infinite"}}/>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer tick ring */}
        {Array.from({length:30},(_,i)=>{
          const a=(126+i*(228/29))*Math.PI/180;
          const big=i%5===0, r1=R+22, r2=R+(big?12:17);
          return <line key={i} x1={cx+r1*Math.cos(a)} y1={cy+r1*Math.sin(a)} x2={cx+r2*Math.cos(a)} y2={cy+r2*Math.sin(a)} stroke={big?"var(--z4)":"var(--z5)"} strokeWidth={big?1:0.5}/>;
        })}
        {/* Decorative ring */}
        <circle cx={cx} cy={cy} r={R+28} fill="none" stroke="var(--z5)" strokeWidth="0.5" strokeDasharray="3 8"/>
        {/* Track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--z5)" strokeWidth="14"
          strokeDasharray={`${arc} ${C}`} strokeLinecap="butt" transform={`rotate(126 ${cx} ${cy})`}/>
        {/* Glow layer */}
        {offset!=null&&pct>0&&<circle cx={cx} cy={cy} r={R} fill="none" stroke={cf} strokeWidth="14" strokeOpacity="0.12"
          strokeDasharray={`${arc} ${C}`} strokeDashoffset={offset}
          strokeLinecap="butt" transform={`rotate(126 ${cx} ${cy})`}/>}
        {/* Main arc */}
        {offset!=null&&<circle cx={cx} cy={cy} r={R} fill="none" stroke={cf} strokeWidth="14"
          strokeDasharray={`${arc} ${C}`} strokeDashoffset={offset}
          strokeLinecap="butt" transform={`rotate(126 ${cx} ${cy})`}
          style={{transition:"stroke-dashoffset 0.04s linear",filter:`drop-shadow(0 0 8px ${cf})`}}/>}
        {/* Inner ring */}
        {offset!=null&&<circle cx={cx} cy={cy} r={R-10} fill="none" stroke={cf} strokeWidth="1" strokeOpacity="0.25"
          strokeDasharray={`${arc*0.9} ${C}`} strokeDashoffset={offset*1.05}
          strokeLinecap="round" transform={`rotate(126 ${cx} ${cy})`}/>}
        {/* Center fill */}
        <circle cx={cx} cy={cy} r={R-8} fill="var(--z7)"/>
        {/* Score number */}
        <text x={cx} y={cy-8} textAnchor="middle" fill={cf}
          style={{fontFamily:"'Fraunces',serif",fontSize:46,fontWeight:400,letterSpacing:"-0.02em"}}>{disp}</text>
        <text x={cx} y={cy+10} textAnchor="middle" fill="var(--z3)"
          style={{fontFamily:"'Geist Mono',monospace",fontSize:9,letterSpacing:"0.12em"}}>/100</text>
        <text x={cx} y={cy+28} textAnchor="middle" fill={cf}
          style={{fontFamily:"'Fraunces',serif",fontSize:14,fontStyle:"italic"}}>{grade} Grade</text>
      </svg>
    </div>
  );
}

// ─── Mini arc for hero demo ───────────────────────────────────────
function MiniArc({ pct }) {
  const [disp, setDisp] = useState(0);
  const [offset, setOffset] = useState(null);
  const R=46, size=120, cx=60, cy=60, C=2*Math.PI*R, arc=C*0.78;
  const cf = pct>=80?"var(--jade)":pct>=50?"var(--g5)":"var(--crimson)";
  const grade = pct>=80?"A":pct>=65?"B":pct>=50?"C":"D";
  useEffect(()=>{
    const s0=performance.now(), dur=1200;
    const go=now=>{const p=Math.min((now-s0)/dur,1),e=1-Math.pow(1-p,4);setDisp(Math.round(e*pct));setOffset(arc-arc*(e*pct/100));if(p<1)requestAnimationFrame(go);};
    requestAnimationFrame(go);
  },[pct,arc]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--z5)" strokeWidth="10" strokeDasharray={`${arc} ${C}`} strokeLinecap="butt" transform={`rotate(126 ${cx} ${cy})`}/>
      {offset!=null&&<circle cx={cx} cy={cy} r={R} fill="none" stroke={cf} strokeWidth="10" strokeDasharray={`${arc} ${C}`} strokeDashoffset={offset} strokeLinecap="butt" transform={`rotate(126 ${cx} ${cy})`} style={{filter:`drop-shadow(0 0 6px ${cf}60)`}}/>}
      <circle cx={cx} cy={cy} r={R-6} fill="var(--z7)"/>
      <text x={cx} y={cy-3} textAnchor="middle" fill={cf} style={{fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:400}}>{disp}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fill="var(--z3)" style={{fontFamily:"'Geist Mono',monospace",fontSize:8,letterSpacing:"0.1em"}}>{grade}</text>
    </svg>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────
function Bar({ pct, color="auto", delay=0, height=3 }) {
  const [w, setW] = useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(pct),delay+80);return()=>clearTimeout(t);},[pct,delay]);
  const c = color==="auto"?(pct>=70?"var(--jade)":pct>=45?"var(--g5)":"var(--crimson)"):color;
  return (
    <div style={{height,background:"var(--z5)",borderRadius:height,overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${w}%`,background:c,
        borderRadius:height,transition:`width 1.3s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        boxShadow:`0 0 8px ${c}40`}}/>
    </div>
  );
}

// ─── Step tracker ─────────────────────────────────────────────────
function Steps({ steps, cur }) {
  return (
    <div style={{display:"flex",flexDirection:"column"}}>
      {steps.map((s,i)=>{
        const done=i<cur, active=i===cur;
        return (
          <div key={i} style={{display:"flex",gap:16,padding:"13px 0",
            borderBottom:i<steps.length-1?"1px solid var(--z5)":"none",
            opacity:i>cur?0.2:1,transition:"opacity 0.5s,background 0.2s",
            background:active?"rgba(200,169,110,0.03)":"transparent"}}>
            <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,
              border:`1px solid ${done?"var(--jade)":active?"var(--g5)":"var(--z4)"}`,
              background:done?"var(--jade)":active?"rgba(200,169,110,0.1)":"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all 0.35s",
              boxShadow:active?"0 0 0 4px var(--gf), 0 0 16px var(--gm)":"none"}}>
              {done?<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 3.8,7.5 8.5,2" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              :active?<div style={{width:6,height:6,borderRadius:"50%",background:"var(--g5)",animation:"breathe 1.5s ease infinite"}}/>
              :<span style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--z3)"}}>{i+1}</span>}
            </div>
            <div style={{flex:1,paddingTop:3}}>
              <div style={{fontFamily:"var(--sans)",fontSize:14,color:done?"var(--z2)":active?"var(--z0)":"var(--z2)",
                fontWeight:active?400:300,textDecoration:done?"line-through":"none",
                textDecorationColor:"var(--z4)",lineHeight:1.3,transition:"all 0.3s"}}>{s.label}</div>
              {active&&s.detail&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--g5)",marginTop:5,letterSpacing:"0.08em",animation:"fadeIn 0.3s ease both"}}>{s.detail}</div>}
            </div>
            {active&&<Spin size={16}/>}
            {done&&<span className="tag tj">✓</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Score dim row ────────────────────────────────────────────────
function DimRow({ label, score, max, delay=0 }) {
  const pct=Math.round((score/max)*100);
  const c=pct>=70?"var(--jade)":pct>=45?"var(--g5)":"var(--crimson)";
  const [show,setShow]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setShow(true),delay);return()=>clearTimeout(t);},[delay]);
  return (
    <div style={{opacity:show?1:0,transform:show?"none":"translateY(6px)",transition:"all 0.45s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:7}}>
        <span style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z1)",fontWeight:300}}>{label}</span>
        <div style={{display:"flex",alignItems:"baseline",gap:3}}>
          <span style={{fontFamily:"var(--serif)",fontSize:22,color:c,fontWeight:400,letterSpacing:"-0.01em"}}>{score}</span>
          <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)"}}>/{max}</span>
        </div>
      </div>
      <Bar pct={pct} color={c} delay={delay+200} height={3}/>
    </div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────
function Ticker() {
  const items = ["Schema Analysis","Entity Clarity","Content Depth","Trust Signals","Extractability Score","AI Readiness Index","GEO Optimization","JSON-LD Markup","FAQ Schema","Structured Data","Canonical Signals","Review Markup","Semantic Coverage","LLM Citation Rate"];
  const txt = items.map(i=>`◆  ${i}`).join("    ");
  return (
    <div style={{overflow:"hidden",borderBottom:"1px solid var(--z6)",padding:"7px 0",background:"var(--z9)",position:"relative"}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:60,background:"linear-gradient(90deg,var(--z9),transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:60,background:"linear-gradient(270deg,var(--z9),transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{display:"inline-block",whiteSpace:"nowrap",animation:"ticker 55s linear infinite",fontFamily:"var(--mono)",fontSize:8.5,letterSpacing:"0.14em",color:"var(--z3)"}}>
        {txt}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{txt}
      </div>
    </div>
  );
}

// ─── Orbiting demo ────────────────────────────────────────────────
function HeroOrb() {
  const scores=[72,91,48,83,61,95,37,78];
  const [idx,setIdx]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setIdx(i=>(i+1)%scores.length),3800);return()=>clearInterval(t);},[]);
  const pct=scores[idx];
  return (
    <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",animation:"float 6s ease-in-out infinite"}}>
      {/* Outer ring glow */}
      <div style={{position:"absolute",inset:-8,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,169,110,0.06) 0%,transparent 70%)",animation:"breathe 4s ease-in-out infinite"}}/>
      <MiniArc key={idx} pct={pct}/>
      {/* Live badge */}
      <div style={{position:"absolute",top:-6,right:-8,padding:"2px 8px",background:"var(--z6)",border:"1px solid var(--z4)",borderRadius:"var(--r3)"}}>
        <span style={{fontFamily:"var(--mono)",fontSize:7.5,color:"var(--z2)",letterSpacing:"0.1em"}}>LIVE</span>
      </div>
    </div>
  );
}

// ─── URL Preview ──────────────────────────────────────────────────
function URLPrev({ url }) {
  if (!url||url.length<12) return null;
  let domain="",path="",valid=false;
  try{const u=new URL(url);domain=u.hostname;path=u.pathname;valid=true;}catch{return null;}
  if (!domain) return null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10,padding:"8px 14px",
      background:"var(--z6)",border:"1px solid var(--z4)",borderRadius:"var(--r6)",animation:"fadeDown 0.22s ease both"}}>
      <div className="gdot" style={{background:"var(--jade)"}}/>
      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--g4)",fontWeight:400}}>{domain}</span>
      {path&&path!=="/"&&<span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z2)"}}>{path.length>48?path.slice(0,48)+"…":path}</span>}
      <span className="tag tj" style={{marginLeft:"auto"}}>Valid</span>
    </div>
  );
}

// ─── MD Renderer ─────────────────────────────────────────────────
function parseMD(raw) {
  if (!raw) return [];
  const lines=raw.split("\n"),blocks=[];let i=0;
  while(i<lines.length){
    const l=lines[i].trim();if(!l){i++;continue;}
    if(l.startsWith("```")){const lang=l.slice(3).trim()||"code",cl=[];i++;while(i<lines.length&&!lines[i].trim().startsWith("```")){cl.push(lines[i]);i++;}blocks.push({t:"code",lang,code:cl.join("\n")});i++;continue;}
    if(l.startsWith("|")){const tl=[];while(i<lines.length&&lines[i].trim().startsWith("|")){tl.push(lines[i].trim());i++;}const pr=r=>r.split("|").map(c=>c.trim()).filter((_,j,a)=>j>0&&j<a.length-1);const[h,...d]=tl;if(h)blocks.push({t:"table",headers:pr(h),rows:d.filter(r=>!r.match(/^\|[-| :]+\|$/)).map(pr)});continue;}
    if(l.startsWith("### ")){blocks.push({t:"h3",text:l.slice(4)});i++;continue;}
    if(l.startsWith("## ")){blocks.push({t:"h2",text:l.slice(3)});i++;continue;}
    if(l.startsWith("# ")){blocks.push({t:"h1",text:l.slice(2)});i++;continue;}
    if(/^\d+\.\s/.test(l)){blocks.push({t:"num",text:l.replace(/^\d+\.\s*/,"").replace(/\*\*/g,"")});i++;continue;}
    if(l.startsWith("- ")||l.startsWith("• ")){blocks.push({t:"bul",text:l.replace(/^[-•]\s*/,"").replace(/\*\*/g,"")});i++;continue;}
    blocks.push({t:"para",text:l});i++;
  }
  return blocks;
}
function Fmt({text}) {
  if(!text)return null;
  return(<>{String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p,i)=>{
    if(p.startsWith("**")&&p.endsWith("**"))return<strong key={i} style={{fontWeight:500,color:"var(--z0)"}}>{p.slice(2,-2)}</strong>;
    if(p.startsWith("`")&&p.endsWith("`"))return<code key={i} style={{fontFamily:"var(--mono)",fontSize:"0.86em",color:"var(--g4)",background:"var(--gf)",padding:"2px 7px",borderRadius:"var(--r3)",border:"1px solid var(--gm)"}}>{p.slice(1,-1)}</code>;
    return<span key={i}>{p}</span>;
  })}</>);
}
function MDRender({blocks}) {
  let n=0;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {blocks.map((b,i)=>{
        if(b.t==="code")return(
          <div key={i} style={{background:"var(--z9)",borderRadius:"var(--r10)",overflow:"hidden",marginTop:4,border:"1px solid var(--z5)"}}>
            <div style={{display:"flex",gap:6,padding:"8px 16px",borderBottom:"1px solid var(--z5)",alignItems:"center"}}>
              {["#ff5f56","#ffbd2e","#27c93f"].map((c,ci)=><div key={ci} style={{width:8,height:8,borderRadius:"50%",background:c,opacity:0.6}}/>)}
              <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",letterSpacing:"0.12em",marginLeft:6,textTransform:"uppercase"}}>{b.lang}</span>
            </div>
            <pre style={{fontFamily:"var(--mono)",fontSize:12.5,color:"var(--z0)",lineHeight:1.9,margin:0,padding:"16px 18px",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{b.code}</pre>
          </div>
        );
        if(b.t==="table")return(
          <div key={i} style={{overflowX:"auto",border:"1px solid var(--z5)",borderRadius:"var(--r6)",marginTop:4}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"var(--z6)"}}>
                {b.headers.map((h,j)=><th key={j} style={{padding:"9px 16px",textAlign:"left",fontFamily:"var(--mono)",fontSize:8.5,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--z2)",borderBottom:"1px solid var(--z5)",fontWeight:400}}>{h}</th>)}
              </tr></thead>
              <tbody>{b.rows.map((row,ri)=>(
                <tr key={ri} className="row" style={{borderBottom:"1px solid var(--z5)",background:ri%2?"var(--z8)":"var(--z7)"}}>
                  {row.map((cell,ci)=><td key={ci} style={{padding:"9px 16px",fontFamily:"var(--sans)",fontSize:13.5,color:"var(--z1)",fontWeight:300,lineHeight:1.5}}><Fmt text={cell}/></td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        );
        if(b.t==="h1")return<div key={i} className="display" style={{fontSize:22,color:"var(--z0)",marginTop:20,paddingBottom:12,borderBottom:"1px solid var(--z5)"}}>{b.text}</div>;
        if(b.t==="h2")return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginTop:18,paddingBottom:10,borderBottom:"1px solid var(--z5)"}}>
            <div style={{width:3,height:20,background:"var(--g5)",borderRadius:2,boxShadow:"0 0 8px var(--g5)",flexShrink:0}}/>
            <span className="display" style={{fontSize:18,color:"var(--z0)"}}>{b.text}</span>
          </div>
        );
        if(b.t==="h3")return<div key={i} style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z2)",marginTop:14,letterSpacing:"0.16em",textTransform:"uppercase"}}>{b.text}</div>;
        if(b.t==="num"){n++;return(
          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"11px 16px",background:"var(--z6)",borderRadius:"var(--r6)",border:"1px solid var(--z5)",transition:"all 0.18s",cursor:"default"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gs)";e.currentTarget.style.background="rgba(200,169,110,0.04)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--z5)";e.currentTarget.style.background="var(--z6)";}}>
            <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--g5)",flexShrink:0,paddingTop:2,fontWeight:400}}>{String(n).padStart(2,"0")}</span>
            <span style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z1)",lineHeight:1.75,fontWeight:300}}><Fmt text={b.text}/></span>
          </div>
        );}
        if(b.t==="bul")return(
          <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"5px 0"}}>
            <div style={{width:4,height:4,borderRadius:"50%",flexShrink:0,background:"var(--g5)",marginTop:9,boxShadow:"0 0 6px var(--g5)"}}/>
            <span style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z2)",lineHeight:1.85,fontWeight:300}}><Fmt text={b.text}/></span>
          </div>
        );
        return<p key={i} style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z2)",lineHeight:1.9,fontWeight:300}}><Fmt text={b.text}/></p>;
      })}
    </div>
  );
}

// ─── Ripple btn wrapper ───────────────────────────────────────────
function RippleBtn({ children, onClick, disabled, cls="btn btn-gold", style={} }) {
  const [rips,setRips]=useState([]);
  function handle(e){
    if(disabled)return;
    const r=e.currentTarget.getBoundingClientRect(),id=Date.now();
    setRips(p=>[...p,{id,x:e.clientX-r.left,y:e.clientY-r.top}]);
    setTimeout(()=>setRips(p=>p.filter(rp=>rp.id!==id)),700);
    onClick&&onClick(e);
  }
  return(
    <button className={cls} disabled={disabled} style={style} onClick={handle}>
      {children}
      {rips.map(rp=><span key={rp.id} style={{position:"absolute",left:rp.x-20,top:rp.y-20,width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,0.2)",animation:"ripple 0.65s ease-out forwards",pointerEvents:"none"}}/>)}
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────
function SH({ label, right }) {
  return (
    <div className="sec-head">
      <span className="label">{label}</span>
      {right}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CRAWL VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CrawlView({ crawlData, onScore }) {
  const [tab,setTab]=useState("overview");
  const [faqOpen,setFaqOpen]=useState(null);
  const raw=crawlData?.data||crawlData||{};
  const page=raw.page_info||{},product=raw.product||{},content=raw.content||{};
  const trust=raw.trust_signals||{},links=raw.links||{},schema=raw.schema_data||[];
  const headings=content.headings||[],features=content.features||[],images=content.images||{};
  const cleanText=raw.clean_text||"";
  const faq=(content.faq&&content.faq.length>0)?content.faq:extractFAQs(cleanText);
  const specRaw=content.specifications||{};
  const specs=Object.keys(specRaw).length>0?specRaw:extractSpecs(cleanText);
  let price=null,currency=product.currency||"INR";
  if(product.price!==undefined&&product.price!==null&&product.price!==""){const n=typeof product.price==="number"?product.price:parseFloat(String(product.price).replace(/[^0-9.]/g,""));if(!isNaN(n)&&n>0)price=n;}
  if(!price&&schema.length>0){const offers=schema.flatMap(s=>s.offers||[]);const prices=offers.map(o=>parseFloat(o.price)).filter(p=>!isNaN(p)&&p>0);if(prices.length>0)price=Math.min(...prices);const curr=offers[0]?.priceCurrency;if(curr)currency=curr;}
  const priceDisplay=price?fmtPrice(price,currency):null;
  const inStock=(product.availability||"").toLowerCase().includes("instock");
  const rating=product.rating?parseFloat(product.rating):null;
  const reviews=product.review_count?parseInt(product.review_count):null;

  return (
    <div style={{animation:"fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both"}}>
      {/* Product card */}
      <div className="panel ca" style={{marginBottom:20,borderRadius:"var(--r14)"}}>
        {/* Gold accent bar */}
        <div style={{height:2,background:"linear-gradient(90deg,transparent,var(--g5) 30%,var(--g4) 70%,transparent)",animation:"ticker 5s linear infinite"}}/>
        <div style={{padding:"28px 32px",borderBottom:"1px solid var(--z5)"}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            <span className={`tag ${inStock?"tj":"tc"}`}>
              <span style={{width:4,height:4,borderRadius:"50%",background:"currentColor",display:"inline-block"}}/>
              {inStock?"In Stock":"Out of Stock"}
            </span>
            {product.brand&&<span className="tag tz">{product.brand}</span>}
            {page.https&&<span className="tag tb">HTTPS ✓</span>}
            {product.category&&<span className="tag tz">{product.category}</span>}
            {page.load_time_ms&&<span className={`tag ${page.load_time_ms<3000?"tj":page.load_time_ms<6000?"ta":"tc"}`}>{page.load_time_ms}ms</span>}
          </div>
          <h2 className="display" style={{fontSize:"clamp(20px,3.2vw,32px)",color:"var(--z0)",marginBottom:22,lineHeight:1.1,maxWidth:560,letterSpacing:"-0.015em"}}>{product.name||page.title||"Product"}</h2>
          <div style={{display:"flex",gap:40,flexWrap:"wrap",alignItems:"flex-end"}}>
            {priceDisplay&&(
              <div>
                <div className="label" style={{marginBottom:6}}>Price</div>
                <div className="display" style={{fontSize:38,color:"var(--g5)",lineHeight:1,letterSpacing:"-0.02em"}}>{priceDisplay}</div>
              </div>
            )}
            {rating&&(
              <div>
                <div className="label" style={{marginBottom:6}}>Rating</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span className="display" style={{fontSize:30,color:"var(--z0)"}}>{rating.toFixed(1)}</span>
                  <div>
                    <div style={{fontSize:13,color:"var(--g5)",letterSpacing:3}}>{"★".repeat(Math.round(rating))}{"☆".repeat(5-Math.round(rating))}</div>
                    {reviews&&<div className="label" style={{marginTop:3,color:"var(--z3)"}}>{reviews.toLocaleString()} reviews</div>}
                  </div>
                </div>
              </div>
            )}
            {product.sku&&(
              <div>
                <div className="label" style={{marginBottom:6}}>SKU</div>
                <div style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--z2)"}}>{product.sku}</div>
              </div>
            )}
          </div>
        </div>
        {/* Stats strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)"}}>
          {[
            {l:"Words",v:content.word_count||0,ok:(content.word_count||0)>=800},
            {l:"Images",v:images.total_images||0,ok:true},
            {l:"Alt Coverage",v:`${images.alt_text_coverage_pct||0}%`,ok:(images.alt_text_coverage_pct||0)>=70},
            {l:"FAQ Items",v:faq.length,ok:faq.length>0},
            {l:"Headings",v:headings.length,ok:headings.length>=3},
            {l:"Links",v:(links.internal||[]).length,ok:true},
          ].map((s,i,arr)=>(
            <div key={s.l} className="row" style={{padding:"14px 16px",borderRight:i<arr.length-1?"1px solid var(--z5)":"none",
              display:"flex",flexDirection:"column",gap:5,cursor:"default",background:"var(--z8)"}}>
              <div className="display" style={{fontSize:22,color:s.ok?"var(--z0)":"var(--crimson)",lineHeight:1}}>{s.v}</div>
              <div className="label">{s.l}</div>
            </div>
          ))}
        </div>
        {/* URL bar */}
        <div style={{padding:"9px 20px",borderTop:"1px solid var(--z5)",display:"flex",alignItems:"center",gap:10,background:"var(--z9)"}}>
          <div className="gdot" style={{background:"var(--jade)"}}/>
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z2)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"0.04em"}}>{page.url}</span>
          {page.status_code&&<span className={`tag ${page.status_code===200?"tj":"ta"}`}>HTTP {page.status_code}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{marginBottom:18,background:"var(--z7)",borderRadius:"var(--r10) var(--r10) 0 0",border:"1px solid var(--z5)",borderBottom:"1px solid var(--z5)"}}>
        {["overview","specs","trust","links"].map(t=>(
          <button key={t} className={`tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div key={tab} style={{display:"flex",flexDirection:"column",gap:14,animation:"fadeIn 0.22s ease both"}}>
        {tab==="overview"&&(<>
          {headings.length>0&&(
            <div className="panel">
              <SH label="Page Structure" right={<span className="label" style={{color:"var(--z3)"}}>{headings.length}</span>}/>
              {headings.slice(0,14).map((h,i)=>(
                <div key={i} className="row" style={{display:"flex",gap:14,padding:"9px 20px",borderBottom:"1px solid var(--z5)",alignItems:"center",background:"var(--z7)"}}>
                  <div style={{width:2,height:14,background:h.level==="h1"?"var(--g5)":h.level==="h2"?"var(--z3)":"var(--z4)",borderRadius:1,flexShrink:0}}/>
                  <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:h.level==="h1"?"var(--g5)":h.level==="h2"?"var(--z2)":"var(--z3)",width:22,flexShrink:0,letterSpacing:"0.1em"}}>{h.level?.toUpperCase()}</span>
                  <span style={{fontFamily:"var(--sans)",fontSize:13.5,color:"var(--z1)",lineHeight:1.4,fontWeight:300}}>{h.text}</span>
                </div>
              ))}
              {headings.length>14&&<div style={{padding:"9px 20px",fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",background:"var(--z7)"}}>+{headings.length-14} more</div>}
            </div>
          )}
          {faq.length>0 ? (
            <div className="panel">
              <SH label="FAQ" right={<span className="label" style={{color:"var(--z3)"}}>{faq.length} questions</span>}/>
              {faq.map((item,i)=>(
                <div key={i} style={{borderBottom:"1px solid var(--z5)"}}>
                  <div onClick={()=>setFaqOpen(faqOpen===i?null:i)} className="row" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,padding:"14px 20px",cursor:"pointer",background:"var(--z7)"}}>
                    <div style={{display:"flex",gap:14,alignItems:"flex-start",flex:1}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--g5)",flexShrink:0,paddingTop:1,fontWeight:400}}>{String(i+1).padStart(2,"0")}</span>
                      <span style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z0)",lineHeight:1.4,fontWeight:300}}>{item.question}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" style={{flexShrink:0,color:"var(--z3)",transform:faqOpen===i?"rotate(180deg)":"none",transition:"transform 0.25s cubic-bezier(0.16,1,0.3,1)"}}>
                      <polyline points="3,6 8,11 13,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {faqOpen===i&&item.answer&&(
                    <div style={{padding:"0 20px 16px 48px",fontFamily:"var(--sans)",fontSize:13.5,color:"var(--z2)",lineHeight:1.85,fontWeight:300,animation:"fadeDown 0.2s ease both",borderLeft:"2px solid var(--gm)",marginLeft:20,background:"var(--z7)"}}>{item.answer}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:"14px 18px",background:"var(--crimsonf)",border:"1px solid var(--crimsonb)",borderRadius:"var(--r10)",display:"flex",gap:12,alignItems:"flex-start"}}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{flexShrink:0,marginTop:1}}><circle cx="8" cy="8" r="7" fill="none" stroke="var(--crimson)" strokeWidth="1.2"/><line x1="8" y1="4.5" x2="8" y2="9" stroke="var(--crimson)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="var(--crimson)"/></svg>
              <div>
                <div style={{fontFamily:"var(--sans)",fontSize:13.5,color:"var(--crimson)",fontWeight:400,marginBottom:2}}>No FAQ section detected</div>
                <div style={{fontFamily:"var(--sans)",fontSize:12.5,color:"var(--crimson)",opacity:0.6,fontWeight:300}}>Adding FAQPage schema is a high-impact GEO win</div>
              </div>
            </div>
          )}
          {features.filter(f=>f.length>20&&f.length<200).length>0&&(
            <div className="panel">
              <SH label="Content Features" right={<span className="label" style={{color:"var(--z3)"}}>{features.filter(f=>f.length>20&&f.length<200).length}</span>}/>
              {features.filter(f=>f.length>20&&f.length<200).slice(0,8).map((f,i)=>(
                <div key={i} className="row" style={{display:"flex",gap:12,padding:"10px 20px",borderBottom:"1px solid var(--z5)",background:"var(--z7)"}}>
                  <div style={{width:4,height:4,borderRadius:"50%",flexShrink:0,background:"var(--g5)",marginTop:9,boxShadow:"0 0 6px var(--g5)"}}/>
                  <span style={{fontFamily:"var(--sans)",fontSize:13.5,color:"var(--z1)",lineHeight:1.7,fontWeight:300}}>{f}</span>
                </div>
              ))}
            </div>
          )}
        </>)}

        {tab==="specs"&&(<>
          {Object.keys(specs).length>0 ? (
            <div className="panel">
              <SH label="Specifications" right={<span className="label" style={{color:"var(--z3)"}}>{Object.keys(specs).length} fields</span>}/>
              {Object.entries(specs).map(([k,v],i,arr)=>(
                <div key={i} className="row" style={{display:"flex",borderBottom:i<arr.length-1?"1px solid var(--z5)":"none"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z2)",padding:"11px 20px",minWidth:200,borderRight:"1px solid var(--z5)",flexShrink:0,letterSpacing:"0.06em",background:"var(--z8)"}}>{k}</div>
                  <div style={{fontFamily:"var(--sans)",fontSize:13.5,color:"var(--z1)",padding:"11px 20px",flex:1,lineHeight:1.6,fontWeight:300,background:"var(--z7)"}}>{Array.isArray(v)?v.join(", "):String(v)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:"14px 18px",background:"var(--crimsonf)",border:"1px solid var(--crimsonb)",borderRadius:"var(--r10)",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"var(--crimson)",flexShrink:0}}/>
              <span style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--crimson)",fontWeight:300}}>No specifications detected — structured markup significantly boosts GEO score</span>
            </div>
          )}
          <div className="panel">
            <SH label="Images" right={<span className="label" style={{color:"var(--z3)"}}>{images.images_with_alt||0}/{images.total_images||0} alt text</span>}/>
            <div style={{padding:"18px 20px",borderBottom:"1px solid var(--z5)",background:"var(--z7)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
                <span style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z2)",fontWeight:300}}>Alt text coverage</span>
                <span className="display" style={{fontSize:24,color:(images.alt_text_coverage_pct||0)>=70?"var(--jade)":"var(--crimson)"}}>{images.alt_text_coverage_pct||0}%</span>
              </div>
              <Bar pct={images.alt_text_coverage_pct||0} color={(images.alt_text_coverage_pct||0)>=70?"var(--jade)":"var(--crimson)"} height={5}/>
            </div>
            {(images.images||[]).slice(0,5).map((img,i)=>(
              <div key={i} className="row" style={{display:"flex",gap:14,padding:"10px 20px",borderBottom:"1px solid var(--z5)",alignItems:"center",background:"var(--z7)"}}>
                <div style={{width:40,height:40,flexShrink:0,overflow:"hidden",background:"var(--z6)",borderRadius:"var(--r6)",border:"1px solid var(--z5)"}}>
                  <img src={img.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                </div>
                <div style={{flex:1,overflow:"hidden"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{img.src.split("/").pop()?.slice(0,60)}</div>
                  {img.alt?<div style={{fontFamily:"var(--sans)",fontSize:12,color:"var(--z2)",marginTop:2,fontWeight:300}}>"{img.alt?.slice(0,60)}"</div>
                  :<div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--crimson)",marginTop:2}}>⚠ Missing alt text</div>}
                </div>
                <div style={{width:7,height:7,borderRadius:"50%",background:img.has_alt?"var(--jade)":"var(--crimson)",boxShadow:`0 0 8px ${img.has_alt?"var(--jade)":"var(--crimson)"}`}}/>
              </div>
            ))}
          </div>
          <div className="panel">
            <SH label="Metadata"/>
            {[{l:"Title",v:page.title},{l:"Meta Description",v:page.meta_description},{l:"Canonical",v:page.canonical_url},{l:"Page Type",v:page.page_type},{l:"Load Time",v:page.load_time_ms?`${page.load_time_ms}ms`:null}].filter(f=>f.v).map((f,i,arr)=>(
              <div key={i} className="row" style={{display:"flex",borderBottom:i<arr.length-1?"1px solid var(--z5)":"none"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z2)",padding:"11px 20px",minWidth:170,borderRight:"1px solid var(--z5)",flexShrink:0,letterSpacing:"0.1em",textTransform:"uppercase",background:"var(--z8)"}}>{f.l}</div>
                <div style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z1)",padding:"11px 20px",flex:1,lineHeight:1.6,wordBreak:"break-word",fontWeight:300,background:"var(--z7)"}}>{f.v}</div>
              </div>
            ))}
          </div>
        </>)}

        {tab==="trust"&&(<>
          <div className="panel">
            <SH label="Trust Signal Matrix" right={<span className="label" style={{color:"var(--z3)"}}>{Object.values(trust).filter(Boolean).length}/{Object.keys(trust).length}</span>}/>
            <div style={{padding:"16px 20px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:8,background:"var(--z8)"}}>
              {Object.entries(trust).map(([key,val])=>{
                const ok=val===true||(typeof val==="string"&&val.length>0);
                return (
                  <div key={key} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 14px",
                    border:`1px solid ${ok?"var(--jadeb)":"var(--z5)"}`,
                    background:ok?"var(--jadef)":"var(--z7)",
                    borderRadius:"var(--r6)",transition:"all 0.18s",cursor:"default"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
                    <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,marginTop:4,
                      background:ok?"var(--jade)":"var(--z4)",
                      boxShadow:ok?"0 0 8px var(--jade)":"none",transition:"all 0.25s"}}/>
                    <span style={{fontFamily:"var(--sans)",fontSize:12.5,color:ok?"var(--z0)":"var(--z3)",lineHeight:1.4,fontWeight:ok?400:300}}>
                      {key.replace(/has_|uses_|mentions_/g,"").replace(/_/g," ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[{l:"Policy",k:[trust.has_return_policy,trust.has_refund_policy,trust.has_warranty_info,trust.has_cancellation_policy]},
              {l:"Contact",k:[trust.has_contact_page,trust.has_about_page,trust.mentions_email,trust.mentions_phone]},
              {l:"Commerce",k:[trust.uses_https,trust.has_cod_option,trust.mentions_secure_payment,trust.mentions_reviews]},
            ].map((s,idx)=>{
              const v=s.k.filter(Boolean).length,pct=Math.round((v/s.k.length)*100);
              const c=pct>=75?"var(--jade)":pct>=50?"var(--g5)":"var(--crimson)";
              return(
                <div key={s.l} className="panel panel-lift ca" style={{padding:"22px 22px",cursor:"default"}}>
                  <div className="label" style={{marginBottom:14}}>{s.l}</div>
                  <div className="display" style={{fontSize:36,color:c,marginBottom:4,lineHeight:1,animation:`badgePop 0.6s cubic-bezier(0.16,1,0.3,1) ${idx*120}ms both`}}>{v}/{s.k.length}</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:c,marginBottom:12,letterSpacing:"0.06em"}}>{pct}%</div>
                  <Bar pct={pct} color={c} height={3} delay={idx*120}/>
                </div>
              );
            })}
          </div>
        </>)}

        {tab==="links"&&(<>
          <div className="panel">
            <SH label="Internal Links" right={<span className="label" style={{color:"var(--z3)"}}>{(links.internal||[]).length}</span>}/>
            <div style={{maxHeight:400,overflowY:"auto"}}>
              {(links.internal||[]).slice(0,30).map((lnk,i)=>(
                <div key={i} className="row" style={{display:"flex",gap:14,padding:"9px 20px",borderBottom:"1px solid var(--z5)",alignItems:"center",background:"var(--z7)"}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--z4)",flexShrink:0}}>→</span>
                  <div style={{flex:1,overflow:"hidden"}}>
                    <div style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z0)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:300}}>{lnk.anchor_text||<span style={{color:"var(--z3)",fontStyle:"italic",fontSize:12}}>no anchor</span>}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{lnk.url}</div>
                  </div>
                </div>
              ))}
              {(links.internal||[]).length>30&&<div style={{padding:"9px 20px",fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",background:"var(--z7)"}}>+{(links.internal||[]).length-30} more</div>}
            </div>
          </div>
          {(links.external||[]).length>0&&(
            <div className="panel">
              <SH label="External Links" right={<span className="label" style={{color:"var(--z3)"}}>{(links.external||[]).length}</span>}/>
              {(links.external||[]).slice(0,10).map((lnk,i,arr)=>(
                <div key={i} className="row" style={{display:"flex",gap:14,padding:"9px 20px",borderBottom:i<arr.length-1?"1px solid var(--z5)":"none",alignItems:"center",background:"var(--z7)"}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--z4)",flexShrink:0}}>↗</span>
                  <div style={{flex:1,overflow:"hidden"}}>
                    <div style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z0)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:300}}>{lnk.anchor_text||"no anchor"}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{lnk.url}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}
      </div>

      <div style={{marginTop:36,paddingTop:26,borderTop:"1px solid var(--z5)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div className="label" style={{marginBottom:4}}>Up Next</div>
          <div style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z2)",fontWeight:300}}>AI Visibility Scoring across 5 dimensions</div>
        </div>
        <RippleBtn onClick={onScore}>Score AI Readiness →</RippleBtn>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCORE VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ScoreView({ scoreData, onGeo }) {
  const ctx=scoreData?.llm_context||scoreData?.data?.llm_context||scoreData||{};
  const vis=ctx.ai_visibility_summary||ctx.scoring_summary||{};
  const sec=ctx.section_scores||ctx.dimension_scores||{};
  const pct=vis.ai_readiness_pct??vis.score??ctx.ai_readiness_pct??ctx.score??0;
  const band=vis.readiness_band??vis.band??ctx.readiness_band??"—";
  const schema_s=sec.schema??sec.schema_markup??ctx.schema_score??0;
  const entity_s=sec.entity??sec.entity_clarity??ctx.entity_score??0;
  const content_s=sec.content??sec.content_depth??ctx.content_score??0;
  const trust_s=sec.trust??sec.trust_signals??ctx.trust_score??0;
  const ext_s=sec.extractability??sec.extractability_score??ctx.extractability_score??0;
  const penalties=ctx.penalties||{};
  const weak=ctx.weak_areas||{};
  const dims=[
    {l:"Schema Markup",s:schema_s,m:20},
    {l:"Entity Clarity",s:entity_s,m:15},
    {l:"Content Depth",s:content_s,m:25},
    {l:"Trust Signals",s:trust_s,m:20},
    {l:"Extractability",s:ext_s,m:20},
  ];
  const cf=pct>=80?"var(--jade)":pct>=40?"var(--g5)":"var(--crimson)";

  return (
    <div style={{animation:"fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both"}}>
      <div className="panel ca" style={{marginBottom:16,borderRadius:"var(--r14)",overflow:"hidden"}}>
        <div style={{height:2,background:`linear-gradient(90deg,transparent,${cf} 30%,${cf} 70%,transparent)`,opacity:0.8}}/>
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:0}}>
          {/* Arc side */}
          <div style={{padding:"36px 44px",borderRight:"1px solid var(--z5)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:"linear-gradient(135deg,var(--z7) 0%,var(--z8) 100%)"}}>
            <Arc pct={pct} size={200}/>
            <div style={{textAlign:"center"}}>
              <div className="label" style={{marginBottom:5}}>AI Readiness Band</div>
              <div className="display-i" style={{fontSize:16,color:cf}}>{band}</div>
            </div>
          </div>
          {/* Dims side */}
          <div style={{padding:"34px 38px",display:"flex",flexDirection:"column",gap:20,background:"var(--z7)"}}>
            <div>
              <div className="label-g" style={{marginBottom:4}}>Dimension Breakdown</div>
              <div style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z3)",fontWeight:300}}>Score across all 5 AI ranking signals</div>
            </div>
            {dims.map((d,i)=><DimRow key={d.l} label={d.l} score={d.s} max={d.m} delay={i*150}/>)}
            <div style={{paddingTop:18,borderTop:"1px solid var(--z5)",display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",letterSpacing:"0.1em"}}>{dims.reduce((a,d)=>a+d.s,0)} of 100 points</span>
              <span className="display" style={{fontSize:36,color:cf}}>{pct}</span>
            </div>
          </div>
        </div>
        {/* Spark row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",borderTop:"1px solid var(--z5)",background:"var(--z8)"}}>
          {dims.map((d,i,arr)=>{
            const pctD=Math.round((d.s/d.m)*100);
            const c=pctD>=70?"var(--jade)":pctD>=45?"var(--g5)":"var(--crimson)";
            return(
              <div key={d.l} style={{padding:"12px 14px",borderRight:i<arr.length-1?"1px solid var(--z5)":"none",transition:"background 0.18s",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--z7)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div className="display" style={{fontSize:20,color:c,lineHeight:1,marginBottom:3}}>{d.s}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:7.5,color:"var(--z3)",letterSpacing:"0.1em",marginBottom:7}}>{d.l.split(" ")[0]}<br/>/{d.m} pts</div>
                <Bar pct={pctD} color={c} height={2} delay={i*80}/>
              </div>
            );
          })}
        </div>
      </div>

      {Object.keys(penalties).length>0&&(
        <div style={{border:"1px solid var(--crimsonb)",background:"var(--crimsonf)",padding:"16px 20px",marginBottom:12,borderRadius:"var(--r10)"}}>
          <div className="label" style={{color:"var(--crimson)",marginBottom:10}}>Score Penalties</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {Object.entries(penalties).map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:8,padding:"7px 14px",border:"1px solid var(--crimsonb)",background:"var(--crimsonf)",borderRadius:"var(--r6)"}}>
                <span style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z1)",fontWeight:300}}>{k.replace(/_/g," ")}</span>
                <span className="display" style={{fontSize:14,color:"var(--crimson)"}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(weak).length>0&&(
        <div className="panel" style={{padding:"20px 24px",marginBottom:12}}>
          <div className="label" style={{marginBottom:14}}>Priority Fixes — Zero Score Areas</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.entries(weak).map(([section,fields])=>(
              <div key={section} style={{display:"flex",gap:16,alignItems:"flex-start",padding:"10px 14px",background:"var(--z6)",borderRadius:"var(--r6)",border:"1px solid var(--z5)"}}>
                <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",textTransform:"uppercase",letterSpacing:"0.1em",minWidth:100,paddingTop:1}}>{section}</span>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {(Array.isArray(fields)?fields:[fields]).map(f=><span key={f} className="tag tc">{String(f).replace(/_/g," ")}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{paddingTop:28,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div className="label" style={{marginBottom:4}}>Up Next</div>
          <div style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z2)",fontWeight:300}}>Full GEO Report — executive insights + JSON-LD code</div>
        </div>
        <RippleBtn onClick={onGeo}>Generate GEO Report →</RippleBtn>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GEO VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOWNLOAD MODAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DownloadModal({ onClose, onDownload, downloading, onGetCode }) {
  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-card">
        <div style={{height:2,background:"linear-gradient(90deg,transparent,var(--g5) 25%,var(--g3) 60%,transparent)"}}/>
        <div style={{padding:"28px 32px 22px",borderBottom:"1px solid var(--z5)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div className="gdot" style={{background:"var(--g5)"}}/>
                <span className="label-g">Export Report</span>
              </div>
              <div className="display" style={{fontSize:22,color:"var(--z0)",marginBottom:6}}>What would you like to do?</div>
              <div style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z2)",fontWeight:300,lineHeight:1.7}}>Download the full report or generate live console fixes.</div>
            </div>
            <button onClick={onClose}
              style={{background:"var(--z6)",border:"1px solid var(--z5)",borderRadius:"var(--r6)",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--z2)",fontSize:18,lineHeight:1,flexShrink:0,marginLeft:16,transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--z5)";e.currentTarget.style.color="var(--z0)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="var(--z6)";e.currentTarget.style.color="var(--z2)";}}>×</button>
          </div>
        </div>
        <div style={{padding:"22px 32px",display:"flex",flexDirection:"column",gap:12}}>
          <button onClick={onDownload} disabled={downloading}
            style={{display:"flex",alignItems:"center",gap:16,padding:"18px 20px",background:"var(--z6)",border:"1px solid var(--z5)",borderRadius:"var(--r10)",cursor:downloading?"not-allowed":"pointer",transition:"all 0.2s",textAlign:"left",width:"100%",opacity:downloading?0.6:1}}
            onMouseEnter={e=>{if(!downloading){e.currentTarget.style.borderColor="var(--z3)";e.currentTarget.style.background="var(--z5)";e.currentTarget.style.transform="translateY(-1px)";}}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--z5)";e.currentTarget.style.background="var(--z6)";e.currentTarget.style.transform="none";}}>
            <div style={{width:40,height:40,borderRadius:"var(--r6)",background:"var(--z5)",border:"1px solid var(--z4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18,color:"var(--z0)"}}>↓</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z0)",fontWeight:400,marginBottom:3}}>Download .docx Report</div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",letterSpacing:"0.06em"}}>JSON-LD snippets · Score analysis · Implementation guide</div>
            </div>
            {downloading&&<Spin size={14} color="var(--z2)"/>}
          </button>
          <button onClick={onGetCode}
            style={{display:"flex",alignItems:"center",gap:16,padding:"18px 20px",background:"var(--gf)",border:"1px solid var(--gs)",borderRadius:"var(--r10)",cursor:"pointer",transition:"all 0.2s",textAlign:"left",width:"100%"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gx)";e.currentTarget.style.background="var(--gm)";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--gs)";e.currentTarget.style.background="var(--gf)";e.currentTarget.style.transform="none";}}>
            <div style={{width:40,height:40,borderRadius:"var(--r6)",background:"var(--gm)",border:"1px solid var(--gs)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18,color:"var(--g4)"}}>◈</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--g4)",fontWeight:400,marginBottom:3}}>Get Implementation Code</div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--g3)",letterSpacing:"0.06em",opacity:0.7}}>Paste your page source · Get console-ready JS fixes</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{color:"var(--g4)",flexShrink:0}}><polyline points="3,2 11,7 3,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{padding:"14px 32px",borderTop:"1px solid var(--z6)",background:"var(--z9)"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",letterSpacing:"0.08em"}}>GENY · GEO Intelligence Engine · v5.0</div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPLEMENT INPUT VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ImplementInputView({ onSubmit, loading, pageUrl }) {
  const [html, setHtml] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (!html.trim()) { setErr("Please paste your page source code first."); return; }
    if (html.trim().length < 200) { setErr("Source seems too short — paste the full HTML of the page."); return; }
    setErr(""); onSubmit(html);
  }

  return (
    <div style={{animation:"fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both"}}>
      <div style={{marginBottom:32}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          <div style={{width:32,height:1,background:"var(--g5)"}}/>
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--g5)",letterSpacing:"0.18em",textTransform:"uppercase"}}>Step 4 · Implementation</span>
        </div>
        <h2 className="display" style={{fontSize:"clamp(28px,4vw,42px)",color:"var(--z0)",marginBottom:12,lineHeight:1.1}}>Paste Your Page Source</h2>
        <p style={{fontFamily:"var(--sans)",fontSize:15,color:"var(--z2)",lineHeight:1.8,maxWidth:560,fontWeight:300}}>
          We'll match each GEO fix to the exact DOM element and generate browser console scripts — ready to copy and run.
        </p>
      </div>

      <div className="panel" style={{padding:"18px 24px",borderRadius:"var(--r10)",marginBottom:24}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z2)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>How to get your page source</div>
        <div style={{display:"flex",gap:0,flexWrap:"wrap"}}>
          {[
            {n:"1",t:"Open your product page",d:"in Chrome, Firefox, or Safari"},
            {n:"2",t:"Right-click anywhere",d:"on the page background"},
            {n:"3",t:'Click "View Page Source"',d:"or press Ctrl+U / ⌘+U"},
            {n:"4",t:"Select All & Copy",d:"Ctrl+A → Ctrl+C"},
          ].map((s,i,arr)=>(
            <div key={s.n} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"6px 16px 6px 0",flex:"1 1 180px"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"var(--gm)",border:"1px solid var(--gs)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--g4)",fontWeight:500}}>{s.n}</span>
              </div>
              <div>
                <div style={{fontFamily:"var(--sans)",fontSize:12.5,color:"var(--z0)",fontWeight:400,marginBottom:2}}>{s.t}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",letterSpacing:"0.04em"}}>{s.d}</div>
              </div>
              {i<arr.length-1&&<div style={{alignSelf:"center",color:"var(--z4)",fontSize:11,marginLeft:"auto",paddingLeft:8,flexShrink:0}}>→</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{borderRadius:"var(--r14)",overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"12px 20px",borderBottom:"1px solid var(--z5)",background:"var(--z7)",display:"flex",alignItems:"center",gap:8}}>
          {["#ff5f56","#ffbd2e","#27c93f"].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:c,opacity:0.6}}/>)}
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",letterSpacing:"0.12em",marginLeft:6,textTransform:"uppercase"}}>HTML Source</span>
          {html.trim().length>100&&(
            <span style={{marginLeft:"auto",fontFamily:"var(--mono)",fontSize:8.5,color:"var(--jade)",letterSpacing:"0.08em"}}>
              {(html.length/1024).toFixed(1)} KB pasted
            </span>
          )}
        </div>
        <textarea
          value={html}
          onChange={e=>{setHtml(e.target.value);setErr("");}}
          placeholder={"<!DOCTYPE html>\n<html>\n  <head>...\n\nPaste your full page source here..."}
          style={{width:"100%",minHeight:300,padding:"20px 22px",background:"var(--z9)",color:"var(--z0)",fontFamily:"var(--mono)",fontSize:12,lineHeight:1.75,border:"none",outline:"none",resize:"vertical",caretColor:"var(--g5)",letterSpacing:"0.01em",display:"block"}}
        />
      </div>

      {err&&<div style={{border:"1px solid var(--crimsonb)",background:"var(--crimsonf)",padding:"10px 16px",marginBottom:16,borderRadius:"var(--r6)",fontFamily:"var(--sans)",fontSize:13,color:"var(--crimson)",animation:"fadeIn 0.2s ease both"}}>{err}</div>}

      {pageUrl&&(
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,padding:"9px 14px",background:"var(--z7)",border:"1px solid var(--z5)",borderRadius:"var(--r6)"}}>
          <div className="gdot" style={{background:"var(--cobalt)"}}/>
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z2)",letterSpacing:"0.06em",flexShrink:0}}>Applying fixes for:</span>
          <span style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--cobalt)",wordBreak:"break-all"}}>{pageUrl}</span>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <RippleBtn onClick={submit} disabled={loading}>
          {loading?<><Spin size={14} color="var(--z8)"/> Generating…</>:<>◈ Generate Console Code</>}
        </RippleBtn>
        <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",letterSpacing:"0.06em"}}>Takes ~30–60s</span>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPLEMENT DONE VIEW — helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CopyBtn({ code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  }
  return <button className={`copy-btn${copied?" copied":""}`} onClick={copy}>{copied?"✓ Copied":"Copy"}</button>;
}

function ConsoleBlock({ code }) {
  return (
    <div className="console-block">
      <div className="console-hdr">
        {["#ff5f56","#ffbd2e","#27c93f"].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:c,opacity:0.55}}/>)}
        <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",letterSpacing:"0.12em",textTransform:"uppercase",marginLeft:6}}>JavaScript · Browser Console</span>
        <CopyBtn code={code}/>
      </div>
      <pre className="console-body">{code}</pre>
    </div>
  );
}

const PRI_STYLE={
  high:  {bg:"var(--crimsonf)",border:"var(--crimsonb)",color:"var(--crimson)"},
  medium:{bg:"var(--amberf)",  border:"var(--amberb)",  color:"var(--amber)"},
  low:   {bg:"var(--jadef)",   border:"var(--jadeb)",   color:"var(--jade)"},
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPLEMENT DONE VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ImplementDoneView({ data }) {
  const [open, setOpen] = useState(null);
  const rewrites = data?.rewrites || [];
  const high   = rewrites.filter(r=>r.recommendation?.priority==="high").length;
  const medium = rewrites.filter(r=>r.recommendation?.priority==="medium").length;
  const low    = rewrites.filter(r=>r.recommendation?.priority==="low").length;

  const allCode = rewrites.map((r,i)=>
    `// ── Fix ${i+1}: ${r.recommendation?.title||"Untitled"} ──\n${r.console_js||""}`
  ).join("\n\n");

  return (
    <div style={{animation:"fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both"}}>
      {/* Header panel */}
      <div className="panel ca" style={{borderRadius:"var(--r14)",overflow:"hidden",marginBottom:24}}>
        <div style={{height:2,background:"linear-gradient(90deg,transparent,var(--g5) 25%,var(--g3) 50%,var(--g5) 75%,transparent)"}}/>
        <div style={{padding:"28px 32px",background:"linear-gradient(135deg,var(--z7) 0%,rgba(200,169,110,0.04) 100%)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:20}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div className="gdot" style={{background:"var(--jade)"}}/>
                <span className="label-g">Implementation Code · Ready</span>
              </div>
              <h2 className="display" style={{fontSize:"clamp(20px,3vw,28px)",color:"var(--z0)",marginBottom:8,lineHeight:1.1}}>Console Scripts Generated</h2>
              <p style={{fontFamily:"var(--sans)",fontSize:13.5,color:"var(--z2)",lineHeight:1.75,maxWidth:440,fontWeight:300}}>
                Each script selects the exact DOM element and applies your GEO fix. Paste directly into your browser console.
              </p>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[{v:high,l:"High",c:"var(--crimson)",b:"var(--crimsonb)",f:"var(--crimsonf)"},{v:medium,l:"Medium",c:"var(--amber)",b:"var(--amberb)",f:"var(--amberf)"},{v:low,l:"Low",c:"var(--jade)",b:"var(--jadeb)",f:"var(--jadef)"}].map(s=>(
                <div key={s.l} style={{padding:"12px 18px",background:s.f,border:`1px solid ${s.b}`,borderRadius:"var(--r10)",textAlign:"center",minWidth:72}}>
                  <div className="display" style={{fontSize:26,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:8.5,color:s.c,marginTop:4,letterSpacing:"0.1em",opacity:0.8}}>{s.l.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{padding:"13px 32px",background:"var(--z9)",borderTop:"1px solid var(--z5)",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0}}>How to apply:</span>
          {["1. Open page in Chrome","2. Press F12 → Console","3. Paste the script","4. Press Enter → Done"].map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
              {i>0&&<div style={{width:3,height:3,borderRadius:"50%",background:"var(--z4)"}}/>}
              <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z2)",letterSpacing:"0.04em"}}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation cards */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        {rewrites.map((rw,i)=>{
          const rec=rw.recommendation||{};
          const pri=rec.priority||"low";
          const ps=PRI_STYLE[pri]||PRI_STYLE.low;
          const isOpen=open===i;
          const isNew=rw.chunk_meta?.type==="new_addition";
          return (
            <div key={i} className="rec-card" style={{borderColor:isOpen?"var(--z4)":"var(--z5)"}}>
              <div onClick={()=>setOpen(isOpen?null:i)}
                style={{padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:14,cursor:"pointer",background:isOpen?"var(--z7)":"var(--z6)",transition:"background 0.2s"}}
                onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background="var(--z7)";}}
                onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background="var(--z6)";}}>
                <div style={{width:28,height:28,borderRadius:"var(--r6)",background:"var(--z5)",border:"1px solid var(--z4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--z2)",fontWeight:500}}>{String(i+1).padStart(2,"0")}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",padding:"3px 8px",borderRadius:"var(--r3)",background:ps.bg,border:`1px solid ${ps.border}`,color:ps.color}}>{pri}</span>
                    {rec.section_type&&<span className="tag tz" style={{fontSize:8,letterSpacing:"0.08em",textTransform:"uppercase"}}>{rec.section_type}</span>}
                    {isNew&&<span className="tag tc" style={{fontSize:8,letterSpacing:"0.06em"}}>new element</span>}
                  </div>
                  <div style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z0)",fontWeight:400,marginBottom:4,lineHeight:1.3}}>{rec.title||"Untitled Fix"}</div>
                  <div style={{fontFamily:"var(--sans)",fontSize:12.5,color:"var(--z2)",lineHeight:1.6,fontWeight:300}}>{rec.description||""}</div>
                </div>
                <div style={{flexShrink:0,marginLeft:8,transition:"transform 0.22s",transform:isOpen?"rotate(180deg)":"none"}}>
                  <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,4 7,10 12,4" fill="none" stroke="var(--z3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </div>
              {isOpen&&(
                <div style={{borderTop:"1px solid var(--z5)",padding:"18px 20px",background:"var(--z9)",animation:"fadeDown 0.2s ease both"}}>
                  {rw.match_score>0&&(
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",letterSpacing:"0.08em",flexShrink:0}}>MATCH</span>
                      <div style={{flex:1,height:2,background:"var(--z5)",borderRadius:1,maxWidth:140}}>
                        <div style={{height:"100%",width:`${Math.round(rw.match_score*100)}%`,background:"var(--g5)",borderRadius:1}}/>
                      </div>
                      <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--g4)"}}>{Math.round(rw.match_score*100)}%</span>
                    </div>
                  )}
                  {rw.chunk_meta?.dom_path&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"8px 12px",background:"var(--z7)",border:"1px solid var(--z5)",borderRadius:"var(--r6)"}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",letterSpacing:"0.08em",flexShrink:0}}>TARGET</span>
                      <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--cobalt)",wordBreak:"break-all"}}>{rw.chunk_meta.dom_path}</span>
                    </div>
                  )}
                  <ConsoleBlock code={rw.console_js||"// No script generated"} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Run all */}
      {rewrites.length>0&&(
        <div style={{padding:"20px 24px",background:"var(--z7)",border:"1px solid var(--z5)",borderRadius:"var(--r10)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z0)",fontWeight:400,marginBottom:4}}>Run All Scripts at Once</div>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",letterSpacing:"0.06em"}}>Combined script applies every fix in a single console paste</div>
          </div>
          <CopyBtn code={allCode}/>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GEO VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GeoView({ data, scoreData, filename, onGetCode }) {
  const [sec,setSec]=useState("summary");
  const [downloading,setDownloading]=useState(false);
  const [dlDone,setDlDone]=useState(false);
  const [showModal,setShowModal]=useState(false);
  if (!data) return null;
  const summary=data.executive_summary||data.summary||"";
  const technical=data.technical_analysis||"";
  const content=data.content_analysis||"";
  const priority=data.prioritized_plan||"";
  const projMatch=priority.match(/#{0,3}\s*Score Projection\s*\n([\s\S]+?)(?=\n#{1,3}\s|\n\n#{1,3}|$)/i);
  const projText=projMatch?projMatch[1]:"";
  const planClean=projMatch?priority.replace(projMatch[0],"").trim():priority;
  const sections=[
    {id:"summary",label:"Summary",icon:"◎",content:summary},
    {id:"technical",label:"Technical",icon:"⚙",content:technical},
    {id:"content",label:"Content",icon:"◈",content:content},
    {id:"roadmap",label:"Roadmap",icon:"↗",content:planClean},
  ].filter(s=>s.content);
  const ctx=scoreData?.llm_context||scoreData?.data?.llm_context||scoreData||{};
  const vis=ctx.ai_visibility_summary||{};
  const pct=data.ai_readiness_pct??vis.ai_readiness_pct??null;
  const band=data.readiness_band??vis.readiness_band??null;
  const productName=data.product_name||ctx.product_summary?.name||"";
  const productBrand=data.product_brand||ctx.product_summary?.brand||"";
  const active=sections.find(s=>s.id===sec);
  const cf=pct!=null?(pct>=80?"var(--jade)":pct>=50?"var(--g5)":"var(--crimson)"):"var(--g5)";

  async function download() {
    if (!filename||downloading) return;
    setDownloading(true);
    try {
      const res=await fetch(`${API}/download_report`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename})});
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download="GENY_Report.docx";
      document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
      setDlDone(true);
    } catch(e) { alert("Download failed: "+e.message); }
    finally { setDownloading(false); }
  }

  return (
    <div style={{animation:"fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both"}}>
      <div className="panel ca" style={{marginBottom:18,borderRadius:"var(--r14)",overflow:"hidden"}}>
        <div style={{height:2,background:"linear-gradient(90deg,transparent,var(--g5) 25%,var(--g3) 50%,var(--g5) 75%,transparent)"}}/>
        <div style={{padding:"28px 32px",borderBottom:"1px solid var(--z5)",background:"linear-gradient(135deg,var(--z7) 0%,rgba(200,169,110,0.04) 100%)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:20}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div className="gdot" style={{background:"var(--g5)"}}/>
                <span className="label-g">GEO Intelligence Report · Ready</span>
              </div>
              <h2 className="display" style={{fontSize:"clamp(20px,3.2vw,30px)",color:"var(--z0)",marginBottom:8,lineHeight:1.1,letterSpacing:"-0.015em",maxWidth:480}}>{productName||"Product GEO Analysis"}</h2>
              {productBrand&&<div style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--z3)",fontWeight:300}}>{productBrand}</div>}
            </div>
            {pct!=null&&(
              <div style={{textAlign:"right",animation:"badgePop 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both"}}>
                <div className="display" style={{fontSize:64,color:cf,lineHeight:1,letterSpacing:"-0.02em"}}>{pct}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z3)",marginTop:4,letterSpacing:"0.1em"}}>/100 · {band}</div>
              </div>
            )}
          </div>
        </div>
        <div className="tab-bar">
          {sections.map(s=>(
            <button key={s.id} className={`tab${sec===s.id?" on":""}`} onClick={()=>setSec(s.id)}>
              <span style={{marginRight:5,opacity:0.5,fontSize:11}}>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
      </div>

      {active&&(
        <div key={active.id} className="panel" style={{padding:"32px 36px",marginBottom:16,borderRadius:"var(--r14)",animation:"scaleIn 0.28s cubic-bezier(0.16,1,0.3,1) both"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24,paddingBottom:16,borderBottom:"1px solid var(--z5)"}}>
            <div style={{width:3,height:20,background:"var(--g5)",borderRadius:2,boxShadow:"0 0 8px var(--g5)"}}/>
            <span className="label-g">{active.label}</span>
          </div>
          <MDRender blocks={parseMD(active.content)}/>
          {active.id==="roadmap"&&projText&&(
            <div style={{marginTop:32,paddingTop:26,borderTop:"1px solid var(--z5)"}}>
              <div className="label-g" style={{marginBottom:14}}>Score Projection</div>
              <div style={{border:"1px solid var(--gs)",borderRadius:"var(--r10)",overflow:"hidden"}}>
                {projText.split("\n").filter(l=>l.trim()).map((line,i)=>{
                  const m=line.match(/^(.+?):\s*(.+)$/); if(!m) return null;
                  const [,label,value]=m;
                  return(
                    <div key={i} className="row" style={{display:"flex",borderBottom:"1px solid var(--z5)"}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z2)",padding:"12px 18px",minWidth:180,borderRight:"1px solid var(--z5)",flexShrink:0,letterSpacing:"0.08em",textTransform:"capitalize",background:"rgba(200,169,110,0.04)"}}>{label}</div>
                      <div className="display" style={{fontSize:18,color:"var(--g4)",padding:"10px 18px",background:"var(--z7)"}}>{value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="panel panel-gold" style={{padding:"26px 32px",borderRadius:"var(--r14)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div className="gdot" style={{background:"var(--g5)"}}/>
              <span className="label-g">Full Report Ready</span>
            </div>
            <div className="display" style={{fontSize:20,color:"var(--z0)",marginBottom:6}}>Export Your GEO Report</div>
            <div style={{fontFamily:"var(--sans)",fontSize:13.5,color:"var(--z2)",lineHeight:1.75,maxWidth:420,fontWeight:300}}>Download the .docx report or get console-ready JavaScript fixes for your page.</div>
            {dlDone&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--jade)",marginTop:10,display:"flex",alignItems:"center",gap:6,letterSpacing:"0.1em"}}>✓ DOWNLOAD COMPLETE</div>}
          </div>
          <RippleBtn onClick={()=>setShowModal(true)}>↓ Export Report</RippleBtn>
        </div>
      </div>

      {showModal&&createPortal(
        <DownloadModal
          onClose={()=>setShowModal(false)}
          onDownload={()=>{ download(); setShowModal(false); }}
          downloading={downloading}
          onGetCode={()=>{ setShowModal(false); onGetCode(); }}
        />,
        document.body
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CRAWL_STEPS=[
  {label:"Connecting to URL",detail:"establishing connection..."},
  {label:"Fetching HTML response",detail:"parsing document structure..."},
  {label:"Extracting metadata & schema",detail:"title · meta · json-ld · canonical..."},
  {label:"Parsing product signals",detail:"price · brand · availability · rating..."},
  {label:"Analyzing trust indicators",detail:"https · reviews · policies · contact..."},
  {label:"Building content map",detail:"headings · features · faq · links..."},
  {label:"Finalizing crawl data",detail:"preparing result payload..."},
];
const GEO_STEPS=[
  {label:"Initializing GEO engine",detail:"loading semantic models..."},
  {label:"Running technical audit",detail:"schema · entity · metadata signals..."},
  {label:"Analyzing content strategy",detail:"FAQ gaps · semantic coverage..."},
  {label:"Building priority roadmap",detail:"high / medium / low impact..."},
  {label:"Generating executive report",detail:"AI visibility uplift estimation..."},
  {label:"Compiling recommendations",detail:"packaging final insights..."},
];
const TRIAL_LINKS=[
  {label:"boAt Earbuds",url:"https://www.boat-lifestyle.com/products/airdopes-supreme-long-playback-earbuds"},
  {label:"Nike AF1",url:"https://www.nike.com/t/air-force-1-07-mens-shoes-jBrhbr/CW2288-111"},
  {label:"IKEA KALLAX",url:"https://www.ikea.com/us/en/p/kallax-shelf-unit-white-10278578/"},
];
const DYK=[
  "LLMs cite pages with structured FAQ schema 3× more often than pages without",
  "Missing canonical URL causes duplicate indexing in AI crawlers",
  "Product pages with spec tables rank 40% higher in AI-powered search",
  "JSON-LD markup is the #1 signal for Google SGE product cards",
  "Pages under 800 words are rarely cited by AI search engines",
  "Adding GTIN enables knowledge graph entity matching across AI systems",
  "Aggregate rating schema unlocks rich snippets in AI browsers",
  "Image alt text contributes to multimodal AI search indexing",
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  useEffect(()=>{ injectCSS(); },[]);
  const [url,setUrl]=useState("");
  const [phase,setPhase]=useState("input");
  const [crawlStep,setCrawlStep]=useState(0);
  const [geoStep,setGeoStep]=useState(0);
  const [filename,setFilename]=useState("");
  const [crawlData,setCrawlData]=useState(null);
  const [scoreData,setScoreData]=useState(null);
  const [geoData,setGeoData]=useState(null);
  const [error,setError]=useState("");
  const [elapsed,setElapsed]=useState(0);
  const [dykIdx,setDykIdx]=useState(0);
  const [implementData,setImplementData]=useState(null);

  async function analyze() {
    if (!url.trim()) return;
    setError(""); setPhase("crawling"); setCrawlStep(0);
    let step=0;
    const t=setInterval(()=>{step=Math.min(step+1,CRAWL_STEPS.length-1);setCrawlStep(step);},800);
    try {
      const res=await fetch(`${API}/crawl_product`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
      if (!res.ok) throw new Error(`Crawl failed (HTTP ${res.status})`);
      const d=await res.json();clearInterval(t);setCrawlStep(CRAWL_STEPS.length);
      setCrawlData(d);setFilename((d.saved_to||"").split("/").pop());
      await sleep(300);setPhase("crawled");
    } catch(e) { clearInterval(t);setError(e.message);setPhase("input"); }
  }
  async function score() {
    setError("");setPhase("scoring");
    try {
      const res=await fetch(`${API}/geo_context`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename})});
      if (!res.ok) throw new Error(`Scoring failed (HTTP ${res.status})`);
      const d=await res.json();setScoreData(d);await sleep(200);setPhase("score");
    } catch(e) { setError(e.message);setPhase("crawled"); }
  }
  async function geo() {
    setError("");setPhase("geo_loading");setGeoStep(0);setElapsed(0);
    let step=0,sec=0;
    const st=setInterval(()=>{step=Math.min(step+1,GEO_STEPS.length-1);setGeoStep(step);},1400);
    const et=setInterval(()=>{sec++;setElapsed(sec);},1000);
    const dy=setInterval(()=>{setDykIdx(i=>(i+1)%DYK.length);},3500);
    try {
      const res=await fetch(`${API}/geo_recommendation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename})});
      if (!res.ok) throw new Error(`GEO report failed (HTTP ${res.status})`);
      const d=await res.json();clearInterval(st);clearInterval(et);clearInterval(dy);
      setGeoStep(GEO_STEPS.length);setGeoData(d);await sleep(300);setPhase("geo_done");
    } catch(e) { clearInterval(st);clearInterval(et);clearInterval(dy);setError(e.message);setPhase("score"); }
  }
  function reset() { setPhase("input");setUrl("");setFilename("");setCrawlData(null);setScoreData(null);setGeoData(null);setImplementData(null);setError(""); }

  async function implement(html) {
    const pageUrl=crawlData?.data?.page_info?.url||url;
    setError("");setPhase("implement_loading");
    try {
      const r1=await fetch(`${API}/index_page`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page_url:pageUrl,html})});
      if (!r1.ok) throw new Error(`Indexing failed (HTTP ${r1.status})`);
      const r2=await fetch(`${API}/apply_rewrites`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename})});
      if (!r2.ok) throw new Error(`Script generation failed (HTTP ${r2.status})`);
      const d=await r2.json();setImplementData(d);await sleep(300);setPhase("implement_done");
    } catch(e) { setError(e.message);setPhase("implement_input"); }
  }

  const CRUMBS=[{l:"Crawl"},{l:"Score"},{l:"Report"},{l:"Implement"}];
  const crumbIdx=["crawled","scoring"].includes(phase)?0:["score","geo_loading"].includes(phase)?1:phase==="geo_done"?2:["implement_input","implement_loading","implement_done"].includes(phase)?3:-1;
  const showCrumbs=["crawled","scoring","score","geo_loading","geo_done","implement_input","implement_loading","implement_done"].includes(phase);

  return (
    <div style={{minHeight:"100vh",background:"var(--z8)",display:"flex",flexDirection:"column"}}>
      {/* Background texture + depth orbs */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-30%",right:"-10%",width:"60vw",height:"60vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(200,169,110,0.04) 0%,transparent 65%)",animation:"orbDrift 30s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"-20%",left:"-8%",width:"50vw",height:"50vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(74,123,200,0.03) 0%,transparent 65%)",animation:"orbDrift 25s ease-in-out infinite reverse"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",flex:1}}>
        <Ticker/>

        {/* NAV */}
        <nav style={{borderBottom:"1px solid var(--z6)",background:"rgba(15,15,14,0.8)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
          <div style={{maxWidth:1060,margin:"0 auto",padding:"0 36px",display:"flex",justifyContent:"space-between",alignItems:"center",height:56}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              {/* Logo */}
              <svg width="28" height="28" viewBox="0 0 28 28">
                <rect x="1" y="1" width="11" height="11" rx="2" fill="var(--g5)" opacity="0.9"/>
                <rect x="16" y="1" width="11" height="11" rx="2" fill="var(--z4)" opacity="0.6"/>
                <rect x="1" y="16" width="11" height="11" rx="2" fill="var(--z4)" opacity="0.6"/>
                <rect x="16" y="16" width="11" height="11" rx="2" fill="var(--z5)" opacity="0.4"/>
              </svg>
              <div style={{width:1,height:18,background:"var(--z5)"}}/>
              <span className="display" style={{fontSize:18,color:"var(--z0)",letterSpacing:"0.02em"}}>GENY</span>
              <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",letterSpacing:"0.14em"}}>GEO Intelligence</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {phase!=="input"&&<button className="btn-ghost" onClick={reset}>↺ New Analysis</button>}
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 13px",border:"1px solid var(--jadeb)",borderRadius:"var(--r6)",background:"var(--jadef)"}}>
                <div className="gdot" style={{background:"var(--jade)"}}/>
                <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--jade)",letterSpacing:"0.1em"}}>Engine Online</span>
              </div>
            </div>
          </div>
        </nav>

        <main style={{flex:1,maxWidth:1060,margin:"0 auto",padding:"44px 36px 64px",width:"100%"}}>
          {/* Breadcrumb */}
          {showCrumbs&&(
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:36,animation:"fadeIn 0.3s ease both"}}>
              {CRUMBS.map((c,i)=>(
                <div key={c.l} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",
                    borderRadius:"var(--r6)",
                    background:i===crumbIdx?"var(--gm)":i<crumbIdx?"var(--z6)":"transparent",
                    border:`1px solid ${i===crumbIdx?"var(--gs)":i<crumbIdx?"var(--z4)":"var(--z5)"}`,
                    transition:"all 0.3s"}}>
                    <div style={{width:16,height:16,borderRadius:"50%",
                      border:`1px solid ${i===crumbIdx?"var(--g5)":i<crumbIdx?"var(--z3)":"var(--z4)"}`,
                      background:i<crumbIdx?"var(--z4)":"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.3s"}}>
                      {i<crumbIdx
                        ?<svg width="7" height="7" viewBox="0 0 7 7"><polyline points="1,3.5 2.8,5.5 6,1.5" fill="none" stroke="var(--z1)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        :<span style={{fontFamily:"var(--mono)",fontSize:7.5,color:i===crumbIdx?"var(--g5)":"var(--z3)",fontWeight:500}}>{i+1}</span>}
                    </div>
                    <span style={{fontFamily:"var(--sans)",fontSize:12,color:i===crumbIdx?"var(--g4)":i<crumbIdx?"var(--z2)":"var(--z3)",fontWeight:i===crumbIdx?400:300,transition:"color 0.3s"}}>{c.l}</span>
                  </div>
                  {i<CRUMBS.length-1&&<svg width="10" height="10" viewBox="0 0 10 10" style={{color:"var(--z4)"}}><polyline points="2,2 8,5 2,8" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error&&(
            <div style={{border:"1px solid var(--crimsonb)",background:"var(--crimsonf)",padding:"12px 18px",marginBottom:20,borderRadius:"var(--r10)",display:"flex",gap:10,alignItems:"center",animation:"fadeIn 0.2s ease both"}}>
              <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="none" stroke="var(--crimson)" strokeWidth="1.2"/><line x1="7" y1="4" x2="7" y2="8.5" stroke="var(--crimson)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="10.5" r="0.8" fill="var(--crimson)"/></svg>
              <span style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--crimson)",flex:1,fontWeight:300}}>{error}</span>
              <button onClick={()=>setError("")} style={{background:"transparent",border:"none",color:"var(--crimson)",cursor:"pointer",fontSize:18,lineHeight:1,opacity:0.5}}>×</button>
            </div>
          )}

          {/* ═══════ INPUT ═══════ */}
          {phase==="input"&&(
            <div style={{animation:"fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) both"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:72,marginBottom:56,alignItems:"start"}}>
                {/* Left: copy */}
                <div>
                  {/* Thin gold rule */}
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
                    <div style={{width:32,height:1,background:"var(--g5)"}}/>
                    <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--g5)",letterSpacing:"0.18em",textTransform:"uppercase"}}>Generative Engine Optimization</span>
                  </div>
                  <h1 style={{marginBottom:24,lineHeight:1.0}}>
                    <div className="display" style={{fontSize:"clamp(50px,7vw,80px)",color:"var(--z0)",display:"block",animation:"slideL 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both"}}>Know Your</div>
                    <div className="display-i" style={{fontSize:"clamp(50px,7vw,80px)",color:"var(--g5)",display:"block",position:"relative",animation:"slideL 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both"}}>
                      GEO Score
                      <span style={{position:"absolute",bottom:-2,left:0,height:1,background:"linear-gradient(90deg,var(--g5),var(--g3),transparent)",animation:"lineGrow 0.8s cubic-bezier(0.16,1,0.3,1) 0.9s both",right:0}}/>
                    </div>
                  </h1>
                  <p style={{fontFamily:"var(--sans)",fontSize:16,color:"var(--z2)",lineHeight:1.85,maxWidth:440,marginBottom:36,fontWeight:300,animation:"fadeUp 0.6s ease 0.4s both"}}>
                    Crawl any product page. Score AI readiness across 5 dimensions. Get a full report with copy-paste JSON-LD fixes and a roadmap to AI search dominance.
                  </p>
                  {/* Feature pills */}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",animation:"fadeUp 0.5s ease 0.55s both"}}>
                    {["⬡ Schema","◎ Entity","◈ Trust","⬢ Content","↗ Report"].map((f,idx)=>(
                      <div key={f} style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",padding:"7px 14px",
                        border:"1px solid var(--z5)",borderRadius:"var(--r6)",color:"var(--z2)",background:"var(--z7)",
                        cursor:"default",transition:"all 0.2s",
                        animation:`fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${0.55+idx*0.06}s both`}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gs)";e.currentTarget.style.color="var(--g4)";e.currentTarget.style.background="var(--gf)";e.currentTarget.style.transform="translateY(-2px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--z5)";e.currentTarget.style.color="var(--z2)";e.currentTarget.style.background="var(--z7)";e.currentTarget.style.transform="none";}}>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: orb + stats */}
                <div style={{display:"flex",flexDirection:"column",gap:10,paddingTop:16,animation:"slideR 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both"}}>
                  <div className="panel panel-gold" style={{padding:"28px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:10,borderRadius:"var(--r14)"}}>
                    <HeroOrb/>
                    <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--z3)",letterSpacing:"0.16em",textTransform:"uppercase",textAlign:"center",marginTop:4}}>Live Demo · Updates Every 4s</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{v:100,l:"Max Score",d:"points"},{v:5,l:"Dimensions",d:"signals"},{v:4,l:"AI Agents",d:"pipeline"},{v:null,l:"~90s",d:"avg time"}].map((s,idx)=>(
                      <div key={s.l} className="panel" style={{padding:"14px 16px",cursor:"default",transition:"all 0.2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gs)";e.currentTarget.style.transform="translateY(-2px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--z5)";e.currentTarget.style.transform="none";}}>
                        <div className="display" style={{fontSize:24,color:"var(--z0)",lineHeight:1,marginBottom:3}}>{s.v?<Num to={s.v} duration={800+idx*200}/>:s.l}</div>
                        <div className="label">{s.v?s.l:s.d}</div>
                        <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--z4)",marginTop:2}}>{s.v?s.d:""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input card */}
              <div className="panel ca" style={{maxWidth:720,borderRadius:"var(--r14)",overflow:"hidden"}}>
                <div style={{padding:"24px 28px",borderBottom:"1px solid var(--z5)"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--z2)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                    Target Product URL
                    <span style={{color:"var(--z4)",fontSize:8}}>· Press Enter to analyze</span>
                  </div>
                  <div style={{display:"flex",gap:0,borderRadius:"var(--r6)",overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",padding:"0 16px",background:"var(--z6)",border:"1px solid var(--z4)",borderRight:"none",borderRadius:"var(--r6) 0 0 var(--r6)",flexShrink:0}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--z3)"}}>https://</span>
                    </div>
                    <input className="inp" style={{borderLeft:"none",borderRadius:"0 var(--r6) var(--r6) 0",flex:1}}
                      value={url.replace(/^https?:\/\//,"")}
                      onChange={e=>setUrl("https://"+e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&analyze()}
                      placeholder="www.example.com/products/your-product"
                      autoFocus/>
                  </div>
                  <URLPrev url={url}/>
                </div>
                <div style={{padding:"14px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--z7)",flexWrap:"wrap",gap:12}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",letterSpacing:"0.1em",marginRight:2}}>Try:</span>
                    {TRIAL_LINKS.map(ex=>(
                      <button key={ex.label} className="btn-ghost" onClick={()=>setUrl(ex.url)}>{ex.label}</button>
                    ))}
                  </div>
                  <RippleBtn onClick={analyze}>Analyze →</RippleBtn>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ CRAWLING ═══════ */}
          {phase==="crawling"&&(
            <div style={{maxWidth:560,animation:"fadeIn 0.35s ease both"}}>
              <div style={{display:"flex",gap:18,alignItems:"flex-start",marginBottom:32}}>
                <Spin size={28}/>
                <div>
                  <div className="display" style={{fontSize:24,color:"var(--z0)",marginBottom:6}}>Crawling Page</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--z2)",wordBreak:"break-all",letterSpacing:"0.04em"}}>{url}</div>
                  <div className="label" style={{marginTop:6}}>Step {crawlStep+1} / {CRAWL_STEPS.length}</div>
                </div>
              </div>
              <div className="panel" style={{padding:"22px 28px",borderRadius:"var(--r14)"}}>
                <Steps steps={CRAWL_STEPS} cur={crawlStep}/>
              </div>
            </div>
          )}

          {phase==="crawled"&&<CrawlView crawlData={crawlData} onScore={score}/>}

          {phase==="scoring"&&(
            <div style={{display:"flex",gap:16,alignItems:"center",padding:"16px 0",animation:"fadeIn 0.3s ease both"}}>
              <Spin size={22}/>
              <div>
                <div className="display" style={{fontSize:18,color:"var(--z0)",marginBottom:4}}>Computing AI Readiness Score</div>
                <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--z3)"}}>Analyzing schema · entity · content · trust · extractability</div>
              </div>
            </div>
          )}

          {phase==="score"&&(
            <div>
              <button className="btn-ghost" onClick={()=>setPhase("crawled")} style={{marginBottom:24}}>← Crawl Data</button>
              <ScoreView scoreData={scoreData} onGeo={geo}/>
            </div>
          )}

          {/* ═══════ GEO LOADING ═══════ */}
          {phase==="geo_loading"&&(
            <div style={{maxWidth:600,animation:"fadeIn 0.35s ease both"}}>
              <div style={{display:"flex",gap:18,alignItems:"flex-start",marginBottom:28}}>
                <Spin size={30}/>
                <div>
                  <div className="display" style={{fontSize:26,color:"var(--z0)",marginBottom:6}}>Generating GEO Report</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div className="gdot" style={{background:"var(--jade)"}}/>
                    <span style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--z3)",letterSpacing:"0.06em"}}>{elapsed}s elapsed · avg ~90s</span>
                  </div>
                </div>
              </div>
              <div className="panel" style={{marginBottom:12,borderRadius:"var(--r14)"}}>
                <SH label="AI Agent Pipeline" right={<span className="label" style={{color:"var(--z3)"}}>4 agents</span>}/>
                {[{l:"Technical Auditor",d:"schema · entity · metadata · canonical"},{l:"Content Strategist",d:"FAQ gaps · semantic depth"},{l:"Prioritizer",d:"impact scoring · effort estimation"},{l:"Report Builder",d:"packaging executive insights"}].map((agent,i)=>{
                  const aA=Math.min(Math.floor((geoStep/GEO_STEPS.length)*4),3);
                  const done=i<aA,active=i===aA;
                  return(
                    <div key={i} style={{display:"flex",gap:16,padding:"14px 20px",borderBottom:i<3?"1px solid var(--z5)":"none",alignItems:"center",opacity:i>aA?0.2:1,transition:"opacity 0.4s",background:active?"rgba(200,169,110,0.03)":"transparent"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,border:`1px solid ${done?"var(--jade)":active?"var(--g5)":"var(--z4)"}`,background:done?"var(--jade)":active?"rgba(200,169,110,0.1)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.35s",boxShadow:active?"0 0 0 4px var(--gf)":"none"}}>
                        {done?<svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1.5,4.5 3.5,6.5 7.5,2.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        :active?<div style={{width:6,height:6,borderRadius:"50%",background:"var(--g5)",animation:"breathe 1.5s ease infinite"}}/>
                        :<span style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--z3)"}}>{i+1}</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"var(--sans)",fontSize:14,color:done?"var(--z3)":active?"var(--z0)":"var(--z3)",fontWeight:active?400:300,textDecoration:done?"line-through":"none",textDecorationColor:"var(--z4)"}}>{agent.l}</div>
                        {active&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--g5)",marginTop:3,animation:"fadeIn 0.3s ease both"}}>{agent.d}</div>}
                      </div>
                      {active&&<Spin size={16}/>}
                      {done&&<span className="tag tj">✓</span>}
                    </div>
                  );
                })}
              </div>
              {/* DYK card */}
              <div className="panel panel-gold" style={{padding:"18px 22px",marginBottom:12,borderRadius:"var(--r14)"}}>
                <div className="label-g" style={{marginBottom:10,display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:"var(--g5)"}}/>Did You Know
                </div>
                <div key={dykIdx} style={{fontFamily:"var(--sans)",fontSize:14,color:"var(--z1)",lineHeight:1.8,fontWeight:300,animation:"fadeIn 0.4s ease both"}}>{DYK[dykIdx]}</div>
                <div style={{display:"flex",gap:4,marginTop:12}}>
                  {DYK.map((_,i)=><div key={i} style={{height:2,width:i===dykIdx?18:4,background:i===dykIdx?"var(--g5)":"var(--z5)",transition:"all 0.4s",borderRadius:1}}/>)}
                </div>
              </div>
              <div className="panel" style={{padding:"22px 28px",borderRadius:"var(--r14)"}}>
                <Steps steps={GEO_STEPS} cur={geoStep}/>
              </div>
            </div>
          )}

          {phase==="geo_done"&&(
            <div>
              <button className="btn-ghost" onClick={()=>setPhase("score")} style={{marginBottom:24}}>← Score View</button>
              <GeoView data={geoData} scoreData={scoreData} filename={filename} onGetCode={()=>setPhase("implement_input")}/>
            </div>
          )}

          {phase==="implement_input"&&(
            <div>
              <button className="btn-ghost" onClick={()=>setPhase("geo_done")} style={{marginBottom:24}}>← GEO Report</button>
              <ImplementInputView onSubmit={implement} loading={false} pageUrl={crawlData?.data?.page_info?.url||url}/>
            </div>
          )}

          {phase==="implement_loading"&&(
            <div style={{maxWidth:560,animation:"fadeIn 0.35s ease both"}}>
              <div style={{display:"flex",gap:18,alignItems:"flex-start",marginBottom:32}}>
                <Spin size={28}/>
                <div>
                  <div className="display" style={{fontSize:24,color:"var(--z0)",marginBottom:6}}>Generating Console Scripts</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--z2)",letterSpacing:"0.04em"}}>Indexing HTML chunks · Matching elements · Writing JavaScript</div>
                </div>
              </div>
              <div className="panel" style={{padding:"22px 28px",borderRadius:"var(--r14)"}}>
                <Steps steps={[
                  {label:"Parsing HTML into semantic chunks",detail:"headers · product info · specs · faq..."},
                  {label:"Embedding and indexing in Qdrant",detail:"vector similarity search..."},
                  {label:"Matching recommendations to elements",detail:"semantic + role-based retrieval..."},
                  {label:"Writing console JavaScript",detail:"selectors · outerHTML · schema injection..."},
                  {label:"Packaging scripts",detail:"IIFE · try/catch · copy-ready..."},
                ]} cur={3}/>
              </div>
            </div>
          )}

          {phase==="implement_done"&&(
            <div>
              <button className="btn-ghost" onClick={()=>setPhase("implement_input")} style={{marginBottom:24}}>← Paste New Source</button>
              <ImplementDoneView data={implementData}/>
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer style={{borderTop:"1px solid var(--z6)",background:"var(--z9)",padding:"16px 36px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <svg width="16" height="16" viewBox="0 0 28 28">
              <rect x="1" y="1" width="11" height="11" rx="2" fill="var(--g5)" opacity="0.8"/>
              <rect x="16" y="16" width="11" height="11" rx="2" fill="var(--z4)" opacity="0.5"/>
            </svg>
            <span className="display" style={{fontSize:14,color:"var(--z0)"}}>GENY</span>
            <span style={{width:1,height:12,background:"var(--z5)"}}/>
            <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)"}}>GEO Intelligence Engine · v5.0</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div className="gdot" style={{background:"var(--jade)"}}/>
            <span style={{fontFamily:"var(--mono)",fontSize:8.5,color:"var(--z3)",letterSpacing:"0.1em"}}>All Systems Nominal</span>
          </div>
        </footer>
      </div>
    </div>
  );
}