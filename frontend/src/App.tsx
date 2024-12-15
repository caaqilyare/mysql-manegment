import { useState } from 'react'
import { ThemeProvider } from '@mui/material';
import { theme } from './theme';
import { CssBaseline } from '@mui/material'
import { DatabaseLogin } from './components/DatabaseLogin'
import { DatabaseManager } from './components/DatabaseManager'
import { ToastProvider } from './contexts/ToastContext';

function App() {
  const [isConnected, setIsConnected] = useState(false)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <div style={{
          width: '100%',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, 
            ${theme.palette.background.default} 0%, 
            ${theme.palette.background.paper} 100%)`,
        }}>
          {!isConnected ? (
            <DatabaseLogin onLogin={setIsConnected} />
          ) : (
            <DatabaseManager />
          )}
        </div>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
