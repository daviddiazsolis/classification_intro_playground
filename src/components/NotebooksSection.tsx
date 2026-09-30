// SPDX-License-Identifier: Apache-2.0
import { motion } from 'motion/react'
import { BookOpen, ExternalLink, Table2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const REPO = 'https://github.com/daviddiazsolis/classification_intro_playground'
const NB = (f: string) => `https://colab.research.google.com/github/daviddiazsolis/classification_intro_playground/blob/main/notebooks/${f}`
// Cada notebook existe en español (es) y en inglés (en); el botón abre el del idioma activo.
const NOTEBOOKS = [
  { k: 'nb1', es: '05_Riesgo_de_Credito_Regresion_Logistica.ipynb', en: '05_Riesgo_de_Credito_Regresion_Logistica_EN.ipynb' },
  { k: 'nb2', es: '06_Riesgo_de_Credito_Taiwan_Mas_Alla_de_la_Logistica.ipynb', en: '06_Riesgo_de_Credito_Taiwan_Mas_Alla_de_la_Logistica_EN.ipynb' },
  { k: 'nb3', es: '07_Calibracion_de_Probabilidades.ipynb', en: '07_Calibracion_de_Probabilidades_EN.ipynb' },
]
// Cada planilla existe en español (es) y en inglés (en); el botón principal descarga la del idioma activo.
const EXCELS = [
  { k: 'xl1', es: 'logistica_01_german_credit.xlsx', en: 'logistic_01_german_credit_EN.xlsx' },
  { k: 'xl2', es: 'logistica_02_regularizacion.xlsx', en: 'logistic_02_regularization_EN.xlsx' },
  { k: 'xl3', es: 'logistica_03_desbalanceo.xlsx', en: 'logistic_03_class_imbalance_EN.xlsx' },
]
const XL = (f: string) => `${REPO}/raw/main/excel/${f}`

export default function NotebooksSection() {
  const { t, language } = useLanguage()
  const other = language === 'es' ? 'en' : 'es'
  return (
    <section id="notebooks" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800/50 scroll-mt-16">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
          <Table2 className="w-5 h-5 text-amber-400" />
          {t('xlTitle')}
        </h2>
        <p className="text-zinc-400 text-sm mb-6">{t('xlSubtitle')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {EXCELS.map(x => (
            <div key={x.k} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col">
              <h3 className="font-semibold text-zinc-200 mb-2 font-mono text-sm">{x[language]}</h3>
              <p className="text-sm text-zinc-500 mb-4 leading-relaxed flex-1">{t(x.k + 'Desc')}</p>
              <div className="flex flex-wrap gap-2">
                <a href={XL(x[language])} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-900 bg-amber-500 transition-opacity hover:opacity-80">
                  <ExternalLink className="w-3 h-3" /> .xlsx
                </a>
                <a href={XL(x[other])} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                  {t('nbOther')}
                </a>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          {t('nbTitle')}
        </h2>
        <p className="text-zinc-400 text-sm mb-6">{t('nbSubtitle')}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {NOTEBOOKS.map(nb => (
            <div key={nb.k} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col">
              <h3 className="font-semibold text-zinc-200 mb-2">{t(nb.k + 'Title')}</h3>
              <p className="text-sm text-zinc-500 mb-4 leading-relaxed flex-1">{t(nb.k + 'Desc')}</p>
              <div className="flex gap-2">
                <a href={NB(nb[language])} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-900 bg-amber-500 transition-opacity hover:opacity-80">
                  <ExternalLink className="w-3 h-3" /> {t('nbOpen')}
                </a>
                <a href={NB(nb[other])} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                  {t('nbOther')}
                </a>
                <a href={REPO} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
