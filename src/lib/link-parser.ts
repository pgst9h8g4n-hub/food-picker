/**
 * 链接解析器 - 纯前端实现
 *
 * 由于国内网络限制，无法使用 Jina Reader 等外部服务。
 * 本方案采用以下策略：
 * 1. 从 URL 中提取可解析的信息（店号、城市等）
 * 2. 生成导航链接（高德/百度地图）
 * 3. 从剪贴板文本中提取结构化信息
 */

export interface ParsedPlace {
  title: string
  address: string | null
  city: string | null
  rating: number | null
  price: number | null
  source: string
  platform: string
}

// 平台检测
function detectPlatform(url: string): { platform: string; domain: string } {
  const lower = url.toLowerCase()
  if (lower.includes('xiaohongshu.com') || lower.includes('xn--wprkg')) return { platform: '小红书', domain: 'xiaohongshu' }
  if (lower.includes('douyin.com') || lower.includes('iesdouyin.com')) return { platform: '抖音', domain: 'douyin' }
  if (lower.includes('dianping.com') || lower.includes('dpurl.cn')) return { platform: '大众点评', domain: 'dianping' }
  if (lower.includes('meituan.com') || lower.includes('mtw.so')) return { platform: '美团', domain: 'meituan' }
  if (lower.includes('kuaishou.com')) return { platform: '快手', domain: 'kuaishou' }
  return { platform: '其他', domain: 'other' }
}

// 从大众点评/美团链接中提取店铺信息
function parseDianpingMeituan(url: string): ParsedPlace | null {
  // 大众点评: /shop/xxx-xxx 或 /shop/xxx/
  const shopMatch = url.match(/\/shop\/([^/]+)/)
  if (shopMatch) {
    // 尝试从 URL 中提取城市
    const cityMatch = url.match(/\/([^/]+?)\/shop\//)
    const city = cityMatch ? cityMatch[1] : null
    return {
      title: '',
      address: null,
      city,
      rating: null,
      price: null,
      source: '大众点评',
      platform: '大众点评',
    }
  }
  return null
}

// 从抖音链接中提取信息
function parseDouyin(url: string): ParsedPlace | null {
  const videoMatch = url.match(/video\/(\d+)/)
  if (videoMatch) {
    return {
      title: '',
      address: null,
      city: null,
      rating: null,
      price: null,
      source: '抖音',
      platform: '抖音',
    }
  }
  return null
}

// 从小红书链接中提取信息
function parseXiaohongshu(url: string): ParsedPlace | null {
  const noteMatch = url.match(/explore\/([^?]+)/)
  if (noteMatch) {
    return {
      title: '',
      address: null,
      city: null,
      rating: null,
      price: null,
      source: '小红书',
      platform: '小红书',
    }
  }
  return null
}

// 从 URL 提取文本信息
export function parseUrlInfo(url: string): ParsedPlace | null {
  const { platform } = detectPlatform(url)

  switch (platform) {
    case '大众点评':
      return parseDianpingMeituan(url)
    case '抖音':
      return parseDouyin(url)
    case '小红书':
      return parseXiaohongshu(url)
    default:
      return null
  }
}

/**
 * 生成地图导航链接
 * 支持高德地图和百度地图
 */
export function generateMapLink(title: string, address?: string): string {
  const keyword = address ? `${title} ${address}` : title
  // 高德地图
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}&callnative=1`
}

/**
 * 生成百度地图导航链接
 */
export function generateBaiduMapLink(title: string, address?: string): string {
  const keyword = address ? `${title} ${address}` : title
  return `https://map.baidu.com/search/${encodeURIComponent(keyword)}`
}

/**
 * 从剪贴板文本中提取店名
 */
export function extractShopName(text: string): string | null {
  // 小红书格式：【店名：xxx】或【xxx】
  const match1 = text.match(/【(?:店名|店铺|餐厅|餐馆|店)[:：\s]*([^】]{2,30})】/)
  if (match1) return match1[1].trim()

  // 大众点评/美团格式
  const match2 = text.match(/(?:店名|店铺|餐厅|餐馆)[:：\s]+(.{2,30})(?:\s|$|[【]])/)
  if (match2) return match2[1].trim()

  // 纯文本首行（去掉常见前缀）
  const firstLine = text.split('\n')[0]?.trim()
  if (firstLine && firstLine.length >= 2 && firstLine.length <= 30) {
    const cleaned = firstLine.replace(/^[-*•●○■□▪▫►▶]/, '').trim()
    // 确保是中文为主的文本
    if (/[一-龥]{2,}/.test(cleaned)) {
      return cleaned
    }
  }

  return null
}

/**
 * 从剪贴板文本中提取地址
 */
export function extractAddress(text: string): string | null {
  // 【地址：xxx】
  const match1 = text.match(/【(?:地址|位置)[:：\s]*(.{2,50})】/)
  if (match1) return match1[1].trim()

  // 地址：xxx
  const match2 = text.match(/(?:地址|位置)[:：\s]+(.{4,50})(?:\s|$|[【]])/)
  if (match2) return match2[1].trim()

  // 街道地址格式
  const match3 = text.match(/((?:[一-龥]{2,6})(?:路|街|大道|巷|弄|号|栋|楼|区)[^\s【】]{0,30})/)
  if (match3 && match3[1].length >= 4) return match3[1].trim()

  return null
}

/**
 * 从剪贴板文本中提取城市
 */
export function extractCity(text: string): string | null {
  const match = text.match(/([^\s【】]{2,6}?市)/)
  if (match) return match[1].replace('市', '')

  const cities = ['成都', '重庆', '北京', '上海', '广州', '深圳', '杭州', '武汉', '西安', '南京', '苏州', '天津', '长沙', '郑州', '青岛', '大连', '厦门', '昆明', '大理', '丽江', '三亚']
  for (const city of cities) {
    if (text.includes(city)) return city
  }
  return null
}

/**
 * 从文本中尝试提取评分
 */
export function extractRating(text: string): number | null {
  const match = text.match(/(\d(?:\.\d)?)\s*分/)
  if (match) {
    const rating = parseFloat(match[1])
    if (rating >= 1 && rating <= 5) return Math.round(rating)
  }
  const starMatch = text.match(/(\d)星/)
  if (starMatch) {
    const rating = parseInt(starMatch[1])
    if (rating >= 1 && rating <= 5) return rating
  }
  return null
}
