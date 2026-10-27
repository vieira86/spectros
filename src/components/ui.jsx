import { useState } from 'react'
import { fmt, signed } from '../utils/format'

export const Bubble = ({ color, children, size = 'md' }) => (
  <span className={`inline-flex items-center justify-center rounded-full text-white font-bold shrink-0 ${size === 'lg' ? 'w-9 h-9 text-base' : 'w-7 h-7 text-sm'}`} style={{ background: color }}>
    {children}
  </span>
)

// "base 1,20 + α: OH 2,30 = 3,50"
export const Breakdown = ({ parts, total, digits = 2 }) => (
  <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
    {parts.map((p, i) => (
      <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-200">
        <span className="text-slate-500 dark:text-slate-400">{p.label}</span>
        <b className="wn">{i === 0 ? fmt(p.value, digits) : signed(p.value, digits)}</b>
      </span>
    ))}
    <span className="font-semibold text-slate-500">=</span>
    <b className="wn text-base text-indigo-700 dark:text-indigo-300">{fmt(total, digits)} ppm</b>
  </div>
)

export const Note = ({ children, tone = 'info' }) => {
  const cls = {
    info: 'border-sky-200 bg-sky-50 text-sky-900 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-200',
    warn: 'border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-200',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200'
  }[tone]
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>{children}</div>
}

export const CopyBox = ({ text, label = 'Formato de artigo' }) => {
  const [ok, setOk] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setOk(true)
      setTimeout(() => setOk(false), 1500)
    })
  }
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <button type="button" onClick={copy} className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
          {ok ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-200 break-words">{text}</p>
    </div>
  )
}

export const Toggle = ({ options, value, onChange }) => (
  <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-1 gap-1">
    {options.map(o => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${value === o.value ? 'bg-white dark:bg-slate-950 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
)

export const Check = ({ checked, onChange, children }) => (
  <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
    {children}
  </label>
)
