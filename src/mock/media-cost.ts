// 媒体消耗报表 — Mock 数据
// 生成多媒体(巨量引擎 / TikTok / 微博 / 快手 / 小红书 / 腾讯)的素材消耗明细,
// 使用固定种子的伪随机数,保证每次刷新数据一致。

import dayjs from 'dayjs'
import {
  MEDIA_PLATFORM_LIST,
  type MediaCostBatch,
  type MediaCostRecord,
  type MediaPlatform,
} from '@/types/media-cost'

/** 固定种子伪随机数(mulberry32) */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 各平台的投放画像 */
interface PlatformProfile {
  /** 单素材日均消耗区间 */
  costRange: [number, number]
  /** 日均曝光区间 */
  impressionRange: [number, number]
  /** 点击率区间 */
  ctrRange: [number, number]
  /** 播放/曝光 转化比 */
  playRatio: number
  /** 互动/曝光 转化比 */
  engageRatio: number
  /** 转化/点击 转化比 */
  convertRatio: number
  /** 素材数量 */
  materialCount: number
  /** 账号列表 */
  accounts: string[]
}

const PROFILES: Record<MediaPlatform, PlatformProfile> = {
  OCEANENGINE: {
    costRange: [1800, 9600],
    impressionRange: [120000, 680000],
    ctrRange: [0.018, 0.042],
    playRatio: 0.62,
    engageRatio: 0.026,
    convertRatio: 0.048,
    materialCount: 5,
    accounts: ['央广时代-巨量广告', '央广时代-本地推', '央广时代-品牌广告'],
  },
  TIKTOK: {
    costRange: [900, 5200],
    impressionRange: [80000, 420000],
    ctrRange: [0.012, 0.031],
    playRatio: 0.71,
    engageRatio: 0.041,
    convertRatio: 0.032,
    materialCount: 4,
    accounts: ['YGT-TikTok-SEA', 'YGT-TikTok-US'],
  },
  WEIBO: {
    costRange: [600, 3600],
    impressionRange: [60000, 380000],
    ctrRange: [0.009, 0.024],
    playRatio: 0.48,
    engageRatio: 0.033,
    convertRatio: 0.021,
    materialCount: 3,
    accounts: ['央广时代-粉丝通', '央广时代-热门流'],
  },
  KUAISHOU: {
    costRange: [700, 4200],
    impressionRange: [70000, 400000],
    ctrRange: [0.013, 0.029],
    playRatio: 0.66,
    engageRatio: 0.038,
    convertRatio: 0.026,
    materialCount: 4,
    accounts: ['央广时代-磁力引擎', '央广时代-磁力本地推'],
  },
  XIAOHONGSHU: {
    costRange: [500, 3000],
    impressionRange: [40000, 260000],
    ctrRange: [0.016, 0.036],
    playRatio: 0.55,
    engageRatio: 0.052,
    convertRatio: 0.019,
    materialCount: 3,
    accounts: ['央广时代-聚光', '央广时代-薯条'],
  },
  TENCENT: {
    costRange: [1200, 6800],
    impressionRange: [100000, 560000],
    ctrRange: [0.011, 0.027],
    playRatio: 0.44,
    engageRatio: 0.019,
    convertRatio: 0.037,
    materialCount: 4,
    accounts: ['央广时代-腾讯广告', '央广时代-优量汇'],
  },
}

/** 素材名称素材池 */
const MATERIAL_POOL = [
  '春日上新-竖版15s',
  '品牌TVC-横版60s',
  '618大促-主推款',
  '用户证言-口播版',
  '产品卖点-三镜头',
  '开箱测评-达人版',
  '剧情短片-都市篇',
  '国风非遗-手绘版',
  '促销切片-9.9包邮',
  '教程种草-对比版',
  '门店实拍-环境篇',
  '代言人-口播版',
  '二次剪辑-混剪版',
  '字幕版-卖点提炼',
  '投流素材-测试B版',
]

