import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/saas.css'
import App from './App.tsx'

// Initialize PWA utilities (registers SW, handles install prompt)
import './utils/pwa'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
