// 媒体消耗报表 — 类型定义
// 支持多媒体(巨量引擎 / TikTok / 微博 / 快手 / 小红书 / 腾讯)素材消耗数据上传与汇总

/** 媒体平台 */
export type MediaPlatform =
  | 'OCEANENGINE' // 巨量引擎
  | 'TIKTOK' // TikTok
  | 'WEIBO' // 微博
  | 'KUAISHOU' // 快手
  | 'XIAOHONGSHU' // 小红书
  | 'TENCENT' // 腾讯

/** 媒体平台元信息 */
export interface MediaPlatformMeta {
  code: MediaPlatform
  /** 完整名称 */
  name: string
  /** 短名称,用于表格标签 */
  short: string
  /** 主题色(图表 / 标签) */
  color: string
  /** 官方后台导出报表的常见格式提示 */
  exportHint: string
}

/** 全部支持的媒体平台 */
export const MEDIA_PLATFORM_LIST: MediaPlatformMeta[] = [
  {
    code: 'OCEANENGINE',
    name: '巨量引擎',
    short: '巨量',
    color: '#165DFF',
    exportHint: '巨量千川 / 穿山甲 后台「素材报表」导出',
  },
  {
    code: 'TIKTOK',
    name: 'TikTok',
    short: 'TikTok',
    color: '#722ED1',
    exportHint: 'TikTok Ads Manager「素材报表」导出',
  },
  {
    code: 'WEIBO',
    name: '微博',
    short: '微博',
    color: '#FF7D00',
    exportHint: '微博粉丝通「投放报表」导出',
  },
  {
    code: 'KUAISHOU',
    name: '快手',
    short: '快手',
    color: '#00B42A',
    exportHint: '磁力引擎「素材报表」导出',
  },
  {
    code: 'XIAOHONGSHU',
    name: '小红书',
    short: '小红书',
    color: '#F53F3F',
    exportHint: '小红书聚光「素材报表」导出',
  },
  {
    code: 'TENCENT',
    name: '腾讯',
    short: '腾讯',
    color: '#14C9C9',
    exportHint: '腾讯广告「素材投放报表」导出',
  },
]

/** 媒体平台索引 */
export const MEDIA_PLATFORM_MAP: Record<MediaPlatform, MediaPlatformMeta> =
  MEDIA_PLATFORM_LIST.reduce(
    (acc, item) => {
      acc[item.code] = item
      return acc
    },
    {} as Record<MediaPlatform, MediaPlatformMeta>,
  )

/** 导入批次状态 */
export type MediaCostBatchStatus = 'SUCCESS' | 'PARSING' | 'FAILED'

/** 导入批次状态文案 */
export const MEDIA_COST_BATCH_STATUS_MAP: Record<
  MediaCostBatchStatus,
  { text: string; color: string }
> = {
  SUCCESS: { text: '导入成功', color: 'green' },
  PARSING: { text: '解析中', color: 'blue' },
  FAILED: { text: '导入失败', color: 'red' },
}

/** 单条素材消耗记录(各平台归一化后的统一结构) */
export interface MediaCostRecord {
  id: string
  /** 所属媒体平台 */
  platform: MediaPlatform
  /** 数据日期 YYYY-MM-DD */
  date: string
  /** 素材 ID */
  materialId: string
  /** 素材名称 */
  materialName: string
  /** 投放账号 / 广告主体 */
  accountName: string
  /** 消耗金额(元) */
  cost: number
  /** 曝光量 */
  impressions: number
  /** 点击量 */
  clicks: number
  /** 播放量 */
  plays: number
  /** 互动量(点赞 / 评论 / 转发合计) */
  engagements: number
  /** 转化量 */
  conversions: number
  /** 来源导入批次 ID */
  batchId: string
  /** 导入时间 */
  createdAt: string
}

/** 导入批次 */
export interface MediaCostBatch {
  id: string
  platform: MediaPlatform
  fileName: string
  /** 文件大小(字节) */
  fileSize: number
  /** 成功入库行数 */
  rowCount: number
  status: MediaCostBatchStatus
  operator: string
  createdAt: string
  /** 失败原因 */
  error?: string
}

