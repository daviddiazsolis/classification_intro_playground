# Classification Intro Playground

Interactive microsite (English / Spanish, dark / light) that introduces supervised modelling through logistic regression on the German Credit data: why the line fails, the logistic function and the 0.5 threshold, binary cross-entropy, training with gradient descent, accuracy / confusion matrix / recall and precision, ROC and AUC, the cost-optimal threshold, regularization (L2, L1, elastic net), class imbalance (class weights, under/over sampling, SMOTE), sampling variation (cross-validation and bootstrap) and a closing tab with the Taiwan case (30,000 clients) where logistic regression is compared with degree-2 logistic, trees, random forest and gradient boosting. Part of the ML & AI Learning Hub.

Same stack as the other playgrounds: Vite + React 19 + Tailwind 4 + lucide-react + motion. MathJax is loaded from cdnjs.

## Structure

- `src/components/` shell of the site (hero, translation widget, sandbox link, notebooks and Excel files, references, footer) in the hub template.
- `src/components/Playground.tsx` mounts the tab engine and re-mounts it when the language changes, keeping tab and step.
- `src/engine/body.es.html`, `body.en.html` content of the ten tabs; `engine.es.js`, `engine.en.js` the live computations (token-identical except for displayed strings): the logistic model is trained in the browser with Newton / IRLS, and ROC, AUC, cost tables, regularization paths, balancing, cross-validation and bootstrap are all computed live on the 1,000 German Credit rows; `data.es.json`, `data.en.json` the prepared dataset, the scikit-learn reference results and the precomputed Taiwan case; `engine.css` the styles, scoped under `.tfp` and mapped to the hub palette (zinc, amber accent).
- `gen/datos_sitio.py` regenerates `data.es.json` from the Excel generators' JSON files (`datos_log.json`, `datos_reg.json`, `datos_bal.json`) and the Taiwan CSV.
- `excel/` the three Excel workbooks (base German Credit, regularization, imbalance) linked from the site.
- `notebooks/` the two Colab notebooks (05 German Credit logistic regression, 06 Taiwan beyond logistic regression) linked from the site.

## Run

```
npm install
npm run dev
npm run build
```

## Publish (same flow as the other playgrounds)

1. Create the GitHub repo `daviddiazsolis/classification_intro_playground` (empty, no README).
2. In this folder: `git init`, `git add .`, `git commit -m "Classification Intro"`, `git branch -M main`, `git remote add origin https://github.com/daviddiazsolis/classification_intro_playground.git`, `git push -u origin main`.
3. In Vercel: Add New Project, import the repo, framework Vite, deploy. The project name `classification-intro-playground` gives the URL `https://classification-intro-playground.vercel.app`, which is the one written in `ml_ai_portal/src/utils/sites.ts`, in `daviddiazsolis-web/src/components/Tools.tsx` and in the Colab / raw links of `NotebooksSection.tsx`.
4. Rebuild and push `ml_ai_portal` and `daviddiazsolis-web` so the new cards appear.
