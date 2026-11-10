<template>
  <div class="media-cost-page">
    <!-- 页头 -->
    <div class="page-header">
      <h2 class="page-title">媒体消耗报表</h2>
      <div class="page-desc">
        支持多平台(巨量引擎 / TikTok / 微博 / 快手 / 小红书 / 腾讯)素材消耗数据上传与统一汇总
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <span class="filter-label">投放账号</span>
      <a-input
        v-model="filters.accountName"
        placeholder="账号名称"
        allow-clear
        style="width: 170px;"
      />

      <span class="filter-label">素材</span>
      <a-input
        v-model="filters.keyword"
        placeholder="素材 ID / 名称"
        allow-clear
        style="width: 170px;"
      />

      <span class="filter-label">日期范围</span>
      <a-range-picker v-model="filters.dateRange" style="width: 250px;" format="YYYY-MM-DD" />

      <div class="filter-actions">
        <a-button type="primary" @click="handleSearch">
          <template #icon><icon-search /></template>
          查询
        </a-button>
        <a-button @click="handleReset">重置</a-button>
        <a-button @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </div>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-icon summary-icon-blue"><icon-bar-chart /></div>
        <div class="summary-body">
          <div class="summary-label">总消耗</div>
          <div class="summary-value">
            {{ formatMoney(summary.cost) }}
            <span class="unit">元</span>
          </div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-cyan"><icon-eye /></div>
        <div class="summary-body">
          <div class="summary-label">总曝光量</div>
          <div class="summary-value">{{ formatNumber(summary.impressions) }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-purple"><icon-common /></div>
        <div class="summary-body">
          <div class="summary-label">总点击量</div>
          <div class="summary-value">{{ formatNumber(summary.clicks) }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-orange"><icon-play-arrow /></div>
        <div class="summary-body">
          <div class="summary-label">总播放量</div>
          <div class="summary-value">{{ formatNumber(summary.plays) }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-green"><icon-common /></div>
        <div class="summary-body">
          <div class="summary-label">平均点击率</div>
          <div class="summary-value">
            {{ summary.ctr.toFixed(2) }}
            <span class="unit">%</span>
          </div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-red"><icon-apps /></div>
        <div class="summary-body">
          <div class="summary-label">覆盖媒体 / 素材</div>
          <div class="summary-value">
            {{ summary.platformCount }}
            <span class="unit">个媒体</span>
            {{ summary.materialCount }}
            <span class="unit">件素材</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <a-row :gutter="12" class="chart-row">
      <a-col :span="8">
        <div class="chart-card">
          <div class="chart-header">
            <h3>各媒体消耗占比</h3>
            <span class="chart-sub">按消耗金额</span>
          </div>
          <div class="chart-body">
            <v-chart :option="shareOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
      <a-col :span="16">
        <div class="chart-card">
          <div class="chart-header">
            <h3>多媒体消耗趋势</h3>
            <span class="chart-sub">按日期 / 媒体</span>
          </div>
          <div class="chart-body">
            <v-chart :option="trendOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
    </a-row>

    <a-row :gutter="12" class="chart-row">
      <a-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>媒体消耗排行</h3>
            <span class="chart-sub">单位:元</span>
          </div>
          <div class="chart-body">
            <v-chart :option="rankOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
      <a-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>媒体点击率对比</h3>
            <span class="chart-sub">单位:%</span>
          </div>
          <div class="chart-body">
            <v-chart :option="ctrOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- 明细表 -->
    <div class="data-section">
      <div class="section-toolbar">
        <div class="toolbar-left">
          <span class="section-title">素材消耗明细</span>
          <a-tag color="arcoblue" size="small">共 {{ total }} 条</a-tag>
        </div>
        <div class="toolbar-right">
          <a-button size="small" @click="handleRefresh">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
        </div>
      </div>

      <!-- 按媒体页签切换:每个页签只列出该媒体的数据 -->
      <div class="media-tabs">
        <button
          class="media-tab"
          :class="{ active: activeTab === 'ALL' }"
          type="button"
          @click="handleTabChange('ALL')"
        >
          <span class="tab-label">全部媒体</span>
          <span class="tab-count">{{ tabTotal }}</span>
        </button>
        <button
          v-for="tab in tabOptions"
          :key="tab.key"
          class="media-tab"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="handleTabChange(tab.key)"
        >
          <span class="tab-dot" :style="{ background: tab.color }"></span>
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <a-table
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1600 }"
        row-key="id"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        @sorter-change="handleSorterChange"
      >
        <template #columns>
          <a-table-column title="媒体" data-index="platform" :width="110" :fixed="'left'">
            <template #cell="{ record }">
              <span class="platform-tag" :style="platformTagStyle(record.platform)">
                <span class="platform-dot"></span>
                {{ platformName(record.platform) }}
              </span>
            </template>
          </a-table-column>
          <a-table-column
            title="日期"
            data-index="date"
            :width="110"
            :sortable="SORTABLE.date"
          />
          <a-table-column title="素材 ID" data-index="materialId" :width="150">
            <template #cell="{ record }">
              <span class="code-text">{{ record.materialId }}</span>
            </template>
          </a-table-column>
          <a-table-column title="素材名称" data-index="materialName" :width="180">
            <template #cell="{ record }">
              <a-tooltip
                v-if="record.materialName"
                :content="record.materialName"
                background-color="#1D2129"
              >
                <span class="ellipsis-text">{{ record.materialName }}</span>
              </a-tooltip>
              <span v-else class="muted">-</span>
            </template>
          </a-table-column>
          <a-table-column title="投放账号" data-index="accountName" :width="170">
            <template #cell="{ record }">
              <span class="ellipsis-text">{{ record.accountName }}</span>
            </template>
          </a-table-column>
          <a-table-column
            title="消耗(元)"
            data-index="cost"
            :width="120"
            align="right"
            :sortable="SORTABLE.cost"
          >
            <template #cell="{ record }">
              <span class="cost-value">{{ formatMoney(record.cost) }}</span>
            </template>
          </a-table-column>
          <a-table-column
            title="曝光量"
            data-index="impressions"
            :width="110"
            align="right"
            :sortable="SORTABLE.impressions"
          >
            <template #cell="{ record }">
              <span class="number-text">{{ formatNumber(record.impressions) }}</span>
            </template>
          </a-table-column>
          <a-table-column
            title="点击量"
            data-index="clicks"
            :width="100"
            align="right"
            :sortable="SORTABLE.clicks"
          >
            <template #cell="{ record }">
              <span class="number-text">{{ formatNumber(record.clicks) }}</span>
            </template>
          </a-table-column>
          <a-table-column
            title="点击率"
            data-index="ctr"
            :width="100"
            align="right"
            :sortable="SORTABLE.ctr"
          >
            <template #cell="{ record }">
              <span class="ctr-value">{{ record.ctr.toFixed(2) }}%</span>
            </template>
          </a-table-column>
          <a-table-column
            title="播放量"
            data-index="plays"
            :width="110"
            align="right"
            :sortable="SORTABLE.plays"
          >
            <template #cell="{ record }">
              <span class="number-text">{{ formatNumber(record.plays) }}</span>
            </template>
          </a-table-column>
          <a-table-column
            title="互动量"
            data-index="engagements"
            :width="100"
            align="right"
            :sortable="SORTABLE.engagements"
          >
            <template #cell="{ record }">
              <span class="number-text">{{ formatNumber(record.engagements) }}</span>
            </template>
          </a-table-column>
          <a-table-column
            title="转化量"
            data-index="conversions"
            :width="100"
            align="right"
            :sortable="SORTABLE.conversions"
          >
            <template #cell="{ record }">
              <span class="number-text">{{ formatNumber(record.conversions) }}</span>
            </template>
          </a-table-column>
          <a-table-column title="来源批次" data-index="batchId" :width="200">
            <template #cell="{ record }">
              <a-tooltip :content="batchFileName(record.batchId)" background-color="#1D2129">
                <span class="ellipsis-text">{{ batchFileName(record.batchId) }}</span>
              </a-tooltip>
            </template>
          </a-table-column>
        </template>
        <template #empty>
          <div class="empty-state">
            <icon-file />
            <div>{{ emptyText }}</div>
          </div>
        </template>
      </a-table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { Message } from '@arco-design/web-vue'
import {
  IconApps,
  IconBarChart,
  IconCommon,
  IconDownload,
  IconEye,
  IconFile,
  IconPlayArrow,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-vue/es/icon'
import { useMediaCostStore } from '@/stores/media-cost'
import {
  MEDIA_PLATFORM_LIST,
  MEDIA_PLATFORM_MAP,
  type MediaCostQuery,
  type MediaCostRecord,
  type MediaPlatform,
} from '@/types/media-cost'
import { csvCell, downloadCsv } from '@/utils/csv'
import { calcCtr } from '@/utils/media-metrics'
import { SORT_DIRECTIONS, sortableBy } from '@/utils/table-sorter'

const store = useMediaCostStore()

// ────────────────────────────── 筛选 ──────────────────────────────

/** 默认查询最近 7 天 */
const defaultRange = (() => {
  const today = dayjs()
  return [today.subtract(6, 'day').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
})()

const filters = reactive({
  accountName: '',
  keyword: '',
  dateRange: defaultRange,
})

/** 已应用的查询条件(点击「查询」后生效) */
const applied = ref<MediaCostQuery>({
  startDate: defaultRange[0],
  endDate: defaultRange[1],
})

const loading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  showPageSize: true,
  showTotal: true,
  pageSizeOptions: [10, 20, 50, 100],
})

/** 筛选后的全部数据(汇总 / 图表 / 页签计数共用) */
const filteredRecords = computed(() => store.filterRecords(applied.value))

// ────────────────────────────── 媒体页签 ──────────────────────────────

/** 当前选中的媒体页签:'ALL' 表示全部媒体 */
const activeTab = ref<'ALL' | MediaPlatform>('ALL')

/** 当前选中的媒体(选中「全部媒体」时为空) */
const activeMedia = computed<MediaPlatform | undefined>(() =>
  activeTab.value === 'ALL' ? undefined : activeTab.value,
)

/** 明细列表数据:按页签切换媒体,其余筛选条件沿用查询结果 */
const tableRecords = computed(() => {
  const media = activeMedia.value
  if (!media) return filteredRecords.value
  return filteredRecords.value.filter((r) => r.platform === media)
})

/** 各媒体页签(条数为当前筛选结果下各媒体的记录数) */
const tabOptions = computed(() => {
  const counts = new Map<MediaPlatform, number>()
  for (const r of filteredRecords.value) {
    counts.set(r.platform, (counts.get(r.platform) ?? 0) + 1)
  }
  return MEDIA_PLATFORM_LIST.map((p) => ({
    key: p.code,
    label: p.name,
    color: p.color,
    count: counts.get(p.code) ?? 0,
  }))
})

/** 「全部媒体」页签的条数 */
const tabTotal = computed(() => filteredRecords.value.length)

/** 切换页签:只切换明细列表的媒体维度,汇总与图表保持全媒体口径 */
function handleTabChange(key: 'ALL' | MediaPlatform) {
  activeTab.value = key
  pagination.current = 1
}

/** 明细列表总条数 */
const total = computed(() => tableRecords.value.length)

/** 明细行:在原始记录上补一个派生的点击率,供表格按该列排序 */
type MediaCostRow = MediaCostRecord & { ctr: number }

/** 明细列表数据:整表交给 Arco 做排序与分页 */
const tableData = computed<MediaCostRow[]>(() =>
  tableRecords.value.map((r) => ({ ...r, ctr: calcCtr(r.impressions, r.clicks) })),
)

// ────────────────────────────── 表格排序 ──────────────────────────────

/**
 * 各列的排序配置。
 * 必须是稳定的常量引用:表格内部对列做深度监听,配置对象每次渲染都新建的话
 * 会把用户选中的排序状态重置回默认排序。
 */
const SORTABLE = {
  date: {
    sorter: sortableBy('date'),
    sortDirections: SORT_DIRECTIONS,
    defaultSortOrder: 'descend' as const,
  },
  cost: { sorter: sortableBy('cost'), sortDirections: SORT_DIRECTIONS },
  impressions: { sorter: sortableBy('impressions'), sortDirections: SORT_DIRECTIONS },
  clicks: { sorter: sortableBy('clicks'), sortDirections: SORT_DIRECTIONS },
  ctr: { sorter: sortableBy('ctr'), sortDirections: SORT_DIRECTIONS },
  plays: { sorter: sortableBy('plays'), sortDirections: SORT_DIRECTIONS },
  engagements: { sorter: sortableBy('engagements'), sortDirections: SORT_DIRECTIONS },
  conversions: { sorter: sortableBy('conversions'), sortDirections: SORT_DIRECTIONS },
}

/** 排序后回到第一页 */
function handleSorterChange() {
  pagination.current = 1
}

/** 参与统计的媒体(受筛选条件影响) */
const activePlatforms = computed(() => {
  const set = new Set(filteredRecords.value.map((r) => r.platform))
  return MEDIA_PLATFORM_LIST.filter((p) => set.has(p.code))
})

// ────────────────────────────── 汇总 ──────────────────────────────

const summary = computed(() => {
  const list = filteredRecords.value
  let cost = 0
  let impressions = 0
  let clicks = 0
  let plays = 0
  const materials = new Set<string>()
  const platforms = new Set<MediaPlatform>()
  for (const r of list) {
    cost += r.cost
    impressions += r.impressions
    clicks += r.clicks
    plays += r.plays
    materials.add(`${r.platform}-${r.materialId}`)
    platforms.add(r.platform)
  }
  return {
    cost,
    impressions,
    clicks,
    plays,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    materialCount: materials.size,
    platformCount: platforms.size,
  }
})

/** 空态文案 */
const emptyText = computed(() => {
  const media = activeMedia.value
  return media
    ? `「${platformName(media)}」暂无消耗数据,可上传该媒体报表或调整筛选条件`
    : '暂无消耗数据,可在「导入任务记录」页上传各媒体报表'
})

// ────────────────────────────── 图表 ──────────────────────────────

/** 各媒体聚合指标 */
const platformStats = computed(() => {
  const map = new Map<MediaPlatform, { cost: number; impressions: number; clicks: number; plays: number }>()
  for (const r of filteredRecords.value) {
    const item = map.get(r.platform) ?? { cost: 0, impressions: 0, clicks: 0, plays: 0 }
    item.cost += r.cost
    item.impressions += r.impressions
    item.clicks += r.clicks
    item.plays += r.plays
    map.set(r.platform, item)
  }
  return map
})

/** 环形图配置(占比类) */
function buildDonutOption(
  data: Array<{ name: string; value: number; color: string }>,
): Record<string, unknown> {
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number }
        return `${p.name}<br/>消耗: ¥${formatNumber(p.value)}<br/>占比: ${p.percent}%`
      },
    },
    legend: {
      orient: 'vertical',
      right: '4%',
      top: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#4e5969', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '76%'],
        center: ['36%', '50%'],
        // 2px 面色间隙分隔相邻扇区
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 6 },
        data: data.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
  }
}

