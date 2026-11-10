// CSV 导出 — 公共辅助

/** CSV 单元格转义(逗号 / 引号 / 换行需包裹) */
export function csvCell(value: unknown): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** 触发浏览器下载 */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(filename, blob)
}

/** 触发浏览器下载任意 Blob(保留原文件名与类型) */
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 延迟释放,避免部分浏览器在下载开始前就回收掉 URL
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
