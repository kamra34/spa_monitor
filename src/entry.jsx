import React from 'react'
import { createRoot } from 'react-dom/client'
import './storage.js' // installs window.storage (fetch + localStorage mirror)
import './styles.css'
import SpaWaterHelper from './SpaWaterHelper.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SpaWaterHelper />
  </React.StrictMode>,
)
