/**
 * GitHub Gist 存储层 - 多设备同步
 * 使用浏览器原生 Crypto API 加密，通过 Gist API 同步
 */

const SYNC_KEY = 'food_picker_sync_enabled'
const TOKEN_KEY = 'food_picker_github_token'
const GIST_ID_KEY = 'food_picker_gist_id'
const GIST_DESCRIPTION = '美食收藏数据'

// 使用 Web Crypto API 加密
async function encrypt(text: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const passwordBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password))
  const key = await crypto.subtle.importKey('raw', passwordBuffer, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(text)
  )

  // 组合 iv + auth tag + encrypted data
  const encryptedBuffer = new Uint8Array(encrypted)
  const result = new Uint8Array(iv.length + 16 + encryptedBuffer.length)
  result.set(iv, 0)
  result.set(encryptedBuffer, iv.length + 16)

  return btoa(String.fromCharCode(...result))
}

async function decrypt(encryptedBase64: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const passwordBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password))
  const key = await crypto.subtle.importKey('raw', passwordBuffer, 'AES-GCM', false, ['decrypt'])

  const data = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
  const iv = data.slice(0, 12)
  const encrypted = data.slice(28) // 12 (iv) + 16 (auth tag)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  )

  return new TextDecoder().decode(decrypted)
}

export function getGithubToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setGithubToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearGithubToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(GIST_ID_KEY)
}

export function generateGistId(password: string): string {
  return btoa(password).slice(0, 32).replace(/[^a-zA-Z0-9]/g, '')
}

export function getOrCreateGistId(password: string): string {
  let gistId = localStorage.getItem(GIST_ID_KEY)
  if (!gistId) {
    gistId = generateGistId(password)
    localStorage.setItem(GIST_ID_KEY, gistId)
  }
  return gistId
}

export function isSyncEnabled(): boolean {
  return localStorage.getItem(SYNC_KEY) === 'true'
}

export function setSyncEnabled(enabled: boolean): void {
  localStorage.setItem(SYNC_KEY, enabled ? 'true' : 'false')
}

async function fetchWithToken(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getGithubToken()
  if (!token) throw new Error('未登录 GitHub')

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearGithubToken()
    throw new Error('GitHub token 无效')
  }
  return response
}

// 获取云端数据
export async function fetchFromGist(password: string): Promise<Record<string, any> | null> {
  const token = getGithubToken()
  if (!token) return null

  try {
    const gistId = getOrCreateGistId(password)
    const resp = await fetchWithToken(`https://api.github.com/gists/${gistId}`)
    if (!resp.ok) return null

    const data = await resp.json()
    const fileKey = Object.keys(data.files ?? {})[0]
    if (!fileKey) return null

    const encrypted = data.files[fileKey].content
    const decrypted = await decrypt(encrypted, password)
    return JSON.parse(decrypted)
  } catch (e) {
    console.warn('Gist 读取失败:', e)
    return null
  }
}

// 保存数据到云端
export async function saveToGist(password: string, data: Record<string, any>): Promise<boolean> {
  const token = getGithubToken()
  if (!token) return false

  try {
    const gistId = getOrCreateGistId(password)
    const encrypted = await encrypt(JSON.stringify(data), password)

    const resp = await fetchWithToken(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: { 'data.json': { content: encrypted } },
      }),
    })

    return resp.ok
  } catch (e) {
    console.warn('Gist 写入失败:', e)
    return false
  }
}

// 创建新的 Gist
export async function createGist(password: string, data: Record<string, any>): Promise<string | null> {
  const token = getGithubToken()
  if (!token) return null

  try {
    const encrypted = await encrypt(JSON.stringify(data), password)
    const resp = await fetchWithToken('https://api.github.com/gists', {
      method: 'POST',
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: { 'data.json': { content: encrypted } },
      }),
    })

    if (!resp.ok) return null
    const result = await resp.json()
    const gistId = result.id
    localStorage.setItem(GIST_ID_KEY, gistId)
    return gistId
  } catch (e) {
    console.warn('Gist 创建失败:', e)
    return null
  }
}

// 连接 GitHub（测试 token 是否有效）
export async function connectGithub(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const resp = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) return { success: false, message: 'Token 无效' }
    setGithubToken(token)
    return { success: true, message: '连接成功' }
  } catch {
    return { success: false, message: '网络错误' }
  }
}

// 同步数据
export async function syncData(password: string, localData: Record<string, any>): Promise<Record<string, any>> {
  const remoteData = await fetchFromGist(password)

  if (remoteData) {
    const merged = { ...remoteData, ...localData }
    await saveToGist(password, merged)
    return merged
  } else {
    await createGist(password, localData)
    return localData
  }
}
