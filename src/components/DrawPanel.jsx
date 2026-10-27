import { useEffect, useRef, useState } from 'react'

// Editor de estruturas JSME (carregado sob demanda da CDN oficial do JSME).
const JSME_URL = 'https://jsme-editor.github.io/dist/jsme/jsme.nocache.js'
let jsmePromise = null

function loadJSME() {
  if (window.JSApplet?.JSME) return Promise.resolve()
  if (jsmePromise) return jsmePromise
  jsmePromise = new Promise((resolve, reject) => {
    const prev = window.jsmeOnLoad
    window.jsmeOnLoad = () => {
      prev?.()
      resolve()
    }
    const s = document.createElement('script')
    s.src = JSME_URL
    s.async = true
    s.onerror = () => {
      jsmePromise = null
      reject(new Error('Não foi possível carregar o editor JSME (verifique a conexão).'))
    }
    document.head.appendChild(s)
    setTimeout(() => {
      if (!window.JSApplet?.JSME) reject(new Error('O editor demorou demais para carregar.'))
    }, 20000)
  })
  return jsmePromise
}

let counter = 0

const DrawPanel = ({ smiles, onChange }) => {
  const box = useRef(null)
  const applet = useRef(null)
  const lastOut = useRef(smiles)
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const idRef = useRef(`jsme-${++counter}`)

  useEffect(() => {
    let alive = true
    loadJSME()
      .then(() => {
        if (!alive || !box.current) return
        const w = Math.max(300, box.current.clientWidth)
        const a = new window.JSApplet.JSME(idRef.current, `${w}px`, '380px', { options: 'oldlook,nocanonize,zoom' })
        applet.current = a
        if (smiles) {
          try {
            a.readGenericMolecularInput(smiles)
          } catch {
            /* SMILES que o JSME não lê: começa vazio */
          }
        }
        a.setCallBack('AfterStructureModified', ev => {
          const s = ev.src.smiles()
          lastOut.current = s
          onChange(s)
        })
        setState('ready')
      })
      .catch(e => {
        if (!alive) return
        setError(e.message)
        setState('error')
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // SMILES alterado fora do editor (ex.: exemplo escolhido) → atualiza o desenho
  useEffect(() => {
    const a = applet.current
    if (!a || smiles === lastOut.current) return
    lastOut.current = smiles
    try {
      if (smiles) a.readGenericMolecularInput(smiles)
      else a.reset()
    } catch {
      /* ignora */
    }
  }, [smiles])

  return (
    <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white overflow-hidden">
      <div ref={box} className="w-full min-h-[380px] relative">
        <div id={idRef.current} />
        {state === 'loading' && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Carregando o editor de estruturas…</div>}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-rose-600">
            <p>{error}</p>
            <p className="text-slate-500">Você ainda pode digitar o SMILES na outra aba.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DrawPanel
