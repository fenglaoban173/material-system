// 媒体消耗明细 — 行数据与导出格式化
// 列表展示、CSV 导出、源文件回溯下载共用同一套列定义与单元格格式。

import {
  MEDIA_PLATFORM_MAP,
  type MediaCostColumnDef,
  type MediaCostRecord,
  type MediaPlatform,
} from '@/types/media-cost'
import { csvCell } from '@/utils/csv'
import { calcCpc, calcCtr, calcExposureRate, calcRoi } from '@/utils/media-metrics'

/** 展示行:原始记录 + 派生指标 */
export type MediaCostRow = MediaCostRecord & {
  /** 千次点击成本 */
  cpc: number
  /** 点击率(%) */
  ctr: number
  /** 曝光率(%) */
  exposureRate: number
  /** ROI */
  roi: number
  /** 来源批次文件名(展示 / 导出时用,比批次 ID 更可读) */
  batchFileName?: string
}

/** 原始记录 → 展示行 */
export function toMediaCostRow(record: MediaCostRecord): MediaCostRow {
  return {
    ...record,
    cpc: calcCpc(record.cost, record.clicks),
    ctr: calcCtr(record.impressions, record.clicks),
    exposureRate: calcExposureRate(record.impressions, record.conversions),
    roi: calcRoi(record.cost, record.conversions),
  }
}

/** 媒体名称 */
export function mediaName(code: MediaPlatform): string {
  return MEDIA_PLATFORM_MAP[code]?.name ?? code
}

/** 千分位数字 */
export function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

/** 金额(保留两位小数) */
export function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** 单元格展示值 */
export function mediaCellText(col: MediaCostColumnDef, row: MediaCostRow): string {
  switch (col.key) {
    case 'platform':
      return mediaName(row.platform)
    case 'date':
      return row.date
    case 'materialName':
      return row.materialName || '-'
    case 'clicks':
      return formatNumber(row.clicks)
    case 'impressions':
      return formatNumber(row.impressions)
    case 'cpc':
      return formatMoney(row.cpc)
    case 'ctr':
      return `${row.ctr.toFixed(2)}%`
    case 'exposureRate':
      return `${row.exposureRate.toFixed(2)}%`
    case 'roi':
      return row.roi.toFixed(2)
    case 'cost':
      return formatMoney(row.cost)
    case 'materialId':
      return row.materialId
    case 'accountName':
      return row.accountName || '-'
    case 'plays':
      return formatNumber(row.plays)
    case 'engagements':
      return formatNumber(row.engagements)
    case 'conversions':
      return formatNumber(row.conversions)
    case 'batchId':
      return row.batchFileName || row.batchId
    default:
      return '-'
  }
}

/** 按列定义生成 CSV 文本(带 BOM,Excel 打开不乱码) */
export function buildCsvFromRows(rows: MediaCostRow[], columns: MediaCostColumnDef[]): string {
  const header = columns.map((c) => c.title)
  const body = rows.map((row) => columns.map((c) => mediaCellText(c, row)).map(csvCell).join(','))
  return `﻿${[header.join(','), ...body].join('\r\n')}`
}
