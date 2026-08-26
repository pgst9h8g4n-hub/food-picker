import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return
      }
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler as EventListener)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    // @ts-ignore - beforeinstallprompt event has userChoice property in some browsers
    deferredPrompt.prompt()
    // @ts-ignore
    const { outcome } = await deferredPrompt.userChoice
    setVisible(false)
    setDeferredPrompt(null)
  }

  function handleClose() {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-xl shrink-0">
          🍜
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">添加到主屏幕</p>
          <p className="text-xs text-gray-400">像 App 一样快速访问</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2 rounded-xl flex items-center gap-1 shrink-0 transition-colors"
        >
          <Plus size={14} /> 添加
        </button>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white p-1 shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