/** 导入记录列表的列定义 */
export interface MediaCostColumnDef {
  /** 字段 key(对应 MediaCostRecord 字段或派生指标) */
  key: string
  /** 表头文案 */
  title: string
  /** 列宽 */
  width: number
  /** 对齐方式 */
  align?: 'left' | 'right'
  /** 表头说明(指标口径) */
  hint?: string
}

/** 公共字段:所有媒体报表都有口径的指标 */
export const MEDIA_COST_COMMON_COLUMNS: MediaCostColumnDef[] = [
  { key: 'date', title: '消耗日期', width: 105 },
  { key: 'materialName', title: '素材名称', width: 180 },
  { key: 'clicks', title: '点击', width: 95, align: 'right' },
  { key: 'impressions', title: '曝光', width: 105, align: 'right' },
  {
    key: 'cpc',
    title: '千次点击成本',
    width: 140,
    align: 'right',
    hint: '消耗 ÷ 点击 × 1000,单位:元',
  },
  { key: 'ctr', title: '点击率', width: 110, align: 'right', hint: '点击 ÷ 曝光 × 100%' },
  {
    key: 'exposureRate',
    title: '曝光率',
    width: 110,
    align: 'right',
    hint: '转化 ÷ 曝光 × 100%,即每百次曝光的转化数',
  },
  {
    key: 'roi',
    title: 'ROI',
    width: 95,
    align: 'right',
    hint: '转化 ÷ 消耗 × 100,即每百元消耗的转化数',
  },
]

/** 媒体列(仅「全部媒体」页签需要,单媒体页签下媒体固定) */
export const MEDIA_COST_MEDIA_COLUMN: MediaCostColumnDef = {
  key: 'platform',
  title: '媒体',
  width: 120,
}

/** 来源批次列(所有媒体通用,用于追溯数据来自哪一次导入) */
export const MEDIA_COST_BATCH_COLUMN: MediaCostColumnDef = {
  key: 'batchId',
  title: '来源批次',
  width: 200,
}

/**
 * 各媒体专属字段。
 * 只列出该平台后台报表里才有口径的指标,公共字段不在这里重复。
 */
export const MEDIA_COST_EXTRA_COLUMNS: Record<MediaPlatform, MediaCostColumnDef[]> = {
  OCEANENGINE: [
    { key: 'cost', title: '消耗(元)', width: 120, align: 'right' },
    { key: 'materialId', title: '素材 ID', width: 150 },
    { key: 'accountName', title: '投放账号', width: 170 },
    { key: 'plays', title: '播放量', width: 110, align: 'right' },
    { key: 'engagements', title: '互动量', width: 100, align: 'right' },
    { key: 'conversions', title: '转化量', width: 100, align: 'right' },
  ],
  TIKTOK: [
    { key: 'cost', title: '消耗(元)', width: 120, align: 'right' },
    { key: 'materialId', title: '素材 ID', width: 150 },
    { key: 'accountName', title: '投放账号', width: 170 },
    { key: 'plays', title: '视频播放量', width: 120, align: 'right' },
    { key: 'engagements', title: '互动量', width: 100, align: 'right' },
  ],
  WEIBO: [
    { key: 'cost', title: '消耗(元)', width: 120, align: 'right' },
    { key: 'materialId', title: '素材 ID', width: 150 },
    { key: 'accountName', title: '投放账号', width: 170 },
    { key: 'engagements', title: '互动量', width: 100, align: 'right' },
    { key: 'conversions', title: '粉丝通转化', width: 120, align: 'right' },
  ],
  KUAISHOU: [
    { key: 'cost', title: '消耗(元)', width: 120, align: 'right' },
    { key: 'materialId', title: '素材 ID', width: 150 },
    { key: 'accountName', title: '投放账号', width: 170 },
    { key: 'plays', title: '播放量', width: 110, align: 'right' },
    { key: 'engagements', title: '互动量', width: 100, align: 'right' },
  ],
  XIAOHONGSHU: [
    { key: 'cost', title: '消耗(元)', width: 120, align: 'right' },
    { key: 'materialId', title: '素材 ID', width: 150 },
    { key: 'accountName', title: '投放账号', width: 170 },
    { key: 'engagements', title: '互动量', width: 100, align: 'right' },
    { key: 'conversions', title: '转化量', width: 100, align: 'right' },
  ],
  TENCENT: [
    { key: 'cost', title: '消耗(元)', width: 120, align: 'right' },
    { key: 'materialId', title: '素材 ID', width: 150 },
    { key: 'accountName', title: '投放账号', width: 170 },
    { key: 'plays', title: '视频播放量', width: 120, align: 'right' },
    { key: 'engagements', title: '互动量', width: 100, align: 'right' },
    { key: 'conversions', title: '转化量', width: 100, align: 'right' },
  ],
}

