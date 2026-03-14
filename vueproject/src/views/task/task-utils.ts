import type { Course } from '@/api/types'

export interface TypicalTaskItem {
  id: number
  title: string
  description: string
  image?: string
  level: '简单' | '一般' | '困难'
}

export interface BingoTaskItem {
  id: number
  title: string
  description: string
}

const LEVELS: Array<'简单' | '一般' | '困难'> = ['简单', '简单', '一般', '一般', '困难', '困难']

export function normalizeCategory(category?: string): 'legacy' | 'typical' | 'bingo' {
  const value = (category ?? '').trim().toLowerCase()
  if (value === 'typical') return 'typical'
  if (value === 'bingo') return 'bingo'
  return 'legacy'
}

export function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

export function toImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
}

function tryParseJson(source: string): any | null {
  try {
    return JSON.parse(source)
  } catch {
    return null
  }
}

function normalizeTypicalItem(item: unknown, id: number): TypicalTaskItem {
  const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
  return {
    id,
    title: String(record.title ?? `Typical 课题 ${id}`),
    description: String(record.description ?? '暂无描述'),
    image: record.image ? String(record.image) : '',
    level: LEVELS[id - 1] ?? '困难',
  }
}

export function parseTypicalItems(course: Course): TypicalTaskItem[] {
  const raw = (course.description ?? '').trim()
  const parsed = raw ? tryParseJson(raw) : null

  let items: unknown[] = []

  if (Array.isArray(parsed)) {
    items = parsed
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).typicalItems)) {
    items = (parsed as { typicalItems: unknown[] }).typicalItems
  } else if (raw.includes('|')) {
    items = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [idPart, title, description, image] = line.split('|')
        return {
          id: Number(idPart),
          title,
          description,
          image,
        }
      })
  }

  if (!items.length) {
    return Array.from({ length: 6 }, (_, index) => {
      const id = index + 1
      return {
        id,
        title: `${course.title} - 子课题 ${id}`,
        description: '该子课题暂未填写具体描述。',
        level: LEVELS[index] ?? '困难',
      }
    })
  }

  return items.slice(0, 6).map((item, index) => {
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const id = Number(record.id) || index + 1
    return normalizeTypicalItem(item, id)
  })
}

export function parseBingoItems(course: Course): BingoTaskItem[] {
  const raw = (course.description ?? '').trim()
  const parsed = raw ? tryParseJson(raw) : null

  let items: unknown[] = []

  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).bingoItems)) {
    items = (parsed as { bingoItems: unknown[] }).bingoItems
  } else if (Array.isArray(parsed)) {
    items = parsed
  }

  if (!items.length) {
    return Array.from({ length: 25 }, (_, index) => {
      const id = index + 1
      return {
        id,
        title: `${course.title} Bingo ${id}`,
        description: '该 Bingo 题目暂未配置具体内容。',
      }
    })
  }

  return Array.from({ length: 25 }, (_, index) => {
    const id = index + 1
    const item = items[index]
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    return {
      id,
      title: String(record.title ?? `${course.title} Bingo ${id}`),
      description: String(record.description ?? '该 Bingo 题目暂未配置具体内容。'),
    }
  })
}