/** 生成某平台的素材清单 */
function buildMaterials(platform: MediaPlatform, rand: () => number) {
  const profile = PROFILES[platform]
  const list: Array<{ id: string; name: string }> = []
  const prefix =
    {
      OCEANENGINE: 'OL',
      TIKTOK: 'TT',
      WEIBO: 'WB',
      KUAISHOU: 'KS',
      XIAOHONGSHU: 'XHS',
      TENCENT: 'TX',
    }[platform] || 'MT'
  for (let i = 0; i < profile.materialCount; i++) {
    const name = MATERIAL_POOL[(Math.floor(rand() * MATERIAL_POOL.length) + i) % MATERIAL_POOL.length]
    list.push({
      id: `${prefix}_2026_${String(i + 1).padStart(4, '0')}`,
      name,
    })
  }
  return list
}

/** 生成 Mock 消耗记录 */
export function generateMockRecords(days = 30): MediaCostRecord[] {
  const records: MediaCostRecord[] = []
  const today = dayjs()
  let seq = 0

  for (const platform of MEDIA_PLATFORM_LIST) {
    const profile = PROFILES[platform.code]
    const rand = mulberry32(
      platform.code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 7),
    )
    const materials = buildMaterials(platform.code, rand)

    for (let d = days - 1; d >= 0; d--) {
      const date = today.subtract(d, 'day').format('YYYY-MM-DD')
      for (const material of materials) {
        // 周末流量与消耗回落
        const weekday = today.subtract(d, 'day').day()
        const weekendFactor = weekday === 0 || weekday === 6 ? 0.72 : 1

        const cost =
          (profile.costRange[0] +
            rand() * (profile.costRange[1] - profile.costRange[0])) *
          weekendFactor
        const impressions = Math.round(
          (profile.impressionRange[0] +
            rand() * (profile.impressionRange[1] - profile.impressionRange[0])) *
            weekendFactor,
        )
        const ctr = profile.ctrRange[0] + rand() * (profile.ctrRange[1] - profile.ctrRange[0])
        const clicks = Math.round(impressions * ctr)
        const plays = Math.round(impressions * profile.playRatio * (0.7 + rand() * 0.5))
        const engagements = Math.round(impressions * profile.engageRatio * (0.6 + rand() * 0.8))
        const conversions = Math.round(clicks * profile.convertRatio * (0.5 + rand()))

        records.push({
          id: `mc_${String(++seq).padStart(6, '0')}`,
          platform: platform.code,
          date,
          materialId: material.id,
          materialName: material.name,
          accountName: profile.accounts[Math.floor(rand() * profile.accounts.length)],
          cost: Number(cost.toFixed(2)),
          impressions,
          clicks,
          plays,
          engagements,
          conversions,
          batchId: `batch_${platform.code.toLowerCase()}_seed`,
          createdAt: `${date} 09:00:00`,
        })
      }
    }
  }

  return records
}

/** 生成 Mock 导入批次 */
export function generateMockBatches(): MediaCostBatch[] {
  const today = dayjs()
  const seeds: Array<{
    platform: MediaPlatform
    fileName: string
    rowCount: number
    daysAgo: number
  }> = [
    { platform: 'OCEANENGINE', fileName: '巨量引擎-素材消耗报表-202605.csv', rowCount: 156, daysAgo: 1 },
    { platform: 'TIKTOK', fileName: 'tiktok_ads_material_report.csv', rowCount: 98, daysAgo: 2 },
    { platform: 'KUAISHOU', fileName: '磁力引擎-素材报表-0508.xlsx', rowCount: 132, daysAgo: 3 },
    { platform: 'WEIBO', fileName: '微博粉丝通-投放报表.csv', rowCount: 64, daysAgo: 5 },
    { platform: 'XIAOHONGSHU', fileName: '聚光-素材报表.xlsx', rowCount: 87, daysAgo: 6 },
    { platform: 'TENCENT', fileName: '腾讯广告-素材投放报表.csv', rowCount: 145, daysAgo: 8 },
  ]

  return seeds.map((s, i) => {
    const created = today.subtract(s.daysAgo, 'day').format('YYYY-MM-DD')
    return {
      id: `batch_${s.platform.toLowerCase()}_seed`,
      platform: s.platform,
      fileName: s.fileName,
      fileSize: s.rowCount * 320,
      rowCount: s.rowCount,
      status: 'SUCCESS' as const,
      operator: ['武文培', '李明', '张伟'][i % 3],
      createdAt: `${created} 10:${String(10 + i).padStart(2, '0')}:00`,
    }
  })
}
