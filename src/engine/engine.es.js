// SPDX-License-Identifier: Apache-2.0
// Motor de las pestañas (vanilla JS). Se monta desde Playground.tsx. Todo lo de German Credit se calcula en vivo.
export function initEngine(DATA, init) {
let quieto = false;
// ===================== utilidades compartidas =====================
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt2 = x => x.toFixed(2).replace("-", "−").replace(".", ",");
const fmt3 = x => x.toFixed(3).replace("-", "−").replace(".", ",");
const fmt4 = x => x.toFixed(4).replace("-", "−").replace(".", ",");
const pct = x => (100 * x).toFixed(1).replace(".", ",") + "%";
const pct0 = x => Math.round(100 * x) + "%";
const mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
const NOMBRE = { duracion: "duración", monto: "monto", edad: "edad", cuota_pct_ingreso: "cuota % ingreso", cta_negativa: "cta. negativa", cta_0_200: "cta. 0 a 200", cta_sobre_200: "cta. sobre 200", hist_critico: "hist. crítico", hist_atrasos: "hist. atrasos", hist_sin_creditos: "hist. sin créditos", ahorro_100_1000: "ahorro 100 a 1.000", ahorro_sobre_1000: "ahorro sobre 1.000", ahorro_desconocido: "ahorro desconocido", vivienda_arriendo: "arriendo", vivienda_gratis: "vivienda gratis", proposito_auto: "propósito auto", proposito_radio_tv: "propósito radio/tv", proposito_muebles: "propósito muebles", intercepto: "intercepto" };
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
  return `<div class="block stage"><div class="t">${tit}</div><table class="cmp small"><tr><th></th><th>predicho 0 (paga)</th><th>predicho 1 (no paga)</th><th>total</th></tr>
  <tr><td><b>real 0 (buen pagador)</b></td><td class="mono">TN ${c.TN}</td><td class="mono" style="color:var(--bad)">FP ${c.FP}</td><td class="mono">${c.TN + c.FP}</td></tr>
  <tr><td><b>real 1 (mal pagador)</b></td><td class="mono" style="color:var(--bad)">FN ${c.FN}</td><td class="mono" style="color:var(--ok)">TP ${c.TP}</td><td class="mono">${c.TP + c.FN}</td></tr>
  <tr><td><b>total</b></td><td class="mono">${c.TN + c.FN}</td><td class="mono">${c.FP + c.TP}</td><td class="mono">${c.TP + c.FP + c.TN + c.FN}</td></tr></table></div>`;
}
function reporteHTML(c, tit) {
  const n0 = c.TN + c.FP, n1 = c.TP + c.FN, f10 = c.rec0 + c.pre0 ? 2 * c.rec0 * c.pre0 / (c.rec0 + c.pre0) : 0;
  return `<div class="block stage"><div class="t">${tit}</div>${tabla(["", "precision", "recall", "f1-score", "support"], [
    { c: ["clase 0 (paga)", fmt3(c.pre0), fmt3(c.rec0), fmt3(f10), n0] },
    { c: ["<b>clase 1 (no paga)</b>", "<b>" + fmt3(c.pre) + "</b>", "<b>" + fmt3(c.rec) + "</b>", fmt3(c.f1), n1], cls: "hi" },
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
    el("rec-datos").innerHTML = kpi([{ t: "clientes", v: mil(ROWS.length) }, { t: "malos pagadores", v: "300", s: "30%" }, { t: "training", v: "700", s: n1t + " malos" }, { t: "testing", v: "300", s: n1s + " malos" }, { t: "columnas preparadas", v: "18", s: "4 numéricas, 14 de 0/1" }]) +
      `<div class="block stage" style="flex:1 1 100%"><div class="t">Los primeros 8 clientes (numéricas en unidades originales; escaladas en la tabla del modelo)</div>${tabla(["id", "y", "conjunto", "duración (meses)", "monto (DM)", "edad", "cuota % ingreso", "cta. negativa", "hist. crítico", "ahorro desconocido", "arriendo"],
        ROWS.slice(0, 8).map(r => ({ c: [r.id, r.y, r.c === "t" ? "training" : "testing", r.raw[0], mil(r.raw[1]), r.raw[2], r.raw[3], r.x[XC.indexOf("cta_negativa")], r.x[XC.indexOf("hist_critico")], r.x[XC.indexOf("ahorro_desconocido")], r.x[XC.indexOf("vivienda_arriendo")]] })), "cmp small")}</div>`;
    el("rec-datos-nota").innerHTML = `<b>Cómo leer las columnas 0/1.</b> Cuenta corriente tiene cuatro categorías (negativa, entre 0 y 200 DM, sobre 200 DM, sin cuenta) y tres columnas: si las tres valen 0 el cliente no tiene cuenta, la categoría base. Lo mismo con historial (base: créditos al día), ahorro (base: menos de 100 DM), vivienda (base: propia) y propósito (base: otros).`;
    if (anim) stagger(el("rec-s0"));
  }
  function rLineal(anim) {
    const yl = ROWS.map(r => zde(TH_LIN, r)); const fuera = yl.filter(v => v < 0 || v > 1).length;
    const mn = Math.min(...yl), mx = Math.max(...yl);
    const hip = { x: XC.map(c => c === "duracion" ? (72 - DATA.media.duracion) / DATA.desv.duracion : c === "monto" ? (18000 - DATA.media.monto) / DATA.desv.monto : c === "edad" ? (21 - DATA.media.edad) / DATA.desv.edad : c === "cuota_pct_ingreso" ? (4 - DATA.media.cuota_pct_ingreso) / DATA.desv.cuota_pct_ingreso : (["cta_negativa", "hist_atrasos", "vivienda_arriendo"].includes(c) ? 1 : 0)) };
    const yh = zde(TH_LIN, hip);
    el("rec-lineal").innerHTML = `<div class="block stage"><div class="t">Predicción de la recta, los 1.000 clientes</div>${histo(yl, { xr: [-0.4, 1.1], k: 30, xt: [-0.4, 0, 0.5, 1], xf: fmt2, xl: "ŷ de la regresión lineal", extra: [{ x: 0, txt: "0", col: "var(--bad)" }, { x: 1, txt: "1", col: "var(--bad)" }] })}</div>` +
      `<div class="block stage"><div class="t">Lo que sale del rango</div>${kpi([{ t: "ŷ mínimo", v: fmt3(mn), col: "var(--bad)" }, { t: "ŷ máximo", v: fmt3(mx) }, { t: "clientes fuera de [0, 1]", v: fuera, s: "de 1.000" }, { t: "cliente hipotético", v: fmt3(yh), col: "var(--bad)", s: "mayor que 1" }])}<p style="font-size:.88rem;color:var(--muted);max-width:44ch">El hipotético: 72 meses, 18.000 DM, 21 años, cuota alta, cuenta negativa, atrasos previos y arriendo. Un cliente extremo empuja la recta fuera del rango.</p></div>`;
    el("rec-lineal-nota").innerHTML = `<b>Lectura.</b> ${fuera} clientes reciben una "probabilidad" negativa, y el hipotético una mayor que 1. Con pesos más agresivos (en el Excel parten en 0,3 parejo) la recta llega a valores de varias unidades. El problema no es de los pesos, es de la recta: no tiene tope.`;
    if (anim) stagger(el("rec-s1"));
  }
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  const probit = z => 0.5 * (1 + erf(z / Math.SQRT2));
  function rSig(anim) {
    const pts = [], pp = []; for (let z = -6; z <= 6.001; z += 0.1) { pts.push([z, sig(z)]); pp.push([z, probit(z)]); }
    const p = sig(st.z);
    el("rec-sig").innerHTML = `<div class="block stage"><div class="t">p según el puntaje z</div>${curva([{ pts, col: "var(--q)", lab: "logística" }, { pts: pp, col: "var(--k)", dash: true, lab: "probit" }], { xr: [-6, 6], yr: [0, 1], xt: [-6, -3, 0, 3, 6], yt: [0, 0.5, 1], xf: v => String(v), yf: fmt2, xl: "puntaje z", extra: [{ tipo: "punto", x: st.z, y: p, txt: fmt3(p) }] })}</div>` +
      `<div class="block stage"><div class="t">Con z = ${fmt2(st.z)}</div>${kpi([{ t: "p = 1 / (1 + e^−z)", v: fmt3(p) }, { t: "odds = p / (1 − p)", v: fmt3(p / (1 - p)) }, { t: "ln(odds)", v: fmt3(Math.log(p / (1 - p))), s: "= z" }, { t: "probit(z)", v: fmt3(probit(st.z)) }])}</div>`;
    if (anim) stagger(el("rec-s2"));
  }
  function rUmb(anim) {
    const c = conf(TST, P_TST, st.u); const marc = c.TP + c.FP;
    el("rec-umb").innerHTML = `<div class="block stage"><div class="t">Distribución de p en testing (pesos entrenados)</div>${histo(P_TST, { xr: [0, 1], k: 20, xt: [0, 0.25, 0.5, 0.75, 1], xf: fmt2, xl: "p", extra: [{ x: st.u, txt: "umbral " + fmt2(st.u) }] })}</div>` +
      `<div class="block stage"><div class="t">Con umbral ${fmt2(st.u)}</div>${kpi([{ t: "marcados como 'no paga'", v: marc, s: "de 300" }, { t: "de ellos, malos de verdad", v: c.TP }, { t: "malos que quedaron sin marcar", v: c.FN, col: "var(--bad)" }, { t: "acierto", v: pct(c.acc) }])}</div>`;
    el("rec-umb-nota").innerHTML = `<b>Lectura.</b> A la derecha del umbral quedan los clientes que el banco rechazaría. Con 0,5 son ${marc}; los 90 malos pagadores de testing se reparten en ${c.TP} marcados y ${c.FN} que pasan. Mueve el umbral y mira cómo esa cuenta cambia: eso es exactamente lo que las pestañas 04 y 05 miden con nombre y apellido.`;
    if (anim) stagger(el("rec-s3"));
  }
  el("rec-z").oninput = e => { st.z = +e.target.value / 100; el("rec-z-v").textContent = fmt2(st.z); if (st.paso === 2) rSig(false); };
  el("rec-u").oninput = e => { st.u = +e.target.value / 100; el("rec-u-v").textContent = fmt2(st.u); if (st.paso === 3) rUmb(false); };
  function render(anim) { [rDatos, rLineal, rSig, rUmb][st.paso](anim); }
  el("rec-replay").onclick = () => render(true);
  GOTO.rec = pasoGenerico("rec", 4, st, render);
  stepper("rec", ["Los datos", "La recta se escapa", "La función logística", "El umbral"], GOTO.rec);
})();

// ===================== 02 PERDIDA =====================
(function () {
  const st = ST.per;
  function rCurva(anim) {
    const a = [], b = [], c = []; for (let p = 0.005; p < 0.9951; p += 0.005) { a.push([p, -Math.log(p)]); b.push([p, -Math.log(1 - p)]); c.push([p, (1 - p) ** 2]); }
    el("per-curva").innerHTML = `<div class="block stage"><div class="t">Pérdida según la probabilidad predicha</div>${curva([{ pts: a, col: "var(--bad)", lab: "si y = 1: −ln(p)" }, { pts: b, col: "var(--q)", lab: "si y = 0: −ln(1 − p)" }, { pts: c, col: "var(--muted)", dash: true, lab: "(1 − p)² si y = 1" }], { xr: [0, 1], yr: [0, 5], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 1, 2, 3, 4, 5], xf: fmt2, yf: v => String(v), xl: "p predicha", w: 520, h: 260 })}</div>` +
      `<div class="block stage"><div class="t">Referencias</div>${tabla(["situación", "pérdida"], [{ c: ["y = 1, p = 0,9 (acertó con confianza)", fmt3(-Math.log(0.9))] }, { c: ["y = 1, p = 0,6 (acertó apenas)", fmt3(-Math.log(0.6))] }, { c: ["y = 1, p = 0,4 (falló apenas)", fmt3(-Math.log(0.4))] }, { c: ["y = 1, p = 0,1 (falló con confianza)", fmt3(-Math.log(0.1))] }, { c: ["y = 1, p = 0,01 (falló muy seguro)", fmt3(-Math.log(0.01))] }], "cmp small")}</div>`;
    if (anim) stagger(el("per-s0"));
  }
  function rEj(anim) {
    const A = [[0, 0.01], [0, st.p1], [1, 0.90], [1, st.p3]], B = [[0, 0.01], [0, 0.05], [1, 0.90], [1, 0.80]];
    const fila = (m) => m.map(([y, p], i) => ({ c: ["cliente " + (i + 1), y, fmt2(p), fmt3(perd(p, y)), p > 0.5 ? 1 : 0, (p > 0.5 ? 1 : 0) === y ? "sí" : "no"], cls: (p > 0.5 ? 1 : 0) !== y ? "hi" : "" }));
    const tot = m => m.reduce((s, [y, p]) => s + perd(p, y), 0);
    el("per-ej").innerHTML = `<div class="block stage"><div class="t">Modelo A (los deslizadores mueven los clientes 2 y 4)</div>${tabla(["", "y real", "p", "pérdida", "predicción (0,5)", "acierto"], fila(A), "cmp small")}<div class="kpi" style="max-width:none"><div><div class="t">pérdida total A</div><div class="v" style="color:var(--bad)">${fmt3(tot(A))}</div></div></div></div>` +
      `<div class="block stage"><div class="t">Modelo B, mejor calibrado</div>${tabla(["", "y real", "p", "pérdida", "predicción (0,5)", "acierto"], fila(B), "cmp small")}<div class="kpi" style="max-width:none"><div><div class="t">pérdida total B</div><div class="v" style="color:var(--ok)">${fmt3(tot(B))}</div></div></div></div>`;
    el("per-ej-nota").innerHTML = `<b>Lectura.</b> El cliente 4 (malo) con p = ${fmt2(st.p3)} aporta ${fmt3(perd(st.p3, 1))} y el cliente 2 (bueno) con p = ${fmt2(st.p1)} aporta ${fmt3(perd(st.p1, 0))}. Súbele la p al cliente 4 y bájasela al 2: la pérdida total de A se acerca a la de B. El acierto (cuántos quedan bien con umbral 0,5) cambia a saltos; la pérdida cambia de forma continua, y por eso es lo que se minimiza.`;
    if (anim) stagger(el("per-s1"));
  }
  el("per-p1").oninput = e => { st.p1 = +e.target.value / 100; el("per-p1-v").textContent = fmt2(st.p1); if (st.paso === 1) rEj(false); };
  el("per-p3").oninput = e => { st.p3 = +e.target.value / 100; el("per-p3-v").textContent = fmt2(st.p3); if (st.paso === 1) rEj(false); };
  function render(anim) { [rCurva, rEj][st.paso](anim); }
  el("per-replay").onclick = () => render(true);
  GOTO.per = pasoGenerico("per", 2, st, render);
  stepper("per", ["La entropía cruzada", "Cuatro clientes"], GOTO.per);
})();

// ===================== 03 ENTRENAR =====================
(function () {
  const st = ST.ent; const T0 = Array(K + 1).fill(0.3);
  function resumen(t) { const pt = TRN.map(r => pde(t, r)), ps = TST.map(r => pde(t, r)); return { Jt: perdMedia(TRN, pt), Js: perdMedia(TST, ps), pm: ps.reduce((a, b) => a + b, 0) / ps.length, acc: conf(TST, ps, 0.5).acc, zmin: Math.min(...TRN.map(r => zde(t, r))), zmax: Math.max(...TRN.map(r => zde(t, r))) }; }
  function rIni(anim) {
    const a = resumen(T0), b = resumen(TH);
    el("ent-ini").innerHTML = `<div class="block stage"><div class="t">Con todos los pesos en 0,3</div>${kpi([{ t: "pérdida promedio training", v: fmt4(a.Jt), col: "var(--bad)" }, { t: "z mínimo y máximo (training)", v: fmt2(a.zmin) + " a " + fmt2(a.zmax) }, { t: "p promedio en testing", v: fmt3(a.pm), s: "tasa real 0,300" }, { t: "acierto testing (umbral 0,5)", v: pct(a.acc) }])}</div>` +
      `<div class="block stage"><div class="t">Con los pesos entrenados (scikit-learn)</div>${kpi([{ t: "pérdida promedio training", v: fmt4(b.Jt), col: "var(--ok)" }, { t: "z mínimo y máximo (training)", v: fmt2(b.zmin) + " a " + fmt2(b.zmax) }, { t: "p promedio en testing", v: fmt3(b.pm), s: "tasa real 0,300" }, { t: "acierto testing (umbral 0,5)", v: pct(b.acc) }])}</div>`;
    if (anim) stagger(el("ent-s0"));
  }
  function grad(t) { const g = Array(K + 1).fill(0); TRN.forEach(r => { const e = pde(t, r) - r.y; g[0] += e; for (let j = 0; j < K; j++) g[j + 1] += e * r.x[j]; }); return g.map(v => v / TRN.length); }
  function paso(n) { if (!st.t) { st.t = T0.slice(); st.hist = [resumen(st.t).Jt]; } for (let k = 0; k < n; k++) { const g = grad(st.t); st.t = st.t.map((v, j) => v - st.lr * g[j]); st.hist.push(perdMedia(TRN, TRN.map(r => pde(st.t, r)))); } }
  function rGD(anim) {
    if (!st.t) { st.t = T0.slice(); st.hist = [resumen(st.t).Jt]; }
    const J = st.hist[st.hist.length - 1], it = st.hist.length - 1; const pts = st.hist.map((v, i) => [i, Math.min(v, 1.2)]);
    const xr = [0, Math.max(20, it)];
    el("ent-gd").innerHTML = `<div class="block stage"><div class="t">Pérdida promedio en training, paso a paso</div>${curva([{ pts, col: "var(--q)" }], { xr, yr: [0.4, 1.2], xt: [0, Math.round(xr[1] / 2), xr[1]], yt: [0.4, 0.6, 0.8, 1.0, 1.2], xf: v => String(Math.round(v)), yf: fmt2, xl: "pasos", extra: [{ tipo: "hline", y: DATA.loss_train, col: "var(--ok)" }], w: 520, h: 240 })}<p style="font-size:.85rem;color:var(--muted)">La línea verde es el mínimo que encuentra scikit-learn: ${fmt4(DATA.loss_train)}.</p></div>` +
      `<div class="block stage"><div class="t">Después de ${it} pasos con η = ${fmt2(st.lr)}</div>${kpi([{ t: "pérdida promedio training", v: fmt4(J), col: J - DATA.loss_train < 0.002 ? "var(--ok)" : "var(--cobre)" }, { t: "distancia al mínimo", v: fmt4(J - DATA.loss_train) }, { t: "intercepto", v: fmt3(st.t[0]), s: "sklearn " + fmt3(TH[0]) }, { t: "peso cta. negativa", v: fmt3(st.t[1 + XC.indexOf("cta_negativa")]), s: "sklearn " + fmt3(TH[1 + XC.indexOf("cta_negativa")]) }])}</div>`;
    el("ent-gd-nota").innerHTML = it === 0 ? `<b>Cómo usarlo.</b> "Un paso" calcula el gradiente sobre los 700 clientes y mueve los 19 pesos una vez. "100 pasos" lo repite cien veces. Con η = 0,1 se necesitan varios cientos de pasos para llegar a la cuarta cifra; sube η a 0,5 y llega en menos, pero con η mayor que 1 empieza a oscilar.` : (J - DATA.loss_train < 0.001 ? `<b>Llegó.</b> La pérdida está a menos de 0,001 del mínimo y los pesos coinciden con los de scikit-learn en la segunda o tercera cifra. Con un solo mínimo, no importa desde dónde se parta ni qué método se use.` : `<b>Todavía no.</b> Faltan ${fmt4(J - DATA.loss_train)} para el mínimo. Sigue dando pasos, o sube la tasa de aprendizaje.`);
    if (anim) stagger(el("ent-s1"));
  }
  function rPesos(anim) {
    const items = ["intercepto"].concat(XC).map((c, j) => ({ lab: nom(c), v: Math.abs(TH[j]), txt: fmt3(TH[j]), cls: TH[j] > 0 ? "pred" : "real" }));
    el("ent-pesos").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">Los 19 pesos (naranjo: suben el riesgo; verde: lo bajan; barra = magnitud)</div>${barras(items, { max: 1.7 })}</div>` +
      `<div class="block stage"><div class="t">Cómo se leen (razón de chances = e^theta)</div>${tabla(["variable", "theta", "e^theta", "lectura"], [
        { c: ["cta. negativa", fmt3(TH[1 + XC.indexOf("cta_negativa")]), fmt2(Math.exp(TH[1 + XC.indexOf("cta_negativa")])), "cuenta en rojo: chances de no pagar × 4,7 frente a no tener cuenta"] },
        { c: ["duración", fmt3(TH[1 + XC.indexOf("duracion")]), fmt2(Math.exp(TH[1 + XC.indexOf("duracion")])), "12 meses más (una desviación): chances × 1,4"] },
        { c: ["ahorro desconocido", fmt3(TH[1 + XC.indexOf("ahorro_desconocido")]), fmt2(Math.exp(TH[1 + XC.indexOf("ahorro_desconocido")])), "chances × 0,34 frente a ahorro bajo conocido"] },
        { c: ["hist. crítico", fmt3(TH[1 + XC.indexOf("hist_critico")]), fmt2(Math.exp(TH[1 + XC.indexOf("hist_critico")])), "otros créditos vigentes y al día: chances × 0,52"] }], "cmp small")}<p style="font-size:.85rem;color:var(--muted)">Pérdida promedio: training ${fmt4(DATA.loss_train)}, testing ${fmt4(DATA.loss_test)}.</p></div>`;
    if (anim) stagger(el("ent-s2"));
  }
  el("ent-lr").oninput = e => { st.lr = +e.target.value / 20; el("ent-lr-v").textContent = fmt2(st.lr); };
  el("ent-paso").onclick = () => { paso(1); rGD(false); };
  el("ent-100").onclick = () => { paso(100); rGD(false); };
  el("ent-reset").onclick = () => { st.t = null; rGD(true); };
  function render(anim) { [rIni, rGD, rPesos][st.paso](anim); }
  el("ent-replay").onclick = () => render(true);
  GOTO.ent = pasoGenerico("ent", 3, st, render);
  stepper("ent", ["Punto de partida", "Descenso de gradiente", "Los pesos"], GOTO.ent);
})();

