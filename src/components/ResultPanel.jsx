import { msReport } from '../engine/index.js'
import { ionText, neutralLabel, pct } from '../utils/format'
import { CopyBox, Note } from './ui'
import SpectrumMS from './SpectrumMS'

const ResultPanel = ({ an, selMz, onSelectMz, onRestart, onReview }) => {
  const byId = new Map(an.allPathways.map(g => [g.id, g]))
  const rows = an.peaks.filter(p => (p.rel >= 3 && (!p.isotope || p.rel >= 10)) || (p.main === 'M' && !p.isotope)).sort((a, b) => b.mz - a.mz)
  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-5">
        <h3 className="section-title">📊 Espectro de massas (IE, 70 eV)</h3>
        <div className="mt-2">
          <SpectrumMS peaks={an.peaks} M={an.M} basePeak={an.basePeak.mz} selected={selMz} onSelect={onSelectMz} />
        </div>
      </div>
      <div className="card p-4 sm:p-5">
        <h3 className="section-title">📋 Resumo dos picos</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-3">m/z</th>
                <th className="py-2 pr-3">%</th>
                <th className="py-2 pr-3">Íon</th>
                <th className="py-2 pr-3">Perda</th>
                <th className="py-2">Atribuição</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const c = p.contributors[0]
                const g = c.src === 'M' ? null : byId.get(c.src)
                const isM = c.src === 'M'
                return (
                  <tr key={p.mz} onClick={() => onSelectMz(p.mz)} className={`border-t border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selMz === p.mz ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}>
                    <td className="py-2 pr-3 wn">{p.mz}</td>
                    <td className="py-2 pr-3 wn">{pct(p.rel)}</td>
                    <td className="py-2 pr-3 wn">{isM ? (c.d ? `M+${c.d}` : 'M⁺•') : c.d ? `${g.mz}+${c.d}` : ionText(g.formulaText, g.oddElectron)}</td>
                    <td className="py-2 pr-3 wn">{isM || c.d ? '—' : g.level === 0 ? `M − ${an.M - g.mz} (${neutralLabel(g.neutralText, g.neutralRadical)})` : `${g.parentMz} − ${g.neutralMass}`}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{isM ? (c.d ? 'pico isotópico do íon molecular' : 'íon molecular') : c.d ? 'pico isotópico' : `${g.mech.short} · ${g.ionName}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <CopyBox text={msReport(an)} />
        </div>
      </div>

      <Note tone="warn">
        <b>Lembre:</b> o SPECTROS gera um espectro <b>estimado</b> por regras de fragmentação (estabilidade de cátions e radicais, rearranjos clássicos), como se faz à mão nas aulas. As posições (m/z) dos fragmentos previstos são exatas; as <b>intensidades são qualitativas</b>. Não são
        considerados: rearranjos complexos, efeitos orto, migrações de H múltiplas e dependência do instrumento. Compare sempre com um espectro experimental (ex.: NIST WebBook).
      </Note>

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className="btn-ghost" onClick={onReview}>
          ← Revisar etapas
        </button>
        <button type="button" className="btn-primary" onClick={onRestart}>
          Nova molécula
        </button>
      </div>
    </div>
  )
}

export default ResultPanel
