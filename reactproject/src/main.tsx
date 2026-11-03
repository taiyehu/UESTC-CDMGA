import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@dsh-ui/tokens/index.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
