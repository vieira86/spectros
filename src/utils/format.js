export const fmt = (x, d = 2) => (x == null || Number.isNaN(x) ? '—' : Number(x).toFixed(d).replace('.', ','))
export const signed = (x, d = 2) => (x >= 0 ? '+' : '−') + fmt(Math.abs(x), d)

const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' }
export const subscript = s => String(s).replace(/\d/g, d => SUB[d])

// íon: C₂H₃O⁺ ou C₃H₆O⁺•
export const ionText = (formulaText, odd) => subscript(formulaText) + (odd ? '⁺•' : '⁺')
// neutro: •CH₃ (radical) ou C₂H₄ (molécula)
export const neutralLabel = (text, radical) => (radical ? '•' : '') + subscript(text)

export const pct = x => (x >= 10 ? Math.round(x) : x >= 1 ? fmt(x, 1) : fmt(x, 1))
