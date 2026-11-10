import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type MediaCostBatch,
  type MediaCostBatchQuery,
  type MediaCostImportPayload,
  type MediaCostPagedResult,
  type MediaCostQuery,
  type MediaCostRecord,
} from '@/types/media-cost'
import { generateMockBatches, generateMockRecords } from '@/mock/media-cost'

/**
 * 原始上传文件(按批次 ID 存)。
 * 放在 store 外部,避免 File 对象被 Vue 代理后无法再生成 Blob。
 */
const rawFiles = new Map<string, File>()

export const useMediaCostStore = defineStore('mediaCost', () => {
  // State
  const records = ref<MediaCostRecord[]>([])
  const batches = ref<MediaCostBatch[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  // Getters
  /** 全部记录(未分页) */
  const allRecords = computed(() => records.value)

  /** 按批次统计行数 */
  const batchRowCount = computed(() => {
    const map: Record<string, number> = {}
    for (const r of records.value) {
      map[r.batchId] = (map[r.batchId] || 0) + 1
    }
    return map
  })

  /** 载入种子数据 */
  function init() {
    if (initialized.value) return
    records.value = generateMockRecords(30)
    batches.value = generateMockBatches()
    initialized.value = true
  }

  /** 按查询条件过滤(前端过滤,供汇总 / 图表 / 分页复用) */
  function filterRecords(query: MediaCostQuery): MediaCostRecord[] {
    let list = records.value

    if (query.platforms?.length) {
      const set = new Set(query.platforms)
      list = list.filter((r) => set.has(r.platform))
    }
    if (query.accountName) {
      const kw = query.accountName.trim().toLowerCase()
      if (kw) list = list.filter((r) => r.accountName.toLowerCase().includes(kw))
    }
    if (query.keyword) {
      const kw = query.keyword.trim().toLowerCase()
      if (kw) {
        list = list.filter(
          (r) =>
            r.materialId.toLowerCase().includes(kw) ||
            r.materialName.toLowerCase().includes(kw),
        )
      }
    }
    if (query.batchFileName) {
      const kw = query.batchFileName.trim().toLowerCase()
      if (kw) {
        const nameMap = new Map(
          batches.value.map((b) => [b.id, b.fileName.toLowerCase()]),
        )
        list = list.filter((r) => (nameMap.get(r.batchId) ?? '').includes(kw))
      }
    }
    if (query.startDate) list = list.filter((r) => r.date >= query.startDate!)
    if (query.endDate) list = list.filter((r) => r.date <= query.endDate!)

    // 日期倒序,同日按消耗倒序
    return [...list].sort((a, b) =>
      a.date === b.date ? b.cost - a.cost : a.date < b.date ? 1 : -1,
    )
  }

  /** 查询消耗明细(前端过滤 + 分页) */
  function fetchList(query: MediaCostQuery): MediaCostPagedResult {
    loading.value = true
    try {
      const list = filterRecords(query)
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 10
      const start = (page - 1) * pageSize
      return {
        list: list.slice(start, start + pageSize),
        total: list.length,
        page,
        pageSize,
      }
    } finally {
      loading.value = false
    }
  }

  /** 查询导入批次(前端过滤 + 导入时间倒序) */
  function fetchBatches(query?: MediaCostBatchQuery): MediaCostBatch[] {
    let list = batches.value

    if (query?.platform) {
      list = list.filter((b) => b.platform === query.platform)
    }
    if (query?.fileName) {
      const kw = query.fileName.trim().toLowerCase()
      if (kw) list = list.filter((b) => b.fileName.toLowerCase().includes(kw))
    }
    if (query?.status) {
      list = list.filter((b) => b.status === query.status)
    }
    if (query?.operator) {
      const kw = query.operator.trim().toLowerCase()
      if (kw) list = list.filter((b) => b.operator.toLowerCase().includes(kw))
    }
    // 导入时间形如 "2026-11-09 10:10:00",取日期部分比较
    if (query?.startDate) list = list.filter((b) => b.createdAt.slice(0, 10) >= query.startDate!)
    if (query?.endDate) list = list.filter((b) => b.createdAt.slice(0, 10) <= query.endDate!)

    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  /** 导入数据 */
  function importRecords(payload: MediaCostImportPayload, file?: File): MediaCostBatch {
    const now = new Date()
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const batchId = `batch_${payload.platform.toLowerCase()}_${Date.now()}`
    const newRecords: MediaCostRecord[] = payload.records.map((r, i) => ({
      ...r,
      id: `${batchId}_${String(i + 1).padStart(4, '0')}`,
      platform: payload.platform,
      batchId,
      createdAt,
    }))

    records.value = [...newRecords, ...records.value]
    batches.value = [
      {
        id: batchId,
        platform: payload.platform,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        rowCount: payload.records.length,
        status: 'SUCCESS',
        operator: '当前用户',
        createdAt,
      },
      ...batches.value,
    ]
    // 留存原始上传文件,便于在列表里回溯下载
    if (file) rawFiles.set(batchId, file)

    return batches.value[0]
  }

  /** 取批次的原始上传文件(演示数据没有原文件时返回 undefined) */
  function getBatchFile(batchId: string): File | undefined {
    return rawFiles.get(batchId)
  }

  /** 删除批次(同时移除该批次下的明细) */
  function removeBatch(id: string) {
    records.value = records.value.filter((r) => r.batchId !== id)
    batches.value = batches.value.filter((b) => b.id !== id)
    rawFiles.delete(id)
  }

  /** 批量删除明细(明细清空的批次一并移除) */
  function removeRecords(ids: string[]) {
    if (!ids.length) return
    const set = new Set(ids)
    records.value = records.value.filter((r) => !set.has(r.id))
    const alive = new Set(records.value.map((r) => r.batchId))
    batches.value = batches.value.filter((b) => alive.has(b.id))
    for (const batchId of Array.from(rawFiles.keys())) {
      if (!alive.has(batchId)) rawFiles.delete(batchId)
    }
  }

  return {
    records,
    batches,
    loading,
    initialized,
    allRecords,
    batchRowCount,
    init,
    filterRecords,
    fetchList,
    fetchBatches,
    importRecords,
    getBatchFile,
    removeBatch,
    removeRecords,
  }
})