// ===================== 04 EVALUAR =====================
(function () {
  const st = ST.eva;
  const rows = () => st.conj === "s" ? TST : TRN, ps = () => st.conj === "s" ? P_TST : P_TRN;
  function rAcc(anim) {
    const cs = conf(TST, P_TST, 0.5), ct = conf(TRN, P_TRN, 0.5);
    el("eva-acc").innerHTML = `<div class="block stage"><div class="t">Acierto con umbral 0,5</div>${barras([{ lab: "modelo, training", v: ct.acc, txt: pct(ct.acc) }, { lab: "modelo, testing", v: cs.acc, txt: pct(cs.acc), cls: "pred" }, { lab: "'todos pagan', testing", v: 0.7, txt: "70,0%" }], { max: 1 })}</div>` +
      `<div class="block stage"><div class="t">Lo que el acierto no dice</div>${kpi([{ t: "malos pagadores en testing", v: 90 }, { t: "atrapados por el modelo", v: cs.TP, col: "var(--ok)" }, { t: "que pasan como buenos", v: cs.FN, col: "var(--bad)" }, { t: "atrapados por 'todos pagan'", v: 0 }])}</div>`;
    if (anim) stagger(el("eva-s0"));
  }
  function rMat(anim) {
    const c = conf(rows(), ps(), st.u);
    el("eva-mat").innerHTML = matrizHTML(c, `Matriz de confusión, ${st.conj === "s" ? "testing (300)" : "training (700)"}, umbral ${fmt2(st.u)}`) +
      `<div class="block stage"><div class="t">Los cuatro casos como barras</div>${barras([{ lab: "TP (malo, marcado)", v: c.TP, txt: c.TP, cls: "real" }, { lab: "FN (malo, no marcado)", v: c.FN, txt: c.FN, cls: "pred" }, { lab: "FP (bueno, marcado)", v: c.FP, txt: c.FP, cls: "pred" }, { lab: "TN (bueno, no marcado)", v: c.TN, txt: c.TN }], { max: rows().length * 0.75 })}</div>`;
    if (anim) stagger(el("eva-s1"));
  }
  function rRep(anim) {
    const c = conf(rows(), ps(), st.u);
    el("eva-rep").innerHTML = reporteHTML(c, `Reporte de clasificación, ${st.conj === "s" ? "testing" : "training"}, umbral ${fmt2(st.u)}`) +
      `<div class="block stage"><div class="t">Clase 1 (no paga): eficacia y eficiencia</div>${barras([{ lab: "recall (eficacia)", v: c.rec, txt: fmt3(c.rec), cls: "real" }, { lab: "precision (eficiencia)", v: c.pre, txt: fmt3(c.pre), cls: "pred" }, { lab: "F1", v: c.f1, txt: fmt3(c.f1) }, { lab: "acierto", v: c.acc, txt: fmt3(c.acc) }], { max: 1 })}<p style="font-size:.85rem;color:var(--muted);max-width:46ch">Con umbral 0,5 en testing: recall 0,567 y precision 0,654. Baja el umbral y verás subir el recall y bajar la precision.</p></div>`;
    if (anim) stagger(el("eva-s2"));
  }
  el("eva-u").oninput = e => { st.u = +e.target.value / 100; el("eva-u-v").textContent = fmt2(st.u); if (st.paso === 1) rMat(false); if (st.paso === 2) rRep(false); };
  segmento("eva-conj", "c", c => { st.conj = c; render(true); });
  function render(anim) { [rAcc, rMat, rRep][st.paso](anim); }
  el("eva-replay").onclick = () => render(true);
  GOTO.eva = pasoGenerico("eva", 3, st, render);
  stepper("eva", ["El acierto", "Matriz de confusión", "Recall y precision"], GOTO.eva);
})();

