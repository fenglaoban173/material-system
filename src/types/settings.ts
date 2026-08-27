// 工时设置相关类型
// 复用「素材需求-新建需求-素材清单」中的素材类型结构(typePath + format)
// 为不同素材类型 / 版式配置标准工时(单位: 小时/件)

import type { MaterialType } from './material'

export type { MaterialType }

// 素材类型中文映射(顶级分类)
export const MATERIAL_TYPE_MAP: Record<MaterialType, string> = {
  VIDEO: '视频',
  IMAGE: '图片',
  AUDIO: '音频',
  FONT: '字体',
  VOICE: '语音',
}

/**
 * 素材类型选项(级联选择器)
 * 与 素材需求-新建需求-素材清单 中的素材类型结构保持一致
 */
export interface MaterialTypeOption {
  label: string
  value: string
  children?: MaterialTypeOption[]
}

export const MATERIAL_TYPE_OPTIONS: MaterialTypeOption[] = [
  {
    label: '视频',
    value: 'VIDEO',
    children: [
      {
        label: '混剪',
        value: 'VIDEO_MIXCUT',
        children: [
          { label: '爆款裂变', value: 'VIDEO_MIXCUT_BKN' },
          { label: '加前后贴', value: 'VIDEO_MIXCUT_JTQ' },
          { label: '实拍素材', value: 'VIDEO_MIXCUT_SP' },
          { label: '无脚本混剪', value: 'VIDEO_MIXCUT_WB' },
          { label: '有脚本混剪', value: 'VIDEO_MIXCUT_YB' },
        ],
      },
      { label: '单人口播', value: 'VIDEO_TALK' },
      {
        label: '剧情',
        value: 'VIDEO_STORY',
        children: [
          { label: '单人剧情', value: 'VIDEO_STORY_SOLO' },
          { label: '多人剧情', value: 'VIDEO_STORY_MULTI' },
        ],
      },
    ],
  },
  {
    label: '平面',
    value: 'IMAGE',
  },
]

/**
 * 根据素材类型路径(typePath)返回可选版式
 * 与「素材需求-新建需求-素材清单」中 getFormatOptions 保持一致
 */
export const getFormatOptions = (typePath: string[]): { label: string; value: string }[] => {
  const isVideo = typePath[0] === 'VIDEO'
  return isVideo
    ? [
        { label: '横版视频', value: '横版视频' },
        { label: '竖版视频', value: '竖版视频' },
      ]
    : [
        { label: '直播背景', value: '直播背景' },
        { label: '详情页', value: '详情页' },
        { label: '图片', value: '图片' },
        { label: '落地页', value: '落地页' },
        { label: '开屏/海报', value: '开屏/海报' },
      ]
}

// 工时设置实体
export interface WorkHoursSetting {
  id: number
  /** 素材类型路径(级联), 例如 ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_BKN'] 或 ['IMAGE'] */
  typePath: string[]
  /** 素材版式, 依赖 typePath[0] */
  format: string
  /** 工时(小时/件) */
  hours: number
  /** 备注 */
  remark?: string
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createTime: string
  /** 创建人 */
  creator?: string
  /** 更新时间 */
  updateTime?: string
}

// 工时设置查询条件
export interface WorkHoursQuery {
  /** 素材类型节点(父或子), 匹配 typePath 中包含该 value 的记录 */
  materialType?: string
  enabled?: boolean
}

// 工时设置新增/编辑表单
export interface WorkHoursFormData {
  id?: number
  typePath: string[]
  format: string
  hours: number
  remark?: string
  enabled: boolean
}

/**
 * 把级联选项平铺为查询下拉用的一维列表
 * 父节点 + 叶子节点都会出现, 用「 / 」展示层级, 例如 "视频 / 混剪 / 爆款裂变"
 * 过滤逻辑: 选中任意节点即匹配 typePath 中包含该 value 的记录
 */
export const flattenMaterialTypeOptions = (): { label: string; value: string }[] => {
  const out: { label: string; value: string }[] = []
  const walk = (nodes: MaterialTypeOption[], parents: string[] = []) => {
    for (const node of nodes) {
      const path = [...parents, node.label]
      out.push({ label: path.join(' / '), value: node.value })
      if (node.children?.length) walk(node.children, path)
    }
  }
  walk(MATERIAL_TYPE_OPTIONS)
  return out
}

export const FLATTEN_MATERIAL_TYPE_OPTIONS = flattenMaterialTypeOptions()

// 工具: 把 typePath 转成可读文本(用于表格/筛选显示)
export const formatTypePath = (typePath: string[]): string => {
  if (!typePath?.length) return '-'
  const findLabel = (options: MaterialTypeOption[], path: string[], idx = 0): string[] => {
    if (idx >= path.length) return []
    const node = options.find((o) => o.value === path[idx])
    if (!node) return [path[idx]]
    return [node.label, ...findLabel(node.children || [], path, idx + 1)]
  }
  return findLabel(MATERIAL_TYPE_OPTIONS, typePath).join(' / ')
}

export const getTypePathColor = (typePath: string[]): string => {
  if (!typePath?.length) return 'gray'
  if (typePath[0] === 'VIDEO') return 'purple'
  if (typePath[0] === 'IMAGE') return 'cyan'
  return 'gray'
}