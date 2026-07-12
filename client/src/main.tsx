import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { SocketProvider } from './contexts/SocketContext'
import { RoomProvider } from './contexts/RoomContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <RoomProvider>
          <App />
        </RoomProvider>
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>,
)
