<template>
  <div class="import-tasks-page">
    <!-- 页头 -->
    <div class="page-header">
      <h2 class="page-title">导入任务记录</h2>
      <div class="page-desc">
        上传各媒体消耗报表并按媒体核对导入结果,公共指标口径统一,各媒体额外展示自身报表的专属指标
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <div class="filter-field">
        <span class="filter-label">来源批次</span>
        <a-input
          v-model="filters.batchFileName"
          placeholder="批次文件名"
          allow-clear
          style="width: 190px;"
        />
      </div>

      <div class="filter-field">
        <span class="filter-label">素材</span>
        <a-input
          v-model="filters.keyword"
          placeholder="素材 ID / 名称"
          allow-clear
          style="width: 180px;"
        />
      </div>

      <div class="filter-field">
        <span class="filter-label">投放账号</span>
        <a-input
          v-model="filters.accountName"
          placeholder="账号名称"
          allow-clear
          style="width: 170px;"
        />
      </div>

      <div class="filter-field">
        <span class="filter-label">消耗日期</span>
        <a-range-picker v-model="filters.dateRange" style="width: 240px;" format="YYYY-MM-DD" />
      </div>

      <div class="filter-actions">
        <a-button type="primary" @click="handleSearch">
          <template #icon><icon-search /></template>
          查询
        </a-button>
        <a-button @click="handleReset">重置</a-button>
        <a-button type="outline" @click="openUpload">
          <template #icon><icon-upload /></template>
          上传数据
        </a-button>
        <a-button @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="data-section">
      <div class="section-toolbar">
        <div class="toolbar-left">
          <span class="section-title">导入数据</span>
          <a-tag color="arcoblue" size="small">共 {{ total }} 条</a-tag>
          <a-tag v-if="selectedKeys.length" color="orange" size="small">
            已选 {{ selectedKeys.length }} 条
          </a-tag>
        </div>
        <div class="toolbar-right">
          <a-button size="small" @click="handleRefresh">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
        </div>
      </div>

      <!-- 按媒体页签切换:每个媒体展示公共字段 + 该媒体专属字段 -->
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

      <!-- 批量操作:独立一行,位于媒体页签下方 -->
      <div class="batch-action-bar">
        <a-dropdown @select="handleBatchAction">
          <a-button type="outline" size="small" :disabled="!selectedKeys.length">
            <template #icon><icon-more-vertical /></template>
            批量操作
          </a-button>
          <template #content>
            <a-doption value="delete">
              <template #icon><icon-delete /></template>
              批量删除
            </a-doption>
          </template>
        </a-dropdown>
        <span v-if="selectedKeys.length" class="batch-action-tip">
          已勾选 {{ selectedKeys.length }} 条,可执行批量操作
        </span>
      </div>

      <a-table
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        :scroll="{ x: tableWidth }"
        row-key="id"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        @sorter-change="handleSorterChange"
        @selection-change="handleSelectionChange"
      >
        <template #columns>
          <a-table-column
            v-for="col in columns"
            :key="col.key"
            :title="col.title"
            :data-index="col.key"
            :width="col.width"
            :align="col.align"
            :sortable="SORTABLE_BY_KEY[col.key]"
          >
            <template #title>
              <span class="th-title">
                {{ col.title }}
                <a-tooltip v-if="col.hint" :content="col.hint" background-color="#1D2129">
                  <icon-question-circle class="hint-icon" />
                </a-tooltip>
              </span>
            </template>
            <template #cell="{ record }">
              <span
                v-if="col.key === 'platform'"
                class="platform-tag"
                :style="platformTagStyle(record.platform)"
              >
                <span class="platform-dot"></span>
                {{ platformName(record.platform) }}
              </span>
              <!-- 来源批次:点击可下载原始上传文件 -->
              <a-tooltip v-else-if="col.key === 'batchId'" :content="batchFileName(record.batchId)">
                <a-link class="batch-link" @click="handleDownloadSource(record.batchId)">
                  <template #icon><icon-download /></template>
                  {{ batchFileName(record.batchId) }}
                </a-link>
              </a-tooltip>
              <span v-else :class="cellClass(col)">{{ cellText(col, record) }}</span>
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

    <!-- 上传抽屉 -->
    <import-drawer v-model:visible="uploadVisible" @imported="handleImported" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconDelete,
  IconDownload,
  IconFile,
  IconMoreVertical,
  IconQuestionCircle,
  IconRefresh,
  IconSearch,
  IconUpload,
} from '@arco-design/web-vue/es/icon'
import type { TableRowSelection } from '@arco-design/web-vue/es/table/interface'
import ImportDrawer from '@/components/media-cost/ImportDrawer.vue'
import { useMediaCostStore } from '@/stores/media-cost'
import {
  MEDIA_COST_BATCH_COLUMN,
  MEDIA_COST_COMMON_COLUMNS,
  MEDIA_COST_MEDIA_COLUMN,
  MEDIA_PLATFORM_LIST,
  MEDIA_PLATFORM_MAP,
  mediaCostColumns,
  type MediaCostColumnDef,
  type MediaCostQuery,
  type MediaCostRecord,
  type MediaPlatform,
} from '@/types/media-cost'
import { downloadBlob, downloadCsv } from '@/utils/csv'
import {
  buildCsvFromRows,
  mediaCellText,
  mediaName,
  toMediaCostRow,
  type MediaCostRow,
} from '@/utils/media-export'
import { SORT_DIRECTIONS, sortableBy, type SortSorter } from '@/utils/table-sorter'