// ===================== 05 ROC =====================
(function () {
  const st = ST.roc; const TU = tablaUmbral(TST, P_TST);
  const cerca = u => TU.reduce((b, r) => Math.abs(r.u - u) < Math.abs(b.u - u) ? r : b, TU[0]);
  function rTabla(anim) {
    const sel = cerca(st.u);
    el("roc-tabla").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">Testing, 300 clientes, todas las métricas según el umbral</div>${tabla(["umbral", "TP", "FP", "TN", "FN", "acierto", "recall", "precision", "F1", "tasa FP"], TU.map(r => ({ c: [fmt2(r.u), r.TP, r.FP, r.TN, r.FN, pct(r.acc), fmt3(r.rec), fmt3(r.pre), fmt3(r.f1), fmt3(r.fpr)], cls: r === sel ? "hi" : "" })), "cmp small")}</div>` +
      `<div class="block stage" style="flex:1 1 100%"><div class="t">Recall, precision y F1 según el umbral</div>${curva([{ pts: TU.map(r => [r.u, r.rec]), col: "var(--v)", lab: "recall", marks: true, r: 3 }, { pts: TU.map(r => [r.u, r.pre]), col: "var(--cobre)", lab: "precision", marks: true, r: 3 }, { pts: TU.map(r => [r.u, r.f1]), col: "var(--muted)", dash: true, lab: "F1" }], { xr: [0, 1], yr: [0, 1], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 0.5, 1], xf: fmt2, yf: fmt2, xl: "umbral", extra: [{ tipo: "vline", x: st.u }], w: 560, h: 240 })}</div>`;
    if (anim) stagger(el("roc-s0"));
  }
  function rCurva(anim) {
    const sel = cerca(st.u); const c = conf(TST, P_TST, st.u);
    // curva exacta con todos los scores
    const us = [...new Set(P_TST)].sort((a, b) => b - a); const ex = [[0, 0]].concat(us.map(u => { const k = conf(TST, P_TST, u - 1e-12); return [k.fpr, k.rec]; }));
    el("roc-curva").innerHTML = `<div class="block stage"><div class="t">Curva ROC en testing</div>${curva([{ pts: ex, col: "var(--q)", sw: 2 }, { pts: TU.map(r => [r.fpr, r.rec]), col: "var(--q)", marks: true, r: 3.5, sw: 0.01 }, { pts: [[0, 0], [1, 1]], col: "var(--muted)", dash: true, lab: "azar" }], { xr: [0, 1], yr: [0, 1], xt: [0, 0.5, 1], yt: [0, 0.5, 1], xf: fmt2, yf: fmt2, xl: "tasa de falsos positivos", extra: [{ tipo: "punto", x: c.fpr, y: c.rec, txt: "umbral " + fmt2(st.u) }], w: 400, h: 400 })}</div>` +
      `<div class="block stage"><div class="t">El punto del umbral ${fmt2(st.u)}</div>${kpi([{ t: "recall (eje vertical)", v: fmt3(c.rec), col: "var(--v)" }, { t: "tasa de falsos positivos (eje horizontal)", v: fmt3(c.fpr), col: "var(--cobre)" }, { t: "marcados", v: c.TP + c.FP, s: "de 300" }, { t: "precision", v: fmt3(c.pre) }])}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">La línea azul usa los 300 scores como umbrales; los puntos son los 21 umbrales de la tabla. Subir el umbral mueve el punto hacia la esquina inferior izquierda.</p></div>`;
    if (anim) stagger(el("roc-s1"));
  }
  function rAuc(anim) {
    const trap = aucTrap(TU), ex = auc(TST, P_TST), tr = auc(TRN, P_TRN);
    // pares: probabilidad de ordenar bien
    el("roc-auc").innerHTML = `<div class="block stage"><div class="t">Tres formas de calcular el AUC en testing</div>${tabla(["método", "AUC"], [{ c: ["trapecios sobre los 21 umbrales de la tabla", fmt4(trap)] }, { c: ["exacto, con los 300 scores como umbrales (scikit-learn)", fmt4(ex)], cls: "hi" }, { c: ["fracción de pares (malo, bueno) bien ordenados", fmt4(ex)] }], "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:52ch">Las dos últimas son el mismo número por construcción: el área bajo la curva ROC exacta es exactamente la probabilidad de que un mal pagador tomado al azar tenga más p que un buen pagador tomado al azar (90 × 210 = 18.900 pares).</p></div>` +
      `<div class="block stage"><div class="t">Training y testing</div>${barras([{ lab: "AUC training", v: tr, txt: fmt3(tr) }, { lab: "AUC testing", v: ex, txt: fmt3(ex), cls: "pred" }, { lab: "azar", v: 0.5, txt: "0,500" }], { max: 1 })}</div>`;
    if (anim) stagger(el("roc-s2"));
  }
  el("roc-u").oninput = e => { st.u = +e.target.value / 100; el("roc-u-v").textContent = fmt2(st.u); if (st.paso === 0) rTabla(false); if (st.paso === 1) rCurva(false); };
  function render(anim) { [rTabla, rCurva, rAuc][st.paso](anim); }
  el("roc-replay").onclick = () => render(true);
  GOTO.roc = pasoGenerico("roc", 3, st, render);
  stepper("roc", ["Métricas según umbral", "La curva ROC", "El AUC"], GOTO.roc);
})();

