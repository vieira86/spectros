// Copia o RDKit.js (JS + WASM) de node_modules para public/rdkit/.
// Roda automaticamente antes de `npm run dev` e `npm run build`.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', '@rdkit', 'rdkit', 'dist')
const dest = join(root, 'public', 'rdkit')

if (!existsSync(src)) {
  console.error('[rdkit] node_modules/@rdkit/rdkit não encontrado. Rode `npm install`.')
  process.exit(1)
}
mkdirSync(dest, { recursive: true })
for (const f of ['RDKit_minimal.js', 'RDKit_minimal.wasm']) copyFileSync(join(src, f), join(dest, f))
console.log('[rdkit] RDKit.js copiado para public/rdkit/')
