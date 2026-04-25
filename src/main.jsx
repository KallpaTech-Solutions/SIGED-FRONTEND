import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/* StrictMode desactivado: en desarrollo montaba/desmontaba dos veces y SignalR
   cancelaba la negociación ("connection stopped during negotiation"). */
createRoot(document.getElementById('root')).render(<App />)
