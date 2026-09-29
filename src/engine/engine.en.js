// SPDX-License-Identifier: Apache-2.0
// Motor de las pestañas (vanilla JS). Se monta desde Playground.tsx. Todo lo de German Credit se calcula en vivo.
export function initEngine(DATA, init) {
let quieto = false;
// ===================== utilidades compartidas =====================
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt2 = x => x.toFixed(2).replace("-", "−").replace(".", ".");
const fmt3 = x => x.toFixed(3).replace("-", "−").replace(".", ".");
const fmt4 = x => x.toFixed(4).replace("-", "−").replace(".", ".");
const pct = x => (100 * x).toFixed(1).replace(".", ".") + "%";
const pct0 = x => Math.round(100 * x) + "%";
const mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const el = id => document.getElementById(id);
function stagger(root) { root.querySelectorAll(".stage").forEach((s, i) => { s.style.animationDelay = reduced ? "0s" : (i * 0.18) + "s"; }); }
function stepper(prefix, pasos, onGo) {
  const rail = el(prefix + "-rail");
  rail.innerHTML = pasos.map((p, i) => `<button type="button" data-p="${i}"><span class="n">${i}</span>${p}</button>`).join("");
  rail.querySelectorAll("button").forEach(b => b.onclick = () => onGo(+b.dataset.p));
  el(prefix + "-prev").onclick = () => onGo(-1, -1);
  el(prefix + "-next").onclick = () => onGo(-1, +1);
}
function marcarPaso(prefix, i, n) {
  document.querySelectorAll(`#m-${prefix} .panel`).forEach((p, k) => p.classList.toggle("on", k === i));
  document.querySelectorAll(`#${prefix}-rail button`).forEach((b, k) => k === i ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current"));
  el(prefix + "-prev").disabled = i === 0; el(prefix + "-next").disabled = i === n - 1;
  document.querySelectorAll(`#m-${prefix} > .controls .ctrl[data-pasos]`).forEach(c => { c.style.display = c.dataset.pasos.split(",").map(Number).includes(i) ? "" : "none"; });
  if (!quieto) { const tb = el("tabs"); if (tb) { const y = tb.getBoundingClientRect().top + window.scrollY - 8; window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" }); } }
}
function segmento(id, attr, cb) {
  const e = el(id);
  e.querySelectorAll("button").forEach(b => b.onclick = () => { e.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); cb(b.dataset[attr]); });
}
function pasoGenerico(prefix, n, st, render) {
  return (i, delta) => {
    if (i < 0) i = Math.max(0, Math.min(n - 1, st.paso + delta));
    st.paso = i; marcarPaso(prefix, i, n);
    render(true); tex(document.getElementById("m-" + prefix));
  };
}
function pasoInicial(prefix) { return 0; }
const barras = (items, o = {}) => `<div class="bars">${items.map(it => `<div class="lab ${it.cls || ""}">${it.lab}</div><div class="bar ${it.cls || ""}"><i style="width:${Math.max(0, Math.min(100, 100 * it.v / (o.max || 1)))}%"></i></div><div class="val">${it.txt}</div>`).join("")}</div>`;
const tabla = (cab, filas, cls = "cmp") => `<div class="mwrap"><table class="${cls}"><tr>${cab.map(c => `<th>${c}</th>`).join("")}</tr>${filas.map(r => `<tr class="${r.cls || ""}">${r.c.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
const kpi = items => `<div class="kpi" style="max-width:none">${items.map(it => `<div><div class="t">${it.t}</div><div class="v" ${it.col ? `style="color:${it.col}"` : ""}>${it.v}${it.s ? ` <small>${it.s}</small>` : ""}</div></div>`).join("")}</div>`;
function curva(series, o) {
  const W = o.w || 420, H = o.h || 200, ml = 44, mb = 30, mt = 12, mr = 12;
  const [x0, x1] = o.xr, [y0, y1] = o.yr;
  const X = x => ml + (x - x0) / (x1 - x0) * (W - ml - mr), Y = y => mt + (y1 - y) / (y1 - y0) * (H - mt - mb);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
  const yt = o.yt || [y0, (y0 + y1) / 2, y1], xt = o.xt || [x0, (x0 + x1) / 2, x1];
  yt.forEach(v => s += `<line x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${ml - 6}" y="${Y(v) + 4}" text-anchor="end" class="tick">${o.yf ? o.yf(v) : v}</text>`);
  xt.forEach(v => s += `<text x="${X(v)}" y="${H - 8}" text-anchor="middle" class="tick">${o.xf ? o.xf(v) : v}</text>`);
  if (o.xl) s += `<text x="${(ml + W - mr) / 2}" y="${H - 20}" text-anchor="middle" class="tick" style="font-weight:600">${o.xl}</text>`;
  series.forEach(se => {
    if (se.pts.length > 1) s += `<polyline points="${se.pts.map(p => X(p[0]) + "," + Y(p[1])).join(" ")}" fill="none" stroke="${se.col}" stroke-width="${se.sw || 2.5}" stroke-linejoin="round" ${se.dash ? 'stroke-dasharray="5 4"' : ""}/>`;
    if (se.marks) se.pts.forEach(p => s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${se.r || 4}" fill="${se.col}"/>`);
    if (se.lab) s += `<text x="${X(se.pts[se.pts.length - 1][0]) - 4}" y="${Y(se.pts[se.pts.length - 1][1]) - 8}" text-anchor="end" style="fill:${se.col};font-size:12px;font-weight:600">${se.lab}</text>`;
  });
  (o.extra || []).forEach(e => { if (e.tipo === "punto") s += `<circle cx="${X(e.x)}" cy="${Y(e.y)}" r="6" fill="var(--cobre)" stroke="var(--surface)" stroke-width="2"/><text x="${X(e.x) + 9}" y="${Y(e.y) - 8}" class="tick" style="fill:var(--cobre);font-weight:600">${e.txt || ""}</text>`; if (e.tipo === "vline") s += `<line x1="${X(e.x)}" x2="${X(e.x)}" y1="${mt}" y2="${H - mb}" stroke="var(--cobre)" stroke-dasharray="4 3"/>`; if (e.tipo === "hline") s += `<line x1="${ml}" x2="${W - mr}" y1="${Y(e.y)}" y2="${Y(e.y)}" stroke="${e.col || "var(--v)"}" stroke-dasharray="4 3"/>`; });
  return s + "</svg>";
}
function histo(vals, o) {
  // histograma simple en SVG
  const [a, b] = o.xr, k = o.k || 15, W = o.w || 420, H = o.h || 180, ml = 36, mb = 28, mt = 10, mr = 10;
  const cnt = Array(k).fill(0); vals.forEach(v => { const i = Math.min(k - 1, Math.max(0, Math.floor((v - a) / (b - a) * k))); cnt[i]++; });
  const mx = Math.max(1, ...cnt); const X = x => ml + (x - a) / (b - a) * (W - ml - mr), Y = c => mt + (1 - c / mx) * (H - mt - mb);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
  cnt.forEach((c, i) => { const x0 = X(a + (b - a) * i / k), x1 = X(a + (b - a) * (i + 1) / k); s += `<rect x="${x0 + 1}" y="${Y(c)}" width="${Math.max(1, x1 - x0 - 2)}" height="${Y(0) - Y(c)}" fill="var(--q)" opacity=".75"/>`; });
  (o.xt || [a, (a + b) / 2, b]).forEach(v => s += `<text x="${X(v)}" y="${H - 8}" text-anchor="middle" class="tick">${o.xf ? o.xf(v) : v}</text>`);
  (o.extra || []).forEach(e => s += `<line x1="${X(e.x)}" x2="${X(e.x)}" y1="${mt}" y2="${H - mb}" stroke="${e.col || "var(--cobre)"}" stroke-width="2" stroke-dasharray="4 3"/><text x="${X(e.x) + 4}" y="${mt + 12}" class="tick" style="fill:${e.col || "var(--cobre)"};font-weight:600">${e.txt || ""}</text>`);
  if (o.xl) s += `<text x="${(ml + W - mr) / 2}" y="${H - 20}" text-anchor="middle" class="tick" style="font-weight:600">${o.xl}</text>`;
  return s + "</svg>";
}
function tex(node) { if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([node]).catch(() => { }); }
function rng32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ===================== datos y modelo logístico =====================
const XC = DATA.XCOLS, K = XC.length;
const ROWS = DATA.filas; const TRN = ROWS.filter(r => r.c === "t"), TST = ROWS.filter(r => r.c === "s");
const NOMBRE = { duracion: "duration", monto: "amount", edad: "age", cuota_pct_ingreso: "installment % of income", cta_negativa: "checking < 0", cta_0_200: "checking 0 to 200", cta_sobre_200: "checking over 200", hist_critico: "history critical", hist_atrasos: "history delays", hist_sin_creditos: "history no credits", ahorro_100_1000: "savings 100 to 1,000", ahorro_sobre_1000: "savings over 1,000", ahorro_desconocido: "savings unknown", vivienda_arriendo: "rent", vivienda_gratis: "housing for free", proposito_auto: "purpose car", proposito_radio_tv: "purpose radio/tv", proposito_muebles: "purpose furniture", intercepto: "intercept" };
const nom = v => NOMBRE[v] || v;
const thetaArr = th => [th.intercepto].concat(XC.map(c => th[c]));
const TH = thetaArr(DATA.theta), TH_LIN = thetaArr(DATA.theta_lineal);
const sig = z => 1 / (1 + Math.exp(-z));
const zde = (t, r) => { let z = t[0]; for (let j = 0; j < K; j++) z += t[j + 1] * r.x[j]; return z; };
const pde = (t, r) => sig(zde(t, r));
const perd = (p, y) => -(y ? Math.log(Math.max(p, 1e-12)) : Math.log(Math.max(1 - p, 1e-12)));
function conf(rows, ps, u) { let TP = 0, FP = 0, TN = 0, FN = 0; rows.forEach((r, i) => { const m = ps[i] > u; if (r.y) { if (m) TP++; else FN++; } else { if (m) FP++; else TN++; } }); const rec = TP + FN ? TP / (TP + FN) : 0, pre = TP + FP ? TP / (TP + FP) : 0; return { TP, FP, TN, FN, acc: (TP + TN) / rows.length, rec, pre, f1: rec + pre ? 2 * rec * pre / (rec + pre) : 0, fpr: FP + TN ? FP / (FP + TN) : 0, rec0: TN + FP ? TN / (TN + FP) : 0, pre0: TN + FN ? TN / (TN + FN) : 0 }; }
function auc(rows, ps) { // exacto: ordenamiento de pares (Mann-Whitney)
  const pos = [], neg = []; rows.forEach((r, i) => (r.y ? pos : neg).push(ps[i]));
  const all = pos.map(v => [v, 1]).concat(neg.map(v => [v, 0])).sort((a, b) => a[0] - b[0]);
  let i = 0, sumR = 0; while (i < all.length) { let j = i; while (j + 1 < all.length && all[j + 1][0] === all[i][0]) j++; const rk = (i + j + 2) / 2; for (let k = i; k <= j; k++) if (all[k][1]) sumR += rk; i = j + 1; }
  return (sumR - pos.length * (pos.length + 1) / 2) / (pos.length * neg.length);
}
const perdMedia = (rows, ps) => rows.reduce((s, r, i) => s + perd(ps[i], r.y), 0) / rows.length;
// Newton (IRLS) para entrenar en vivo: pocas iteraciones, 19x19
function solve(A, b) { const n = b.length; const M = A.map((r, i) => r.concat([b[i]])); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c] || 1e-12; for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / d; if (!f) continue; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } } return M.map((r, i) => r[n] / (r[i] || 1e-12)); }
function entrenar(rows, w = null, iters = 12) {
  const d = K + 1; let t = Array(d).fill(0);
  const xs = rows.map(r => [1].concat(r.x)); const ys = rows.map(r => r.y);
  for (let it = 0; it < iters; it++) {
    const H = Array.from({ length: d }, () => Array(d).fill(0)), g = Array(d).fill(0);
    for (let i = 0; i < rows.length; i++) { let z = 0; for (let j = 0; j < d; j++) z += t[j] * xs[i][j]; const p = sig(z), wi = (w ? w[i] : 1), e = wi * (p - ys[i]), v = wi * p * (1 - p) + 1e-9; for (let j = 0; j < d; j++) { g[j] += e * xs[i][j]; for (let k = j; k < d; k++) H[j][k] += v * xs[i][j] * xs[i][k]; } }
    for (let j = 0; j < d; j++) { H[j][j] += 1e-6; for (let k = 0; k < j; k++) H[j][k] = H[k][j]; }
    const step = solve(H, g); let mx = 0; for (let j = 0; j < d; j++) { t[j] -= step[j]; mx = Math.max(mx, Math.abs(step[j])); } if (mx < 1e-7) break;
  }
  return t;
}
const P_TST = TST.map(r => pde(TH, r)), P_TRN = TRN.map(r => pde(TH, r));
const UMB = []; for (let u = 1.0; u > -0.001; u -= 0.05) UMB.push(Math.round(u * 100) / 100);
function tablaUmbral(rows, ps, umbs = UMB) { return umbs.map(u => ({ u, ...conf(rows, ps, u) })); }
function aucTrap(t) { let s = 0; for (let i = 1; i < t.length; i++) s += (t[i].fpr - t[i - 1].fpr) * (t[i].rec + t[i - 1].rec) / 2; return s; }
function matrizHTML(c, tit) {
  return `<div class="block stage"><div class="t">${tit}</div><table class="cmp small"><tr><th></th><th>predicted 0 (pays)</th><th>predicted 1 (does not pay)</th><th>total</th></tr>
  <tr><td><b>actual 0 (good payer)</b></td><td class="mono">TN ${c.TN}</td><td class="mono" style="color:var(--bad)">FP ${c.FP}</td><td class="mono">${c.TN + c.FP}</td></tr>
  <tr><td><b>actual 1 (bad payer)</b></td><td class="mono" style="color:var(--bad)">FN ${c.FN}</td><td class="mono" style="color:var(--ok)">TP ${c.TP}</td><td class="mono">${c.TP + c.FN}</td></tr>
  <tr><td><b>total</b></td><td class="mono">${c.TN + c.FN}</td><td class="mono">${c.FP + c.TP}</td><td class="mono">${c.TP + c.FP + c.TN + c.FN}</td></tr></table></div>`;
}
function reporteHTML(c, tit) {
  const n0 = c.TN + c.FP, n1 = c.TP + c.FN, f10 = c.rec0 + c.pre0 ? 2 * c.rec0 * c.pre0 / (c.rec0 + c.pre0) : 0;
  return `<div class="block stage"><div class="t">${tit}</div>${tabla(["", "precision", "recall", "f1-score", "support"], [
    { c: ["class 0 (pays)", fmt3(c.pre0), fmt3(c.rec0), fmt3(f10), n0] },
    { c: ["<b>class 1 (does not pay)</b>", "<b>" + fmt3(c.pre) + "</b>", "<b>" + fmt3(c.rec) + "</b>", fmt3(c.f1), n1], cls: "hi" },
    { c: ["accuracy", "", "", fmt3(c.acc), n0 + n1] },
    { c: ["macro avg", fmt3((c.pre + c.pre0) / 2), fmt3((c.rec + c.rec0) / 2), fmt3((c.f1 + f10) / 2), n0 + n1] }], "cmp small")}</div>`;
}

// ===================== pestañas =====================
let modeloActual = "rec";
const GOTO = {};
function irModelo(m) {
  modeloActual = m;
  document.querySelectorAll(".modelo").forEach(e => e.classList.toggle("on", e.id === "m-" + m));
  document.querySelectorAll("#tabs button").forEach(b => b.dataset.m === m ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
  GOTO[m](ST[m].paso);
}
document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => irModelo(b.dataset.m));
const ST = { rec: { paso: 0, z: 1.5, u: 0.5 }, per: { paso: 0, p1: 0.8, p3: 0.1 }, ent: { paso: 0, lr: 0.1, t: null, hist: [] }, eva: { paso: 0, u: 0.5, conj: "s" }, roc: { paso: 0, u: 0.5 }, cos: { paso: 0, fn: 5, fp: 1 }, reg: { paso: 0, tipo: "l2", li: 3 }, bal: { paso: 0, met: "base", u: 0.5 }, mue: { paso: 0, sem: 1, res: [], bsSem: 1 }, tw: { paso: 0 } };

// ===================== 01 RECTA =====================
(function () {
  const st = ST.rec;
  function rDatos(anim) {
    const n1t = TRN.filter(r => r.y).length, n1s = TST.filter(r => r.y).length;
    el("rec-datos").innerHTML = kpi([{ t: "customers", v: mil(ROWS.length) }, { t: "bad payers", v: "300", s: "30%" }, { t: "training", v: "700", s: n1t + " bad" }, { t: "testing", v: "300", s: n1s + " bad" }, { t: "prepared columns", v: "18", s: "4 numeric, 14 of 0/1" }]) +
      `<div class="block stage" style="flex:1 1 100%"><div class="t">The first 8 customers (numeric columns in original units; scaled in the model table)</div>${tabla(["id", "y", "set", "duration (months)", "amount (DM)", "age", "installment % of income", "checking < 0", "history critical", "savings unknown", "rent"],
        ROWS.slice(0, 8).map(r => ({ c: [r.id, r.y, r.c === "t" ? "training" : "testing", r.raw[0], mil(r.raw[1]), r.raw[2], r.raw[3], r.x[XC.indexOf("cta_negativa")], r.x[XC.indexOf("hist_critico")], r.x[XC.indexOf("ahorro_desconocido")], r.x[XC.indexOf("vivienda_arriendo")]] })), "cmp small")}</div>`;
    el("rec-datos-nota").innerHTML = `<b>How to read the 0/1 columns.</b> Checking account has four categories (negative, between 0 and 200 DM, over 200 DM, no account) and three columns: if all three are 0 the customer has no account, the base category. The same goes for history (base: credits up to date), savings (base: less than 100 DM), housing (base: owned) and purpose (base: other).`;
    if (anim) stagger(el("rec-s0"));
  }
  function rLineal(anim) {
    const yl = ROWS.map(r => zde(TH_LIN, r)); const fuera = yl.filter(v => v < 0 || v > 1).length;
    const mn = Math.min(...yl), mx = Math.max(...yl);
    const hip = { x: XC.map(c => c === "duracion" ? (72 - DATA.media.duracion) / DATA.desv.duracion : c === "monto" ? (18000 - DATA.media.monto) / DATA.desv.monto : c === "edad" ? (21 - DATA.media.edad) / DATA.desv.edad : c === "cuota_pct_ingreso" ? (4 - DATA.media.cuota_pct_ingreso) / DATA.desv.cuota_pct_ingreso : (["cta_negativa", "hist_atrasos", "vivienda_arriendo"].includes(c) ? 1 : 0)) };
    const yh = zde(TH_LIN, hip);
    el("rec-lineal").innerHTML = `<div class="block stage"><div class="t">Prediction of the straight line, all 1,000 customers</div>${histo(yl, { xr: [-0.4, 1.1], k: 30, xt: [-0.4, 0, 0.5, 1], xf: fmt2, xl: "ŷ from the linear regression", extra: [{ x: 0, txt: "0", col: "var(--bad)" }, { x: 1, txt: "1", col: "var(--bad)" }] })}</div>` +
      `<div class="block stage"><div class="t">What falls outside the range</div>${kpi([{ t: "minimum ŷ", v: fmt3(mn), col: "var(--bad)" }, { t: "maximum ŷ", v: fmt3(mx) }, { t: "customers outside [0, 1]", v: fuera, s: "of 1,000" }, { t: "hypothetical customer", v: fmt3(yh), col: "var(--bad)", s: "greater than 1" }])}<p style="font-size:.88rem;color:var(--muted);max-width:44ch">The hypothetical one: 72 months, 18,000 DM, 21 years old, high installment, negative checking account, previous delays and rent. An extreme customer pushes the line outside the range.</p></div>`;
    el("rec-lineal-nota").innerHTML = `<b>Reading.</b> ${fuera} customers receive a negative "probability", and the hypothetical one gets a value greater than 1. With more aggressive weights (in the Excel they start at 0.3 across the board) the line reaches values of several units. The problem is not the weights, it is the straight line: it has no cap.`;
    if (anim) stagger(el("rec-s1"));
  }
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  const probit = z => 0.5 * (1 + erf(z / Math.SQRT2));
  function rSig(anim) {
    const pts = [], pp = []; for (let z = -6; z <= 6.001; z += 0.1) { pts.push([z, sig(z)]); pp.push([z, probit(z)]); }
    const p = sig(st.z);
    el("rec-sig").innerHTML = `<div class="block stage"><div class="t">p as a function of the score z</div>${curva([{ pts, col: "var(--q)", lab: "logistic" }, { pts: pp, col: "var(--k)", dash: true, lab: "probit" }], { xr: [-6, 6], yr: [0, 1], xt: [-6, -3, 0, 3, 6], yt: [0, 0.5, 1], xf: v => String(v), yf: fmt2, xl: "score z", extra: [{ tipo: "punto", x: st.z, y: p, txt: fmt3(p) }] })}</div>` +
      `<div class="block stage"><div class="t">With z = ${fmt2(st.z)}</div>${kpi([{ t: "p = 1 / (1 + e^−z)", v: fmt3(p) }, { t: "odds = p / (1 − p)", v: fmt3(p / (1 - p)) }, { t: "ln(odds)", v: fmt3(Math.log(p / (1 - p))), s: "= z" }, { t: "probit(z)", v: fmt3(probit(st.z)) }])}</div>`;
    if (anim) stagger(el("rec-s2"));
  }
  function rUmb(anim) {
    const c = conf(TST, P_TST, st.u); const marc = c.TP + c.FP;
    el("rec-umb").innerHTML = `<div class="block stage"><div class="t">Distribution of p in testing (trained weights)</div>${histo(P_TST, { xr: [0, 1], k: 20, xt: [0, 0.25, 0.5, 0.75, 1], xf: fmt2, xl: "p", extra: [{ x: st.u, txt: "threshold " + fmt2(st.u) }] })}</div>` +
      `<div class="block stage"><div class="t">With threshold ${fmt2(st.u)}</div>${kpi([{ t: "flagged as 'does not pay'", v: marc, s: "of 300" }, { t: "of those, truly bad payers", v: c.TP }, { t: "bad payers left unflagged", v: c.FN, col: "var(--bad)" }, { t: "accuracy", v: pct(c.acc) }])}</div>`;
    el("rec-umb-nota").innerHTML = `<b>Reading.</b> To the right of the threshold are the customers the bank would reject. With 0.5 there are ${marc}; the 90 bad payers in testing split into ${c.TP} flagged and ${c.FN} that get through. Move the threshold and watch how that count changes: that is exactly what tabs 04 and 05 measure by name.`;
    if (anim) stagger(el("rec-s3"));
  }
  el("rec-z").oninput = e => { st.z = +e.target.value / 100; el("rec-z-v").textContent = fmt2(st.z); if (st.paso === 2) rSig(false); };
  el("rec-u").oninput = e => { st.u = +e.target.value / 100; el("rec-u-v").textContent = fmt2(st.u); if (st.paso === 3) rUmb(false); };
  function render(anim) { [rDatos, rLineal, rSig, rUmb][st.paso](anim); }
  el("rec-replay").onclick = () => render(true);
  GOTO.rec = pasoGenerico("rec", 4, st, render);
  stepper("rec", ["The data", "The line runs away", "The logistic function", "The threshold"], GOTO.rec);
})();

// ===================== 02 PERDIDA =====================
(function () {
  const st = ST.per;
  function rCurva(anim) {
    const a = [], b = [], c = []; for (let p = 0.005; p < 0.9951; p += 0.005) { a.push([p, -Math.log(p)]); b.push([p, -Math.log(1 - p)]); c.push([p, (1 - p) ** 2]); }
    el("per-curva").innerHTML = `<div class="block stage"><div class="t">Loss as a function of the predicted probability</div>${curva([{ pts: a, col: "var(--bad)", lab: "if y = 1: −ln(p)" }, { pts: b, col: "var(--q)", lab: "if y = 0: −ln(1 − p)" }, { pts: c, col: "var(--muted)", dash: true, lab: "(1 − p)² if y = 1" }], { xr: [0, 1], yr: [0, 5], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 1, 2, 3, 4, 5], xf: fmt2, yf: v => String(v), xl: "predicted p", w: 520, h: 260 })}</div>` +
      `<div class="block stage"><div class="t">Reference values</div>${tabla(["situation", "loss"], [{ c: ["y = 1, p = 0.9 (right, with confidence)", fmt3(-Math.log(0.9))] }, { c: ["y = 1, p = 0.6 (barely right)", fmt3(-Math.log(0.6))] }, { c: ["y = 1, p = 0.4 (barely wrong)", fmt3(-Math.log(0.4))] }, { c: ["y = 1, p = 0.1 (wrong, with confidence)", fmt3(-Math.log(0.1))] }, { c: ["y = 1, p = 0.01 (wrong, very sure)", fmt3(-Math.log(0.01))] }], "cmp small")}</div>`;
    if (anim) stagger(el("per-s0"));
  }
  function rEj(anim) {
    const A = [[0, 0.01], [0, st.p1], [1, 0.90], [1, st.p3]], B = [[0, 0.01], [0, 0.05], [1, 0.90], [1, 0.80]];
    const fila = (m) => m.map(([y, p], i) => ({ c: ["customer " + (i + 1), y, fmt2(p), fmt3(perd(p, y)), p > 0.5 ? 1 : 0, (p > 0.5 ? 1 : 0) === y ? "yes" : "no"], cls: (p > 0.5 ? 1 : 0) !== y ? "hi" : "" }));
    const tot = m => m.reduce((s, [y, p]) => s + perd(p, y), 0);
    el("per-ej").innerHTML = `<div class="block stage"><div class="t">Model A (the sliders move customers 2 and 4)</div>${tabla(["", "actual y", "p", "loss", "prediction (0.5)", "correct"], fila(A), "cmp small")}<div class="kpi" style="max-width:none"><div><div class="t">total loss A</div><div class="v" style="color:var(--bad)">${fmt3(tot(A))}</div></div></div></div>` +
      `<div class="block stage"><div class="t">Model B, better calibrated</div>${tabla(["", "actual y", "p", "loss", "prediction (0.5)", "correct"], fila(B), "cmp small")}<div class="kpi" style="max-width:none"><div><div class="t">total loss B</div><div class="v" style="color:var(--ok)">${fmt3(tot(B))}</div></div></div></div>`;
    el("per-ej-nota").innerHTML = `<b>Reading.</b> Customer 4 (bad payer) with p = ${fmt2(st.p3)} contributes ${fmt3(perd(st.p3, 1))} and customer 2 (good payer) with p = ${fmt2(st.p1)} contributes ${fmt3(perd(st.p1, 0))}. Raise the p of customer 4 and lower it for customer 2: the total loss of A gets closer to that of B. Accuracy (how many are classified correctly with threshold 0.5) changes in jumps; the loss changes continuously, and that is why it is what gets minimized.`;
    if (anim) stagger(el("per-s1"));
  }
  el("per-p1").oninput = e => { st.p1 = +e.target.value / 100; el("per-p1-v").textContent = fmt2(st.p1); if (st.paso === 1) rEj(false); };
  el("per-p3").oninput = e => { st.p3 = +e.target.value / 100; el("per-p3-v").textContent = fmt2(st.p3); if (st.paso === 1) rEj(false); };
  function render(anim) { [rCurva, rEj][st.paso](anim); }
  el("per-replay").onclick = () => render(true);
  GOTO.per = pasoGenerico("per", 2, st, render);
  stepper("per", ["Cross-entropy", "Four customers"], GOTO.per);
})();

// ===================== 03 ENTRENAR =====================
(function () {
  const st = ST.ent; const T0 = Array(K + 1).fill(0.3);
  function resumen(t) { const pt = TRN.map(r => pde(t, r)), ps = TST.map(r => pde(t, r)); return { Jt: perdMedia(TRN, pt), Js: perdMedia(TST, ps), pm: ps.reduce((a, b) => a + b, 0) / ps.length, acc: conf(TST, ps, 0.5).acc, zmin: Math.min(...TRN.map(r => zde(t, r))), zmax: Math.max(...TRN.map(r => zde(t, r))) }; }
  function rIni(anim) {
    const a = resumen(T0), b = resumen(TH);
    el("ent-ini").innerHTML = `<div class="block stage"><div class="t">With all weights at 0.3</div>${kpi([{ t: "average training loss", v: fmt4(a.Jt), col: "var(--bad)" }, { t: "minimum and maximum z (training)", v: fmt2(a.zmin) + " to " + fmt2(a.zmax) }, { t: "average p in testing", v: fmt3(a.pm), s: "actual rate 0.300" }, { t: "testing accuracy (threshold 0.5)", v: pct(a.acc) }])}</div>` +
      `<div class="block stage"><div class="t">With the trained weights (scikit-learn)</div>${kpi([{ t: "average training loss", v: fmt4(b.Jt), col: "var(--ok)" }, { t: "minimum and maximum z (training)", v: fmt2(b.zmin) + " to " + fmt2(b.zmax) }, { t: "average p in testing", v: fmt3(b.pm), s: "actual rate 0.300" }, { t: "testing accuracy (threshold 0.5)", v: pct(b.acc) }])}</div>`;
    if (anim) stagger(el("ent-s0"));
  }
  function grad(t) { const g = Array(K + 1).fill(0); TRN.forEach(r => { const e = pde(t, r) - r.y; g[0] += e; for (let j = 0; j < K; j++) g[j + 1] += e * r.x[j]; }); return g.map(v => v / TRN.length); }
  function paso(n) { if (!st.t) { st.t = T0.slice(); st.hist = [resumen(st.t).Jt]; } for (let k = 0; k < n; k++) { const g = grad(st.t); st.t = st.t.map((v, j) => v - st.lr * g[j]); st.hist.push(perdMedia(TRN, TRN.map(r => pde(st.t, r)))); } }
  function rGD(anim) {
    if (!st.t) { st.t = T0.slice(); st.hist = [resumen(st.t).Jt]; }
    const J = st.hist[st.hist.length - 1], it = st.hist.length - 1; const pts = st.hist.map((v, i) => [i, Math.min(v, 1.2)]);
    const xr = [0, Math.max(20, it)];
    el("ent-gd").innerHTML = `<div class="block stage"><div class="t">Average training loss, step by step</div>${curva([{ pts, col: "var(--q)" }], { xr, yr: [0.4, 1.2], xt: [0, Math.round(xr[1] / 2), xr[1]], yt: [0.4, 0.6, 0.8, 1.0, 1.2], xf: v => String(Math.round(v)), yf: fmt2, xl: "steps", extra: [{ tipo: "hline", y: DATA.loss_train, col: "var(--ok)" }], w: 520, h: 240 })}<p style="font-size:.85rem;color:var(--muted)">The green line is the minimum found by scikit-learn: ${fmt4(DATA.loss_train)}.</p></div>` +
      `<div class="block stage"><div class="t">After ${it} steps with η = ${fmt2(st.lr)}</div>${kpi([{ t: "average training loss", v: fmt4(J), col: J - DATA.loss_train < 0.002 ? "var(--ok)" : "var(--cobre)" }, { t: "distance to the minimum", v: fmt4(J - DATA.loss_train) }, { t: "intercept", v: fmt3(st.t[0]), s: "sklearn " + fmt3(TH[0]) }, { t: "weight checking < 0", v: fmt3(st.t[1 + XC.indexOf("cta_negativa")]), s: "sklearn " + fmt3(TH[1 + XC.indexOf("cta_negativa")]) }])}</div>`;
    el("ent-gd-nota").innerHTML = it === 0 ? `<b>How to use it.</b> "One step" computes the gradient over the 700 customers and moves the 19 weights once. "100 steps" repeats that a hundred times. With η = 0.1 it takes several hundred steps to reach the fourth digit; raise η to 0.5 and it gets there in fewer, but with η greater than 1 it starts to oscillate.` : (J - DATA.loss_train < 0.001 ? `<b>It arrived.</b> The loss is within 0.001 of the minimum and the weights match those of scikit-learn to the second or third digit. With a single minimum, it does not matter where you start from or which method you use.` : `<b>Not yet.</b> Still ${fmt4(J - DATA.loss_train)} away from the minimum. Keep taking steps, or raise the learning rate.`);
    if (anim) stagger(el("ent-s1"));
  }
  function rPesos(anim) {
    const items = ["intercepto"].concat(XC).map((c, j) => ({ lab: nom(c), v: Math.abs(TH[j]), txt: fmt3(TH[j]), cls: TH[j] > 0 ? "pred" : "real" }));
    el("ent-pesos").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">The 19 weights (orange: raise the risk; green: lower it; bar = magnitude)</div>${barras(items, { max: 1.7 })}</div>` +
      `<div class="block stage"><div class="t">How to read them (odds ratio = e^theta)</div>${tabla(["variable", "theta", "e^theta", "reading"], [
        { c: ["checking < 0", fmt3(TH[1 + XC.indexOf("cta_negativa")]), fmt2(Math.exp(TH[1 + XC.indexOf("cta_negativa")])), "account in the red: odds of not paying × 4.7 compared with having no account"] },
        { c: ["duration", fmt3(TH[1 + XC.indexOf("duracion")]), fmt2(Math.exp(TH[1 + XC.indexOf("duracion")])), "12 more months (one standard deviation): odds × 1.4"] },
        { c: ["savings unknown", fmt3(TH[1 + XC.indexOf("ahorro_desconocido")]), fmt2(Math.exp(TH[1 + XC.indexOf("ahorro_desconocido")])), "odds × 0.34 compared with known low savings"] },
        { c: ["history critical", fmt3(TH[1 + XC.indexOf("hist_critico")]), fmt2(Math.exp(TH[1 + XC.indexOf("hist_critico")])), "other credits open and up to date: odds × 0.52"] }], "cmp small")}<p style="font-size:.85rem;color:var(--muted)">Average loss: training ${fmt4(DATA.loss_train)}, testing ${fmt4(DATA.loss_test)}.</p></div>`;
    if (anim) stagger(el("ent-s2"));
  }
  el("ent-lr").oninput = e => { st.lr = +e.target.value / 20; el("ent-lr-v").textContent = fmt2(st.lr); };
  el("ent-paso").onclick = () => { paso(1); rGD(false); };
  el("ent-100").onclick = () => { paso(100); rGD(false); };
  el("ent-reset").onclick = () => { st.t = null; rGD(true); };
  function render(anim) { [rIni, rGD, rPesos][st.paso](anim); }
  el("ent-replay").onclick = () => render(true);
  GOTO.ent = pasoGenerico("ent", 3, st, render);
  stepper("ent", ["Starting point", "Gradient descent", "The weights"], GOTO.ent);
})();

// ===================== 04 EVALUAR =====================
(function () {
  const st = ST.eva;
  const rows = () => st.conj === "s" ? TST : TRN, ps = () => st.conj === "s" ? P_TST : P_TRN;
  function rAcc(anim) {
    const cs = conf(TST, P_TST, 0.5), ct = conf(TRN, P_TRN, 0.5);
    el("eva-acc").innerHTML = `<div class="block stage"><div class="t">Accuracy with threshold 0.5</div>${barras([{ lab: "model, training", v: ct.acc, txt: pct(ct.acc) }, { lab: "model, testing", v: cs.acc, txt: pct(cs.acc), cls: "pred" }, { lab: "'everyone pays', testing", v: 0.7, txt: "70.0%" }], { max: 1 })}</div>` +
      `<div class="block stage"><div class="t">What accuracy does not say</div>${kpi([{ t: "bad payers in testing", v: 90 }, { t: "caught by the model", v: cs.TP, col: "var(--ok)" }, { t: "who pass as good payers", v: cs.FN, col: "var(--bad)" }, { t: "caught by 'everyone pays'", v: 0 }])}</div>`;
    if (anim) stagger(el("eva-s0"));
  }
  function rMat(anim) {
    const c = conf(rows(), ps(), st.u);
    el("eva-mat").innerHTML = matrizHTML(c, `Confusion matrix, ${st.conj === "s" ? "testing (300)" : "training (700)"}, threshold ${fmt2(st.u)}`) +
      `<div class="block stage"><div class="t">The four cases as bars</div>${barras([{ lab: "TP (bad payer, flagged)", v: c.TP, txt: c.TP, cls: "real" }, { lab: "FN (bad payer, not flagged)", v: c.FN, txt: c.FN, cls: "pred" }, { lab: "FP (good payer, flagged)", v: c.FP, txt: c.FP, cls: "pred" }, { lab: "TN (good payer, not flagged)", v: c.TN, txt: c.TN }], { max: rows().length * 0.75 })}</div>`;
    if (anim) stagger(el("eva-s1"));
  }
  function rRep(anim) {
    const c = conf(rows(), ps(), st.u);
    el("eva-rep").innerHTML = reporteHTML(c, `Classification report, ${st.conj === "s" ? "testing" : "training"}, threshold ${fmt2(st.u)}`) +
      `<div class="block stage"><div class="t">Class 1 (does not pay): effectiveness and efficiency</div>${barras([{ lab: "recall (effectiveness)", v: c.rec, txt: fmt3(c.rec), cls: "real" }, { lab: "precision (efficiency)", v: c.pre, txt: fmt3(c.pre), cls: "pred" }, { lab: "F1", v: c.f1, txt: fmt3(c.f1) }, { lab: "accuracy", v: c.acc, txt: fmt3(c.acc) }], { max: 1 })}<p style="font-size:.85rem;color:var(--muted);max-width:46ch">With threshold 0.5 in testing: recall 0.567 and precision 0.654. Lower the threshold and you will see recall go up and precision go down.</p></div>`;
    if (anim) stagger(el("eva-s2"));
  }
  el("eva-u").oninput = e => { st.u = +e.target.value / 100; el("eva-u-v").textContent = fmt2(st.u); if (st.paso === 1) rMat(false); if (st.paso === 2) rRep(false); };
  segmento("eva-conj", "c", c => { st.conj = c; render(true); });
  function render(anim) { [rAcc, rMat, rRep][st.paso](anim); }
  el("eva-replay").onclick = () => render(true);
  GOTO.eva = pasoGenerico("eva", 3, st, render);
  stepper("eva", ["Accuracy", "Confusion matrix", "Recall and precision"], GOTO.eva);
})();

// ===================== 05 ROC =====================
(function () {
  const st = ST.roc; const TU = tablaUmbral(TST, P_TST);
  const cerca = u => TU.reduce((b, r) => Math.abs(r.u - u) < Math.abs(b.u - u) ? r : b, TU[0]);
  function rTabla(anim) {
    const sel = cerca(st.u);
    el("roc-tabla").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">Testing, 300 customers, all metrics by threshold</div>${tabla(["threshold", "TP", "FP", "TN", "FN", "accuracy", "recall", "precision", "F1", "FP rate"], TU.map(r => ({ c: [fmt2(r.u), r.TP, r.FP, r.TN, r.FN, pct(r.acc), fmt3(r.rec), fmt3(r.pre), fmt3(r.f1), fmt3(r.fpr)], cls: r === sel ? "hi" : "" })), "cmp small")}</div>` +
      `<div class="block stage" style="flex:1 1 100%"><div class="t">Recall, precision and F1 by threshold</div>${curva([{ pts: TU.map(r => [r.u, r.rec]), col: "var(--v)", lab: "recall", marks: true, r: 3 }, { pts: TU.map(r => [r.u, r.pre]), col: "var(--cobre)", lab: "precision", marks: true, r: 3 }, { pts: TU.map(r => [r.u, r.f1]), col: "var(--muted)", dash: true, lab: "F1" }], { xr: [0, 1], yr: [0, 1], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 0.5, 1], xf: fmt2, yf: fmt2, xl: "threshold", extra: [{ tipo: "vline", x: st.u }], w: 560, h: 240 })}</div>`;
    if (anim) stagger(el("roc-s0"));
  }
  function rCurva(anim) {
    const sel = cerca(st.u); const c = conf(TST, P_TST, st.u);
    // curva exacta con todos los scores
    const us = [...new Set(P_TST)].sort((a, b) => b - a); const ex = [[0, 0]].concat(us.map(u => { const k = conf(TST, P_TST, u - 1e-12); return [k.fpr, k.rec]; }));
    el("roc-curva").innerHTML = `<div class="block stage"><div class="t">ROC curve on testing</div>${curva([{ pts: ex, col: "var(--q)", sw: 2 }, { pts: TU.map(r => [r.fpr, r.rec]), col: "var(--q)", marks: true, r: 3.5, sw: 0.01 }, { pts: [[0, 0], [1, 1]], col: "var(--muted)", dash: true, lab: "chance" }], { xr: [0, 1], yr: [0, 1], xt: [0, 0.5, 1], yt: [0, 0.5, 1], xf: fmt2, yf: fmt2, xl: "false positive rate", extra: [{ tipo: "punto", x: c.fpr, y: c.rec, txt: "threshold " + fmt2(st.u) }], w: 400, h: 400 })}</div>` +
      `<div class="block stage"><div class="t">The point for threshold ${fmt2(st.u)}</div>${kpi([{ t: "recall (vertical axis)", v: fmt3(c.rec), col: "var(--v)" }, { t: "false positive rate (horizontal axis)", v: fmt3(c.fpr), col: "var(--cobre)" }, { t: "flagged", v: c.TP + c.FP, s: "of 300" }, { t: "precision", v: fmt3(c.pre) }])}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">The blue line uses the 300 scores as thresholds; the dots are the 21 thresholds in the table. Raising the threshold moves the point toward the lower left corner.</p></div>`;
    if (anim) stagger(el("roc-s1"));
  }
  function rAuc(anim) {
    const trap = aucTrap(TU), ex = auc(TST, P_TST), tr = auc(TRN, P_TRN);
    // pares: probabilidad de ordenar bien
    el("roc-auc").innerHTML = `<div class="block stage"><div class="t">Three ways to compute the AUC on testing</div>${tabla(["method", "AUC"], [{ c: ["trapezoids over the 21 thresholds in the table", fmt4(trap)] }, { c: ["exact, with the 300 scores as thresholds (scikit-learn)", fmt4(ex)], cls: "hi" }, { c: ["fraction of (bad, good) pairs correctly ordered", fmt4(ex)] }], "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:52ch">The last two are the same number by construction: the area under the exact ROC curve is exactly the probability that a randomly chosen bad payer has a higher p than a randomly chosen good payer (90 × 210 = 18,900 pairs).</p></div>` +
      `<div class="block stage"><div class="t">Training and testing</div>${barras([{ lab: "AUC training", v: tr, txt: fmt3(tr) }, { lab: "AUC testing", v: ex, txt: fmt3(ex), cls: "pred" }, { lab: "chance", v: 0.5, txt: "0.500" }], { max: 1 })}</div>`;
    if (anim) stagger(el("roc-s2"));
  }
  el("roc-u").oninput = e => { st.u = +e.target.value / 100; el("roc-u-v").textContent = fmt2(st.u); if (st.paso === 0) rTabla(false); if (st.paso === 1) rCurva(false); };
  function render(anim) { [rTabla, rCurva, rAuc][st.paso](anim); }
  el("roc-replay").onclick = () => render(true);
  GOTO.roc = pasoGenerico("roc", 3, st, render);
  stepper("roc", ["Metrics by threshold", "The ROC curve", "The AUC"], GOTO.roc);
})();

// ===================== 06 COSTOS =====================
(function () {
  const st = ST.cos; const TU = tablaUmbral(TST, P_TST);
  const uf = () => st.fp / (st.fp + st.fn);
  function rForm(anim) {
    const u = uf(); const pts = []; for (let p = 0.005; p < 1; p += 0.005) pts.push([p, p * st.fn]); const pts2 = []; for (let p = 0.005; p < 1; p += 0.005) pts2.push([p, (1 - p) * st.fp]);
    const mx = Math.max(st.fn, st.fp);
    el("cos-form").innerHTML = `<div class="block stage"><div class="t">Expected cost of each decision, as a function of p</div>${curva([{ pts, col: "var(--bad)", lab: "do not flag: p · c_FN" }, { pts: pts2, col: "var(--q)", lab: "flag: (1 − p) · c_FP" }], { xr: [0, 1], yr: [0, mx], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, mx / 2, mx], xf: fmt2, yf: v => String(v), xl: "customer's p", extra: [{ tipo: "vline", x: u }], w: 480, h: 240 })}</div>` +
      `<div class="block stage"><div class="t">With c_FN = ${st.fn} and c_FP = ${st.fp}</div>${kpi([{ t: "optimal threshold p* = c_FP / (c_FP + c_FN)", v: fmt3(u), col: "var(--cobre)" }, { t: "reading", v: "", s: `flag anyone whose p is above ${fmt3(u)}` }])}<p style="font-size:.88rem;color:var(--muted);max-width:44ch">Where the two lines cross, flagging and not flagging cost the same. To the right, flagging is the better choice. If letting a bad payer through costs ${st.fn} times as much as rejecting a good one, you need to be ${st.fn > st.fp ? "much stricter than 50%" : st.fn === st.fp ? "exactly 50%" : "more permissive than 50%"}.</p></div>`;
    if (anim) stagger(el("cos-s0"));
  }
  function rTabla(anim) {
    const filas = TU.map(r => ({ ...r, costo: r.FP * st.fp + r.FN * st.fn })); const min = filas.reduce((b, r) => r.costo < b.costo ? r : b, filas[0]); const u = uf();
    const c50 = filas.find(r => Math.abs(r.u - 0.5) < 1e-9).costo, c1 = filas[0].costo;
    el("cos-tabla").innerHTML = `<div class="block stage"><div class="t">Total cost on testing by threshold</div>${curva([{ pts: filas.map(r => [r.u, r.costo]), col: "var(--q)", marks: true, r: 3 }], { xr: [0, 1], yr: [0, Math.max(...filas.map(r => r.costo)) * 1.05], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, Math.round(c1 / 2), c1], xf: fmt2, yf: v => String(Math.round(v)), xl: "threshold", extra: [{ tipo: "vline", x: u }, { tipo: "punto", x: min.u, y: min.costo, txt: "minimum " + fmt2(min.u) }], w: 520, h: 250 })}</div>` +
      `<div class="block stage"><div class="t">Summary</div>${kpi([{ t: "threshold from the formula", v: fmt3(u) }, { t: "lowest-cost threshold in the table", v: fmt2(min.u), col: "var(--cobre)" }, { t: "minimum cost", v: min.costo, s: "on 300 customers" }, { t: "cost with threshold 0.5", v: c50 }, { t: "cost of 'everyone pays' (threshold 1)", v: c1 }, { t: "recall and precision at the minimum", v: fmt3(min.rec), s: "and " + fmt3(min.pre) }])}</div>` +
      `<div class="block stage" style="flex:1 1 100%"><div class="t">The table (FP × c_FP + FN × c_FN)</div>${tabla(["threshold", "FP", "FN", "cost", "recall", "precision"], filas.map(r => ({ c: [fmt2(r.u), r.FP, r.FN, r.costo, fmt3(r.rec), fmt3(r.pre)], cls: r === min ? "hi" : "" })), "cmp small")}</div>`;
    el("cos-tabla-nota").innerHTML = `<b>Reading.</b> With these costs the formula says ${fmt3(u)} and the table says ${fmt2(min.u)}. ${Math.abs(u - min.u) < 0.06 ? "They agree: the model is reasonably calibrated in that region and the sample does not distort things." : "They disagree, and the next step explains why that can happen."} What does not change with the original costs (5 and 1) is the direction: threshold 0.5 is expensive (${c50} versus ${min.costo}) because it lets too many bad payers through.`;
    if (anim) stagger(el("cos-s1"));
  }
  function rCal(anim) {
    const idx = TST.map((r, i) => i).sort((a, b) => P_TST[a] - P_TST[b]); const g = 5, filas = [];
    for (let k = 0; k < g; k++) { const ids = idx.slice(Math.floor(k * idx.length / g), Math.floor((k + 1) * idx.length / g)); const pm = ids.reduce((s, i) => s + P_TST[i], 0) / ids.length, ym = ids.reduce((s, i) => s + TST[i].y, 0) / ids.length; filas.push({ k, n: ids.length, pm, ym }); }
    el("cos-cal").innerHTML = `<div class="block stage"><div class="t">Calibration by quintiles of p (testing)</div>${tabla(["group", "customers", "average p", "actual fraction of bad payers"], filas.map(f => ({ c: [f.k === 0 ? "least risky 20%" : f.k === 4 ? "most risky 20%" : String(f.k + 1), f.n, fmt3(f.pm), fmt3(f.ym)], cls: Math.abs(f.pm - f.ym) > 0.08 ? "hi" : "" })), "cmp small")}</div>` +
      `<div class="block stage"><div class="t">The same thing, drawn (diagonal = perfect calibration)</div>${curva([{ pts: [[0, 0], [1, 1]], col: "var(--muted)", dash: true }, { pts: filas.map(f => [f.pm, f.ym]), col: "var(--cobre)", marks: true, r: 5 }], { xr: [0, 1], yr: [0, 1], xt: [0, 0.5, 1], yt: [0, 0.5, 1], xf: fmt2, yf: fmt2, xl: "average p of the group", w: 320, h: 320 })}</div>`;
    if (anim) stagger(el("cos-s2"));
  }
  el("cos-fn").oninput = e => { st.fn = +e.target.value; el("cos-fn-v").textContent = st.fn; if (st.paso === 0) rForm(false); if (st.paso === 1) rTabla(false); };
  el("cos-fp").oninput = e => { st.fp = +e.target.value; el("cos-fp-v").textContent = st.fp; if (st.paso === 0) rForm(false); if (st.paso === 1) rTabla(false); };
  function render(anim) { [rForm, rTabla, rCal][st.paso](anim); }
  el("cos-replay").onclick = () => render(true);
  GOTO.cos = pasoGenerico("cos", 3, st, render);
  stepper("cos", ["The formula", "The table", "Calibration"], GOTO.cos);
})();

// ===================== 07 REGULARIZACION =====================
(function () {
  const st = ST.reg; const LAMS = DATA.reg.l2.map(r => r.lam);
  const cur = () => DATA.reg[st.tipo][st.li];
  function rPesos(anim) {
    const r = cur(); const t = thetaArr(r.theta); const t0 = TH;
    const items = XC.map((c, j) => ({ lab: nom(c), v: Math.abs(t[j + 1]), txt: fmt3(t[j + 1]) + (Math.abs(t[j + 1]) < 1e-6 ? " (zero)" : ""), cls: Math.abs(t[j + 1]) < 1e-6 ? "" : (t[j + 1] > 0 ? "pred" : "real") }));
    // trayectorias
    const cols = ["var(--q)", "var(--k)", "var(--v)", "var(--cobre)", "var(--bad)", "var(--muted)"];
    const series = XC.map((c, j) => ({ pts: LAMS.map((l, i) => [i, thetaArr(DATA.reg[st.tipo][i].theta)[j + 1]]), col: cols[j % cols.length], sw: 1.5 }));
    const ceros = t.slice(1).filter(v => Math.abs(v) < 1e-6).length, s1 = t.slice(1).reduce((s, v) => s + Math.abs(v), 0), s10 = t0.slice(1).reduce((s, v) => s + Math.abs(v), 0);
    el("reg-pesos").innerHTML = `<div class="block stage"><div class="t">${({ l2: "Ridge", l1: "Lasso", en: "Elastic net (α = 0.5)" })[st.tipo]}, λ = ${r.lam}: the 18 weights</div>${barras(items, { max: 1.7 })}</div>` +
      `<div class="block stage"><div class="t">Summary</div>${kpi([{ t: "weights exactly at zero", v: ceros, s: "of 18" }, { t: "sum of |theta|", v: fmt2(s1), s: "unregularized " + fmt2(s10) }, { t: "intercept (not penalized)", v: fmt3(t[0]) }])}<div class="t" style="margin-top:10px">Path of each weight as a function of λ</div>${curva(series, { xr: [0, LAMS.length - 1], yr: [-1.3, 1.7], xt: LAMS.map((l, i) => i), yt: [-1, 0, 1], xf: i => String(LAMS[i]), yf: v => String(v), xl: "λ", extra: [{ tipo: "vline", x: st.li }], w: 420, h: 220 })}</div>`;
    if (anim) stagger(el("reg-s1"));
  }
  function rEval(anim) {
    const filas = DATA.reg[st.tipo].map((r, i) => ({ c: [r.lam, fmt4(r.loss_train), fmt4(r.loss_test), fmt3(r.auc_train), fmt3(r.auc_test), r.ceros], cls: i === st.li ? "hi" : "" }));
    const r = cur(); const ps = TST.map(x => pde(thetaArr(r.theta), x)); const c = conf(TST, ps, 0.5);
    el("reg-eval").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">${({ l2: "Ridge", l1: "Lasso", en: "Elastic net" })[st.tipo]} for each λ (scikit-learn weights; C = 1/λ)</div>${tabla(["λ", "training loss", "testing loss", "AUC training", "AUC testing", "weights at zero"], filas, "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Testing loss as a function of λ</div>${curva([{ pts: DATA.reg[st.tipo].map((x, i) => [i, x.loss_test]), col: "var(--cobre)", marks: true, r: 3, lab: "testing" }, { pts: DATA.reg[st.tipo].map((x, i) => [i, x.loss_train]), col: "var(--q)", marks: true, r: 3, lab: "training" }], { xr: [0, LAMS.length - 1], yr: [0.45, 0.62], xt: LAMS.map((l, i) => i), yt: [0.45, 0.5, 0.55, 0.6], xf: i => String(LAMS[i]), yf: fmt2, xl: "λ", w: 420, h: 220 })}</div>` +
      reporteHTML(c, `Testing with λ = ${r.lam}, threshold 0.5 (computed here)`);
    if (anim) stagger(el("reg-s2"));
  }
  segmento("reg-tipo", "t", t => { st.tipo = t; render(true); });
  el("reg-lam").oninput = e => { st.li = +e.target.value; el("reg-lam-v").textContent = LAMS[st.li]; if (st.paso === 1) rPesos(false); if (st.paso === 2) rEval(false); };
  function render(anim) { [() => { if (anim) stagger(el("reg-s0")); }, rPesos, rEval][st.paso](anim); }
  el("reg-replay").onclick = () => render(true);
  GOTO.reg = pasoGenerico("reg", 3, st, render);
  stepper("reg", ["The idea", "The weights as a function of λ", "What it really does"], GOTO.reg);
})();

// ===================== 08 DESBALANCEO =====================
(function () {
  const st = ST.bal; const NM = { base: "unbalanced", cw: "class weights (1.667 / 0.714)", sub: "undersampling 210 + 210", over: "oversampling, bad payers ×2", smote: "SMOTE, 490 + 490" };
  const pst = met => TST.map(r => pde(thetaArr(DATA.bal[met].theta), r));
  function rProb(anim) {
    const c = conf(TST, P_TST, 0.5); const pm = P_TST.reduce((a, b) => a + b, 0) / 300;
    el("bal-prob").innerHTML = `<div class="block stage"><div class="t">Training: 490 good, 210 bad</div>${barras([{ lab: "good payers (y = 0)", v: 490, txt: "490 (70%)" }, { lab: "bad payers (y = 1)", v: 210, txt: "210 (30%)", cls: "pred" }], { max: 500 })}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Every row weighs the same in the loss, so the majority class rules.</p></div>` +
      reporteHTML(c, "Report on testing, threshold 0.5 (model from tab 03)") +
      `<div class="block stage"><div class="t">Calibrated probabilities</div>${kpi([{ t: "average p in testing", v: fmt3(pm) }, { t: "actual rate of bad payers", v: "0.300" }, { t: "recall class 1", v: fmt3(c.rec), col: "var(--bad)" }, { t: "recall class 0", v: fmt3(c.rec0), col: "var(--ok)" }])}</div>`;
    if (anim) stagger(el("bal-s0"));
  }
  function rMet(anim) {
    const ps = pst(st.met); const c = conf(TST, ps, 0.5); const pm = ps.reduce((a, b) => a + b, 0) / 300;
    let extra = "";
    if (st.met === "cw") extra = `<div class="block stage"><div class="t">Row weight</div>${tabla(["class", "rows in training", "weight", "sum of weights"], [{ c: ["bad (y = 1)", 210, fmt3(DATA.bal_extra.w1), "350"] }, { c: ["good (y = 0)", 490, fmt3(DATA.bal_extra.w0), "350"] }], "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:40ch">n / (2 · n_class): both classes contribute the same to the loss. In scikit-learn, class_weight='balanced'.</p></div>`;
    if (st.met === "sub") extra = `<div class="block stage"><div class="t">Rows used</div>${barras([{ lab: "bad, all of them", v: 210, txt: "210", cls: "pred" }, { lab: "good, drawn", v: 210, txt: "210 of 490" }, { lab: "good, discarded", v: 280, txt: "280" }], { max: 500 })}<p style="font-size:.85rem;color:var(--muted);max-width:40ch">280 real customers with information are thrown away. With fewer rows, the result depends more on the draw.</p></div>`;
    if (st.met === "over") extra = `<div class="block stage"><div class="t">Repetitions</div>${barras([{ lab: "bad, each one 2 times", v: 420, txt: "420", cls: "pred" }, { lab: "good, 1 time", v: 490, txt: "490" }], { max: 500 })}<p style="font-size:.85rem;color:var(--muted);max-width:40ch">Repeating a row k times is the same as giving it weight k. To balance exactly you would repeat 490/210 = 2.33 times (or sample 490 bad payers with replacement); with 1.667 and 0.714 it would be identical to class weights.</p></div>`;
    if (st.met === "smote") { const e = DATA.bal_extra.smote_ejemplos[0]; const j = [XC.indexOf("duracion"), XC.indexOf("monto"), XC.indexOf("edad"), XC.indexOf("cta_negativa"), XC.indexOf("vivienda_arriendo")]; extra = `<div class="block stage"><div class="t">One synthetic customer and its two parents (u = ${fmt2(e.u)})</div>${tabla(["", "duration", "amount", "age", "checking < 0", "rent"], [{ c: ["parent a (id " + e.id_a + ")"].concat(j.map(k => fmt2(e.xa[k]))) }, { c: ["parent b (id " + e.id_b + ")"].concat(j.map(k => fmt2(e.xb[k]))) }, { c: ["child = a + u (b − a)"].concat(j.map(k => fmt2(e.xn[k]))), cls: "hi" }], "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Scaled values. The 0/1 columns end up fractional (a customer with 0.37 of "rent"), which means nothing; there are variants (SMOTE-NC) for categoricals. 280 synthetic rows are created until reaching 490 and 490.</p></div>`; }
    el("bal-met-out").innerHTML = extra + matrizHTML(c, `Testing, ${NM[st.met]}, threshold 0.5`) + reporteHTML(c, "Report on testing") +
      `<div class="block stage"><div class="t">What changes and what does not</div>${kpi([{ t: "recall class 1", v: fmt3(c.rec), col: "var(--ok)" }, { t: "precision class 1", v: fmt3(c.pre), col: "var(--cobre)" }, { t: "AUC testing", v: fmt3(auc(TST, ps)) }, { t: "average p (actual rate 0.300)", v: fmt3(pm), col: Math.abs(pm - 0.3) > 0.08 ? "var(--bad)" : "" }])}</div>`;
    if (anim) stagger(el("bal-s1"));
  }
  function rCmp(anim) {
    const filas = ["base", "cw", "sub", "over", "smote"].map(m => { const ps = pst(m); const c = conf(TST, ps, 0.5); return { c: [NM[m], "0.50", pct(c.acc), fmt3(c.rec), fmt3(c.pre), fmt3(c.f1), fmt3(c.rec0), fmt3(auc(TST, ps)), fmt3(ps.reduce((a, b) => a + b, 0) / 300)], cls: m === "cw" ? "hi" : "" }; });
    const cu = conf(TST, P_TST, st.u); filas.push({ c: ["<b>unbalanced, threshold moved</b>", fmt2(st.u), pct(cu.acc), fmt3(cu.rec), fmt3(cu.pre), fmt3(cu.f1), fmt3(cu.rec0), fmt3(auc(TST, P_TST)), fmt3(P_TST.reduce((a, b) => a + b, 0) / 300)], cls: "hi" });
    el("bal-cmp").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">The four methods on testing, and the unbalanced model with the slider threshold</div>${tabla(["model", "threshold", "accuracy", "recall 1", "precision 1", "F1", "recall 0", "AUC", "average p"], filas, "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Class weights versus threshold ${fmt2(st.u)}</div>${barras([{ lab: "recall, class weights", v: conf(TST, pst("cw"), 0.5).rec, txt: fmt3(conf(TST, pst("cw"), 0.5).rec), cls: "real" }, { lab: "recall, threshold " + fmt2(st.u), v: cu.rec, txt: fmt3(cu.rec), cls: "real" }, { lab: "precision, class weights", v: conf(TST, pst("cw"), 0.5).pre, txt: fmt3(conf(TST, pst("cw"), 0.5).pre), cls: "pred" }, { lab: "precision, threshold " + fmt2(st.u), v: cu.pre, txt: fmt3(cu.pre), cls: "pred" }], { max: 1 })}</div>`;
    if (anim) stagger(el("bal-s2"));
  }
  segmento("bal-met", "b", b => { st.met = b; if (st.paso === 1) rMet(true); });
  el("bal-u").oninput = e => { st.u = +e.target.value / 100; el("bal-u-v").textContent = fmt2(st.u); if (st.paso === 2) rCmp(false); };
  function render(anim) { [rProb, rMet, rCmp][st.paso](anim); }
  el("bal-replay").onclick = () => render(true);
  GOTO.bal = pasoGenerico("bal", 3, st, render);
  stepper("bal", ["The problem", "The corrections", "Balance or move the threshold"], GOTO.bal);
})();

// ===================== 09 VARIACION MUESTRAL =====================
(function () {
  const st = ST.mue;
  function particion(sem) { // estratificada 70/30 con semilla
    const r = rng32(7000 + sem); const tr = [], te = [];
    [0, 1].forEach(cl => { const idx = ROWS.map((x, i) => i).filter(i => ROWS[i].y === cl); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } const k = Math.round(0.3 * idx.length); idx.slice(0, k).forEach(i => te.push(ROWS[i])); idx.slice(k).forEach(i => tr.push(ROWS[i])); });
    return { tr, te };
  }
  function medir(sem) { const { tr, te } = particion(sem); const t = entrenar(tr); const ps = te.map(x => pde(t, x)); const c = conf(te, ps, 0.5); return { sem, auc: auc(te, ps), rec: c.rec, pre: c.pre }; }
  function rPart(anim) {
    if (!st.res.length) st.res = [medir(1)];
    const ult = st.res[st.res.length - 1]; const aucs = st.res.map(x => x.auc), recs = st.res.map(x => x.rec);
    const mean = a => a.reduce((s, v) => s + v, 0) / a.length, sd = a => Math.sqrt(mean(a.map(v => (v - mean(a)) ** 2)));
    el("mue-part").innerHTML = `<div class="block stage"><div class="t">Split ${ult.sem}: retrained on its 700 and measured on its 300</div>${kpi([{ t: "AUC testing", v: fmt3(ult.auc), col: "var(--cobre)" }, { t: "recall (threshold 0.5)", v: fmt3(ult.rec) }, { t: "precision", v: fmt3(ult.pre) }, { t: "the course split", v: fmt3(DATA.auc_test), s: "AUC" }])}</div>` +
      `<div class="block stage"><div class="t">${st.res.length} splits so far: AUC</div>${histo(aucs, { xr: [0.65, 0.9], k: 25, xt: [0.65, 0.7, 0.75, 0.8, 0.85, 0.9], xf: fmt2, xl: "AUC on testing", extra: [{ x: DATA.auc_test, txt: "the course split" }] })}${kpi([{ t: "average", v: fmt3(mean(aucs)) }, { t: "standard deviation", v: fmt3(sd(aucs)) }, { t: "minimum and maximum", v: fmt3(Math.min(...aucs)) + " to " + fmt3(Math.max(...aucs)) }, { t: "recall: minimum and maximum", v: fmt2(Math.min(...recs)) + " to " + fmt2(Math.max(...recs)) }])}</div>`;
    el("mue-part-nota").innerHTML = st.res.length < 5 ? `<b>Keep going.</b> Press "Ten more splits" a couple of times and look at where the course split falls within the distribution.` : `<b>Reading.</b> With ${st.res.length} splits the AUC goes from ${fmt3(Math.min(...aucs))} to ${fmt3(Math.max(...aucs))}, with average ${fmt3(mean(aucs))}. The 0.822 of the course split ${DATA.auc_test > mean(aucs) + sd(aucs) ? "landed in the upper part: the testing sample we got was a kind one" : "is within the normal range"}. A metric on a single split is a noisy estimate, and comparing two models by one AUC point on a single split says nothing.`;
    if (anim) stagger(el("mue-s0"));
  }
  function rCV(anim) {
    // 5 pliegues estratificados sobre training, 3 repeticiones
    const res = []; const costoU = UMB.map(() => 0); let nfold = 0;
    for (let rep = 0; rep < 3; rep++) {
      const r = rng32(900 + rep); const folds = Array.from({ length: 5 }, () => []);
      [0, 1].forEach(cl => { const idx = TRN.map((x, i) => i).filter(i => TRN[i].y === cl); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } idx.forEach((i, k) => folds[k % 5].push(i)); });
      folds.forEach(f => { const S = new Set(f); const tr = TRN.filter((x, i) => !S.has(i)), va = f.map(i => TRN[i]); const t = entrenar(tr); const ps = va.map(x => pde(t, x)); res.push(auc(va, ps)); tablaUmbral(va, ps).forEach((row, k) => costoU[k] += row.FP * 1 + row.FN * 5); nfold++; });
    }
    const mean = res.reduce((s, v) => s + v, 0) / res.length, sd = Math.sqrt(res.reduce((s, v) => s + (v - mean) ** 2, 0) / res.length);
    const cm = costoU.map(v => v / nfold); let bi = 0; cm.forEach((v, i) => { if (v < cm[bi]) bi = i; });
    el("mue-cv").innerHTML = `<div class="block stage"><div class="t">5 folds × 3 repetitions, training only (computed here)</div>${kpi([{ t: "AUC by cross-validation", v: fmt3(mean), s: "± " + fmt3(sd), col: "var(--cobre)" }, { t: "AUC on the course testing set", v: fmt3(DATA.auc_test) }, { t: "threshold with lowest mean cost (5 and 1)", v: fmt2(UMB[bi]) }, { t: "formula", v: "0.167", s: "table on testing: 0.25" }])}${barras(res.map((v, i) => ({ lab: "fold " + (i + 1), v, txt: fmt3(v) })), { max: 1 })}</div>` +
      `<div class="block stage"><div class="t">Mean cost per threshold on the validation folds</div>${curva([{ pts: cm.map((v, i) => [UMB[i], v]), col: "var(--q)", marks: true, r: 3 }], { xr: [0, 1], yr: [0, Math.max(...cm) * 1.05], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, Math.round(Math.max(...cm) / 2), Math.round(Math.max(...cm))], xf: fmt2, yf: v => String(Math.round(v)), xl: "threshold", extra: [{ tipo: "vline", x: UMB[bi] }], w: 420, h: 220 })}</div>`;
    el("mue-cv-nota").innerHTML = `<b>Reading.</b> Cross-validation estimates an AUC of ${fmt3(mean)}, below the ${fmt3(DATA.auc_test)} on testing: that is the honest expectation for a new customer. And the lowest-cost threshold chosen by cross-validation lands at ${fmt2(UMB[bi])}, close to the formula (0.167) and far from the 0.25 of the table on testing. Choosing with validation and measuring on testing is the right sequence.`;
    if (anim) stagger(el("mue-s1"));
  }
  function rBS(anim) {
    const r = rng32(300 + st.bsSem); const B = 500; const A = [], Rc = [], U = [];
    for (let b = 0; b < B; b++) { const idx = Array.from({ length: 300 }, () => Math.floor(r() * 300)); const rows = idx.map(i => TST[i]), ps = idx.map(i => P_TST[i]); if (!rows.some(x => x.y) || rows.every(x => x.y)) continue; A.push(auc(rows, ps)); const c = conf(rows, ps, 0.5); Rc.push(c.rec); const t = tablaUmbral(rows, ps); let bi = 0; t.forEach((row, k) => { if (row.FP + 5 * row.FN < t[bi].FP + 5 * t[bi].FN) bi = k; }); U.push(t[bi].u); }
    const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
    el("mue-bs").innerHTML = `<div class="block stage"><div class="t">${A.length} resamples of the 300 testing customers (draw ${st.bsSem})</div>${tabla(["metric", "original estimate", "95% CI: 2.5%", "97.5%"], [{ c: ["AUC", fmt3(DATA.auc_test), fmt3(q(A, 0.025)), fmt3(q(A, 0.975))] }, { c: ["recall (threshold 0.5)", fmt3(conf(TST, P_TST, 0.5).rec), fmt3(q(Rc, 0.025)), fmt3(q(Rc, 0.975))] }, { c: ["optimal threshold from the table (5 and 1)", "0.25", fmt2(q(U, 0.025)), fmt2(q(U, 0.975))] }], "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Where the optimal threshold from the table falls if I change the sample</div>${histo(U, { xr: [0, 0.6], k: 12, xt: [0, 0.2, 0.4, 0.6], xf: fmt2, xl: "optimal threshold", extra: [{ x: 0.167, txt: "formula", col: "var(--v)" }] })}</div>` +
      `<div class="block stage"><div class="t">AUC across the resamples</div>${histo(A, { xr: [0.7, 0.95], k: 25, xt: [0.7, 0.75, 0.8, 0.85, 0.9, 0.95], xf: fmt2, xl: "AUC", extra: [{ x: DATA.auc_test, txt: "original" }] })}</div>`;
    el("mue-bs-nota").innerHTML = `<b>Reading.</b> The testing AUC is not ${fmt3(DATA.auc_test)}: it is "between ${fmt3(q(A, 0.025))} and ${fmt3(q(A, 0.975))} with 95% confidence". The recall is not 0.567: it is "between ${fmt2(q(Rc, 0.025))} and ${fmt2(q(Rc, 0.975))}". And the optimal threshold from the table spreads between ${fmt2(q(U, 0.025))} and ${fmt2(q(U, 0.975))}: the formula and the cross-validation threshold fall inside, and the difference from 0.25 is not evidence of anything.`;
    if (anim) stagger(el("mue-s2"));
  }
  el("mue-otra").onclick = () => { st.sem++; st.res.push(medir(st.sem)); rPart(false); };
  el("mue-diez").onclick = () => { for (let k = 0; k < 10; k++) { st.sem++; st.res.push(medir(st.sem)); } rPart(false); };
  el("mue-boot").onclick = () => { st.bsSem++; rBS(false); };
  function render(anim) { [rPart, rCV, rBS][st.paso](anim); }
  el("mue-replay").onclick = () => render(true);
  GOTO.mue = pasoGenerico("mue", 3, st, render);
  stepper("mue", ["Another split", "Cross-validation", "Bootstrap"], GOTO.mue);
})();

// ===================== 10 TAIWAN =====================
(function () {
  const st = ST.tw; const T = DATA.tw; const NM = { "logistica lineal": "linear logistic", "logistica grado 2 sin regularizar": "degree-2 logistic, unregularized", "logistica grado 2 regularizada": "degree-2 logistic, L2 by cross-validation", "arbol profundidad 4": "decision tree, depth 4", "arbol sin limite": "decision tree, no limit", "random forest 300": "random forest, 300 trees", "gradient boosting 300": "gradient boosting, 300 trees" };
  const m = n => T.modelos.find(x => x.nombre === n);
  function rDatos(anim) {
    el("tw-datos").innerHTML = kpi([{ t: "customers", v: mil(T.n) }, { t: "did not pay the following month", v: pct(T.tasa) }, { t: "training", v: mil(T.ntr) }, { t: "testing", v: mil(T.nte) }, { t: "columns", v: 23, s: "limit, demographics, 6 months of delays, bills and payments" }]) +
      `<div class="block stage"><div class="t">The starting point: the linear logistic, unregularized</div>${kpi([{ t: "AUC training", v: fmt3(m("logistica lineal").auc_train) }, { t: "AUC testing", v: fmt3(m("logistica lineal").auc_test), col: "var(--cobre)" }, { t: "95% bootstrap interval", v: fmt3(m("logistica lineal").lo) + " to " + fmt3(m("logistica lineal").hi) }])}<p style="font-size:.85rem;color:var(--muted);max-width:46ch">It is the model everything else is measured against. In German Credit the AUC was 0.82 with an interval from 0.76 to 0.87; here the interval is four times narrower because testing has 30 times more customers.</p></div>`;
    if (anim) stagger(el("tw-s0"));
  }
  function rPoly(anim) {
    const filas = ["logistica lineal", "logistica grado 2 sin regularizar", "logistica grado 2 regularizada"].map(n => { const x = m(n); return { c: [NM[n], fmt3(x.auc_train), fmt3(x.auc_test), fmt3(x.lo) + " to " + fmt3(x.hi), fmt3(x.auc_train - x.auc_test)] }; });
    el("tw-poly").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">With 21,000 training customers (${T.ncols2} degree-2 columns; λ chosen by cross-validation: ${fmt2(T.lam_cv)})</div>${tabla(["model", "AUC training", "AUC testing", "95% CI", "gap"], filas, "cmp small")}</div>` +
      `<div class="block stage"><div class="t">The same degree 2 with only 1,000 training customers</div>${tabla(["model", "AUC training", "AUC testing"], [{ c: ["unregularized", fmt3(T.chico.libre[0]), fmt3(T.chico.libre[1])], cls: "hi" }, { c: ["L2 by cross-validation", fmt3(T.chico.reg[0]), fmt3(T.chico.reg[1])] }], "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">With 1,000 rows and 299 weights, the model with no brake memorizes training and collapses on testing; the regularized one sacrifices training and generalizes. It is the difference that did not show up in German Credit.</p></div>`;
    if (anim) stagger(el("tw-s1"));
  }
  function svgArbol2(t) {
    // arbol de profundidad 2: dibujo simple
    const W = 520, H = 230; const nodes = [];
    function rec(n, x, y, dx, d) { nodes.push({ n, x, y }); if (!n.hoja) { rec(n.izq, x - dx, y + 70, dx / 2, d + 1); rec(n.der, x + dx, y + 70, dx / 2, d + 1); } }
    rec(t, W / 2, 30, 130, 0);
    let s = `<svg class="arbol" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    nodes.forEach(nd => { if (!nd.n.hoja) { const l = nodes.find(q => q.n === nd.n.izq), r = nodes.find(q => q.n === nd.n.der); s += `<line x1="${nd.x}" y1="${nd.y}" x2="${l.x}" y2="${l.y}"/><line x1="${nd.x}" y1="${nd.y}" x2="${r.x}" y2="${r.y}"/><text x="${(nd.x + l.x) / 2 - 6}" y="${(nd.y + l.y) / 2}" text-anchor="end" class="lab">≤</text><text x="${(nd.x + r.x) / 2 + 6}" y="${(nd.y + r.y) / 2}" class="lab">></text>`; } });
    nodes.forEach(nd => { const hoja = !!nd.n.hoja; const txt = hoja ? `do not pay ${pct0(nd.n.p1)}` : `${nd.n.var} ≤ ${nd.n.umbral.toFixed(1).replace(".", ".")}`; const sub = hoja ? `${mil(nd.n.n[0] + nd.n.n[1])} customers` : `do not pay ${pct0(nd.n.p1)}`; const w = Math.max(90, txt.length * 7 + 16); s += `<g class="nd ${hoja ? "hoja " + (nd.n.p1 > 0.5 ? "c1" : "c0") : ""}"><rect x="${nd.x - w / 2}" y="${nd.y - 15}" width="${w}" height="40" rx="6"/><text x="${nd.x}" y="${nd.y + 4}" text-anchor="middle">${txt}</text><text x="${nd.x}" y="${nd.y + 19}" text-anchor="middle" class="sub">${sub}</text></g>`; });
    return s + "</svg>";
  }
  function rArbol(anim) {
    el("tw-arbol").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">Depth-2 tree on training (cuts in original units)</div>${svgArbol2(T.arbol2)}</div>` +
      `<div class="block stage"><div class="t">A single tree, on testing</div>${tabla(["model", "AUC training", "AUC testing", "95% CI"], ["arbol profundidad 4", "arbol sin limite"].map(n => { const x = m(n); return { c: [NM[n], fmt3(x.auc_train), fmt3(x.auc_test), fmt3(x.lo) + " to " + fmt3(x.hi)], cls: n === "arbol sin limite" ? "hi" : "" }; }), "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Pruned to depth 4 it does not beat the degree-2 logistic (0.737 versus 0.750); with no limit it memorizes (1.000 on training, 0.607 on testing).</p></div>`;
    if (anim) stagger(el("tw-s2"));
  }
  function rEns(anim) {
    const orden = ["logistica lineal", "logistica grado 2 regularizada", "arbol profundidad 4", "random forest 300", "gradient boosting 300"];
    el("tw-ens").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">The models on testing (9,000 customers)</div>${tabla(["model", "AUC training", "AUC testing", "95% bootstrap CI", "gap"], orden.map(n => { const x = m(n); return { c: [NM[n], fmt3(x.auc_train), fmt3(x.auc_test), fmt3(x.lo) + " to " + fmt3(x.hi), fmt3(x.auc_train - x.auc_test)], cls: n === "gradient boosting 300" ? "hi" : "" }; }), "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Paired AUC differences (same resample for both models)</div>${tabla(["comparison", "difference", "95% CI", "does it contain zero?"], T.pares.map(p => ({ c: [NM[p.a] + " − " + NM[p.b], (p.d > 0 ? "+" : "") + fmt4(p.d), (p.lo > 0 ? "+" : "") + fmt4(p.lo) + " to +" + fmt4(p.hi), p.lo > 0 ? "no: the difference is real" : "yes"] })), "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Cross-validation, 5 folds on training</div>${tabla(["model", "average", "minimum", "maximum"], Object.entries(T.cv).map(([n, v]) => ({ c: [({ "logistica lineal": "linear logistic", "random forest": "random forest", "gradient boosting": "gradient boosting" })[n] || n, fmt3(v.reduce((a, b) => a + b, 0) / v.length), fmt3(Math.min(...v)), fmt3(Math.max(...v))] })), "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">The ranges of the logistic and of the boosting do not even come close: the difference holds up on other samples.</p></div>`;
    if (anim) stagger(el("tw-s3"));
  }
  function rEsc(anim) {
    const E = T.escalera; const C = T.curva;
    el("tw-esc").innerHTML = `<div class="block stage"><div class="t">By months of delay in September (testing, values with at least 20 customers)</div>${tabla(["delay", "customers", "actually did not pay", "logistic", "degree 2", "boosting"], E.map(r => ({ c: [r.a, mil(r.n), fmt3(r.real), fmt3(r.lg), fmt3(r.g2), fmt3(r.gb)], cls: r.a === 2 ? "hi" : "" })), "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Estimated risk by delay, for a typical customer</div>${curva([{ pts: C.atraso.map((a, i) => [a, C.lg[i]]), col: "var(--q)", marks: true, r: 3, lab: "logistic" }, { pts: C.atraso.map((a, i) => [a, C.g2[i]]), col: "var(--k)", marks: true, r: 3, lab: "degree 2" }, { pts: C.atraso.map((a, i) => [a, C.gb[i]]), col: "var(--cobre)", marks: true, r: 3, lab: "boosting" }], { xr: [-2, 8], yr: [0, 1], xt: [-2, 0, 2, 4, 6, 8], yt: [0, 0.5, 1], xf: v => String(v), yf: fmt2, xl: "months of delay in September", w: 460, h: 260 })}</div>` +
      `<div class="block stage"><div class="t">Which variables each one uses (top 8 of the boosting)</div>${tabla(["variable", "|coef.| logistic", "boosting importance", "random forest importance"], T.imp.cols.map((c, i) => ({ c, l: T.imp.logit_abs[i], g: T.imp.gb[i], r: T.imp.rf[i] })).sort((a, b) => b.g - a.g).slice(0, 8).map(x => ({ c: [x.c, fmt3(x.l), fmt3(x.g), fmt3(x.r)] })), "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">All three agree on the first variable. They are not the same magnitude (importance is how much each variable reduced impurity, a fraction that sums to 1) but they do compare in order.</p></div>`;
    if (anim) stagger(el("tw-s4"));
  }
  function render(anim) { [rDatos, rPoly, rArbol, rEns, rEsc][st.paso](anim); }
  el("tw-replay").onclick = () => render(true);
  GOTO.tw = pasoGenerico("tw", 5, st, render);
  stepper("tw", ["The data", "Polynomials and regularization", "Trees", "Ensembles", "What it found"], GOTO.tw);
})();

let modeloInicial = (init && init.m && GOTO[init.m]) ? init.m : "rec";
if (init && typeof init.paso === "number" && ST[modeloInicial]) ST[modeloInicial].paso = init.paso;
quieto = true; irModelo(modeloInicial); quieto = false;
return { getState: () => ({ m: modeloActual, paso: ST[modeloActual].paso }) };
}