// ===================== 06 COSTOS =====================
(function () {
  const st = ST.cos; const TU = tablaUmbral(TST, P_TST);
  const uf = () => st.fp / (st.fp + st.fn);
  function rForm(anim) {
    const u = uf(); const pts = []; for (let p = 0.005; p < 1; p += 0.005) pts.push([p, p * st.fn]); const pts2 = []; for (let p = 0.005; p < 1; p += 0.005) pts2.push([p, (1 - p) * st.fp]);
    const mx = Math.max(st.fn, st.fp);
    el("cos-form").innerHTML = `<div class="block stage"><div class="t">Costo esperado de cada decisión, según p</div>${curva([{ pts, col: "var(--bad)", lab: "no marcar: p · c_FN" }, { pts: pts2, col: "var(--q)", lab: "marcar: (1 − p) · c_FP" }], { xr: [0, 1], yr: [0, mx], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, mx / 2, mx], xf: fmt2, yf: v => String(v), xl: "p del cliente", extra: [{ tipo: "vline", x: u }], w: 480, h: 240 })}</div>` +
      `<div class="block stage"><div class="t">Con c_FN = ${st.fn} y c_FP = ${st.fp}</div>${kpi([{ t: "umbral óptimo p* = c_FP / (c_FP + c_FN)", v: fmt3(u), col: "var(--cobre)" }, { t: "lectura", v: "", s: `marcar a quien tenga p mayor que ${fmt3(u)}` }])}<p style="font-size:.88rem;color:var(--muted);max-width:44ch">Donde las dos rectas se cruzan, marcar y no marcar cuestan lo mismo. A la derecha conviene marcar. Si dejar pasar a un malo cuesta ${st.fn} veces lo que rechazar a un bueno, hay que ser ${st.fn > st.fp ? "mucho más estricto que 50%" : st.fn === st.fp ? "exactamente 50%" : "más permisivo que 50%"}.</p></div>`;
    if (anim) stagger(el("cos-s0"));
  }
  function rTabla(anim) {
    const filas = TU.map(r => ({ ...r, costo: r.FP * st.fp + r.FN * st.fn })); const min = filas.reduce((b, r) => r.costo < b.costo ? r : b, filas[0]); const u = uf();
    const c50 = filas.find(r => Math.abs(r.u - 0.5) < 1e-9).costo, c1 = filas[0].costo;
    el("cos-tabla").innerHTML = `<div class="block stage"><div class="t">Costo total en testing según el umbral</div>${curva([{ pts: filas.map(r => [r.u, r.costo]), col: "var(--q)", marks: true, r: 3 }], { xr: [0, 1], yr: [0, Math.max(...filas.map(r => r.costo)) * 1.05], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, Math.round(c1 / 2), c1], xf: fmt2, yf: v => String(Math.round(v)), xl: "umbral", extra: [{ tipo: "vline", x: u }, { tipo: "punto", x: min.u, y: min.costo, txt: "mínimo " + fmt2(min.u) }], w: 520, h: 250 })}</div>` +
      `<div class="block stage"><div class="t">Resumen</div>${kpi([{ t: "umbral por fórmula", v: fmt3(u) }, { t: "umbral con menor costo en la tabla", v: fmt2(min.u), col: "var(--cobre)" }, { t: "costo mínimo", v: min.costo, s: "en 300 clientes" }, { t: "costo con umbral 0,5", v: c50 }, { t: "costo de 'todos pagan' (umbral 1)", v: c1 }, { t: "recall y precision en el mínimo", v: fmt3(min.rec), s: "y " + fmt3(min.pre) }])}</div>` +
      `<div class="block stage" style="flex:1 1 100%"><div class="t">La tabla (FP × c_FP + FN × c_FN)</div>${tabla(["umbral", "FP", "FN", "costo", "recall", "precision"], filas.map(r => ({ c: [fmt2(r.u), r.FP, r.FN, r.costo, fmt3(r.rec), fmt3(r.pre)], cls: r === min ? "hi" : "" })), "cmp small")}</div>`;
    el("cos-tabla-nota").innerHTML = `<b>Lectura.</b> Con estos costos la fórmula dice ${fmt3(u)} y la tabla ${fmt2(min.u)}. ${Math.abs(u - min.u) < 0.06 ? "Coinciden: el modelo está razonablemente calibrado en esa zona y la muestra no distorsiona." : "No coinciden, y el paso siguiente dice por qué puede pasar."} Lo que no cambia con los costos originales (5 y 1) es la dirección: el umbral 0,5 es caro (${c50} contra ${min.costo}) porque deja pasar a demasiados malos pagadores.`;
    if (anim) stagger(el("cos-s1"));
  }
  function rCal(anim) {
    const idx = TST.map((r, i) => i).sort((a, b) => P_TST[a] - P_TST[b]); const g = 5, filas = [];
    for (let k = 0; k < g; k++) { const ids = idx.slice(Math.floor(k * idx.length / g), Math.floor((k + 1) * idx.length / g)); const pm = ids.reduce((s, i) => s + P_TST[i], 0) / ids.length, ym = ids.reduce((s, i) => s + TST[i].y, 0) / ids.length; filas.push({ k, n: ids.length, pm, ym }); }
    el("cos-cal").innerHTML = `<div class="block stage"><div class="t">Calibración por quintiles de p (testing)</div>${tabla(["grupo", "clientes", "p promedio", "fracción real de malos"], filas.map(f => ({ c: [f.k === 0 ? "20% menos riesgoso" : f.k === 4 ? "20% más riesgoso" : String(f.k + 1), f.n, fmt3(f.pm), fmt3(f.ym)], cls: Math.abs(f.pm - f.ym) > 0.08 ? "hi" : "" })), "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Lo mismo, dibujado (diagonal = calibración perfecta)</div>${curva([{ pts: [[0, 0], [1, 1]], col: "var(--muted)", dash: true }, { pts: filas.map(f => [f.pm, f.ym]), col: "var(--cobre)", marks: true, r: 5 }], { xr: [0, 1], yr: [0, 1], xt: [0, 0.5, 1], yt: [0, 0.5, 1], xf: fmt2, yf: fmt2, xl: "p promedio del grupo", w: 320, h: 320 })}</div>`;
    if (anim) stagger(el("cos-s2"));
  }
  el("cos-fn").oninput = e => { st.fn = +e.target.value; el("cos-fn-v").textContent = st.fn; if (st.paso === 0) rForm(false); if (st.paso === 1) rTabla(false); };
  el("cos-fp").oninput = e => { st.fp = +e.target.value; el("cos-fp-v").textContent = st.fp; if (st.paso === 0) rForm(false); if (st.paso === 1) rTabla(false); };
  function render(anim) { [rForm, rTabla, rCal][st.paso](anim); }
  el("cos-replay").onclick = () => render(true);
  GOTO.cos = pasoGenerico("cos", 3, st, render);
  stepper("cos", ["La fórmula", "La tabla", "Calibración"], GOTO.cos);
})();

