import request from '@/utils/request'
import type {
  MediaCostBatch,
  MediaCostImportPayload,
  MediaCostPagedResult,
  MediaCostQuery,
  MediaPlatform,
} from '@/types/media-cost'

/**
 * 媒体消耗报表接口
 *
 * 说明:各媒体后台导出的表头命名不一致,前端上传时已完成「字段映射 + 归一化」,
 * 后端接收到的 records 均为统一结构(金额单位:元,日期格式:YYYY-MM-DD)。
 */

/** 查询媒体消耗明细 */
export const getMediaCostList = (params: MediaCostQuery): Promise<MediaCostPagedResult> => {
  return request.get('/report/media-cost/list', { params })
}

/** 查询导入批次 */
export const getMediaCostBatches = (params?: {
  platform?: MediaPlatform
}): Promise<MediaCostBatch[]> => {
  return request.get('/report/media-cost/batches', { params })
}

/** 导入媒体消耗数据 */
export const importMediaCost = (
  payload: MediaCostImportPayload
): Promise<MediaCostBatch> => {
  return request.post('/report/media-cost/import', payload)
}

/** 删除导入批次(级联删除该批次明细) */
export const deleteMediaCostBatch = (id: string): Promise<void> => {
  return request.delete(`/report/media-cost/batches/${id}`)
}
