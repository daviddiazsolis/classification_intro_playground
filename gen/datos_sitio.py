# -*- coding: utf-8 -*-
"""Datos para el micrositio de modelamiento supervisado: German Credit escalado + referencias + Taiwán precalculado."""
import json, numpy as np, pandas as pd, warnings
from sklearn.linear_model import LogisticRegression, LinearRegression, LogisticRegressionCV
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import roc_auc_score, log_loss
warnings.filterwarnings("ignore")
L = "/home/claude/log/"
D = json.load(open(L + "datos_log.json")); R = json.load(open(L + "datos_reg.json")); B = json.load(open(L + "datos_bal.json"))
XC, NUM = D["XCOLS"], D["NUM"]
ES = pd.DataFrame(D["esc"]); TR = pd.DataFrame(D["trans"])
tr = (ES.conjunto == "training").values
# filas compactas: id, y, conjunto (t/s), x escalado (redondeado a 4), y las 4 numericas crudas para mostrar
filas = []
for i, r in ES.iterrows():
    filas.append({"id": int(r.id), "y": int(r.y), "c": "t" if r.conjunto == "training" else "s", "x": [round(float(r[c]), 4) for c in XC],
                  "raw": [int(TR.loc[i, c]) for c in NUM]})
X = ES.loc[tr, XC].values; y = ES.loc[tr, "y"].values
lin = LinearRegression().fit(X, y)
out = {
    "XCOLS": XC, "NUM": NUM, "media": D["media"], "desv": D["desv"], "filas": filas,
    "theta": D["ref"]["theta"], "theta_lineal": {"intercepto": float(lin.intercept_), **{c: float(b) for c, b in zip(XC, lin.coef_)}},
    "loss_train": D["ref"]["loss_train"], "loss_test": D["ref"]["loss_test"], "auc_test": D["ref"]["auc_test"], "auc_train": D["ref"]["auc_train"],
    "reg": {pen: [{"lam": r["lam"], "theta": r["theta"], "loss_train": r["loss_train"], "loss_test": r["loss_test"], "auc_train": r["auc_train"], "auc_test": r["auc_test"], "ceros": r["ceros"]} for r in R[pen]] for pen in ("l2", "l1", "en")},
    "bal": {k: {"theta": B[k]["theta"], "auc_test": B[k]["auc_test"], "p_media": B[k]["p_media_test"]} for k in ("base", "cw", "sub", "over", "smote")},
    "bal_extra": {"w1": B["cw"]["w1"], "w0": B["cw"]["w0"], "usar": B["sub"]["usar"], "smote_ejemplos": B["smote"]["ejemplos"][:2]},
}
# ---------------- Taiwán (precalculado)
tw = pd.read_csv(L + "taiwan_raw.csv")
Xt = tw.drop(columns=tw.columns[-1]).apply(pd.to_numeric); yt = tw[tw.columns[-1]].astype(int).values
meses = ["sep", "ago", "jul", "jun", "may", "abr"]
Xt.columns = (["limite_credito", "sexo", "educacion", "estado_civil", "edad"] + ["atraso_" + m for m in meses] + ["factura_" + m for m in meses] + ["pago_" + m for m in meses])
Xa, Xb, ya, yb = train_test_split(Xt, yt, test_size=0.3, random_state=42, stratify=yt)
esc = StandardScaler().fit(Xa); A, Bt = esc.transform(Xa), esc.transform(Xb)
rng = np.random.default_rng(0); IDX = [rng.integers(0, len(yb), len(yb)) for _ in range(300)]
def ev(name, m, Atr, Ate, seg=None):
    p_tr, p_te = m.predict_proba(Atr)[:, 1], m.predict_proba(Ate)[:, 1]
    v = np.array([roc_auc_score(yb[i], p_te[i]) for i in IDX])
    return dict(nombre=name, auc_train=float(roc_auc_score(ya, p_tr)), auc_test=float(roc_auc_score(yb, p_te)), lo=float(np.percentile(v, 2.5)), hi=float(np.percentile(v, 97.5)), p=p_te)