/** 某个媒体的完整列集合:公共字段 + 该媒体专属字段 + 来源批次 */
export function mediaCostColumns(platform: MediaPlatform): MediaCostColumnDef[] {
  return [
    ...MEDIA_COST_COMMON_COLUMNS,
    ...MEDIA_COST_EXTRA_COLUMNS[platform],
    MEDIA_COST_BATCH_COLUMN,
  ]
}

/** 导入批次查询参数 */
export interface MediaCostBatchQuery {
  /** 媒体平台 */
  platform?: MediaPlatform
  /** 文件名关键字(模糊匹配) */
  fileName?: string
  /** 导入状态 */
  status?: MediaCostBatchStatus
  /** 操作人(模糊匹配) */
  operator?: string
  /** 导入起始日期 YYYY-MM-DD */
  startDate?: string
  /** 导入结束日期 YYYY-MM-DD */
  endDate?: string
}

/** 统一后的导入字段 */
export type MediaCostField =
  | 'date'
  | 'materialId'
  | 'materialName'
  | 'accountName'
  | 'cost'
  | 'impressions'
  | 'clicks'
  | 'plays'
  | 'engagements'
  | 'conversions'

/** 字段元信息 */
export interface MediaCostFieldMeta {
  key: MediaCostField
  label: string
  /** 是否必填 */
  required: boolean
  /** 是否数值型 */
  numeric: boolean
  /** 源文件列名别名(统一小写后匹配) */
  aliases: string[]
  /** 字段说明 */
  hint: string
}

/**
 * 导入字段与源表头别名的映射表。
 * 各媒体后台导出的表头命名不一致(消耗 / 花费 / 消费 / cost ...),
 * 上传时按别名自动匹配,匹配不到的可手工指定。
 */
