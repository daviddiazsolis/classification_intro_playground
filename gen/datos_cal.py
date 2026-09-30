# -*- coding: utf-8 -*-
"""Datos precalculados de calibración (Taiwán) para la pestaña 11 del micrositio.

Reproduce el notebook 07 del curso (07_Calibracion_de_Probabilidades.ipynb): ejecuta sus celdas de código hasta la
sección 5 y guarda, para cada modelo y cada corrección (sin calibrar, Platt, isotónica), el diagrama de confiabilidad por
deciles, las métricas en testing y la curva de costo por umbral con c_FN = 4 y c_FP = 1. Agrega el bloque "cal" a
data.es.json y data.en.json (mismos números en los dos idiomas). Uso: python3 gen/datos_cal.py [ruta del notebook 07].
"""
import json, sys, numpy as np, pandas as pd, nbformat, warnings
warnings.filterwarnings("ignore")
NB = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/tr/es/07_Calibracion_de_Probabilidades.ipynb"
SITIO = "/home/claude/hub/classification_intro_playground/src/engine/"
nb = nbformat.read(NB, as_version=4)
src = "\n".join(c.source for i, c in enumerate(nb.cells) if c.cell_type == "code" and i <= 24).replace("plt.show()", "plt.close()")
ns = {}
exec(compile(src, "nb07", "exec"), ns)
yt_te, P_te, P_platt, P_iso = ns["yt_te"], ns["P_te"], ns["P_platt"], ns["P_iso"]
confiabilidad, metricas, costo_por_umbral = ns["confiabilidad"], ns["metricas"], ns["costo_por_umbral"]
KEY = {"logística": "logit", "árbol sin límite": "arbol_libre", "árbol profundidad 4": "arbol_4", "random forest, hojas de 1": "rf1", "random forest, hojas de 5": "rf5", "gradient boosting": "gb"}
umb = np.round(np.arange(0.05, 0.96, 0.05), 2)
def bloque(p):
    t = confiabilidad(yt_te, p, 10); m = metricas(yt_te, p); c = costo_por_umbral(yt_te, p, 4, 1, umb)
    return {"p": [round(float(v), 4) for v in t.p_promedio], "y": [round(float(v), 4) for v in t.fraccion_real], "n": [int(v) for v in t.n],
            "auc": round(float(m["AUC"]), 4), "brier": round(float(m["Brier"]), 4), "logloss": round(float(m["log_loss"]), 4), "ece": round(float(m["ECE"]), 4),
            "pm": round(float(p.mean()), 4), "costo": [int(v) for v in c.values]}
cal = {"nfit": int(len(ns["y_fit"])), "ncal": int(len(ns["y_cal"])), "nte": int(len(yt_te)), "tasa": round(float(yt_te.mean()), 4), "umbrales": [float(u) for u in umb],
       "modelos": {KEY[n]: {"raw": bloque(P_te[n]), "platt": bloque(P_platt[n]), "iso": bloque(P_iso[n])} for n in P_te}}
for lang in ("es", "en"):
    d = json.load(open(SITIO + f"data.{lang}.json")); d["cal"] = cal
    json.dump(d, open(SITIO + f"data.{lang}.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("ok"); print(pd.DataFrame({k: {c: v[c]["ece"] for c in v} for k, v in cal["modelos"].items()}).T)
