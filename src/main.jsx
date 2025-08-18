import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { DatabaseProvider } from './contexts/DatabaseContext.jsx' // 1. Importe o DatabaseProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O AuthProvider deve vir primeiro se o DatabaseProvider depender dele */}
    <AuthProvider>
      {/* O DatabaseProvider deve envolver o App */}
      <DatabaseProvider>
        <App />
      </DatabaseProvider>
    </AuthProvider>
  </React.StrictMode>,
)