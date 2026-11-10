// 上传文件解析工具
// 支持 CSV / TXT(内置解析) 与 Excel(.xlsx / .xlsm,基于 fflate 解压 + DOMParser 解析 XML)
// 解析结果统一为「二维字符串表格」,再由字段映射规则归一化为媒体消耗记录

import { unzipSync, strFromU8 } from 'fflate'
import { MEDIA_COST_FIELDS, type MediaCostField } from '@/types/media-cost'

/** 解析后的表格:第一行为表头 */
export interface ParsedGrid {
  /** 表头 */
  headers: string[]
  /** 数据行(与 headers 等长) */
  rows: string[][]
}

/** 字段映射:目标字段 → 源文件列名 */
export type ColumnMapping = Partial<Record<MediaCostField, string>>

// ────────────────────────────── CSV / 文本 ──────────────────────────────

/** 猜测分隔符(逗号 / 分号 / 制表符) */
function detectDelimiter(text: string): string {
  const sample = text.slice(0, 5000)
  const candidates = [',', ';', '\t']
  let best = ','
  let bestCount = 0
  for (const d of candidates) {
    // 只统计引号外的分隔符
    let count = 0
    let inQuotes = false
    for (const ch of sample) {
      if (ch === '"') inQuotes = !inQuotes
      else if (!inQuotes && ch === d) count++
    }
    if (count > bestCount) {
      bestCount = count
      best = d
    }
  }
  return best
}

/** CSV 状态机解析,支持引号包裹、转义双引号、换行 */
function parseMatrix(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushRow = () => {
    row.push(field)
    field = ''
    if (row.some((c) => c.trim() !== '')) rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === delimiter) {
      row.push(field)
      field = ''
      continue
    }
    if (ch === '\r') {
      if (text[i + 1] === '\n') i++
      pushRow()
      continue
    }
    if (ch === '\n') {
      pushRow()
      continue
    }
    field += ch
  }
  if (field !== '' || row.length) pushRow()

  return rows
}

/** 解析 CSV / 文本内容 */
export function parseDelimitedText(text: string): ParsedGrid {
  // 去掉 BOM
  const clean = text.replace(/^﻿/, '')
  const matrix = parseMatrix(clean, detectDelimiter(clean))
  if (!matrix.length) return { headers: [], rows: [] }
  const [headers, ...rows] = matrix
  return {
    headers: headers.map((h) => h.trim()),
    rows: rows.map((r) => {
      const copy = r.slice(0, headers.length)
      while (copy.length < headers.length) copy.push('')
      return copy
    }),
  }
}

// ────────────────────────────── Excel (.xlsx) ──────────────────────────────

/** "BC12" → 54(0 基列号) */
function columnIndexFromRef(ref: string): number {
  const m = /^([A-Z]+)/i.exec(ref)
  if (!m) return -1
  let n = 0
  for (const ch of m[1].toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  // DOMParser 解析失败时会返回带 parsererror 的文档
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('文件内容不是合法的 Excel(XML 解析失败)')
  }
  return doc
}

/** 读取 xl/sharedStrings.xml */
function readSharedStrings(files: Record<string, Uint8Array>): string[] {
  const raw = files['xl/sharedStrings.xml']
  if (!raw) return []
  const doc = parseXml(strFromU8(raw))
  const list: string[] = []
  const nodes = doc.getElementsByTagName('si')
  for (let i = 0; i < nodes.length; i++) {
    const texts = nodes[i].getElementsByTagName('t')
    let value = ''
    for (let j = 0; j < texts.length; j++) value += texts[j].textContent ?? ''
    list.push(value)
  }
  return list
}

