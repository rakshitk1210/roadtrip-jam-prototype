import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/map.css'
import './styles/ui.css'
import './styles/wrapped.css'
import './styles/photoPicker.css'
import './styles/wrappedPreview.css'
import './styles/scrapbook.css'
import './styles/souvenirMap.css'
import './styles/permissions.css'
import './styles/inspector.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
