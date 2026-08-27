// 共享模拟数据: 文件夹 / 需求 / 素材
// 用于 素材列表 / 素材上传 / 素材需求 等页面的关联选项

export interface FolderNode {
  key: string
  title: string
  children?: FolderNode[]
}

/** 文件夹树 — 与 素材列表 左侧目录保持一致 */
export const folderTree: FolderNode[] = [
  {
    key: 'all',
    title: '全部素材',
    children: [
      { key: 'video', title: '视频' },
      { key: 'image', title: '图片' },
      { key: 'audio', title: '音频' },
    ],
  },
  {
    key: '618',
    title: '618活动',
    children: [
      { key: '618-video', title: '宣传视频' },
      { key: '618-image', title: '海报素材' },
    ],
  },
  {
    key: 'brand',
    title: '品牌素材',
    children: [
      { key: 'brand-logo', title: 'LOGO' },
      { key: 'brand-product', title: '产品图' },
    ],
  },
]

/** 把文件夹树拍平成 select 下拉选项(含父子标签) */
export const folderOptions: { label: string; value: string; children?: { label: string; value: string }[] }[] =
  folderTree.map((node) => ({
    label: node.title,
    value: node.key,
    children: node.children?.map((c) => ({ label: c.title, value: c.key })),
  }))

/** 顶级目录(不带子目录的文件夹)下拉选项 */
export const topFolderOptions: { label: string; value: string }[] = folderTree.map((f) => ({
  label: f.title,
  value: f.key,
}))

/** 全部叶子文件夹(用于子目录精细选择) */
export const leafFolderOptions: { label: string; value: string }[] = folderTree.flatMap((f) =>
  (f.children || []).map((c) => ({ label: `${f.title} / ${c.title}`, value: c.key }))
)

export interface DemandOption {
  /** 需求 ID */
  value: string
  /** 需求名称(展示用) */
  label: string
  /** 需求编号 */
  demandId: string
  /** 客户/品牌 */
  customerName?: string
}

/** 需求列表 — 与 素材需求-需求管理 保持一致 */
export const demandList: DemandOption[] = [
  { value: '1', label: '618大促活动宣传素材', demandId: 'REQ202406180001', customerName: '某知名电商客户' },
  { value: '2', label: '新品上市海报设计', demandId: 'REQ202406150002', customerName: '某美妆品牌' },
  { value: '3', label: '品牌升级宣传片', demandId: 'REQ202406100003', customerName: '某汽车品牌' },
  { value: '4', label: '端午节活动素材', demandId: 'REQ202406050004', customerName: '某餐饮连锁' },
  { value: '5', label: '夏季新品发布会预告', demandId: 'REQ202406010005', customerName: '某服装品牌' },
  { value: '6', label: '双十一预热短视频', demandId: 'REQ202406200006', customerName: '某零售品牌' },
  { value: '7', label: '品牌联名海报设计', demandId: 'REQ202406210007', customerName: '某运动品牌' },
  { value: '8', label: '产品讲解视频', demandId: 'REQ202406220008', customerName: '某家电品牌' },
]

/** 需求下拉(简短 label) */
export const demandOptions: { label: string; value: string }[] = demandList.map((d) => ({
  label: `${d.label} (${d.demandId})`,
  value: d.demandId,
}))

// 素材类型级联选项 — 与 素材需求-新建需求-素材清单 中 typeOptions 保持一致
export interface MaterialTypeCascaderNode {
  label: string
  value: string
  children?: MaterialTypeCascaderNode[]
}

export const materialTypeOptions: MaterialTypeCascaderNode[] = [
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

// 把 typePath 转成「视频 / 混剪 / 爆款裂变」式的可读文本
export const formatMaterialTypePath = (
  options: MaterialTypeCascaderNode[],
  path: string[]
): string => {
  if (!path?.length) return '-'
  const findLabel = (nodes: MaterialTypeCascaderNode[], p: string[], idx = 0): string[] => {
    if (idx >= p.length) return []
    const node = nodes.find((n) => n.value === p[idx])
    if (!node) return [p[idx]]
    return [node.label, ...findLabel(node.children || [], p, idx + 1)]
  }
  return findLabel(options, path).join(' / ')
}

/** 素材版式选项（与需求创建页保持一致） */
export interface MaterialFormatOption { label: string; value: string }

/**
 * 根据素材类型 typePath 动态返回版式选项。
 * 视频 → 横版视频 / 竖版视频；平面 → 直播背景 / 详情页 / 图片 / 落地页 / 开屏/海报。
 */
export const getFormatOptions = (typePath: string[]): MaterialFormatOption[] => {
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