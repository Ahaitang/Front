import * as XLSX from 'xlsx'

/**
 * 导出数据到 Excel
 */
export function exportToExcel(data: any[], filename: string, headers?: Record<string, string>) {
  // 如果提供了 headers，则转换数据
  const exportData = headers
    ? data.map(item => {
        const row: Record<string, any> = {}
        for (const [key, label] of Object.entries(headers)) {
          row[label] = item[key]
        }
        return row
      })
    : data

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 计算剩余时间描述
 */
export function formatRemainingTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '已过期'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}