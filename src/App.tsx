import { useState, useEffect } from 'react'
import LoginPage from '@/components/LoginPage'
import HomePage from '@/components/HomePage'
import { isLoggedIn as checkLoggedIn } from '@/lib/auth'

function App() {
  const [loggedIn, setLoggedIn] = useState(checkLoggedIn())
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setLoggedIn(checkLoggedIn())
    setChecking(false)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    )
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  return <HomePage onLogout={() => setLoggedIn(false)} />
}

export default App