// ===================== 07 REGULARIZACION =====================
(function () {
  const st = ST.reg; const LAMS = DATA.reg.l2.map(r => r.lam);
  const cur = () => DATA.reg[st.tipo][st.li];
  function rPesos(anim) {
    const r = cur(); const t = thetaArr(r.theta); const t0 = TH;
    const items = XC.map((c, j) => ({ lab: nom(c), v: Math.abs(t[j + 1]), txt: fmt3(t[j + 1]) + (Math.abs(t[j + 1]) < 1e-6 ? " (cero)" : ""), cls: Math.abs(t[j + 1]) < 1e-6 ? "" : (t[j + 1] > 0 ? "pred" : "real") }));
    // trayectorias
    const cols = ["var(--q)", "var(--k)", "var(--v)", "var(--cobre)", "var(--bad)", "var(--muted)"];
    const series = XC.map((c, j) => ({ pts: LAMS.map((l, i) => [i, thetaArr(DATA.reg[st.tipo][i].theta)[j + 1]]), col: cols[j % cols.length], sw: 1.5 }));
    const ceros = t.slice(1).filter(v => Math.abs(v) < 1e-6).length, s1 = t.slice(1).reduce((s, v) => s + Math.abs(v), 0), s10 = t0.slice(1).reduce((s, v) => s + Math.abs(v), 0);
    el("reg-pesos").innerHTML = `<div class="block stage"><div class="t">${({ l2: "Ridge", l1: "Lasso", en: "Elastic net (α = 0,5)" })[st.tipo]}, λ = ${r.lam}: los 18 pesos</div>${barras(items, { max: 1.7 })}</div>` +
      `<div class="block stage"><div class="t">Resumen</div>${kpi([{ t: "pesos exactamente en cero", v: ceros, s: "de 18" }, { t: "suma de |theta|", v: fmt2(s1), s: "sin regularizar " + fmt2(s10) }, { t: "intercepto (no se penaliza)", v: fmt3(t[0]) }])}<div class="t" style="margin-top:10px">Trayectoria de cada peso según λ</div>${curva(series, { xr: [0, LAMS.length - 1], yr: [-1.3, 1.7], xt: LAMS.map((l, i) => i), yt: [-1, 0, 1], xf: i => String(LAMS[i]), yf: v => String(v), xl: "λ", extra: [{ tipo: "vline", x: st.li }], w: 420, h: 220 })}</div>`;
    if (anim) stagger(el("reg-s1"));
  }
  function rEval(anim) {
    const filas = DATA.reg[st.tipo].map((r, i) => ({ c: [r.lam, fmt4(r.loss_train), fmt4(r.loss_test), fmt3(r.auc_train), fmt3(r.auc_test), r.ceros], cls: i === st.li ? "hi" : "" }));
    const r = cur(); const ps = TST.map(x => pde(thetaArr(r.theta), x)); const c = conf(TST, ps, 0.5);
    el("reg-eval").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">${({ l2: "Ridge", l1: "Lasso", en: "Elastic net" })[st.tipo]} para cada λ (pesos de scikit-learn; C = 1/λ)</div>${tabla(["λ", "pérdida training", "pérdida testing", "AUC training", "AUC testing", "pesos en cero"], filas, "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Pérdida en testing según λ</div>${curva([{ pts: DATA.reg[st.tipo].map((x, i) => [i, x.loss_test]), col: "var(--cobre)", marks: true, r: 3, lab: "testing" }, { pts: DATA.reg[st.tipo].map((x, i) => [i, x.loss_train]), col: "var(--q)", marks: true, r: 3, lab: "training" }], { xr: [0, LAMS.length - 1], yr: [0.45, 0.62], xt: LAMS.map((l, i) => i), yt: [0.45, 0.5, 0.55, 0.6], xf: i => String(LAMS[i]), yf: fmt2, xl: "λ", w: 420, h: 220 })}</div>` +
      reporteHTML(c, `Testing con λ = ${r.lam}, umbral 0,5 (calculado aquí)`);
    if (anim) stagger(el("reg-s2"));
  }
  segmento("reg-tipo", "t", t => { st.tipo = t; render(true); });
  el("reg-lam").oninput = e => { st.li = +e.target.value; el("reg-lam-v").textContent = LAMS[st.li]; if (st.paso === 1) rPesos(false); if (st.paso === 2) rEval(false); };
  function render(anim) { [() => { if (anim) stagger(el("reg-s0")); }, rPesos, rEval][st.paso](anim); }
  el("reg-replay").onclick = () => render(true);
  GOTO.reg = pasoGenerico("reg", 3, st, render);
  stepper("reg", ["La idea", "Los pesos según λ", "Qué hace de verdad"], GOTO.reg);
})();

// ===================== 08 DESBALANCEO =====================
(function () {
  const st = ST.bal; const NM = { base: "sin balancear", cw: "class weights (1,667 / 0,714)", sub: "submuestreo 210 + 210", over: "sobremuestreo, malos ×2", smote: "SMOTE, 490 + 490" };
  const pst = met => TST.map(r => pde(thetaArr(DATA.bal[met].theta), r));
  function rProb(anim) {
    const c = conf(TST, P_TST, 0.5); const pm = P_TST.reduce((a, b) => a + b, 0) / 300;
    el("bal-prob").innerHTML = `<div class="block stage"><div class="t">Training: 490 buenos, 210 malos</div>${barras([{ lab: "buenos pagadores (y = 0)", v: 490, txt: "490 (70%)" }, { lab: "malos pagadores (y = 1)", v: 210, txt: "210 (30%)", cls: "pred" }], { max: 500 })}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Cada fila pesa lo mismo en la pérdida, así que la clase mayoritaria manda.</p></div>` +
      reporteHTML(c, "Reporte en testing, umbral 0,5 (modelo de la pestaña 03)") +
      `<div class="block stage"><div class="t">Probabilidades calibradas</div>${kpi([{ t: "p promedio en testing", v: fmt3(pm) }, { t: "tasa real de malos", v: "0,300" }, { t: "recall clase 1", v: fmt3(c.rec), col: "var(--bad)" }, { t: "recall clase 0", v: fmt3(c.rec0), col: "var(--ok)" }])}</div>`;
    if (anim) stagger(el("bal-s0"));
  }
  function rMet(anim) {
    const ps = pst(st.met); const c = conf(TST, ps, 0.5); const pm = ps.reduce((a, b) => a + b, 0) / 300;
    let extra = "";
    if (st.met === "cw") extra = `<div class="block stage"><div class="t">Peso de fila</div>${tabla(["clase", "filas en training", "peso", "suma de pesos"], [{ c: ["malos (y = 1)", 210, fmt3(DATA.bal_extra.w1), "350"] }, { c: ["buenos (y = 0)", 490, fmt3(DATA.bal_extra.w0), "350"] }], "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:40ch">n / (2 · n_clase): las dos clases aportan lo mismo a la pérdida. En scikit-learn, class_weight='balanced'.</p></div>`;
    if (st.met === "sub") extra = `<div class="block stage"><div class="t">Filas usadas</div>${barras([{ lab: "malos, todos", v: 210, txt: "210", cls: "pred" }, { lab: "buenos, sorteados", v: 210, txt: "210 de 490" }, { lab: "buenos descartados", v: 280, txt: "280" }], { max: 500 })}<p style="font-size:.85rem;color:var(--muted);max-width:40ch">Se botan 280 clientes reales con información. Con menos filas, el resultado depende más del sorteo.</p></div>`;
    if (st.met === "over") extra = `<div class="block stage"><div class="t">Repeticiones</div>${barras([{ lab: "malos, cada uno 2 veces", v: 420, txt: "420", cls: "pred" }, { lab: "buenos, 1 vez", v: 490, txt: "490" }], { max: 500 })}<p style="font-size:.85rem;color:var(--muted);max-width:40ch">Repetir una fila k veces es lo mismo que darle peso k. Con 1,667 y 0,714 sería idéntico a class weights.</p></div>`;
    if (st.met === "smote") { const e = DATA.bal_extra.smote_ejemplos[0]; const j = [XC.indexOf("duracion"), XC.indexOf("monto"), XC.indexOf("edad"), XC.indexOf("cta_negativa"), XC.indexOf("vivienda_arriendo")]; extra = `<div class="block stage"><div class="t">Un cliente sintético y sus dos padres (u = ${fmt2(e.u)})</div>${tabla(["", "duración", "monto", "edad", "cta. negativa", "arriendo"], [{ c: ["padre a (id " + e.id_a + ")"].concat(j.map(k => fmt2(e.xa[k]))) }, { c: ["padre b (id " + e.id_b + ")"].concat(j.map(k => fmt2(e.xb[k]))) }, { c: ["hijo = a + u (b − a)"].concat(j.map(k => fmt2(e.xn[k]))), cls: "hi" }], "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Valores escalados. Las columnas 0/1 quedan fraccionarias (un cliente con 0,37 de "arriendo"), que no significa nada; hay variantes (SMOTE-NC) para categóricas. Se crean 280 sintéticos hasta igualar 490 y 490.</p></div>`; }
    el("bal-met-out").innerHTML = extra + matrizHTML(c, `Testing, ${NM[st.met]}, umbral 0,5`) + reporteHTML(c, "Reporte en testing") +
      `<div class="block stage"><div class="t">Lo que cambia y lo que no</div>${kpi([{ t: "recall clase 1", v: fmt3(c.rec), col: "var(--ok)" }, { t: "precision clase 1", v: fmt3(c.pre), col: "var(--cobre)" }, { t: "AUC testing", v: fmt3(auc(TST, ps)) }, { t: "p promedio (tasa real 0,300)", v: fmt3(pm), col: Math.abs(pm - 0.3) > 0.08 ? "var(--bad)" : "" }])}</div>`;
    if (anim) stagger(el("bal-s1"));
  }
  function rCmp(anim) {
    const filas = ["base", "cw", "sub", "over", "smote"].map(m => { const ps = pst(m); const c = conf(TST, ps, 0.5); return { c: [NM[m], "0,50", pct(c.acc), fmt3(c.rec), fmt3(c.pre), fmt3(c.f1), fmt3(c.rec0), fmt3(auc(TST, ps)), fmt3(ps.reduce((a, b) => a + b, 0) / 300)], cls: m === "cw" ? "hi" : "" }; });
    const cu = conf(TST, P_TST, st.u); filas.push({ c: ["<b>sin balancear, umbral movido</b>", fmt2(st.u), pct(cu.acc), fmt3(cu.rec), fmt3(cu.pre), fmt3(cu.f1), fmt3(cu.rec0), fmt3(auc(TST, P_TST)), fmt3(P_TST.reduce((a, b) => a + b, 0) / 300)], cls: "hi" });
    el("bal-cmp").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">Los cuatro métodos en testing, y el modelo sin balancear con el umbral del deslizador</div>${tabla(["modelo", "umbral", "acierto", "recall 1", "precision 1", "F1", "recall 0", "AUC", "p promedio"], filas, "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Class weights contra umbral ${fmt2(st.u)}</div>${barras([{ lab: "recall, class weights", v: conf(TST, pst("cw"), 0.5).rec, txt: fmt3(conf(TST, pst("cw"), 0.5).rec), cls: "real" }, { lab: "recall, umbral " + fmt2(st.u), v: cu.rec, txt: fmt3(cu.rec), cls: "real" }, { lab: "precision, class weights", v: conf(TST, pst("cw"), 0.5).pre, txt: fmt3(conf(TST, pst("cw"), 0.5).pre), cls: "pred" }, { lab: "precision, umbral " + fmt2(st.u), v: cu.pre, txt: fmt3(cu.pre), cls: "pred" }], { max: 1 })}</div>`;
    if (anim) stagger(el("bal-s2"));
  }
  segmento("bal-met", "b", b => { st.met = b; if (st.paso === 1) rMet(true); });
  el("bal-u").oninput = e => { st.u = +e.target.value / 100; el("bal-u-v").textContent = fmt2(st.u); if (st.paso === 2) rCmp(false); };
  function render(anim) { [rProb, rMet, rCmp][st.paso](anim); }
  el("bal-replay").onclick = () => render(true);
  GOTO.bal = pasoGenerico("bal", 3, st, render);
  stepper("bal", ["El problema", "Las correcciones", "Balancear o mover el umbral"], GOTO.bal);
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
    el("mue-part").innerHTML = `<div class="block stage"><div class="t">Partición ${ult.sem}: se reentrena con sus 700 y se mide en sus 300</div>${kpi([{ t: "AUC testing", v: fmt3(ult.auc), col: "var(--cobre)" }, { t: "recall (umbral 0,5)", v: fmt3(ult.rec) }, { t: "precision", v: fmt3(ult.pre) }, { t: "la partición del curso", v: fmt3(DATA.auc_test), s: "AUC" }])}</div>` +
      `<div class="block stage"><div class="t">${st.res.length} particiones hasta ahora: AUC</div>${histo(aucs, { xr: [0.65, 0.9], k: 25, xt: [0.65, 0.7, 0.75, 0.8, 0.85, 0.9], xf: fmt2, xl: "AUC en testing", extra: [{ x: DATA.auc_test, txt: "la del curso" }] })}${kpi([{ t: "promedio", v: fmt3(mean(aucs)) }, { t: "desviación", v: fmt3(sd(aucs)) }, { t: "mínimo y máximo", v: fmt3(Math.min(...aucs)) + " a " + fmt3(Math.max(...aucs)) }, { t: "recall: mínimo y máximo", v: fmt2(Math.min(...recs)) + " a " + fmt2(Math.max(...recs)) }])}</div>`;
    el("mue-part-nota").innerHTML = st.res.length < 5 ? `<b>Sigue.</b> Aprieta "Diez particiones más" un par de veces y mira dónde cae la del curso dentro de la distribución.` : `<b>Lectura.</b> Con ${st.res.length} particiones el AUC va de ${fmt3(Math.min(...aucs))} a ${fmt3(Math.max(...aucs))}, con promedio ${fmt3(mean(aucs))}. El 0,822 de la partición del curso ${DATA.auc_test > mean(aucs) + sd(aucs) ? "quedó en la parte alta: la muestra de testing que nos tocó fue amable" : "está dentro de lo normal"}. Una métrica sobre una sola partición es una estimación con ruido, y comparar dos modelos por un punto de AUC en una sola partición no dice nada.`;
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
    el("mue-cv").innerHTML = `<div class="block stage"><div class="t">5 pliegues × 3 repeticiones, solo training (calculado aquí)</div>${kpi([{ t: "AUC por validación cruzada", v: fmt3(mean), s: "± " + fmt3(sd), col: "var(--cobre)" }, { t: "AUC en el testing del curso", v: fmt3(DATA.auc_test) }, { t: "umbral de menor costo medio (5 y 1)", v: fmt2(UMB[bi]) }, { t: "fórmula", v: "0,167", s: "tabla sobre testing: 0,25" }])}${barras(res.map((v, i) => ({ lab: "pliegue " + (i + 1), v, txt: fmt3(v) })), { max: 1 })}</div>` +
      `<div class="block stage"><div class="t">Costo medio por umbral en los pliegues de validación</div>${curva([{ pts: cm.map((v, i) => [UMB[i], v]), col: "var(--q)", marks: true, r: 3 }], { xr: [0, 1], yr: [0, Math.max(...cm) * 1.05], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, Math.round(Math.max(...cm) / 2), Math.round(Math.max(...cm))], xf: fmt2, yf: v => String(Math.round(v)), xl: "umbral", extra: [{ tipo: "vline", x: UMB[bi] }], w: 420, h: 220 })}</div>`;
    el("mue-cv-nota").innerHTML = `<b>Lectura.</b> La validación cruzada estima un AUC de ${fmt3(mean)}, por debajo del ${fmt3(DATA.auc_test)} de testing: esa es la expectativa honesta para un cliente nuevo. Y el umbral de menor costo elegido por validación cruzada cae en ${fmt2(UMB[bi])}, cerca de la fórmula (0,167) y lejos del 0,25 de la tabla sobre testing. Elegir con validación y medir en testing es la secuencia correcta.`;
    if (anim) stagger(el("mue-s1"));
  }
  function rBS(anim) {
    const r = rng32(300 + st.bsSem); const B = 500; const A = [], Rc = [], U = [];
    for (let b = 0; b < B; b++) { const idx = Array.from({ length: 300 }, () => Math.floor(r() * 300)); const rows = idx.map(i => TST[i]), ps = idx.map(i => P_TST[i]); if (!rows.some(x => x.y) || rows.every(x => x.y)) continue; A.push(auc(rows, ps)); const c = conf(rows, ps, 0.5); Rc.push(c.rec); const t = tablaUmbral(rows, ps); let bi = 0; t.forEach((row, k) => { if (row.FP + 5 * row.FN < t[bi].FP + 5 * t[bi].FN) bi = k; }); U.push(t[bi].u); }
    const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
    el("mue-bs").innerHTML = `<div class="block stage"><div class="t">${A.length} remuestreos de los 300 clientes de testing (sorteo ${st.bsSem})</div>${tabla(["métrica", "estimación original", "IC 95%: 2,5%", "97,5%"], [{ c: ["AUC", fmt3(DATA.auc_test), fmt3(q(A, 0.025)), fmt3(q(A, 0.975))] }, { c: ["recall (umbral 0,5)", fmt3(conf(TST, P_TST, 0.5).rec), fmt3(q(Rc, 0.025)), fmt3(q(Rc, 0.975))] }, { c: ["umbral óptimo de la tabla (5 y 1)", "0,25", fmt2(q(U, 0.025)), fmt2(q(U, 0.975))] }], "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Dónde cae el umbral óptimo de la tabla si cambio la muestra</div>${histo(U, { xr: [0, 0.6], k: 12, xt: [0, 0.2, 0.4, 0.6], xf: fmt2, xl: "umbral óptimo", extra: [{ x: 0.167, txt: "fórmula", col: "var(--v)" }] })}</div>` +
      `<div class="block stage"><div class="t">AUC en los remuestreos</div>${histo(A, { xr: [0.7, 0.95], k: 25, xt: [0.7, 0.75, 0.8, 0.85, 0.9, 0.95], xf: fmt2, xl: "AUC", extra: [{ x: DATA.auc_test, txt: "original" }] })}</div>`;
    el("mue-bs-nota").innerHTML = `<b>Lectura.</b> El AUC de testing no es ${fmt3(DATA.auc_test)}: es "entre ${fmt3(q(A, 0.025))} y ${fmt3(q(A, 0.975))} con 95% de confianza". El recall no es 0,567: es "entre ${fmt2(q(Rc, 0.025))} y ${fmt2(q(Rc, 0.975))}". Y el umbral óptimo de la tabla se reparte entre ${fmt2(q(U, 0.025))} y ${fmt2(q(U, 0.975))}: la fórmula y el umbral de validación cruzada quedan adentro, y la diferencia con 0,25 no es evidencia de nada.`;
    if (anim) stagger(el("mue-s2"));
  }
  el("mue-otra").onclick = () => { st.sem++; st.res.push(medir(st.sem)); rPart(false); };
  el("mue-diez").onclick = () => { for (let k = 0; k < 10; k++) { st.sem++; st.res.push(medir(st.sem)); } rPart(false); };
  el("mue-boot").onclick = () => { st.bsSem++; rBS(false); };
  function render(anim) { [rPart, rCV, rBS][st.paso](anim); }
  el("mue-replay").onclick = () => render(true);
  GOTO.mue = pasoGenerico("mue", 3, st, render);
  stepper("mue", ["Otra partición", "Validación cruzada", "Bootstrap"], GOTO.mue);
})();

// ===================== 10 TAIWAN =====================
(function () {
  const st = ST.tw; const T = DATA.tw; const NM = { "logistica lineal": "logística lineal", "logistica grado 2 sin regularizar": "logística grado 2, sin regularizar", "logistica grado 2 regularizada": "logística grado 2, L2 por validación cruzada", "arbol profundidad 4": "árbol de decisión, profundidad 4", "arbol sin limite": "árbol de decisión, sin límite", "random forest 300": "random forest, 300 árboles", "gradient boosting 300": "gradient boosting, 300 árboles" };
  const m = n => T.modelos.find(x => x.nombre === n);
  function rDatos(anim) {
    el("tw-datos").innerHTML = kpi([{ t: "clientes", v: mil(T.n) }, { t: "no pagaron al mes siguiente", v: pct(T.tasa) }, { t: "training", v: mil(T.ntr) }, { t: "testing", v: mil(T.nte) }, { t: "columnas", v: 23, s: "límite, demografía, 6 meses de atrasos, facturas y pagos" }]) +
      `<div class="block stage"><div class="t">El punto de partida: la logística lineal, sin regularizar</div>${kpi([{ t: "AUC training", v: fmt3(m("logistica lineal").auc_train) }, { t: "AUC testing", v: fmt3(m("logistica lineal").auc_test), col: "var(--cobre)" }, { t: "intervalo bootstrap 95%", v: fmt3(m("logistica lineal").lo) + " a " + fmt3(m("logistica lineal").hi) }])}<p style="font-size:.85rem;color:var(--muted);max-width:46ch">Es el modelo contra el que se mide todo lo demás. En German Credit el AUC era 0,82 con un intervalo de 0,76 a 0,87; aquí el intervalo es cuatro veces más angosto porque testing tiene 30 veces más clientes.</p></div>`;
    if (anim) stagger(el("tw-s0"));
  }
  function rPoly(anim) {
    const filas = ["logistica lineal", "logistica grado 2 sin regularizar", "logistica grado 2 regularizada"].map(n => { const x = m(n); return { c: [NM[n], fmt3(x.auc_train), fmt3(x.auc_test), fmt3(x.lo) + " a " + fmt3(x.hi), fmt3(x.auc_train - x.auc_test)] }; });
    el("tw-poly").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">Con 21.000 clientes de training (${T.ncols2} columnas de grado 2; λ elegida por validación cruzada: ${fmt2(T.lam_cv)})</div>${tabla(["modelo", "AUC training", "AUC testing", "IC 95%", "brecha"], filas, "cmp small")}</div>` +
      `<div class="block stage"><div class="t">El mismo grado 2 con solo 1.000 clientes de training</div>${tabla(["modelo", "AUC training", "AUC testing"], [{ c: ["sin regularizar", fmt3(T.chico.libre[0]), fmt3(T.chico.libre[1])], cls: "hi" }, { c: ["L2 por validación cruzada", fmt3(T.chico.reg[0]), fmt3(T.chico.reg[1])] }], "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Con 1.000 filas y 299 pesos, el modelo sin freno memoriza training y se desploma en testing; el regularizado sacrifica training y generaliza. Es la diferencia que en German Credit no apareció.</p></div>`;
    if (anim) stagger(el("tw-s1"));
  }
  function svgArbol2(t) {
    // arbol de profundidad 2: dibujo simple
    const W = 520, H = 230; const nodes = [];
    function rec(n, x, y, dx, d) { nodes.push({ n, x, y }); if (!n.hoja) { rec(n.izq, x - dx, y + 70, dx / 2, d + 1); rec(n.der, x + dx, y + 70, dx / 2, d + 1); } }
    rec(t, W / 2, 30, 130, 0);
    let s = `<svg class="arbol" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    nodes.forEach(nd => { if (!nd.n.hoja) { const l = nodes.find(q => q.n === nd.n.izq), r = nodes.find(q => q.n === nd.n.der); s += `<line x1="${nd.x}" y1="${nd.y}" x2="${l.x}" y2="${l.y}"/><line x1="${nd.x}" y1="${nd.y}" x2="${r.x}" y2="${r.y}"/><text x="${(nd.x + l.x) / 2 - 6}" y="${(nd.y + l.y) / 2}" text-anchor="end" class="lab">≤</text><text x="${(nd.x + r.x) / 2 + 6}" y="${(nd.y + r.y) / 2}" class="lab">></text>`; } });
    nodes.forEach(nd => { const hoja = !!nd.n.hoja; const txt = hoja ? `no pagan ${pct0(nd.n.p1)}` : `${nd.n.var} ≤ ${nd.n.umbral.toFixed(1).replace(".", ",")}`; const sub = hoja ? `${mil(nd.n.n[0] + nd.n.n[1])} clientes` : `no pagan ${pct0(nd.n.p1)}`; const w = Math.max(90, txt.length * 7 + 16); s += `<g class="nd ${hoja ? "hoja " + (nd.n.p1 > 0.5 ? "c1" : "c0") : ""}"><rect x="${nd.x - w / 2}" y="${nd.y - 15}" width="${w}" height="40" rx="6"/><text x="${nd.x}" y="${nd.y + 4}" text-anchor="middle">${txt}</text><text x="${nd.x}" y="${nd.y + 19}" text-anchor="middle" class="sub">${sub}</text></g>`; });
    return s + "</svg>";
  }
  function rArbol(anim) {
    el("tw-arbol").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">Árbol de profundidad 2 sobre training (cortes en unidades originales)</div>${svgArbol2(T.arbol2)}</div>` +
      `<div class="block stage"><div class="t">Un árbol solo, en testing</div>${tabla(["modelo", "AUC training", "AUC testing", "IC 95%"], ["arbol profundidad 4", "arbol sin limite"].map(n => { const x = m(n); return { c: [NM[n], fmt3(x.auc_train), fmt3(x.auc_test), fmt3(x.lo) + " a " + fmt3(x.hi)], cls: n === "arbol sin limite" ? "hi" : "" }; }), "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Podado a profundidad 4 no le gana a la logística de grado 2 (0,737 contra 0,750); sin límite memoriza (1,000 en training, 0,607 en testing).</p></div>`;
    if (anim) stagger(el("tw-s2"));
  }
  function rEns(anim) {
    const orden = ["logistica lineal", "logistica grado 2 regularizada", "arbol profundidad 4", "random forest 300", "gradient boosting 300"];
    el("tw-ens").innerHTML = `<div class="block stage" style="flex:1 1 100%"><div class="t">Los modelos en testing (9.000 clientes)</div>${tabla(["modelo", "AUC training", "AUC testing", "IC 95% bootstrap", "brecha"], orden.map(n => { const x = m(n); return { c: [NM[n], fmt3(x.auc_train), fmt3(x.auc_test), fmt3(x.lo) + " a " + fmt3(x.hi), fmt3(x.auc_train - x.auc_test)], cls: n === "gradient boosting 300" ? "hi" : "" }; }), "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Diferencias pareadas de AUC (misma remuestra para los dos modelos)</div>${tabla(["comparación", "diferencia", "IC 95%", "¿contiene el cero?"], T.pares.map(p => ({ c: [NM[p.a] + " − " + NM[p.b], (p.d > 0 ? "+" : "") + fmt4(p.d), (p.lo > 0 ? "+" : "") + fmt4(p.lo) + " a +" + fmt4(p.hi), p.lo > 0 ? "no: la diferencia es real" : "sí"] })), "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Validación cruzada, 5 pliegues sobre training</div>${tabla(["modelo", "promedio", "mínimo", "máximo"], Object.entries(T.cv).map(([n, v]) => ({ c: [({ "logistica lineal": "logística lineal", "random forest": "random forest", "gradient boosting": "gradient boosting" })[n] || n, fmt3(v.reduce((a, b) => a + b, 0) / v.length), fmt3(Math.min(...v)), fmt3(Math.max(...v))] })), "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Los rangos de la logística y del boosting ni se acercan: la diferencia se sostiene en otras muestras.</p></div>`;
    if (anim) stagger(el("tw-s3"));
  }
  function rEsc(anim) {
    const E = T.escalera; const C = T.curva;
    el("tw-esc").innerHTML = `<div class="block stage"><div class="t">Por meses de atraso en septiembre (testing, valores con al menos 20 clientes)</div>${tabla(["atraso", "clientes", "realmente no pagó", "logística", "grado 2", "boosting"], E.map(r => ({ c: [r.a, mil(r.n), fmt3(r.real), fmt3(r.lg), fmt3(r.g2), fmt3(r.gb)], cls: r.a === 2 ? "hi" : "" })), "cmp small")}</div>` +
      `<div class="block stage"><div class="t">Riesgo estimado según el atraso, para un cliente típico</div>${curva([{ pts: C.atraso.map((a, i) => [a, C.lg[i]]), col: "var(--q)", marks: true, r: 3, lab: "logística" }, { pts: C.atraso.map((a, i) => [a, C.g2[i]]), col: "var(--k)", marks: true, r: 3, lab: "grado 2" }, { pts: C.atraso.map((a, i) => [a, C.gb[i]]), col: "var(--cobre)", marks: true, r: 3, lab: "boosting" }], { xr: [-2, 8], yr: [0, 1], xt: [-2, 0, 2, 4, 6, 8], yt: [0, 0.5, 1], xf: v => String(v), yf: fmt2, xl: "meses de atraso en septiembre", w: 460, h: 260 })}</div>` +
      `<div class="block stage"><div class="t">Qué variables usa cada uno (primeras 8 del boosting)</div>${tabla(["variable", "|coef.| logística", "importancia boosting", "importancia random forest"], T.imp.cols.map((c, i) => ({ c, l: T.imp.logit_abs[i], g: T.imp.gb[i], r: T.imp.rf[i] })).sort((a, b) => b.g - a.g).slice(0, 8).map(x => ({ c: [x.c, fmt3(x.l), fmt3(x.g), fmt3(x.r)] })), "cmp small")}<p style="font-size:.85rem;color:var(--muted);max-width:44ch">Los tres coinciden en la primera variable. No son la misma magnitud (la importancia es cuánto redujo la impureza cada variable, una fracción que suma 1) pero sí se comparan en orden.</p></div>`;
    if (anim) stagger(el("tw-s4"));
  }
  function render(anim) { [rDatos, rPoly, rArbol, rEns, rEsc][st.paso](anim); }
  el("tw-replay").onclick = () => render(true);
  GOTO.tw = pasoGenerico("tw", 5, st, render);
  stepper("tw", ["Los datos", "Polinomios y regularización", "Árboles", "Ensambles", "Qué encontró"], GOTO.tw);
})();

let modeloInicial = (init && init.m && GOTO[init.m]) ? init.m : "rec";
if (init && typeof init.paso === "number" && ST[modeloInicial]) ST[modeloInicial].paso = init.paso;
quieto = true; irModelo(modeloInicial); quieto = false;
return { getState: () => ({ m: modeloActual, paso: ST[modeloActual].paso }) };
}