/** 环形图:各媒体消耗占比 */
const shareOption = computed(() => {
  const stats = platformStats.value
  return buildDonutOption(
    activePlatforms.value.map((p) => ({
      name: p.name,
      value: Number((stats.get(p.code)?.cost ?? 0).toFixed(2)),
      color: p.color,
    })),
  )
})

/** 折线图:多媒体消耗趋势 */
const trendOption = computed(() => {
  const dates = [...new Set(filteredRecords.value.map((r) => r.date))].sort()
  const daily = new Map<string, number>()
  for (const r of filteredRecords.value) {
    const key = `${r.platform}|${r.date}`
    daily.set(key, (daily.get(key) ?? 0) + r.cost)
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#4e5969', fontSize: 12 },
    },
    grid: { left: 10, right: 20, top: 40, bottom: 10, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisLabel: { color: '#86909c', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '元',
      nameTextStyle: { color: '#86909c', fontSize: 11 },
      axisLabel: {
        color: '#86909c',
        fontSize: 11,
        formatter: (v: number) => (v >= 10000 ? `${v / 10000}w` : String(v)),
      },
      splitLine: { lineStyle: { color: '#f2f3f5' } },
    },
    series: activePlatforms.value.map((p) => ({
      name: p.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: dates.map((d) => Number((daily.get(`${p.code}|${d}`) ?? 0).toFixed(2))),
      lineStyle: { width: 2, color: p.color },
      // 2px 面色描边,避免与相邻线重叠时看不清
      itemStyle: { color: p.color, borderColor: '#fff', borderWidth: 2 },
    })),
  }
})

