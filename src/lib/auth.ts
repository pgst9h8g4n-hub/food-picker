/**
 * 简单本地密码认证
 * 密码以 bcrypt 哈希形式存储在 localStorage
 * 首次登录时创建密码，之后可直接用密码登录
 */

const PASSWORD_KEY = 'food_picker_password'
const SALT_KEY = 'food_picker_salt'

// 简单的本地密码验证（不使用外部库，用简单哈希）
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

export function setupPassword(password: string): boolean {
  const salt = Math.random().toString(36).slice(2)
  const hash = simpleHash(salt + password)
  localStorage.setItem(PASSWORD_KEY, hash)
  localStorage.setItem(SALT_KEY, salt)
  return true
}

export function verifyPassword(password: string): boolean {
  const storedHash = localStorage.getItem(PASSWORD_KEY)
  const salt = localStorage.getItem(SALT_KEY)
  if (!storedHash || !salt) return false
  const hash = simpleHash(salt + password)
  return hash === storedHash
}

export function isLoggedIn(): boolean {
  return localStorage.getItem('food_picker_auth') === 'true'
}

export function login(password: string): boolean {
  if (verifyPassword(password)) {
    localStorage.setItem('food_picker_auth', 'true')
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem('food_picker_auth')
}

export function needsSetup(): boolean {
  return !localStorage.getItem(PASSWORD_KEY)
}
