export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateTime(date: Date = new Date()): string {
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${formatDate(date)} ${hour}:${minute}:${second}`
}

export function isExpired(deadline: string): boolean {
  const now = new Date(formatDate())
  const target = new Date(deadline)
  return target < now
}

export function highlightKeyword(
  text: string,
  keyword: string
): string {
  if (!keyword) return text
  const reg = new RegExp(escapeRegExp(keyword), 'gi')
  return text.replace(reg, (match) => `<span class="search-highlight">${match}</span>`)
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function dragSort<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const newList = [...list]
  const [item] = newList.splice(fromIndex, 1)
  newList.splice(toIndex, 0, item)
  return newList
}