const store = useMediaCostStore()

// ────────────────────────────── 筛选 ──────────────────────────────

const filters = reactive({
  batchFileName: '',
  keyword: '',
  accountName: '',
  dateRange: [] as string[],
})

/** 已应用的查询条件(点击「查询」后生效) */
const applied = ref<MediaCostQuery>({})

const loading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  showPageSize: true,
  showTotal: true,
  pageSizeOptions: [10, 20, 50, 100],
})

/** 筛选后的全部导入数据 */
const filteredRecords = computed(() => store.filterRecords(applied.value))

// ────────────────────────────── 媒体页签 ──────────────────────────────

/** 当前选中的媒体页签:'ALL' 表示全部媒体 */
const activeTab = ref<'ALL' | MediaPlatform>('ALL')

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

/** 当前页签下的导入数据 */
const tabRecords = computed(() => {
  if (activeTab.value === 'ALL') return filteredRecords.value
  return filteredRecords.value.filter((r) => r.platform === activeTab.value)
})

/** 当前页签的列:公共字段 + 该媒体专属字段 + 来源批次 */
const columns = computed<MediaCostColumnDef[]>(() => {
  if (activeTab.value === 'ALL') {
    // 全部媒体:混排各平台数据,需要额外的「媒体」列区分来源
    return [MEDIA_COST_MEDIA_COLUMN, ...MEDIA_COST_COMMON_COLUMNS, MEDIA_COST_BATCH_COLUMN]
  }
  return mediaCostColumns(activeTab.value)
})

/** 表格总宽度(列宽之和) */
const tableWidth = computed(
  () => columns.value.reduce((sum, c) => sum + c.width, 0) + 40,
)

// ────────────────────────────── 列表数据 ──────────────────────────────

/** 列表数据:整表交给 Arco 做排序与分页 */
const tableData = computed<MediaCostRow[]>(() => tabRecords.value.map(toRow))

/** 列表总条数 */
const total = computed(() => tabRecords.value.length)

// ────────────────────────────── 表格排序 ──────────────────────────────

/** 排序配置类型 */
interface ColumnSortable {
  sorter: SortSorter
  sortDirections: ('ascend' | 'descend')[]
  defaultSortOrder?: 'ascend' | 'descend'
}

/**
 * 各字段的排序配置。
 * 必须是稳定的常量引用:表格内部对列做深度监听,配置对象每次渲染都新建的话
 * 会把用户选中的排序状态重置回默认排序。
 */
