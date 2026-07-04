/**
 * 链接解析 Edge Function
 * 接收小红书/美团/抖音链接，提取页面标题和图片
 *
 * 部署：supabase functions deploy parse-link --project-ref dspxjopcshoinkpfxgba
 */

interface ParsedResult {
  title: string | null
  image_url: string | null
  platform: string
  source_url: string
}

interface ParseResponse {
  error: string | null
  parsed: ParsedResult | null
}

const PLATFORMS: Record<string, { patterns: RegExp[]; titlePattern: RegExp; imagePattern: RegExp }> = {
  xiaohongshu: {
    patterns: [/xiaohongshu\.com/, /xn--wpr/g],
    titlePattern: /property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    imagePattern: /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  },
  meituan: {
    patterns: [/meituan\.com/, /dianping\.com/, /dpurl\.cn/, /mtw\.so/],
    titlePattern: /property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    imagePattern: /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  },
  douyin: {
    patterns: [/douyin\.com/, /iesdouyin\.com/],
    titlePattern: /property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    imagePattern: /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  },
}

Deno.serve(async (req: Request) => {
  // 仅支持 POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持 POST 请求', parsed: null }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: '请求体格式错误', parsed: null }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { url } = body
  if (!url) {
    return new Response(JSON.stringify({ error: '缺少 url 参数', parsed: null }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // 识别平台
    let platformKey: string | null = null
    for (const [name, config] of Object.entries(PLATFORMS)) {
      if (config.patterns.some((p) => p.test(url))) {
        platformKey = name
        break
      }
    }

    if (!platformKey) {
      return new Response(
        JSON.stringify({
          error: null,
          parsed: null,
          message: '不支持的链接类型，仍可手动填写',
        } satisfies ParseResponse),
        { headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 抓取页面（设置超时 10s，跟随重定向）
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timer)

    // 获取最终 URL（重定向后的真实地址）
    const finalUrl = response.url

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `页面抓取失败 (${response.status})`,
          parsed: null,
        } satisfies ParseResponse),
        { headers: { 'Content-Type': 'application/json' } },
      )
    }

    const html = await response.text()
    const config = PLATFORMS[platformKey]

    // 提取 og:title
    const titleMatch = html.match(config.titlePattern)
    const title = titleMatch?.[1]?.trim() || null

    // 提取 og:image
    const imageMatch = html.match(config.imagePattern)
    let imageUrl: string | null = imageMatch?.[1] || null

    // 相对路径转绝对路径（使用最终 URL）
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        const urlObj = new URL(finalUrl)
        imageUrl = imageUrl.startsWith('/')
          ? urlObj.protocol + '//' + urlObj.host + imageUrl
          : urlObj.origin + '/' + imageUrl
      } catch {
        // ignore
      }
    }

    return new Response(
      JSON.stringify({
        error: null,
        parsed: {
          title,
          image_url: imageUrl,
          platform: platformKey,
          source_url: url,
        } satisfies ParsedResult,
      } satisfies ParseResponse),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '解析失败'
    return new Response(
      JSON.stringify({ error: message, parsed: null } satisfies ParseResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
