// Carrega o RDKit.js (WASM) uma única vez e converte SMILES → grafo do motor.
import { buildMolecule } from '../engine/molecule.js'

let promise = null

export function loadRDKit() {
  if (promise) return promise
  const base = import.meta.env.BASE_URL || './'
  promise = new Promise((resolve, reject) => {
    const start = () =>
      window
        .initRDKitModule({ locateFile: () => `${base}rdkit/RDKit_minimal.wasm` })
        .then(resolve, reject)
    if (window.initRDKitModule) return start()
    const s = document.createElement('script')
    s.src = `${base}rdkit/RDKit_minimal.js`
    s.async = true
    s.onload = start
    s.onerror = () => reject(new Error('Não foi possível carregar o RDKit.js'))
    document.head.appendChild(s)
  })
  promise.catch(() => {
    promise = null
  })
  return promise
}

// SMILES → { mol, canonical } ou { error }
export function parseSmiles(R, text) {
  const smiles = (text || '').trim()
  if (!smiles) return { error: 'empty' }
  if (!R) return { error: 'loading' }
  let m = null
  try {
    m = R.get_mol(smiles)
  } catch {
    m = null
  }
  if (!m || !m.is_valid()) {
    m?.delete?.()
    return { error: 'SMILES inválido. Confira parênteses, números de anel e letras minúsculas de aromáticos.' }
  }
  try {
    const mol = buildMolecule(m.get_json(), m.get_molblock())
    const canonical = m.get_smiles()
    if (!mol.atoms.length) return { error: 'Molécula vazia.' }
    if (mol.atoms.length > 80) return { error: 'Molécula grande demais para esta versão (máx. 80 átomos pesados).' }
    return { mol, canonical }
  } finally {
    m.delete()
  }
}
