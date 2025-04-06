import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-slate-700">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
          <a 
            href="https://vitejs.dev" 
            target="_blank" 
            rel="noreferrer"
            className="hover:scale-110 transition-transform duration-300"
          >
            <img src={viteLogo} className="h-24 sm:h-32" alt="Vite logo" />
          </a>
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-indigo-500 to-transparent hidden sm:block"></div>
          <a 
            href="https://react.dev" 
            target="_blank"
            rel="noreferrer"
            className="hover:scale-110 transition-transform duration-300"
          >
            <img src={reactLogo} className="h-24 sm:h-32 animate-spin-slow" alt="React logo" />
          </a>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text mb-8">
          Vite + React
        </h1>
        
        <div className="flex flex-col items-center">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-lg font-medium shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Count is {count}
          </button>
          
          <p className="text-slate-300 text-center mb-6">
            Edit <code className="font-mono bg-slate-700 px-2 py-1 rounded text-pink-400">src/App.jsx</code> and save to test HMR
          </p>
        </div>
        
        <p className="text-sm text-slate-400 text-center pt-6 border-t border-slate-700">
          Click on the Vite and React logos to learn more about these technologies
        </p>
      </div>
      
      <div className="mt-8 text-slate-500 text-sm flex gap-4">
        <a href="https://vitejs.dev/guide/" className="hover:text-indigo-400 transition-colors">Documentation</a>
        <a href="https://github.com/vitejs/vite" className="hover:text-indigo-400 transition-colors">GitHub</a>
        <a href="https://react.dev/learn" className="hover:text-indigo-400 transition-colors">Learn React</a>
      </div>
    </div>
  )
}

export default App
