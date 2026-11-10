// 媒体消耗派生指标 — 各媒体报表口径不一,统一按「消耗 / 曝光 / 点击 / 转化」派生公共指标。

/** 千次点击成本(元 / 千次点击) */
export function calcCpc(cost: number, clicks: number): number {
  return clicks ? (cost / clicks) * 1000 : 0
}

/** 点击率(%) */
export function calcCtr(impressions: number, clicks: number): number {
  return impressions ? (clicks / impressions) * 100 : 0
}

/** 曝光率(%) —— 每百次曝光带来的转化数 */
export function calcExposureRate(impressions: number, conversions: number): number {
  return impressions ? (conversions / impressions) * 100 : 0
}

/** ROI —— 每百元消耗带来的转化数 */
export function calcRoi(cost: number, conversions: number): number {
  return cost ? (conversions / cost) * 100 : 0
}