const SORTABLE_BY_KEY: Record<string, ColumnSortable> = {
  date: {
    sorter: sortableBy('date'),
    sortDirections: SORT_DIRECTIONS,
    defaultSortOrder: 'descend',
  },
  materialName: { sorter: sortableBy('materialName'), sortDirections: SORT_DIRECTIONS },
  clicks: { sorter: sortableBy('clicks'), sortDirections: SORT_DIRECTIONS },
  impressions: { sorter: sortableBy('impressions'), sortDirections: SORT_DIRECTIONS },
  cpc: { sorter: sortableBy('cpc'), sortDirections: SORT_DIRECTIONS },
  ctr: { sorter: sortableBy('ctr'), sortDirections: SORT_DIRECTIONS },
  exposureRate: { sorter: sortableBy('exposureRate'), sortDirections: SORT_DIRECTIONS },
  roi: { sorter: sortableBy('roi'), sortDirections: SORT_DIRECTIONS },
  cost: { sorter: sortableBy('cost'), sortDirections: SORT_DIRECTIONS },
  materialId: { sorter: sortableBy('materialId'), sortDirections: SORT_DIRECTIONS },
  accountName: { sorter: sortableBy('accountName'), sortDirections: SORT_DIRECTIONS },
  plays: { sorter: sortableBy('plays'), sortDirections: SORT_DIRECTIONS },
  engagements: { sorter: sortableBy('engagements'), sortDirections: SORT_DIRECTIONS },
  conversions: { sorter: sortableBy('conversions'), sortDirections: SORT_DIRECTIONS },
  batchId: { sorter: sortableBy('batchId'), sortDirections: SORT_DIRECTIONS },
  platform: { sorter: sortableBy('platform'), sortDirections: SORT_DIRECTIONS },
}

/** 排序后回到第一页 */
function handleSorterChange() {
  pagination.current = 1
}

// ────────────────────────────── 批量勾选 ──────────────────────────────

/** 已勾选的行 key */
const selectedKeys = ref<string[]>([])

/** 表格勾选配置(selectedRowKeys 由外部驱动,便于清空) */
const rowSelection = reactive<TableRowSelection>({
  type: 'checkbox',
  showCheckedAll: true,
  selectedRowKeys: [],
})

/** 勾选变化:同步到外部状态 */
function handleSelectionChange(keys: (string | number)[]) {
  selectedKeys.value = keys.map(String)
  rowSelection.selectedRowKeys = selectedKeys.value
}

/** 切换页签时清空勾选 */
function clearSelection() {
  selectedKeys.value = []
  rowSelection.selectedRowKeys = []
}

/** 批量操作菜单 */
function handleBatchAction(key: string | number | Record<string, any> | undefined) {
  if (key === 'delete') handleBatchDelete()
}

/** 批量删除:二次确认后移除所选明细 */
function handleBatchDelete() {
  if (!selectedKeys.value.length) return
  const count = selectedKeys.value.length
  Modal.confirm({
    title: '确认删除',
    content: `已选中 ${count} 条导入数据,删除后不可恢复,确认删除吗?`,
    okText: '确认删除',
    okButtonProps: { status: 'danger' },
    cancelText: '取消',
    onOk: () => {
      store.removeRecords(selectedKeys.value)
      clearSelection()
      Message.success(`已删除 ${count} 条数据`)
    },
  })
}

// ────────────────────────────── 查询 / 导出 ──────────────────────────────