modelos = []
logit = LogisticRegression(penalty=None, max_iter=5000).fit(A, ya); modelos.append(ev("logistica lineal", logit, A, Bt))
poly = PolynomialFeatures(2, include_bias=False); P = poly.fit_transform(A); Pt = poly.transform(Bt); esc2 = StandardScaler().fit(P); P, Pt = esc2.transform(P), esc2.transform(Pt)
pl = LogisticRegression(penalty=None, max_iter=3000).fit(P, ya); modelos.append(ev("logistica grado 2 sin regularizar", pl, P, Pt))
pc = LogisticRegressionCV(Cs=8, cv=5, max_iter=3000, n_jobs=-1).fit(P, ya); modelos.append(ev("logistica grado 2 regularizada", pc, P, Pt))
ar = DecisionTreeClassifier(max_depth=4, min_samples_leaf=20, random_state=0).fit(A, ya); modelos.append(ev("arbol profundidad 4", ar, A, Bt))
ah = DecisionTreeClassifier(random_state=0).fit(A, ya); modelos.append(ev("arbol sin limite", ah, A, Bt))
rf = RandomForestClassifier(n_estimators=300, min_samples_leaf=5, n_jobs=-1, random_state=0).fit(A, ya); modelos.append(ev("random forest 300", rf, A, Bt))
gb = GradientBoostingClassifier(n_estimators=300, learning_rate=0.05, max_depth=3, subsample=0.8, random_state=0).fit(A, ya); modelos.append(ev("gradient boosting 300", gb, A, Bt))
# 1000 filas
Pk, yk = P[:1000], ya[:1000]
plk = LogisticRegression(penalty=None, max_iter=5000).fit(Pk, yk); pck = LogisticRegressionCV(Cs=8, cv=5, max_iter=5000, n_jobs=-1).fit(Pk, yk)
chico = {"libre": [float(roc_auc_score(yk, plk.predict_proba(Pk)[:, 1])), float(roc_auc_score(yb, plk.predict_proba(Pt)[:, 1]))],
         "reg": [float(roc_auc_score(yk, pck.predict_proba(Pk)[:, 1])), float(roc_auc_score(yb, pck.predict_proba(Pt)[:, 1]))]}
# diferencias pareadas
def dif(a, b):
    pa, pb = modelos[a]["p"], modelos[b]["p"]; d = np.array([roc_auc_score(yb[i], pa[i]) - roc_auc_score(yb[i], pb[i]) for i in IDX])
    return dict(a=modelos[a]["nombre"], b=modelos[b]["nombre"], d=float(modelos[a]["auc_test"] - modelos[b]["auc_test"]), lo=float(np.percentile(d, 2.5)), hi=float(np.percentile(d, 97.5)))
pares = [dif(6, 0), dif(6, 2), dif(6, 5), dif(2, 0)]
# escalera por atraso
comp = pd.DataFrame({"a": Xb["atraso_sep"].values, "y": yb, "lg": modelos[0]["p"], "g2": modelos[2]["p"], "gb": modelos[6]["p"]})
esc_ = comp.groupby("a").agg(n=("y", "size"), real=("y", "mean"), lg=("lg", "mean"), g2=("g2", "mean"), gb=("gb", "mean")).reset_index()
esc_ = esc_[esc_.n >= 20]
# curva cliente tipico
tip = Xa.median(); gr = pd.DataFrame([tip] * 11); gr["atraso_sep"] = np.arange(-2, 9); gr = gr[Xt.columns]; G = esc.transform(gr)
curva = {"atraso": list(range(-2, 9)), "lg": [float(v) for v in logit.predict_proba(G)[:, 1]], "g2": [float(v) for v in pc.predict_proba(esc2.transform(poly.transform(G)))[:, 1]], "gb": [float(v) for v in gb.predict_proba(G)[:, 1]]}
# cv
cv5 = StratifiedKFold(5, shuffle=True, random_state=0)
cv = {n: [float(v) for v in cross_val_score(m, A, ya, cv=cv5, scoring="roc_auc", n_jobs=-1)] for n, m in [("logistica lineal", LogisticRegression(penalty=None, max_iter=5000)), ("random forest", RandomForestClassifier(n_estimators=300, min_samples_leaf=5, n_jobs=-1, random_state=0)), ("gradient boosting", GradientBoostingClassifier(n_estimators=300, learning_rate=0.05, max_depth=3, subsample=0.8, random_state=0))]}
# importancias
imp = {"cols": list(Xt.columns), "logit_abs": [float(v) for v in np.abs(logit.coef_[0])], "gb": [float(v) for v in gb.feature_importances_], "rf": [float(v) for v in rf.feature_importances_]}
# arbol profundidad 2 sobre crudo
a2 = DecisionTreeClassifier(max_depth=2, min_samples_leaf=20, random_state=0).fit(Xa, ya); t = a2.tree_
def nodo(i):
    if t.children_left[i] == -1: return {"hoja": 1, "n": [int(v) for v in t.value[i][0] * t.n_node_samples[i]] if t.value[i][0].sum() <= 1.0001 else [int(v) for v in t.value[i][0]], "p1": float(t.value[i][0][1] / t.value[i][0].sum())}
    return {"var": Xt.columns[t.feature[i]], "umbral": float(t.threshold[i]), "izq": nodo(t.children_left[i]), "der": nodo(t.children_right[i]), "p1": float(t.value[i][0][1] / t.value[i][0].sum()), "cnt": int(t.n_node_samples[i])}
