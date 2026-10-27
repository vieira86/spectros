import { useMemo, useState } from 'react'
import { fmt, subscript, ionText, neutralLabel, pct } from '../utils/format'
import { isobaricFormulas } from '../engine/mass.js'
import { ELEMENTS } from '../data/elements.js'
import { MECH_GROUPS, COMMON_LOSSES, COMMON_IONS } from '../data/mechanisms.js'
import { Note, Toggle, Check } from './ui'
import SpectrumMS from './SpectrumMS'

const Card = ({ children, className = '' }) => <div className={`card p-4 sm:p-5 ${className}`}>{children}</div>
const Label = ({ children }) => <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>
const Big = ({ children }) => <p className="mt-1 text-3xl font-bold wn text-gray-900 dark:text-white">{children}</p>

const MzBubble = ({ mz, color }) => (
  <span className="inline-flex items-center justify-center rounded-xl text-white font-bold wn text-sm min-w-[3rem] h-9 px-2 shrink-0" style={{ background: color }}>
    {mz}
  </span>
)

export const Equation = ({ g, M, className = '' }) => (
  <p className={`text-sm text-slate-700 dark:text-slate-200 wn font-medium ${className}`}>
    {g.level === 0 ? (
      <>
        M⁺• <span className="text-slate-400">({M})</span>
      </>
    ) : (
      <>
        íon {g.parentMz}
      </>
    )}{' '}
    → <span className="text-indigo-700 dark:text-indigo-300">{ionText(g.formulaText, g.oddElectron)}</span> <span className="text-slate-400">({g.mz})</span> + <span>{neutralLabel(g.neutralText, g.neutralRadical)}</span>{' '}
    <span className="text-slate-400">({g.neutralMass} u)</span>
  </p>
)