/** 横向条形图:媒体消耗排行 */
const rankOption = computed(() => {
  const stats = platformStats.value
  const rows = [...activePlatforms.value]
    .map((p) => ({
      name: p.name,
      value: Number((stats.get(p.code)?.cost ?? 0).toFixed(2)),
      color: p.color,
    }))
    .sort((a, b) => a.value - b.value)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 10, right: 40, top: 10, bottom: 10, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#86909c',
        fontSize: 11,
        formatter: (v: number) => (v >= 10000 ? `${v / 10000}w` : String(v)),
      },
      splitLine: { lineStyle: { color: '#f2f3f5' } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#4e5969', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        barWidth: 18,
        data: rows.map((r) => ({ value: r.value, itemStyle: { color: r.color, borderRadius: [0, 4, 4, 0] } })),
        label: {
          show: true,
          position: 'right',
          formatter: (p: { value: number }) => `¥${formatNumber(p.value)}`,
          color: '#4e5969',
          fontSize: 11,
        },
      },
    ],
  }
})

/** 柱状图:媒体点击率对比 */
const ctrOption = computed(() => {
  const stats = platformStats.value
  const rows = activePlatforms.value.map((p) => {
    const s = stats.get(p.code)
    const ctr = s && s.impressions ? (s.clicks / s.impressions) * 100 : 0
    return { name: p.name, value: Number(ctr.toFixed(2)), color: p.color }
  })
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
    grid: { left: 10, right: 20, top: 20, bottom: 10, containLabel: true },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.name),
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisLabel: { color: '#86909c', fontSize: 11, interval: 0, rotate: rows.length > 4 ? 20 : 0 },
    },
    yAxis: {
      type: 'value',
      name: '%',
      nameTextStyle: { color: '#86909c', fontSize: 11 },
      axisLabel: { color: '#86909c', fontSize: 11, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f2f3f5' } },
    },
    series: [
      {
        type: 'bar',
        barWidth: 26,
        data: rows.map((r) => ({ value: r.value, itemStyle: { color: r.color, borderRadius: [4, 4, 0, 0] } })),
      },
    ],
  }
})

