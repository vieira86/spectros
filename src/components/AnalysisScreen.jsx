import { useEffect, useMemo, useRef, useState } from 'react'
import { STEPS } from '../data/steps'
import { subscript, fmt, ionText, pct } from '../utils/format'
import MoleculeView from './MoleculeView'
import { StepEstrutura, StepIonizacao, StepIsotopos, StepFragmentos, StepPerdas, StepEspectro } from './Steps'
import ResultPanel from './ResultPanel'
import SpectrumMS from './SpectrumMS'

const RESULT = STEPS.length
const LABELS = [...STEPS.map(s => s.short), 'Resumo']

const ProgressBar = ({ current, onGo }) => (
  <nav aria-label="Etapas da análise" className="card px-3 py-3 sm:px-5">
    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
      <span>{current === RESULT ? 'Análise concluída' : `Etapa ${current + 1} de ${STEPS.length}`}</span>
      <span>{Math.round((current / RESULT) * 100)}%</span>
    </div>
    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 transition-all duration-500" style={{ width: `${(current / RESULT) * 100}%` }} />
    </div>
    <ol className="mt-3 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {LABELS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="shrink-0">
            <button
              type="button"
              onClick={() => onGo(i)}
              aria-current={active ? 'step' : undefined}
              className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white border-transparent'
                  : done
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30'
                    : 'bg-white text-gray-500 border-slate-200 dark:bg-slate-900 dark:text-gray-400 dark:border-slate-700'
              }`}
            >
              {done && !active ? '✓ ' : ''}
              {label}
            </button>
          </li>
        )
      })}
    </ol>
  </nav>
)

const AnalysisScreen = ({ an, smiles, name, onEdit, onRestart }) => {
  const [current, setCurrent] = useState(0)
  const [selPath, setSelPath] = useState(null)
  const [selMz, setSelMz] = useState(null)
  const [guessed, setGuessed] = useState(false)
  const topRef = useRef(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [current])

  const byId = useMemo(() => new Map(an.allPathways.map(g => [g.id, g])), [an])
  const step = STEPS[current]
  const stepId = current === RESULT ? 'resumo' : step.id
  const sel = selPath ? byId.get(selPath) : null
  const showFrag = ['fragmentos', 'perdas', 'espectro', 'resumo'].includes(stepId)

  const selectPath = id => {
    setSelPath(v => (v === id ? null : id))
    const g = byId.get(id)
    if (g) setSelMz(g.mz)
  }
  const selectMz = mz => {
    setSelMz(mz)
    const p = an.peaks.find(x => x.mz === mz)
    const c = p?.contributors[0]
    setSelPath(c && c.src !== 'M' ? c.src : null)
  }

  // destaques na estrutura
  const view = useMemo(() => {
    const tags = new Map()
    const halos = new Map()
    if (showFrag && sel) {
      const fr = sel.rep.frag
      for (const i of fr.ion) halos.set(i, sel.mech.color)
      if (fr.chargeAtom != null && fr.ion.has(fr.chargeAtom)) tags.set(fr.chargeAtom, { text: sel.oddElectron ? '•+' : '+', color: sel.mech.color })
      if (fr.hFrom != null) tags.set(fr.hFrom, { text: 'H', color: '#db2777' })
      return { tags, halos, focus: fr.ion, cut: new Set(fr.cut) }
    }
    if (current >= 1) {
      const s0 = an.sites[0]
      const a = s0.atoms.length > 2 ? s0.atoms[0] : s0.atoms[0]
      for (const i of s0.atoms) halos.set(i, '#4f46e5')
      tags.set(a, { text: '•+', color: '#4f46e5' })
    }
    return { tags, halos, focus: null, cut: null }
  }, [an, sel, showFrag, current])

  const wide = showFrag && stepId !== 'espectro' && stepId !== 'resumo'

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* estrutura */}
      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              ✓ {name ? `${name} · ` : ''}
              <span className="wn">{subscript(an.formula.text)}</span>
              <span className="text-slate-500 font-normal">
                {' '}
                · M = <span className="wn">{an.M}</span> · {fmt(an.masses.avg, 2)} g/mol
              </span>
            </p>
            <p className="wn text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-all">{smiles}</p>
          </div>
          <button type="button" onClick={onEdit} className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
            ✎ Editar molécula
          </button>
        </div>
        <div className={`mt-2 grid gap-4 items-center ${wide ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]' : ''}`}>
          <div className="rounded-2xl bg-white dark:bg-slate-900 flex flex-col items-center">
            <MoleculeView mol={an.mol} tags={view.tags} halos={view.halos} focus={view.focus} cutBonds={view.cut} maxHeight={300} />
            {showFrag && sel && (
              <p className="text-xs text-center text-slate-600 dark:text-slate-300 mt-1">
                Fica no íon: átomos destacados · <span className="text-rose-600 font-semibold">- - -</span> ligação rompida
                {sel.rep.frag.hFrom != null ? ' · H = hidrogênio transferido' : ''} · <b className="wn">{ionText(sel.formulaText, sel.oddElectron)}</b> m/z {sel.mz} ({pct(sel.rel)}%)
                {sel.level > 0 ? ` · formado a partir do íon ${sel.parentMz}` : ''}
              </p>
            )}
          </div>
          {wide && (
            <div className="hidden md:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Prévia do espectro</p>
              <SpectrumMS peaks={an.peaks} M={an.M} basePeak={an.basePeak.mz} selected={selMz} onSelect={selectMz} height={280} compact />
            </div>
          )}
        </div>
        {current >= 1 && !(showFrag && sel) && <p className="text-xs text-slate-500 mt-1 text-center">•+ = sítio provável da ionização ({an.sites[0].label})</p>}
        {an.warnings.map((w, i) => (
          <p key={i} className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            ⚠ {w}
          </p>
        ))}
      </section>

      <div ref={topRef} className="scroll-mt-20" />
      <ProgressBar current={current} onGo={setCurrent} />

      {current < RESULT && (
        <section className="space-y-3 animate-fade-in-up" key={current}>
          <div>
            <h2 className="section-title">
              <span>{step.icon}</span> {step.title}
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300">{step.intro}</p>
          </div>
          {step.id === 'estrutura' && <StepEstrutura an={an} />}
          {step.id === 'ionizacao' && <StepIonizacao an={an} />}
          {step.id === 'isotopos' && <StepIsotopos an={an} />}
          {step.id === 'fragmentos' && <StepFragmentos an={an} sel={selPath} onSelect={selectPath} />}
          {step.id === 'perdas' && <StepPerdas an={an} sel={selPath} onSelect={selectPath} />}
          {step.id === 'espectro' && <StepEspectro an={an} selMz={selMz} onSelectMz={selectMz} sel={selPath} onSelectPath={selectPath} guessed={guessed} setGuessed={setGuessed} />}
        </section>
      )}
      {current === RESULT && <ResultPanel an={an} selMz={selMz} onSelectMz={selectMz} onRestart={onRestart} onReview={() => setCurrent(0)} />}

      {current < RESULT && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button type="button" className="btn-ghost" onClick={() => (current === 0 ? onEdit() : setCurrent(c => c - 1))}>
            ← {current === 0 ? 'Molécula' : 'Anterior'}
          </button>
          <div className="flex gap-2">
            {current < STEPS.length - 1 && (
              <button type="button" onClick={() => setCurrent(RESULT)} className="hidden sm:inline-flex btn-ghost">
                Ir ao resumo
              </button>
            )}
            <button type="button" className="btn-primary" onClick={() => setCurrent(c => c + 1)}>
              {current === STEPS.length - 1 ? 'Ver resumo' : 'Próxima etapa'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalysisScreen
