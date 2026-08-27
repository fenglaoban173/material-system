// 报表管理 / 违规积分明细 — 类型定义
// 来源：巨量引擎开放平台 score_violation_event/get 接口
// https://open.oceanengine.com/labels/7/docs/1807434338681868

/** 业务线 */
export type BusinessLine = 'AD' | 'LOCALAD'

/** 违规单状态 */
export type ViolationStatus =
  | 'APPEAL' // 已申诉（失效）
  | 'FAILAPPEAL' // 申诉失败
  | 'ONAPPEAL' // 申诉中
  | 'VALID' // 生效
  | 'TIMEOUT' // 已超时不可申诉
  | 'APPEALDISABLED' // 不支持申诉

/** 违规类型 */
export type IllegalType =
  | 'GENERAL' // 一般违规（AD）
  | 'SERIOUS' // 严重违规（AD）
  | 'CRITICAL' // 严重违规（本地推）
  | 'MINOR' // 一般违规（本地推）
  | 'BACKLINKSERIOUS' // 后链路严重违规（AD）
  | 'BACKLINKGENERAL' // 后链路一般违规（AD）

/** 过滤条件 */
export interface ViolationFilter {
  status?: ViolationStatus
  start_time?: string
  end_time?: string
  event_id?: number
  illegal_type?: IllegalType
}

/** 查询参数 */
export interface ViolationScoreQuery {
  advertiser_id: number
  business_line: BusinessLine
  page?: number
  page_size?: number
  filtering?: ViolationFilter
}

/** 分页信息 */
export interface PageInfo {
  page: number
  page_size: number
  total_page: number
  total_number: number
}

/** 违规单事件 */
export interface ViolationScoreEvent {
  event_id: number
  advertiser_id: number
  ad_id: number
  material_id: string
  violation_evidence_img: string
  score: number
  reject_reason: string
  create_time: string
  status: ViolationStatus
  illegal_type: IllegalType
  /** 业务线（前端按筛选条件回填，接口本身不返回） */
  business_line?: BusinessLine
}

/** 接口 data 字段 */
export interface ViolationScoreData {
  adv_score_event: ViolationScoreEvent[]
  page_info: PageInfo
}

/** 接口标准应答 */
export interface ViolationScoreResponse {
  code: number
  message: string
  data: ViolationScoreData
  request_id?: string
}

/** 状态枚举显示文案 */
export const VIOLATION_STATUS_MAP: Record<ViolationStatus, { text: string; color: string }> = {
  APPEAL: { text: '已申诉（失效）', color: 'gray' },
  FAILAPPEAL: { text: '申诉失败', color: 'red' },
  ONAPPEAL: { text: '申诉中', color: 'arcoblue' },
  VALID: { text: '生效', color: 'green' },
  TIMEOUT: { text: '已超时不可申诉', color: 'orangered' },
  APPEALDISABLED: { text: '不支持申诉', color: 'gray' },
}

/** 违规类型显示文案 */
export const ILLEGAL_TYPE_MAP: Record<IllegalType, string> = {
  GENERAL: '一般违规（AD）',
  SERIOUS: '严重违规（AD）',
  CRITICAL: '严重违规（本地推）',
  MINOR: '一般违规（本地推）',
  BACKLINKSERIOUS: '后链路严重违规（AD）',
  BACKLINKGENERAL: '后链路一般违规（AD）',
}

/** 业务线显示文案 */
export const BUSINESS_LINE_MAP: Record<BusinessLine, string> = {
  AD: 'AD 营销',
  LOCALAD: '本地推',
}
