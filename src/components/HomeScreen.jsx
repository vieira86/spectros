import { useMemo, useState } from 'react'
import { parseSmiles } from '../chem/rdkit'
import { formulaOf } from '../engine/molecule.js'
import { formulaOfAtoms, nominalMass } from '../engine/mass.js'
import { EXAMPLES } from '../data/examples'
import { subscript, fmt } from '../utils/format'
import MoleculeView from './MoleculeView'
import DrawPanel from './DrawPanel'
import { Toggle } from './ui'

const HOW = [
  { icon: '✏️', title: 'Estrutura', desc: 'Desenhe a molécula ou digite o SMILES' },
  { icon: '⚡', title: 'Íon molecular', desc: 'Massa, ionização e padrão isotópico' },
  { icon: '✂️', title: 'Fragmentação', desc: 'α-clivagem, McLafferty, tropílio… na estrutura' },
  { icon: '📊', title: 'Espectro', desc: 'EM-IE (70 eV) simulado e interativo' }
]

const HomeScreen = ({ rdkit, rdkitError, initialSmiles = '', onAnalyze }) => {
  const [smiles, setSmiles] = useState(initialSmiles)
  const [tab, setTab] = useState('smiles')
  const [exName, setExName] = useState('')

  const parsed = useMemo(() => (rdkit ? parseSmiles(rdkit, smiles) : { error: 'loading' }), [rdkit, smiles])
  const formula = useMemo(() => (parsed.mol ? formulaOf(parsed.mol) : null), [parsed])

  const submit = e => {
    e?.preventDefault()
    if (!parsed.mol) return
    onAnalyze({ smiles: smiles.trim(), name: exName })
  }
  const loadExample = ex => {
    setSmiles(ex.smiles)
    setExName(ex.name)
    document.getElementById('mol-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const edit = v => {
    setSmiles(v)
    setExName('')
  }

  return (
    <div className="relative">
      <div className="hero-blob w-72 h-72 bg-indigo-300 dark:bg-indigo-800 -top-10 -left-16 animate-blob" aria-hidden="true" />
      <div className="hero-blob w-72 h-72 bg-fuchsia-300 dark:bg-fuchsia-800 top-24 -right-16 animate-blob-delayed" aria-hidden="true" />

      <div className="relative max-w-4xl mx-auto">
        <div className="text-center pt-2 pb-8 animate-fade-in-up">
          <span className="stat-chip">⚛️ Espectrometria de massas · impacto de elétrons (70 eV)</span>
          <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">SPECTROS</span>
            <span className="block mt-2 text-lg sm:text-2xl font-semibold text-gray-500 dark:text-gray-400 tracking-normal">Mass Spectrometry System</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Da estrutura ao espectro: veja o íon molecular, os isótopos e cada fragmentação que forma os picos</p>
        </div>

        <form id="mol-form" onSubmit={submit} className="glass-morphism rounded-3xl p-5 sm:p-8 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Qual molécula você quer analisar?</p>
            <Toggle
              options={[
                { value: 'smiles', label: '⌨️ SMILES' },
                { value: 'draw', label: '✏️ Desenhar' }
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>

          {tab === 'draw' && (
            <div className="mt-4">
              <DrawPanel smiles={smiles} onChange={edit} />
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              id="smiles"
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              value={smiles}
              onChange={e => edit(e.target.value)}
              placeholder="Ex.: CCC(C)=O (butanona)"
              aria-label="SMILES"
              className="flex-1 min-w-0 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-lg font-mono text-gray-900 placeholder:text-slate-400 placeholder:font-sans focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
            <button type="submit" className="btn-primary text-base sm:py-0" disabled={!parsed.mol}>
              Simular EM <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="mt-3 min-h-[1.5rem] text-sm">
            {rdkitError ? (
              <span className="text-rose-600">{rdkitError}</span>
            ) : !rdkit ? (
              <span className="text-slate-500">Carregando o RDKit (motor químico)…</span>
            ) : !smiles.trim() ? (
              <span className="text-slate-500 dark:text-slate-400">
                SMILES: <code className="wn">CCO</code> etanol · <code className="wn">Cc1ccccc1</code> tolueno · <code className="wn">CCBr</code> bromoetano.
              </span>
            ) : parsed.error ? (
              <span className="text-rose-600 font-medium">{parsed.error}</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ {exName ? `${exName} · ` : ''}
                <span className="wn">{subscript(formula.text)}</span>
                <span className="text-slate-500 font-normal"> · M = {nominalMass(formulaOfAtoms(parsed.mol, new Set(parsed.mol.atoms.map(a => a.idx))))}</span>
                {formula.idh != null && <span className="text-slate-500 font-normal"> · IDH = {fmt(formula.idh, 0)}</span>}
              </span>
            )}
          </div>

          {parsed.mol && tab === 'smiles' && (
            <div className="mt-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-3 flex justify-center">
              <MoleculeView mol={parsed.mol} maxHeight={220} />
            </div>
          )}
        </form>

        <div className="mt-10">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Como funciona</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {HOW.map((s, i) => (
              <div key={s.title} className="glass-morphism rounded-2xl p-4 text-center animate-fade-in-up" style={{ animationDelay: `${120 + i * 80}ms` }}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Passo {i + 1}</p>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{s.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Pratique com exemplos</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {EXAMPLES.map(ex => (
              <button type="button" key={ex.id} onClick={() => loadExample(ex)} className="card p-3 text-left hover:shadow-md hover:border-indigo-300 transition-all">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">{ex.tag}</span>
                <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mt-0.5">{ex.name}</p>
                <p className="wn text-xs text-slate-500 dark:text-slate-400 mt-1 break-all">{ex.smiles}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
