/**
 * 链接解析器 - 纯前端实现
 *
 * 支持从剪贴板读取抖音/小红书/美团链接并提取信息。
 */

export interface ParsedPlace {
  title: string
  address: string | null
  city: string | null
  rating: number | null
  price: number | null
  source: string
  platform: string
  rawText: string  // 原始剪贴板文本
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
  const shopMatch = url.match(/\/shop\/([^/]+)/)
  if (shopMatch) {
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
      rawText: url,
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
      rawText: url,
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
      rawText: url,
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
 */
export function generateMapLink(title: string, address?: string): string {
  const keyword = address ? `${title} ${address}` : title
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}&callnative=1`
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

  // 抖音/小红书分享文案常见格式
  const match3 = text.match(/推荐[\s]{0,2}【?([^【\n]{2,30})】?/)
  if (match3) return match3[1].trim()

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

/**
 * 从文本中尝试提取价格
 */
export function extractPrice(text: string): number | null {
  const match = text.match(/¥?\s*(\d{2,4})\s*元/)
  if (match) {
    const price = parseInt(match[1])
    if (price >= 10 && price <= 2000) return price
  }
  return null
}

/**
 * 检测剪贴板内容是否为支持的链接或分享文本
 */
export function detectClipboardContent(text: string): {
  isLink: boolean
  platform: string
  parsed?: ParsedPlace
} {
  const trimmed = text.trim()

  // 检查是否是 URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.')) {
    const parsed = parseUrlInfo(trimmed)
    const { platform } = detectPlatform(trimmed)
    return {
      isLink: true,
      platform,
      parsed: parsed || {
        title: '',
        address: null,
        city: null,
        rating: null,
        price: null,
        source: platform,
        platform,
        rawText: trimmed,
      },
    }
  }

  // 检查是否是分享文本（包含链接）
  const linkMatch = trimmed.match(/https?:\/\/[^\s]+/i)
  if (linkMatch) {
    const url = linkMatch[0]
    const parsed = parseUrlInfo(url)
    const { platform } = detectPlatform(url)
    return {
      isLink: true,
      platform,
      parsed: parsed || {
        title: '',
        address: null,
        city: null,
        rating: null,
        price: null,
        source: platform,
        platform,
        rawText: trimmed,
      },
    }
  }

  // 普通分享文本 - 尝试提取信息
  const shopName = extractShopName(trimmed)
  const address = extractAddress(trimmed)
  const city = extractCity(trimmed)
  const rating = extractRating(trimmed)
  const price = extractPrice(trimmed)

  if (shopName || address || city) {
    return {
      isLink: false,
      platform: '分享文本',
      parsed: {
        title: shopName || '',
        address,
        city,
        rating,
        price,
        source: '分享文本',
        platform: '分享文本',
        rawText: trimmed,
      },
    }
  }

  return { isLink: false, platform: '其他' }
}