export const MEDIA_COST_FIELDS: MediaCostFieldMeta[] = [
  {
    key: 'date',
    label: '数据日期',
    required: true,
    numeric: false,
    hint: '支持 2026-05-01 / 2026/05/01 / 20260501 / Excel 日期格式',
    aliases: [
      '日期',
      '数据日期',
      '统计日期',
      '报表日期',
      '投放日期',
      '时间',
      '日期(天)',
      'date',
      'day',
      'stat_date',
      'report_date',
    ],
  },
  {
    key: 'materialId',
    label: '素材 ID',
    required: true,
    numeric: false,
    hint: '各平台创意 / 视频 / 作品 ID',
    aliases: [
      '素材id',
      '素材编号',
      '创意id',
      '创意编号',
      '视频id',
      '作品id',
      '笔记id',
      '笔记编号',
      '帖子id',
      '广告id',
      'material_id',
      'creative_id',
      'video_id',
      'item_id',
      'ad_id',
    ],
  },
  {
    key: 'materialName',
    label: '素材名称',
    required: false,
    numeric: false,
    hint: '素材标题 / 创意名称,缺失时用素材 ID 兜底',
    aliases: [
      '素材名称',
      '素材名',
      '创意名称',
      '视频名称',
      '作品名称',
      '标题',
      '视频标题',
      'material_name',
      'creative_name',
      'title',
      'name',
    ],
  },
  {
    key: 'accountName',
    label: '投放账号',
    required: false,
    numeric: false,
    hint: '广告主 / 账号名称',
    aliases: [
      '账号',
      '账号名称',
      '广告主',
      '广告主名称',
      '客户',
      '客户名称',
      '主体',
      '投放主体',
      'account',
      'account_name',
      'advertiser',
      'advertiser_name',
    ],
  },
  {
    key: 'cost',
    label: '消耗金额',
    required: true,
    numeric: true,
    hint: '单位:元,支持千分位与「万 / 亿」单位',
    aliases: [
      '消耗',
      '消耗金额',
      '花费',
      '花费金额',
      '消费',
      '消费金额',
      '成本',
      '总消耗',
      '广告消耗',
      '投放金额',
      'cost',
      'spend',
      'amount',
      'total_cost',
    ],
  },
  {
    key: 'impressions',
    label: '曝光量',
    required: false,
    numeric: true,
    hint: '展示次数',
    aliases: [
      '曝光',
      '曝光量',
      '曝光次数',
      '展现量',
      '展现次数',
      '展示量',
      '展示次数',
      '展示数',
      'impressions',
      'impression',
      'impr',
      'pv',
    ],
  },
  {
    key: 'clicks',
    label: '点击量',
    required: false,
    numeric: true,
    hint: '注意:「点击率」不是点击量,不会被自动匹配',
    aliases: ['点击', '点击量', '点击次数', '点击数', 'clicks', 'click', 'click_cnt'],
  },
  {
    key: 'plays',
    label: '播放量',
    required: false,
    numeric: true,
    hint: '视频播放次数',
    aliases: [
      '播放',
      '播放量',
      '播放次数',
      '视频播放',
      '观看量',
      '观看次数',
      'vv',
      'plays',
      'play',
      'video_views',
    ],
  },
  {
    key: 'engagements',
    label: '互动量',
    required: false,
    numeric: true,
    hint: '点赞 + 评论 + 转发合计',
    aliases: [
      '互动',
      '互动量',
      '互动数',
      '互动量(点赞评论转发)',
      'engagement',
      'engagements',
      'interactions',
    ],
  },
  {
    key: 'conversions',
    label: '转化量',
    required: false,
    numeric: true,
    hint: '表单 / 下单等转化次数',
    aliases: [
      '转化',
      '转化量',
      '转化数',
      '转化次数',
      'conversions',
      'conversion',
      'cvr_count',
    ],
  },
]

/** 字段索引 */
export const MEDIA_COST_FIELD_MAP: Record<MediaCostField, MediaCostFieldMeta> =
  MEDIA_COST_FIELDS.reduce(
    (acc, item) => {
      acc[item.key] = item
      return acc
    },
    {} as Record<MediaCostField, MediaCostFieldMeta>,
  )

/** 报表查询参数 */
export interface MediaCostQuery {
  /** 选中的媒体平台,空表示全部 */
  platforms?: MediaPlatform[]
  /** 投放账号(模糊匹配) */
  accountName?: string
  /** 素材 ID / 名称关键字 */
  keyword?: string
  /** 来源批次文件名关键字(模糊匹配) */
  batchFileName?: string
  /** 起始日期 YYYY-MM-DD */
  startDate?: string
  /** 结束日期 YYYY-MM-DD */
  endDate?: string
  page?: number
  pageSize?: number
}

/** 分页结果 */
export interface MediaCostPagedResult {
  list: MediaCostRecord[]
  total: number
  page: number
  pageSize: number
}

/** 上传导入的请求体(归一化后的记录) */
export interface MediaCostImportPayload {
  platform: MediaPlatform
  fileName: string
  fileSize: number
  records: Array<
    Pick<
      MediaCostRecord,
      | 'date'
      | 'materialId'
      | 'materialName'
      | 'accountName'
      | 'cost'
      | 'impressions'
      | 'clicks'
      | 'plays'
      | 'engagements'
      | 'conversions'
    >
  >
}
