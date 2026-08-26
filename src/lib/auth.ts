/**
 * 简单本地密码认证
 * 使用固定盐值（从应用名派生），使多设备可以互相验证密码
 */

const PASSWORD_KEY = 'food_picker_password'

// 固定盐值：从应用标识派生，确保多设备一致
const APP_SALT = 'food-picker-multi-device-salt-v1'

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

// 注册新用户：创建密码（使用固定盐值）
export function setupPassword(password: string): boolean {
  const hash = simpleHash(APP_SALT + password)
  localStorage.setItem(PASSWORD_KEY, hash)
  return true
}

// 验证密码（使用相同固定盐值）
export function verifyPassword(password: string): boolean {
  const storedHash = localStorage.getItem(PASSWORD_KEY)
  if (!storedHash) return false
  const hash = simpleHash(APP_SALT + password)
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
