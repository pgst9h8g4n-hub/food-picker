import { useState } from 'react'
import { useAuth } from '@/lib/hooks'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp, loading } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    const err = isSignUp ? await signUp(password) : await signIn(password)
    if (err) {
      setError(err.message)
    } else {
      onLogin()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🍜</div>
          <h1 className="text-2xl font-bold text-gray-900">美食与游玩地收藏</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSignUp ? '创建密码以开始使用' : '输入密码登录'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading
              ? '处理中...'
              : isSignUp
              ? '创建账号'
              : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setPassword('')
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {isSignUp ? '已有账号？去登录' : '没有账号？创建密码'}
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-gray-400">
          密码仅保存在本机，换设备需重新设置
        </p>
      </div>
    </div>
  )
}