// ────────────────────────────── 工具方法 ──────────────────────────────

function platformName(code: MediaPlatform): string {
  return MEDIA_PLATFORM_MAP[code]?.name ?? code
}

function mediaColor(code: MediaPlatform): string {
  return MEDIA_PLATFORM_MAP[code]?.color ?? '#165DFF'
}

function platformTagStyle(code: MediaPlatform) {
  const color = mediaColor(code)
  return {
    color,
    backgroundColor: `${color}14`,
    borderColor: `${color}33`,
  }
}

function batchFileName(batchId: string): string {
  const batch = store.batches.find((b) => b.id === batchId)
  return batch?.fileName ?? batchId
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ────────────────────────────── 查询 / 导出 ──────────────────────────────

function buildQuery(): MediaCostQuery {
  return {
    accountName: filters.accountName || undefined,
    keyword: filters.keyword || undefined,
    startDate: filters.dateRange?.[0],
    endDate: filters.dateRange?.[1],
  }
}

function handleSearch() {
  applied.value = buildQuery()
  pagination.current = 1
  loading.value = true
  setTimeout(() => (loading.value = false), 300)
}

function handleReset() {
  filters.accountName = ''
  filters.keyword = ''
  filters.dateRange = [...defaultRange]
  applied.value = buildQuery()
  pagination.current = 1
}

function handleRefresh() {
  handleSearch()
}

function handlePageChange(page: number) {
  pagination.current = page
}

function handlePageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.current = 1
}

