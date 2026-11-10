// 表格排序 — 公共辅助
// Arco 的 a-table 由列上的 :sortable 配置驱动排序,
// 比较器需要自己根据 direction 决定升序 / 降序(框架不会代为取反)。

/** 排序比较器的取值类型(宽松,便于按字段名取值) */
export type SortRow = Record<string, any>

/** 排序比较器签名 */
export type SortSorter = (
  a: SortRow,
  b: SortRow,
  extra: { dataIndex: string; direction: 'ascend' | 'descend' },
) => number

/** 排序方向序列:点击一次从大到小,再次从小到大,第三次取消排序 */
export const SORT_DIRECTIONS: ('ascend' | 'descend')[] = ['descend', 'ascend']

/**
 * 按字段生成排序比较器。
 * 字符串按字典序比较(日期为 YYYY-MM-DD 时即时间顺序),数值按大小比较。
 */
export function sortableBy(field: string): SortSorter {
  return (a, b, { direction }) => {
    const va = a[field]
    const vb = b[field]
    const result = va > vb ? 1 : va < vb ? -1 : 0
    return direction === 'descend' ? -result : result
  }
}