/** 读取工作表关系,返回 rId → 工作表路径 */
function readSheetRels(files: Record<string, Uint8Array>): Record<string, string> {
  const raw = files['xl/_rels/workbook.xml.rels']
  const map: Record<string, string> = {}
  if (!raw) return map
  const doc = parseXml(strFromU8(raw))
  const nodes = doc.getElementsByTagName('Relationship')
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i]
    const id = el.getAttribute('Id')
    const target = el.getAttribute('Target')
    if (!id || !target) continue
    map[id] = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`
  }
  return map
}

/** 读取单元格文本 */
function cellText(cell: Element, shared: string[]): string {
  const t = cell.getAttribute('t')
  if (t === 'inlineStr') {
    const texts = cell.getElementsByTagName('t')
    let v = ''
    for (let i = 0; i < texts.length; i++) v += texts[i].textContent ?? ''
    return v
  }
  const vNodes = cell.getElementsByTagName('v')
  const raw = vNodes.length ? (vNodes[0].textContent ?? '') : ''
  if (t === 's') {
    const idx = Number(raw)
    return Number.isNaN(idx) ? '' : shared[idx] ?? ''
  }
  if (t === 'b') return raw === '1' ? 'TRUE' : 'FALSE'
  return raw
}

/** 解析 Excel 工作簿(取第一个工作表) */
export function parseXlsx(buffer: ArrayBuffer): ParsedGrid {
  const files = unzipSync(new Uint8Array(buffer))

  const shared = readSharedStrings(files)
  const rels = readSheetRels(files)

  // 定位第一个工作表
  const workbookRaw = files['xl/workbook.xml']
  if (!workbookRaw) throw new Error('不是有效的 Excel 文件(缺少 xl/workbook.xml)')
  const workbook = parseXml(strFromU8(workbookRaw))
  const sheetNodes = workbook.getElementsByTagName('sheet')
  if (!sheetNodes.length) throw new Error('Excel 中没有找到工作表')

  const firstSheet = sheetNodes[0]
  const rid = firstSheet.getAttribute('r:id') || firstSheet.getAttribute('id')
  let sheetPath = rid && rels[rid]
  if (!sheetPath) {
    // 兜底:直接找第一个 worksheet
    const candidate = Object.keys(files).find((k) => /^xl\/worksheets\/.*\.xml$/.test(k))
    if (!candidate) throw new Error('Excel 中没有找到工作表数据')
    sheetPath = candidate
  }
  const sheetRaw = files[sheetPath]
  if (!sheetRaw) throw new Error('Excel 工作表数据缺失')

  const sheetDoc = parseXml(strFromU8(sheetRaw))
  const rowNodes = sheetDoc.getElementsByTagName('row')
  const matrix: string[][] = []

  for (let r = 0; r < rowNodes.length; r++) {
    const cells = rowNodes[r].getElementsByTagName('c')
    const values: string[] = []
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c]
      const ref = cell.getAttribute('r')
      const col = ref ? columnIndexFromRef(ref) : values.length
      const text = cellText(cell, shared)
      // 补齐跳过的空单元格
      while (values.length < col) values.push('')
      values[col] = text
    }
    if (values.some((v) => String(v).trim() !== '')) matrix.push(values)
  }

  if (!matrix.length) return { headers: [], rows: [] }
  const width = matrix.reduce((max, row) => Math.max(max, row.length), 0)
  const headers = matrix[0].map((h) => String(h).trim())
  while (headers.length < width) headers.push('')
  const rows = matrix.slice(1).map((row) => {
    const copy = row.slice(0, width)
    while (copy.length < width) copy.push('')
    return copy.map((v) => String(v))
  })
  return { headers, rows }
}

/** 按文件后缀自动选择解析方式 */
export async function parseFile(file: File): Promise<ParsedGrid> {
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()
  if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
    return parseXlsx(buffer)
  }
  // CSV / TXT: 用 TextDecoder 读取(兼容 GBK 兜底)
  const text = decodeText(buffer)
  return parseDelimitedText(text)
}

/** 解码文本,UTF-8 乱码时回退 GBK */
function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  // 出现大量替换字符(U+FFFD)说明不是 UTF-8,回退 GBK
  const bad = utf8.split(String.fromCharCode(0xfffd)).length - 1
  if (bad > 0 && bad / Math.max(utf8.length, 1) > 0.01) {
    try {
      return new TextDecoder('gbk').decode(bytes)
    } catch {
      return utf8
    }
  }
  return utf8
}

// ────────────────────────────── 字段映射 ──────────────────────────────

/** 表头归一化:去空格 / 下划线 / 连字符,转小写 */
function normalizeHeader(header: string): string {
  return String(header ?? '')
    .replace(/[\s　_\-]/g, '')
    .toLowerCase()
}

/** 比率类表头不参与数值字段的自动匹配 */
const RATIO_PATTERN = /率|占比|比例|单价|均价/

/**
 * 根据表头自动匹配字段映射。
 * 规则:先精确匹配,再「别名包含 + 少量后缀」匹配;同一个源列不会被两个字段重复占用。
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader)
  const used = new Set<number>()
  const mapping: ColumnMapping = {}

  // 必填字段优先匹配,避免可选字段抢走「素材 ID」这类列
  const ordered = [...MEDIA_COST_FIELDS].sort(
    (a, b) => Number(b.required) - Number(a.required),
  )

  for (const field of ordered) {
    const aliases = field.aliases.map(normalizeHeader)
    let hit = -1

    // 1. 精确匹配
    for (let i = 0; i < normalized.length; i++) {
      if (used.has(i) || !normalized[i]) continue
      if (aliases.includes(normalized[i])) {
        hit = i
        break
      }
    }

    // 2. 别名被表头包含(允许少量后缀,如「消耗金额(元)」)
    if (hit < 0) {
      for (let i = 0; i < normalized.length; i++) {
        if (used.has(i) || !normalized[i]) continue
        if (field.numeric && RATIO_PATTERN.test(normalized[i])) continue
        // 取「能匹配且长度差最小」的那个别名,
        // 避免「消耗」抢走本该属于「消耗金额(元)」的列
        let bestAlias = ''
        for (const alias of aliases) {
          if (!alias || !normalized[i].includes(alias)) continue
          if (normalized[i].length - alias.length > 4) continue
          if (alias.length > bestAlias.length) bestAlias = alias
        }
        if (bestAlias) {
          hit = i
          break
        }
      }
    }

    if (hit >= 0) {
      used.add(hit)
      mapping[field.key] = headers[hit]
    }
  }

  return mapping
}

/** 把数值单元格转成 number,失败返回 0 */
export function parseNumeric(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (value === null || value === undefined) return 0
  let s = String(value).trim()
  if (!s) return 0

  let multiplier = 1
  if (/万$/.test(s)) {
    multiplier = 1e4
    s = s.replace(/万$/, '')
  } else if (/亿$/.test(s)) {
    multiplier = 1e8
    s = s.replace(/亿$/, '')
  }
  s = s.replace(/[,，\s　¥￥$元个人次条]/g, '')
  if (!/^-?\d*\.?\d+%?$/.test(s)) return 0
  const n = Number(s.replace('%', ''))
  if (!Number.isFinite(n)) return 0
  return n * multiplier
}

/** 把日期单元格归一化为 YYYY-MM-DD,无法识别时返回空串 */
export function parseDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(value)
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel 序列号(1900 日期系统): 20000 ~ 60000 约为 1954 ~ 2064 年
    if (value > 20000 && value < 60000) {
      const ms = Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000
      return formatDate(new Date(ms))
    }
    // 20260501 这类紧凑数字
    if (value >= 19000101 && value <= 29991231) {
      const s = String(Math.floor(value))
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    }
    return ''
  }

  const s = String(value ?? '').trim()
  if (!s) return ''

  // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD(可带时间部分)
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`

  // YYYYMMDD
  const digits = s.replace(/\D/g, '')
  if (digits.length === 8) {
    const m2 = /^(\d{4})(\d{2})(\d{2})$/.exec(digits)
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`
  }

  // MM/DD/YYYY
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(s)
  if (m) return `${m[3]}-${pad(m[1])}-${pad(m[2])}`

  return ''
}

function pad(v: string | number): string {
  return String(v).padStart(2, '0')
}

function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** 生成 CSV 导入模板内容 */
export function buildCsvTemplate(): string {
  const headers = MEDIA_COST_FIELDS.map((f) => f.label)
  const sample = [
    '2026-05-01',
    'mat_2026_05_0001',
    '示例素材-春日上新',
    '央广时代-品牌账户',
    '1280.50',
    '250000',
    '6200',
    '48000',
    '3100',
    '260',
  ]
  const lines = [headers.join(','), sample.join(',')]
  return `﻿${lines.join('\r\n')}`
}