function handleExport() {
  // 导出当前页签下的明细数据
  const list = tableRecords.value
  if (!list.length) {
    Message.warning('暂无可导出的数据')
    return
  }
  const header = [
    '媒体',
    '日期',
    '素材ID',
    '素材名称',
    '投放账号',
    '消耗(元)',
    '曝光量',
    '点击量',
    '点击率(%)',
    '播放量',
    '互动量',
    '转化量',
    '来源批次',
  ]
  const rows = list.map((r: MediaCostRecord) =>
    [
      platformName(r.platform),
      r.date,
      r.materialId,
      r.materialName,
      r.accountName,
      r.cost.toFixed(2),
      r.impressions,
      r.clicks,
      calcCtr(r.impressions, r.clicks).toFixed(2),
      r.plays,
      r.engagements,
      r.conversions,
      r.batchId,
    ]
      .map(csvCell)
      .join(','),
  )
  const scopeName = activeMedia.value ? platformName(activeMedia.value) : '全部媒体'
  downloadCsv(
    `媒体消耗报表_${scopeName}_${dayjs().format('YYYYMMDD')}.csv`,
    `﻿${[header.join(','), ...rows].join('\r\n')}`,
  )
  Message.success(`已导出 ${list.length} 条数据`)
}

// ────────────────────────────── 生命周期 ──────────────────────────────

onMounted(() => {
  store.init()
  applied.value = buildQuery()
})
</script>

