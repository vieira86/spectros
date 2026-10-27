import { useEffect, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import AnalysisScreen from './components/AnalysisScreen'
import ThemeToggle from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'
import { loadRDKit, parseSmiles } from './chem/rdkit'
import { analyzeMolecule } from './engine/index.js'
import './index.css'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [rdkit, setRdkit] = useState(null)
  const [rdkitError, setRdkitError] = useState('')
  const [view, setView] = useState('home')
  const [input, setInput] = useState({ smiles: '', name: '' })
  const [analysis, setAnalysis] = useState(null)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    loadRDKit()
      .then(setRdkit)
      .catch(e => setRdkitError(e.message))
  }, [])

  const handleAnalyze = ({ smiles, name }) => {
    const p = parseSmiles(rdkit, smiles)
    if (!p.mol) return
    setInput({ smiles, name })
    setAnalysis({ an: analyzeMolecule(p.mol), canonical: p.canonical })
    setRunId(n => n + 1)
    setView('analysis')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = (clear = false) => {
    if (clear) setInput({ smiles: '', name: '' })
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-fuchsia-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md shadow-sm border-b border-white/40 dark:bg-slate-900/75 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-4">
            <button type="button" onClick={() => goHome()} className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-700 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <svg viewBox="0 0 64 64" className="w-7 h-7" aria-hidden="true">
                  <g stroke="#fff" strokeWidth="5" strokeLinecap="round">
                    <path d="M10 52V40" />
                    <path d="M19 52V20" />
                    <path d="M28 52V34" />
                    <path d="M37 52V45" />
                    <path d="M46 52V10" />
                    <path d="M55 52V30" />
                  </g>
                </svg>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent leading-none">SPECTROS</h1>
                <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-1">Mass Spectrometry System</p>
              </div>
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {view === 'home' && <HomeScreen key={input.smiles} rdkit={rdkit} rdkitError={rdkitError} initialSmiles={input.smiles} onAnalyze={handleAnalyze} />}
        {view === 'analysis' && analysis && <AnalysisScreen key={runId} an={analysis.an} smiles={analysis.canonical} name={input.name} onEdit={() => goHome()} onRestart={() => goHome(true)} />}
      </main>

      <footer className="bg-gray-900 text-white py-10 px-4 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:justify-center gap-10 md:gap-20">
          <div className="md:max-w-sm">
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">SPECTROS</h3>
            <p className="text-gray-400 text-sm">
              Ferramenta didática de espectrometria de massas: desenhe a molécula, calcule o íon molecular e o padrão isotópico, acompanhe cada fragmentação na estrutura e compare com o espectro simulado de IE a 70 eV.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3">Sobre o autor</h4>
            <div className="flex items-center space-x-4">
              <img src="https://github.com/vieira86.png" alt="Rafael Vieira" className="w-14 h-14 rounded-full border-2 border-indigo-500 shadow-lg" />
              <div>
                <p className="font-semibold text-white">Prof. Dr. Rafael Vieira</p>
                <p className="text-sm text-gray-400">Química · IFRO</p>
                <p className="text-sm text-gray-400">rafael.vieira@ifro.edu.br</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">© 2026 SPECTROS — Espectros estimados por regras de fragmentação: use como guia de estudo, não como espectro experimental.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
