/**
 * 数据导出工具
 */
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'

/**
 * 导出 Excel 文件
 * @param data 要导出的数据数组
 * @param fileName 文件名
 * @param sheetName 工作表名称
 */
export function exportToExcel(
  data: any[],
  fileName: string,
  sheetName: string = 'Sheet1'
) {
  try {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    // 设置列宽
    const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 15 }))
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `${fileName}.xlsx`)

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('导出错误:', error)
  }
}

/**
 * 导出多个工作表的 Excel 文件
 * @param sheets 工作表数据数组，每个元素包含 name 和 data
 * @param fileName 文件名
 */
export function exportMultipleSheets(
  sheets: Array<{ name: string; data: any[] }>,
  fileName: string
) {
  try {
    const wb = XLSX.utils.book_new()

    sheets.forEach(sheet => {
      const ws = XLSX.utils.json_to_sheet(sheet.data)
      if (sheet.data.length > 0) {
        const colWidths = Object.keys(sheet.data[0]).map(() => ({ wch: 15 }))
        ws['!cols'] = colWidths
      }
      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    })

    XLSX.writeFile(wb, `${fileName}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('导出错误:', error)
  }
}