const Challenge = ({ question, answer, unit = '', hint, onSolved, children }) => {
  const [guess, setGuess] = useState('')
  const [state, setState] = useState(null)
  const check = e => {
    e.preventDefault()
    const g = parseFloat(String(guess).replace(',', '.'))
    if (Number.isNaN(g)) return
    const ok = Math.abs(g - answer) < 0.5
    setState(ok ? 'ok' : 'no')
    if (ok) onSolved?.()
  }
  return (
    <Card>
      <form onSubmit={check} className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="font-semibold text-gray-900 dark:text-white flex-1">{question}</label>
        <div className="flex gap-2 items-center">
          <input type="text" inputMode="decimal" value={guess} onChange={e => setGuess(e.target.value)} className="w-28 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 font-mono text-lg dark:bg-slate-900 dark:border-slate-700" aria-label="sua resposta" />
          {unit && <span className="text-slate-500">{unit}</span>}
          <button className="btn-primary !py-2 !px-5" type="submit">
            Conferir
          </button>
          <button type="button" className="text-sm font-semibold text-slate-500 hover:underline" onClick={() => setState('show')}>
            Mostrar
          </button>
        </div>
      </form>
      {state === 'ok' && <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">✓ Isso mesmo!</p>}
      {state === 'no' && <p className="mt-2 text-sm font-semibold text-rose-600">Ainda não. {hint}</p>}
      {(state === 'ok' || state === 'show') && <div className="mt-2">{children}</div>}
    </Card>
  )
}

// ── 1. Massa ────────────────────────────────────────────────────────────────
export const StepEstrutura = ({ an }) => {
  const F = an.formula.F
  const order = Object.keys(F).sort((a, b) => (a === 'C' ? -1 : b === 'C' ? 1 : a === 'H' ? -1 : b === 'H' ? 1 : a.localeCompare(b)))
  const sum = order.map(el => `${F[el]}×${ELEMENTS[el].nominal}`).join(' + ')
  const iso = useMemo(() => isobaricFormulas(F, 5), [F])
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <Label>Fórmula molecular</Label>
          <Big>{subscript(an.formula.text)}</Big>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Grupos: {an.groupNames.join(', ')}</p>
        </Card>
        <Card>
          <Label>Índice de deficiência de H</Label>
          <Big>{an.formula.idh == null ? '—' : fmt(an.formula.idh, 0)}</Big>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{an.formula.idh >= 4 ? 'IDH ≥ 4: provável anel aromático.' : an.formula.idh ? 'Anéis e/ou ligações π.' : 'Nenhum anel ou ligação π.'}</p>
          <p className="text-xs text-slate-400 mt-1 wn">IDH = C − H/2 − X/2 + N/2 + 1</p>
        </Card>
        <Card>
          <Label>Massa molar (média)</Label>
          <Big>{fmt(an.masses.avg, 2)}</Big>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">g/mol — usada na balança, não no espectrômetro.</p>
        </Card>
      </div>

      <Challenge
        question="Qual m/z você espera para o íon molecular (massa nominal, com os isótopos mais abundantes)?"
        answer={an.M}
        hint="Use massas inteiras: C = 12, H = 1, N = 14, O = 16, Cl = 35, Br = 79…"
      >
        <p className="text-sm text-slate-700 dark:text-slate-200">
          <span className="wn">{sum}</span> = <b className="wn text-indigo-700 dark:text-indigo-300 text-base">{an.M}</b>
        </p>
      </Challenge>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <Label>Três "massas" diferentes</Label>
          <table className="mt-2 w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 pr-2">Nominal</td>
                <td className="py-2 wn text-right">{an.M}</td>
                <td className="py-2 pl-3 text-slate-500 text-xs">inteiros do isótopo mais abundante (espectrômetro de baixa resolução)</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 pr-2">Monoisotópica</td>
                <td className="py-2 wn text-right">{fmt(an.masses.mono, 4)}</td>
                <td className="py-2 pl-3 text-slate-500 text-xs">massas exatas: ¹H = 1,00783; ¹⁶O = 15,99491… (alta resolução)</td>
              </tr>
              <tr>
                <td className="py-2 pr-2">Média</td>
                <td className="py-2 wn text-right">{fmt(an.masses.avg, 3)}</td>
                <td className="py-2 pl-3 text-slate-500 text-xs">média ponderada dos isótopos (tabela periódica)</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">
            m/z exata de M⁺• (descontando 1 elétron): <b className="wn">{fmt(an.masses.ionExact, 4)}</b>
          </p>
        </Card>
        {iso.length > 1 && (
          <Card>
            <Label>Alta resolução (EMAR): quem tem m/z {an.M}?</Label>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Várias fórmulas têm a mesma massa nominal, mas massas exatas diferentes. Um espectrômetro de alta resolução as distingue.</p>
            <table className="mt-2 w-full text-sm">
              <thead className="text-xs text-slate-500 text-left">
                <tr>
                  <th className="py-1">Fórmula</th>
                  <th className="py-1 text-right">Massa exata</th>
                  <th className="py-1 text-right">Δ (mDa)</th>
                </tr>
              </thead>
              <tbody>
                {iso.map(x => (
                  <tr key={x.text} className={`border-t border-slate-100 dark:border-slate-800 ${Math.abs(x.delta) < 1e-6 ? 'font-bold text-indigo-700 dark:text-indigo-300' : ''}`}>
                    <td className="py-1 wn">{subscript(x.text)}</td>
                    <td className="py-1 wn text-right">{fmt(x.mono, 4)}</td>
                    <td className="py-1 wn text-right">{Math.abs(x.delta) < 1e-6 ? '—' : (x.delta > 0 ? '+' : '−') + fmt(Math.abs(x.delta) * 1000, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  )
}

// ── 2. Ionização ────────────────────────────────────────────────────────────
export const StepIonizacao = ({ an }) => {
  const s0 = an.sites[0]
  const m = an.mInfo
  const r13 = an.rule13
  const tone = m.rel >= 20 ? 'ok' : m.rel >= 5 ? 'info' : 'warn'
  return (
    <div className="space-y-3">
      <Card className="text-center">
        <p className="text-xl sm:text-2xl font-semibold wn text-gray-900 dark:text-white">
          {subscript(an.formula.text)} + e⁻ <span className="text-slate-400 text-base">(70 eV)</span> → <span className="text-indigo-700 dark:text-indigo-300">[{subscript(an.formula.text)}]⁺•</span> + 2 e⁻
        </p>
        <p className="text-sm text-slate-500 mt-2">
          m/z do íon molecular: <b className="wn text-gray-900 dark:text-white">{an.M}</b>
        </p>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <Label>De onde sai o elétron?</Label>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Sai o elétron menos "preso" (menor energia de ionização). Regra geral: <b>n &gt; π &gt; σ</b> — elétrons não ligantes (N, O, S, halogênios) saem antes dos π, que saem antes dos σ. Num alcano só restam elétrons σ, por isso os alcanos fragmentam tanto.
          </p>
          <ol className="mt-3 space-y-1.5">
            {an.sites.map((s, i) => (
              <li key={s.key} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${i === 0 ? 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                <span className="wn text-xs mt-0.5 w-14 shrink-0 text-slate-500">{fmt(s.ie, 1)} eV</span>
                <span className="flex-1">
                  <span className={i === 0 ? 'font-semibold text-indigo-800 dark:text-indigo-200' : ''}>{s.label}</span>
                  <span className="block text-xs text-slate-500">{s.model}</span>
                </span>
                {i === 0 && <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">•+ aqui</span>}
              </li>
            ))}
          </ol>
          <p className="text-xs text-slate-500 mt-2">Na estrutura, o símbolo •+ marca o sítio provável da carga e do radical ({s0.label}). Ele direciona as α-clivagens.</p>
          {an.sites.some((s, i) => /^n|par de elétrons n/.test(s.label) && an.sites.slice(0, i).some(t => /π/.test(t.label))) && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Repare: aqui um elétron π tem energia de ionização menor que um elétron n. A regra n &gt; π &gt; σ é uma tendência; os valores medidos (eV) é que decidem.</p>
          )}
        </Card>

        <div className="space-y-3">
          <Card>
            <Label>Regra do nitrogênio</Label>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              M = <b className="wn">{an.M}</b> é <b>{an.nitrogen.odd ? 'ímpar' : 'par'}</b> → a molécula tem{' '}
              <b>{an.nitrogen.odd ? 'número ímpar de N' : 'zero ou número par de N'}</b> ({an.nitrogen.nN} N na fórmula {an.nitrogen.ok ? '✓' : '⚠'}).
            </p>
            <p className="text-xs text-slate-500 mt-1">Vale porque o N é o único elemento comum com massa par e valência ímpar. Fragmentos de clivagem simples (sem N) têm m/z ímpar; rearranjos e perdas de molécula neutra (McLafferty, H₂O, retro-Diels–Alder) dão m/z par.</p>
          </Card>
          <Card>
            <Label>Regra do 13</Label>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200 wn">
              {an.M} ÷ 13 = {r13.n} (resto {r13.r}) → fórmula-base C<sub>{r13.n}</sub>H<sub>{r13.n + r13.r}</sub>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Ponto de partida quando só se conhece M: troque CH₄ por O (16), CH₂ por N (14)… e ajuste até chegar à fórmula real ({subscript(an.formula.text)}).
            </p>
          </Card>
        </div>
      </div>

      <Card>
        <Label>Como ter certeza de que aquele pico é o íon molecular?</Label>
        <ul className="mt-2 grid sm:grid-cols-2 gap-2 text-sm text-slate-700 dark:text-slate-200">
          <li className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">🎚️ <b>Variar a energia:</b> diminuindo a energia do feixe de elétrons, o pico do M⁺• deve aumentar (há menos fragmentação).</li>
          <li className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">⚪ <b>Elétron ímpar:</b> M⁺• é um cátion-radical (nº ímpar de elétrons). Íons de nº par de elétrons não podem ser M.</li>
          <li className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">🔢 <b>Regra do nitrogênio:</b> M par → nenhum ou nº par de N; M ímpar → nº ímpar de N.</li>
          <li className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">🚫 <b>Perdas impossíveis:</b> perdas de 4 a 14 u e de 21 a 25 u são muito improváveis. Se houver um pico a essa distância abaixo do suposto M, o M verdadeiro está mais acima.</li>
        </ul>
        <p className="text-xs text-slate-500 mt-2">Na dúvida, repete-se a análise com ionização química (CI) e procura-se o [M+H]⁺. O detector lê a massa do íon com os isótopos que ele tiver — por isso, ao lado de M, aparecem M+1 e M+2.</p>
      </Card>

      <Note tone={tone}>
        <p>
          <b>Estabilidade de M⁺•:</b> esperado <b>{m.label}</b> (~{pct(m.rel)}% do pico-base nesta simulação).
        </p>
        <ul className="mt-1 list-disc pl-5 space-y-0.5">
          {m.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </Note>
    </div>
  )
}

// ── 3. Isótopos ─────────────────────────────────────────────────────────────
const ISO_PATTERNS = [
  { k: 'Cl', txt: '1 Cl: M e M+2 na razão ~3:1 (³⁵Cl 75,8% · ³⁷Cl 24,2%)' },
  { k: 'Cl2', txt: '2 Cl: M, M+2, M+4 ≈ 9 : 6 : 1' },
  { k: 'Br', txt: '1 Br: M e M+2 quase iguais, ~1:1 (⁷⁹Br 50,7% · ⁸¹Br 49,3%)' },
  { k: 'Br2', txt: '2 Br: M, M+2, M+4 ≈ 1 : 2 : 1' },
  { k: 'S', txt: 'S: M+2 de ~4–5% por átomo de S (³⁴S)' }
]

export const StepIsotopos = ({ an }) => {
  const F = an.formula.F
  const iso = an.isotopes.filter(x => x.d <= 4)
  const m1 = iso.find(x => x.d === 1)?.rel ?? 0
  const m2 = iso.find(x => x.d === 2)?.rel ?? 0
  const nC = F.C || 0
  const est = m1 / 1.1
  const maxRel = Math.max(...iso.map(x => x.rel))
  const present = ISO_PATTERNS.filter(p => (p.k === 'Cl' && F.Cl === 1) || (p.k === 'Cl2' && F.Cl === 2) || (p.k === 'Br' && F.Br === 1) || (p.k === 'Br2' && F.Br === 2) || (p.k === 'S' && F.S))
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Card>
          <Label>Região do íon molecular</Label>
          <svg viewBox="0 0 320 180" className="w-full mt-2" role="img" aria-label="Padrão isotópico do íon molecular">
            {iso.map((x, i) => {
              const h = (x.rel / maxRel) * 120
              const xx = 40 + i * 62
              return (
                <g key={x.d}>
                  <rect x={xx - 9} y={140 - h} width={18} height={h} rx="2" fill={x.d === 0 ? '#4f46e5' : '#c026d3'} opacity={x.d === 0 ? 1 : 0.75} />
                  <text x={xx} y={134 - h} textAnchor="middle" fontSize="12" fontWeight="700" className="fill-slate-700 dark:fill-slate-200 font-mono">
                    {pct(x.rel)}
                  </text>
                  <text x={xx} y={158} textAnchor="middle" fontSize="12" className="fill-slate-500 font-mono">
                    {an.M + x.d}
                  </text>
                  <text x={xx} y={174} textAnchor="middle" fontSize="11" className="fill-slate-400">
                    {x.d === 0 ? 'M' : `M+${x.d}`}
                  </text>
                </g>
              )
            })}
            <line x1="20" x2="310" y1="140" y2="140" stroke="#94a3b8" />
          </svg>
          <p className="text-xs text-slate-500">Intensidades relativas a M = 100 (calculadas pela abundância natural dos isótopos).</p>
        </Card>
        <div className="space-y-3">
          <Card>
            <Label>Quantos carbonos? (pico M+1)</Label>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              Cada C contribui com ~1,1% de ¹³C para M+1:
              <span className="block mt-1 wn">
                n(C) ≈ {fmt(m1, 1)} ÷ 1,1 ≈ <b className="text-indigo-700 dark:text-indigo-300">{fmt(est, 1)}</b>
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              A fórmula tem {nC} C. A diferença vem do ²H, ¹⁵N, ¹⁷O… e, no espectro real, da incerteza de medir picos pequenos.
            </p>
          </Card>
          <Card>
            <Label>Pico M+2: halogênios e enxofre</Label>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              M+2 = <b className="wn">{fmt(m2, 1)}%</b> de M.{' '}
              {present.length ? 'Padrão característico:' : m2 < 3 ? 'Pequeno: sem Cl, Br ou S (só ¹⁸O e dois ¹³C).' : ''}
              {(F.F || F.I) && !present.length ? ' Flúor e iodo são monoisotópicos: não deixam M+2.' : ''}
            </p>
            {present.length > 0 && (
              <ul className="mt-1 text-sm list-disc pl-5 text-indigo-800 dark:text-indigo-200">
                {present.map(p => (
                  <li key={p.k}>{p.txt}</li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <Note>
        <b>Padrões para memorizar:</b> {ISO_PATTERNS.map(p => p.txt).join(' · ')} · F e I são monoisotópicos (sem M+2). Viu um M+2 enorme? Pense em Cl ou Br. O mesmo vale para os fragmentos: um fragmento que ainda contém Cl ou Br também aparece em "dupla".
      </Note>
    </div>
  )
}

// ── 4. Fragmentos ───────────────────────────────────────────────────────────
export const PathCard = ({ g, M, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(g.id)}
    className={`w-full text-left rounded-2xl border p-3 transition-all ${selected ? 'border-transparent ring-2 shadow-md bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white/70 dark:bg-slate-900/60'}`}
    style={selected ? { '--tw-ring-color': g.mech.color } : undefined}
  >
    <div className="flex items-start gap-3">
      <MzBubble mz={g.mz} color={g.mech.color} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{g.mech.short}</p>
          <span className="wn text-xs text-slate-500">{pct(g.rel)}%</span>
        </div>
        <Equation g={g} M={M} className="mt-0.5" />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {g.ionName}
          {g.neutralName ? ` · sai ${g.neutralRadical ? 'o radical' : ''} ${g.neutralName}` : ''}
        </p>
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, g.rel)}%`, background: g.mech.color }} />
        </div>
      </div>
    </div>
    {selected && (
      <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2 space-y-2">
        <p className="text-sm text-slate-700 dark:text-slate-200">{g.mech.text}</p>
        {g.level === 0 && g.parts?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500">Por que é favorecido? Pontuação do modelo:</span>
            {g.parts.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1">
                <span className="text-slate-500">{p.label}</span>
                <b className="wn">{(p.value >= 0 && i ? '+' : '') + fmt(p.value, 1)}</b>
              </span>
            ))}
            <span className="font-semibold text-slate-500">
              = <b className="wn text-indigo-700 dark:text-indigo-300">{fmt(g.score, 1)}</b>
            </span>
          </div>
        )}
        <p className="text-xs text-slate-500">
          {g.oddElectron ? 'Íon de número ímpar de elétrons (cátion-radical, OE⁺•)' : 'Íon de número par de elétrons (cátion, EE⁺)'} · m/z exata {fmt(g.exactMz, 4)}
          {g.count > 1 ? ` · ${g.count} caminhos equivalentes` : ''}
        </p>
      </div>
    )}
  </button>
)

export const StepFragmentos = ({ an, sel, onSelect }) => {
  const [mode, setMode] = useState('main')
  const all = mode === 'all'
  const list = an.pathways.filter(g => all || g.rel >= 5)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Toggle
          options={[
            { value: 'main', label: 'Principais (≥ 5%)' },
            { value: 'all', label: 'Todos' }
          ]}
          value={mode}
          onChange={setMode}
        />
        <p className="text-xs text-slate-500">
          {list.length} de {an.pathways.length} caminhos
        </p>
      </div>
      {MECH_GROUPS.map(G => {
        const items = list.filter(g => g.mech.group === G.id)
        if (!items.length) return null
        return (
          <Card key={G.id}>
            <h3 className="font-bold text-gray-900 dark:text-white">{G.label}</h3>
            <p className="text-xs text-slate-500 mb-2">{G.desc}</p>
            <div className="grid gap-2">
              {items.map(g => (
                <PathCard key={g.id} g={g} M={an.M} selected={sel === g.id} onSelect={onSelect} />
              ))}
            </div>
          </Card>
        )
      })}
      {!list.length && <Note>Nenhum fragmento acima de 5%: M⁺• domina o espectro. Mostre "Todos" para ver os caminhos menores.</Note>}
      <Note>
        <b>Regra de Stevenson:</b> a fragmentação gera, preferencialmente, o cátion de menor energia de ionização (o mais estável: CH₃⁺ &lt; 1º &lt; 2º &lt; 3º &lt; alila &lt; benzila); o outro pedaço sai como radical neutro e não é detectado. <b>Havendo opção, sai o maior radical alquila.</b>
      </Note>
      <Note>
        <b>Regra do número par de elétrons:</b> um cátion-radical pode perder um radical (OE⁺• → EE⁺ + R•) ou uma molécula neutra (OE⁺• → OE⁺• + N); já um cátion de número par de elétrons só perde moléculas neutras (EE⁺ → EE⁺ + N). Perder um neutro mantém a paridade da massa: M par → fragmento par.
      </Note>
    </div>
  )
}

// ── 5. Perdas neutras ───────────────────────────────────────────────────────
export const StepPerdas = ({ an, sel, onSelect }) => {
  const losses = useMemo(() => {
    const map = new Map()
    for (const g of an.pathways) {
      if (g.level !== 0) continue
      const d = an.M - g.mz
      const cur = map.get(d) || { d, items: [], rel: 0 }
      cur.items.push(g)
      cur.rel = Math.max(cur.rel, g.rel)
      map.set(d, cur)
    }
    return [...map.values()].filter(x => x.rel >= 1).sort((a, b) => a.d - b.d)
  }, [an])
  const ions = COMMON_IONS.map(ci => ({ ...ci, peak: an.peaks.find(p => p.mz === ci.mz && !p.isotope) })).filter(x => x.peak && x.peak.rel >= 3)
  const top = an.pathways.filter(g => g.rel >= 15 && Object.keys(g.formula).every(k => 'CHNO'.includes(k))).slice(0, 3)
  return (
    <div className="space-y-3">
      <Card>
        <Label>Perdas a partir de M⁺• (m/z {an.M})</Label>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-3">Perda</th>
                <th className="py-2 pr-3">Íon</th>
                <th className="py-2 pr-3">Neutro</th>
                <th className="py-2 pr-3">Tabela de perdas comuns</th>
              </tr>
            </thead>
            <tbody>
              {losses.map(x => {
                const ref = COMMON_LOSSES.find(c => c.d === x.d)
                const g = x.items.reduce((a, b) => (b.rel > a.rel ? b : a))
                return (
                  <tr key={x.d} onClick={() => onSelect(g.id)} className={`border-t border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${x.items.some(i => i.id === sel) ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}>
                    <td className="py-2 pr-3 wn whitespace-nowrap">M − {x.d}</td>
                    <td className="py-2 pr-3 wn">
                      {g.mz} <span className="text-slate-400 font-normal">({pct(g.rel)}%)</span>
                    </td>
                    <td className="py-2 pr-3 wn">{[...new Set(x.items.map(i => neutralLabel(i.neutralText, i.neutralRadical)))].join(' / ')}</td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{ref ? `${ref.what} — ${ref.hint}` : <span className="text-slate-400">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">Perdas de 4 a 14 u e de 21 a 25 u são muito improváveis (não há neutro comum com essas massas): se aparecerem, o pico "M" provavelmente não é o íon molecular — o M verdadeiro está mais acima.</p>
      </Card>

      {ions.length > 0 && (
        <Card>
          <Label>Íons diagnósticos presentes</Label>
          <div className="mt-2 grid sm:grid-cols-2 gap-2">
            {ions.map(x => (
              <div key={x.mz} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm flex gap-3 items-center">
                <b className="wn text-base text-indigo-700 dark:text-indigo-300 w-10">{x.mz}</b>
                <span className="flex-1 text-slate-700 dark:text-slate-200">{x.what}</span>
                <span className="wn text-xs text-slate-500">{pct(x.peak.rel)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {top.length > 0 && (
        <Card>
          <Label>Alta resolução também resolve fragmentos</Label>
          <div className="mt-2 grid md:grid-cols-3 gap-3">
            {top.map(g => {
              const alts = isobaricFormulas(g.formula, 3, !g.oddElectron)
              return (
                <div key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-sm font-semibold">
                    m/z {g.mz} <span className="text-slate-400 font-normal">(nominal)</span>
                  </p>
                  <ul className="mt-1 text-sm space-y-0.5">
                    {alts.map(a => (
                      <li key={a.text} className={`flex justify-between wn ${Math.abs(a.delta) < 1e-6 ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-500'}`}>
                        <span>{ionText(a.text, g.oddElectron)}</span>
                        <span>{fmt(a.mono - 0.00054858, 4)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── 6. Espectro ─────────────────────────────────────────────────────────────
export const PeakDetail = ({ an, mz, sel, onSelectPath }) => {
  const p = an.peaks.find(x => x.mz === mz)
  if (!p) return null
  const byId = new Map(an.allPathways.map(g => [g.id, g]))
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-bold">
          m/z <span className="wn">{p.mz}</span> <span className="text-slate-500 font-normal text-sm">· {pct(p.rel)}%</span>
        </p>
        {p.mz === an.basePeak.mz && <span className="text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300">pico-base</span>}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {p.contributors
          .filter(c => c.share >= 0.03)
          .map((c, i) => {
            const g = c.src === 'M' ? null : byId.get(c.src)
            const txt = c.src === 'M' ? (c.d === 0 ? 'Íon molecular M⁺•' : `Pico isotópico de M⁺• (M+${c.d})`) : c.d === 0 ? `${g.mech.short}: ${ionText(g.formulaText, g.oddElectron)}` : `Isótopo (+${c.d}) do íon ${g.mz} (${ionText(g.formulaText, g.oddElectron)})`
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={!g}
                  onClick={() => g && onSelectPath(g.id)}
                  className={`w-full text-left rounded-xl px-3 py-2 flex items-center gap-2 ${g && sel === g.id ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-50 dark:bg-slate-800/50'} ${g ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : ''}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g ? g.mech.color : '#4f46e5' }} />
                  <span className="flex-1">{txt}</span>
                  <span className="wn text-xs text-slate-500">{Math.round(c.share * 100)}%</span>
                </button>
              </li>
            )
          })}
      </ul>
      {(() => {
        const main = p.contributors[0]
        const g = main && main.src !== 'M' && main.d === 0 ? byId.get(main.src) : null
        return g ? <Equation g={g} M={an.M} className="mt-2" /> : null
      })()}
    </Card>
  )
}

export const StepEspectro = ({ an, selMz, onSelectMz, sel, onSelectPath, guessed, setGuessed }) => {
  const [iso, setIso] = useState(true)
  const [pick, setPick] = useState(null)
  const options = useMemo(() => {
    const top = [...an.peaks].filter(p => !p.isotope).sort((a, b) => b.rel - a.rel).slice(0, 4).map(p => p.mz)
    const mPeak = an.M
    if (!top.includes(mPeak)) top[3] = mPeak
    return [...new Set(top)].sort((a, b) => a - b)
  }, [an])
  const baseG = an.pathways.find(g => g.mz === an.basePeak.mz)
  return (
    <div className="space-y-3">
      {!guessed && (
        <Card>
          <p className="font-semibold text-gray-900 dark:text-white">Antes de ver o espectro: qual você acha que será o pico-base (100%)?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map(mz => (
              <button
                key={mz}
                type="button"
                onClick={() => {
                  setPick(mz)
                  setGuessed(true)
                  onSelectMz(an.basePeak.mz)
                }}
                className="btn-ghost wn"
              >
                m/z {mz}
                {mz === an.M ? ' (M⁺•)' : ''}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setGuessed(true)} className="mt-3 text-sm font-semibold text-slate-500 hover:underline">
            Pular e ver o espectro
          </button>
        </Card>
      )}
      {guessed && (
        <>
          {pick != null && (
            <Note tone={pick === an.basePeak.mz ? 'ok' : 'warn'}>
              {pick === an.basePeak.mz ? '✓ Acertou! ' : `O pico-base é m/z ${an.basePeak.mz}, não ${pick}. `}
              {an.basePeak.main === 'M' ? 'O íon molecular é tão estável que ele mesmo é o pico-base.' : baseG ? `Ele vem de: ${baseG.mech.short.toLowerCase()} — ${baseG.ionName}.` : ''}
            </Note>
          )}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <p className="text-sm text-slate-500">
                Clique em um pico para ver a atribuição · <span className="text-indigo-600 font-semibold">■ M⁺•</span> · <span className="text-fuchsia-600 font-semibold">■ pico-base</span> · <span className="text-slate-400 font-semibold">■ isotópico</span>
              </p>
              <Check checked={iso} onChange={setIso}>
                Mostrar picos isotópicos
              </Check>
            </div>
            <SpectrumMS peaks={an.peaks} M={an.M} basePeak={an.basePeak.mz} selected={selMz} onSelect={onSelectMz} showIsotopes={iso} />
          </Card>
          {selMz != null && <PeakDetail an={an} mz={selMz} sel={sel} onSelectPath={onSelectPath} />}
        </>
      )}
    </div>
  )
}

