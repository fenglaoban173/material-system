// Material Types
export type MaterialType = 'VIDEO' | 'IMAGE' | 'AUDIO' | 'FONT' | 'VOICE'

export type MaterialStatus = 'VALID' | 'PENDING' | 'AUDITING' | 'REJECTED' | 'DELETED'

export type UploadType = 'UPLOAD_BY_FILE' | 'UPLOAD_BY_URL'

export type MaterialUseAs = 'BACKGROUND' | 'FOREGROUND' | 'POST_VIDEO' | 'PRE_VIDEO' | 'RAW'

// Material Entity
export interface Material {
  id: number
  name: string
  type: MaterialType
  status: MaterialStatus
  url: string
  thumbnail?: string
  size: number
  width?: number
  height?: number
  duration?: number
  format: string
  signature: string
  tags?: string[]
  createTime: string
  updateTime?: string
  advertiserId: number
  isAIGC?: boolean
  auditStatus?: 'PASS' | 'REJECT' | 'WARNING'
  rejectReasons?: string[]
  // 需求相关字段
  demandId?: string
  cost?: number
  impressions?: number
  clicks?: number
  conversions?: number
  costPerConversion?: number
  conversionRate?: number
}

// Upload Request
export interface UploadRequest {
  advertiserId: number
  uploadType: UploadType
  filename: string
  isAIGC?: boolean
  // File upload
  file?: File
  signature?: string
  // URL upload
  url?: string
}

// Upload Response
export interface UploadResponse {
  code: number
  message: string
  data: {
    materialId: number
    url: string
    width: number
    height: number
    size: number
    duration?: number
    format: string
    signature: string
  }
}

// Material List Query
export interface MaterialListQuery {
  advertiserId: number
  materialIds?: number[]
  materialType?: MaterialType
  page?: number
  pageSize?: number
}

// Material List Response
export interface MaterialListResponse {
  code: number
  message: string
  data: {
    pageInfo: {
      page: number
      pageSize: number
      totalNumber: number
      totalPage: number
    }
    list: Material[]
  }
}

// Batch Delete Request
export interface BatchDeleteRequest {
  advertiserId: number
  materialIds: number[]
}

// Pre-audit Request
export interface PreAuditRequest {
  advertiserId: number
  materialIds: number[]
}

// Pre-audit Result
export interface PreAuditResult {
  materialId: number
  status: 'PASS' | 'REJECT' | 'WARNING'
  rejectReasons?: string[]
  suggestions?: string[]
}

// Quality Analysis
export interface QualityAnalysis {
  materialId: number
  clarity: number
  brightness: number
  contrast: number
  tags: string[]
  labels: string[]
}

// Cleanup Task
export interface CleanupTask {
  id: number
  advertiserId: number
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  filterConditions: {
    startDate?: string
    endDate?: string
    minDuration?: number
    maxDuration?: number
    maxSize?: number
  }
  totalCount: number
  cleanedCount: number
  createTime: string
  completeTime?: string
}

// AIGC Element
export interface AIGCElement {
  elementId: number
  elementType: MaterialType | 'FOLDER'
  elementName: string
  elementUrl: string
  signature: string
  useAs: MaterialUseAs
  pathName: string
  createTime: string
}

// Share Settings
export interface ShareSettings {
  advertiserId: number
  materialIds: number[]
  targetAdvertiserIds: number[]
  shareType: 'READ' | 'WRITE'
}

// 素材组合项: 1 个需求可包含 N 个 (类型+版式+数量) 三元组
export interface MaterialItem {
  /** 类型 cascader 路径, 如 ['IMAGE', 'IMAGE_DETAIL'] 或 ['VIDEO', 'VIDEO_CLIP'] */
  typePath: string[]
  /** 版式, 如 '详情页' / '竖版视频', 依赖 typePath */
  format: string
  /** 该组合下的素材数量, 整数 >= 1 */
  count: number
}

// 创作者/设计师: 一个需求下可分配多人, 每人负责若干素材组合
export interface Creator {
  /** 设计师姓名 */
  name: string
  /** 状态: 已分配 / 制作中 / 审核中 / 已完成 / 待分配 */
  status?: string
  /** 状态标签色: blue / orange / green / arcoblue 等 */
  statusColor?: string
  /** 该创作者负责的素材组合(类型+版式+数量) */
  materials?: MaterialItem[]
}

// Stats
export interface MaterialStats {
  totalCount: number
  videoCount: number
  imageCount: number
  audioCount: number
  todayUploadCount: number
  pendingAuditCount: number
  storageUsed: number
  storageTotal: number
}