<style scoped lang="scss">
.media-cost-page {
  padding: 24px;

  .page-header {
    margin-bottom: 12px;

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-1);
    }

    .page-desc {
      margin-top: 4px;
      font-size: 12px;
      color: var(--color-text-3);
    }
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    padding: 16px 20px;
    background: #ffffff;
    border-radius: 8px;
    margin-bottom: 12px;

    .filter-label {
      font-size: 14px;
      color: #4e5969;
      white-space: nowrap;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }
  }

  // 汇总卡片
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin-bottom: 12px;

    .summary-card {
      background: #ffffff;
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;

      .summary-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }
      .summary-icon-blue { background: rgba(22, 93, 255, 0.12); color: rgb(22, 93, 255); }
      .summary-icon-cyan { background: rgba(0, 180, 200, 0.12); color: rgb(0, 180, 200); }
      .summary-icon-purple { background: rgba(124, 58, 237, 0.12); color: rgb(124, 58, 237); }
      .summary-icon-orange { background: rgba(255, 125, 0, 0.12); color: rgb(255, 125, 0); }
      .summary-icon-green { background: rgba(0, 180, 42, 0.12); color: rgb(0, 180, 42); }
      .summary-icon-red { background: rgba(245, 63, 63, 0.12); color: rgb(245, 63, 63); }

      .summary-body {
        min-width: 0;
        .summary-label {
          font-size: 13px;
          color: var(--color-text-3);
          margin-bottom: 4px;
          white-space: nowrap;
        }
        .summary-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-1);
          font-family: Monaco, Consolas, monospace;
          white-space: nowrap;
          .unit {
            font-size: 12px;
            color: var(--color-text-3);
            font-weight: 400;
            font-family: inherit;
            margin-left: 2px;
          }
        }
      }
    }
  }

  // 图表
  .chart-row {
    margin-bottom: 12px;
    row-gap: 12px;
  }

  .chart-card {
    background: #ffffff;
    border-radius: 8px;
    padding: 16px 20px;
    height: 100%;

    .chart-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-1);
      }

      .chart-sub {
        font-size: 12px;
        color: var(--color-text-4);
      }
    }

    .chart-body {
      height: 300px;
    }

    .chart {
      height: 100%;
      width: 100%;
    }
  }

  .data-section {
    background: #ffffff;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 12px;

    .section-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-1);
        }
      }

      .toolbar-right {
        display: flex;
        gap: 12px;
      }
    }
  }

  // 媒体页签
  .media-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-neutral-3);

    .media-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 30px;
      padding: 0 12px;
      border: 1px solid var(--color-neutral-3);
      border-radius: 15px;
      background: #fff;
      color: var(--color-text-2);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--color-primary-5);
        color: var(--color-primary-6);
      }

      &.active {
        border-color: var(--color-primary-6);
        background: var(--color-primary-1);
        color: var(--color-primary-6);
        font-weight: 500;
      }

      .tab-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .tab-count {
        font-size: 12px;
        font-family: Monaco, Consolas, monospace;
        color: var(--color-text-4);
        background: var(--color-fill-2);
        border-radius: 9px;
        padding: 0 6px;
        line-height: 16px;
      }

      &.active .tab-count {
        color: var(--color-primary-6);
        background: #fff;
      }
    }
  }

  .platform-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    display: inline-block;
    flex-shrink: 0;
  }

  .platform-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border-radius: 12px;
    border: 1px solid;
    font-size: 12px;
    line-height: 20px;
    white-space: nowrap;
  }

  .code-text {
    font-family: Monaco, Consolas, monospace;
    font-size: 12px;
    color: var(--color-text-2);
  }

  .ellipsis-text {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }

  .number-text {
    font-family: Monaco, Consolas, monospace;
    color: var(--color-text-2);
  }

  .cost-value {
    font-family: Monaco, Consolas, monospace;
    font-weight: 600;
    color: #f53f3f;
  }

  .ctr-value {
    font-family: Monaco, Consolas, monospace;
    font-weight: 600;
    color: var(--color-primary-6);
  }

  .muted {
    color: var(--color-text-4);
  }

  .empty-state {
    padding: 40px 0;
    text-align: center;
    color: var(--color-text-4);

    .arco-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }

    div {
      font-size: 13px;
    }
  }
}

@media (max-width: 1440px) {
  .media-cost-page .summary-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .media-cost-page .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