function buildQuery(): MediaCostQuery {
  return {
    batchFileName: filters.batchFileName || undefined,
    keyword: filters.keyword || undefined,
    accountName: filters.accountName || undefined,
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
  filters.batchFileName = ''
  filters.keyword = ''
  filters.accountName = ''
  filters.dateRange = []
  handleSearch()
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

/** 导出当前页签下的数据 */
function handleExport() {
  const list = tableData.value
  if (!list.length) {
    Message.warning('暂无可导出的数据')
    return
  }
  const content = buildCsvFromRows(list, columns.value)
  downloadCsv(`导入任务记录-${dayjs().format('YYYYMMDD')}.csv`, content)
  Message.success(`已导出 ${list.length} 条记录`)
}

// ────────────────────────────── 源文件下载 ──────────────────────────────

/** 批次 ID → 批次文件名 */
function batchFileName(batchId: string): string {
  const batch = store.batches.find((b) => b.id === batchId)
  return batch?.fileName ?? batchId
}

/** 原始记录 → 展示行(补上来源批次文件名) */
function toRow(record: MediaCostRecord): MediaCostRow {
  return {
    ...toMediaCostRow(record),
    batchFileName: batchFileName(record.batchId),
  }
}

/**
 * 下载批次的原始上传文件。
 * 有原始文件时直接下载;演示数据没有原文件时,按该批次的明细还原一份 CSV。
 */
function handleDownloadSource(batchId: string) {
  const batch = store.batches.find((b) => b.id === batchId)
  if (!batch) {
    Message.warning('未找到对应的导入批次')
    return
  }

  const raw = store.getBatchFile(batchId)
  if (raw) {
    downloadBlob(batch.fileName, raw)
    Message.success(`正在下载 ${batch.fileName}`)
    return
  }

  const rows = store.records
    .filter((r) => r.batchId === batchId)
    .map(toRow)
  if (!rows.length) {
    Message.warning('该批次暂无可下载的源文件')
    return
  }
  const content = buildCsvFromRows(rows, mediaCostColumns(batch.platform))
  const filename = batch.fileName.toLowerCase().endsWith('.csv')
    ? batch.fileName
    : `${batch.fileName.replace(/\.[^.]+$/, '')}.csv`
  downloadCsv(filename, content)
  Message.success(`已导出 ${rows.length} 条数据(${filename})`)
}

// ────────────────────────────── 上传 ──────────────────────────────

const uploadVisible = ref(false)

function openUpload() {
  uploadVisible.value = true
}

/** 导入完成:切到刚导入的媒体并刷新列表 */
function handleImported(payload: { platform: MediaPlatform; count: number }) {
  activeTab.value = payload.platform
  clearSelection()
  // 把日期范围放宽,保证新数据可见
  filters.dateRange = [
    dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]
  handleSearch()
}

// ────────────────────────────── 展示辅助 ──────────────────────────────

/** 切换页签 */
function handleTabChange(key: 'ALL' | MediaPlatform) {
  activeTab.value = key
  pagination.current = 1
  clearSelection()
}

/** 空态文案 */
const emptyText = computed(() =>
  activeTab.value === 'ALL'
    ? '暂无导入数据,可通过「上传数据」导入各媒体报表'
    : `「${platformName(activeTab.value)}」暂无导入数据,可上传该媒体报表或调整筛选条件`,
)

function platformName(code: MediaPlatform): string {
  return mediaName(code)
}

/** 媒体标签配色 */
function platformTagStyle(code: MediaPlatform) {
  const color = MEDIA_PLATFORM_MAP[code]?.color ?? '#165DFF'
  return {
    color,
    backgroundColor: `${color}14`,
    borderColor: `${color}33`,
  }
}

/** 单元格展示值 */
function cellText(col: MediaCostColumnDef, row: MediaCostRow): string {
  return mediaCellText(col, row)
}

/** 单元格样式类 */
function cellClass(col: MediaCostColumnDef): string {
  switch (col.key) {
    case 'cost':
      return 'cost-value'
    case 'ctr':
    case 'exposureRate':
    case 'roi':
      return 'rate-value'
    case 'cpc':
      return 'number-text'
    case 'clicks':
    case 'impressions':
    case 'plays':
    case 'engagements':
    case 'conversions':
      return 'number-text'
    case 'materialId':
      return 'code-text'
    case 'materialName':
    case 'accountName':
      return 'ellipsis-text'
    default:
      return ''
  }
}

onMounted(() => {
  store.init()
})
</script>

<style scoped lang="scss">
.import-tasks-page {
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

    .filter-field {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

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
        align-items: center;
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

  // 批量操作:单独一行
  .batch-action-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .batch-action-tip {
      font-size: 12px;
      color: var(--color-text-4);
    }
  }

  .th-title {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .hint-icon {
      font-size: 13px;
      color: var(--color-text-4);
      cursor: help;
    }
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

  .platform-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  // 来源批次:可点击下载源文件
  .batch-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    font-size: 13px;

    :deep(.arco-link-text) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
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

  .rate-value {
    font-family: Monaco, Consolas, monospace;
    font-weight: 600;
    color: var(--color-primary-6);
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
</style>