arbol2 = nodo(0)
# costos: umbral optimo por modelo con FN=4 FP=1
umb = np.round(np.arange(1, -0.001, -0.05), 2)
def costos(p):
    return [dict(u=float(u), costo=int(((p > u) & (yb == 0)).sum() * 1 + ((p <= u) & (yb == 1)).sum() * 4), rec=float(((p > u) & (yb == 1)).sum() / yb.sum())) for u in umb]
cost = {m["nombre"]: costos(m["p"]) for m in modelos if m["nombre"] in ("logistica lineal", "logistica grado 2 regularizada", "random forest 300", "gradient boosting 300")}
# calibracion deciles
cal = {}
for nm, p in [("logistica lineal", modelos[0]["p"]), ("random forest 300", modelos[5]["p"]), ("gradient boosting 300", modelos[6]["p"])]:
    g = pd.qcut(p, 10, labels=False, duplicates="drop"); df = pd.DataFrame({"g": g, "p": p, "y": yb}).groupby("g").agg(p=("p", "mean"), y=("y", "mean"))
    cal[nm] = {"p": [float(v) for v in df.p], "y": [float(v) for v in df.y]}
out["tw"] = {"n": int(len(yt)), "tasa": float(yt.mean()), "ntr": int(len(ya)), "nte": int(len(yb)), "ncols2": int(P.shape[1]),
             "modelos": [{k: v for k, v in m.items() if k != "p"} for m in modelos], "chico": chico, "pares": pares,
             "escalera": esc_.round(4).to_dict("records"), "curva": curva, "cv": cv, "imp": imp, "arbol2": arbol2, "costos": cost, "cal": cal,
             "lam_cv": float(1 / pc.C_[0])}

# curvas ROC en una grilla común de FPR (101 puntos) para comparar modelos visualmente
from sklearn.metrics import roc_curve
grid = np.round(np.linspace(0, 1, 101), 2)
def roc_grid(p):
    fpr, tpr, thr = roc_curve(yb, p)
    return {"tpr": [float(v) for v in np.interp(grid, fpr, tpr)], "umbral": [float(v) for v in np.interp(grid, fpr, np.clip(thr, 0, 1))]}
out["tw"]["roc"] = {"fpr": [float(v) for v in grid], "modelos": {m["nombre"]: roc_grid(m["p"]) for m in modelos}}
# AUC parcial (hasta un FPR máximo) por modelo, para varios topes, calculado exacto con los 9.000 clientes
from sklearn.metrics import roc_auc_score as _ras
out["tw"]["pauc"] = {m["nombre"]: {str(f): float(_ras(yb, m["p"], max_fpr=f)) for f in (0.05, 0.1, 0.2, 0.3, 0.5)} for m in modelos}
json.dump(out, open("/home/claude/hub/classification_intro_playground/src/engine/data.es.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("ok", len(json.dumps(out)) // 1024, "KB"); print([(m["nombre"], round(m["auc_test"], 3)) for m in modelos]); print(chico); print(esc_.round(3).to_string())
