<template>
  <div class="employee-work-hours-page">
    <div class="page-header">
      <h2 class="page-title">员工工时报表</h2>
      <div class="page-desc">按员工维度统计工时投入与产出, 用于产能评估与团队绩效分析</div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <span class="filter-label">员工</span>
      <a-select v-model="filters.employeeId" placeholder="请选择" style="width: 160px;" allow-clear>
        <a-option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</a-option>
      </a-select>

      <span class="filter-label">部门</span>
      <a-cascader
        v-model="filters.departmentPath"
        :options="DEPARTMENT_OPTIONS"
        placeholder="请选择部门"
        allow-clear
        style="width: 220px;"
      />

      <span class="filter-label">时间范围</span>
      <a-range-picker v-model="filters.dateRange" style="width: 280px;" format="YYYY-MM-DD" />

      <div class="filter-actions">
        <a-button @click="handleRefresh">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
        <a-button @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </div>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-icon summary-icon-blue"><icon-user /></div>
        <div class="summary-body">
          <div class="summary-label">参与员工</div>
          <div class="summary-value">{{ summary.employeeCount }} <span class="unit">人</span></div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-purple"><icon-list /></div>
        <div class="summary-body">
          <div class="summary-label">处理需求</div>
          <div class="summary-value">{{ summary.demandCount }} <span class="unit">单</span></div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-cyan"><icon-image /></div>
        <div class="summary-body">
          <div class="summary-label">产出素材</div>
          <div class="summary-value">{{ summary.materialCount }} <span class="unit">件</span></div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-orange"><icon-clock-circle /></div>
        <div class="summary-body">
          <div class="summary-label">总工时</div>
          <div class="summary-value">{{ summary.totalHours.toFixed(1) }} <span class="unit">小时</span></div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon summary-icon-green"><icon-dashboard /></div>
        <div class="summary-body">
          <div class="summary-label">人均工时</div>
          <div class="summary-value">{{ summary.avgHours.toFixed(1) }} <span class="unit">小时</span></div>
        </div>
      </div>
    </div>

    <!-- 数据区 -->
    <div class="data-section">
      <div class="section-toolbar">
        <div class="toolbar-left">
          <span class="section-title">员工工时明细</span>
          <a-tag color="arcoblue" size="small">共 {{ tableData.length }} 条</a-tag>
        </div>
      </div>

      <a-table
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1300 }"
        row-key="employeeId"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #columns>
          <a-table-column title="员工" data-index="name" :width="120" :fixed="'left'">
            <template #cell="{ record }">
              <div class="employee-cell">
                <a-avatar :size="28" class="employee-avatar">{{ record.name?.slice(0, 1) }}</a-avatar>
                <div class="employee-info">
                  <div class="employee-name">{{ record.name }}</div>
                  <div class="employee-id">ID: {{ record.employeeId }}</div>
                </div>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="部门" :width="200">
            <template #cell="{ record }">
              <span class="dept-text">
                <span class="dept-parent">{{ record.department }}</span>
                <span v-if="record.group" class="dept-sep">/</span>
                <span v-if="record.group" class="dept-child">{{ record.group }}</span>
              </span>
            </template>
          </a-table-column>
          <a-table-column title="处理需求" data-index="demandCount" :width="100" align="center">
            <template #cell="{ record }">
              <span class="number-cell">{{ record.demandCount }}</span>
            </template>
          </a-table-column>
          <a-table-column title="产出素材" data-index="materialCount" :width="100" align="center">
            <template #cell="{ record }">
              <span class="number-cell">{{ record.materialCount }}</span>
            </template>
          </a-table-column>
          <a-table-column title="总工时" :width="120" align="right">
            <template #cell="{ record }">
              <span class="hours-value">{{ record.totalHours.toFixed(1) }}</span>
              <span class="hours-unit">h</span>
            </template>
          </a-table-column>
          <a-table-column title="人均工时/件" :width="130" align="right">
            <template #cell="{ record }">
              <span class="hours-value">{{ record.avgHoursPerPiece.toFixed(2) }}</span>
              <span class="hours-unit">h</span>
            </template>
          </a-table-column>
          <a-table-column title="日均工时" :width="110" align="right">
            <template #cell="{ record }">
              <span class="hours-value">{{ record.dailyAvgHours.toFixed(2) }}</span>
              <span class="hours-unit">h</span>
            </template>
          </a-table-column>
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
  IconRefresh,
  IconDownload,
  IconUser,
  IconList,
  IconImage,
  IconClockCircle,
  IconDashboard,
} from '@arco-design/web-vue/es/icon'

// 部门结构: 成都素材部(下含剪辑组、其他组) / 北京素材部
const DEPARTMENT_OPTIONS = [
  {
    label: '成都素材部',
    value: 'CHENGDU',
    children: [
      { label: '剪辑组', value: 'CHENGDU_CUT' },
      { label: '其他组', value: 'CHENGDU_OTHER' },
    ],
  },
  {
    label: '北京素材部',
    value: 'BEIJING',
  },
]

// 员工下拉
const employees = [
  { id: 1001, name: '张明' },
  { id: 1002, name: '李娜' },
  { id: 1003, name: '王刚' },
  { id: 1004, name: '陈静' },
  { id: 1005, name: '刘洋' },
  { id: 1006, name: '赵琳' },
  { id: 1007, name: '孙浩' },
  { id: 1008, name: '周敏' },
  { id: 1009, name: '吴强' },
  { id: 1010, name: '郑佳' },
]

interface EmployeeHoursRow {
  employeeId: number
  name: string
  /** 部门(顶级) */
  department: string
  /** 部门下的组, 可选 */
  group?: string
  demandCount: number
  materialCount: number
  totalHours: number
  avgHoursPerPiece: number
  dailyAvgHours: number
}

// 默认时间范围: 本周(周一 - 今天)
const thisWeekRange: string[] = (() => {
  const today = dayjs()
  // dayjs 默认周日=0, 中国习惯把周一当作一周的开始
  const weekday = today.day() === 0 ? 7 : today.day()
  const start = today.subtract(weekday - 1, 'day').format('YYYY-MM-DD')
  const end = today.format('YYYY-MM-DD')
  return [start, end]
})()

const filters = reactive({
  employeeId: undefined as number | undefined,
  departmentPath: [] as string[],
  dateRange: thisWeekRange,
})

const loading = ref(false)
const tableData = ref<EmployeeHoursRow[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 12,
  showPageSize: true,
  showTotal: true,
  pageSizeOptions: [10, 20, 50, 100],
})

// 顶部汇总
const summary = computed(() => {
  const list = tableData.value
  return {
    employeeCount: list.length,
    demandCount: list.reduce((s, it) => s + it.demandCount, 0),
    materialCount: list.reduce((s, it) => s + it.materialCount, 0),
    totalHours: list.reduce((s, it) => s + it.totalHours, 0),
    avgHours: list.length
      ? list.reduce((s, it) => s + it.totalHours, 0) / list.length
      : 0,
  }
})

// 模拟数据
const seed: EmployeeHoursRow[] = [
  // 成都素材部 / 剪辑组
  { employeeId: 1001, name: '张明', department: '成都素材部', group: '剪辑组', demandCount: 18, materialCount: 96, totalHours: 168.5, avgHoursPerPiece: 1.76, dailyAvgHours: 7.0 },
  { employeeId: 1003, name: '王刚', department: '成都素材部', group: '剪辑组', demandCount: 12, materialCount: 48, totalHours: 192.0, avgHoursPerPiece: 4.0, dailyAvgHours: 8.0 },
  { employeeId: 1004, name: '陈静', department: '成都素材部', group: '剪辑组', demandCount: 10, materialCount: 42, totalHours: 168.0, avgHoursPerPiece: 4.0, dailyAvgHours: 7.0 },
  { employeeId: 1007, name: '孙浩', department: '成都素材部', group: '剪辑组', demandCount: 8, materialCount: 32, totalHours: 144.0, avgHoursPerPiece: 4.5, dailyAvgHours: 6.0 },
  // 成都素材部 / 其他组
  { employeeId: 1002, name: '李娜', department: '成都素材部', group: '其他组', demandCount: 16, materialCount: 84, totalHours: 156.0, avgHoursPerPiece: 1.86, dailyAvgHours: 6.5 },
  { employeeId: 1005, name: '刘洋', department: '成都素材部', group: '其他组', demandCount: 14, materialCount: 70, totalHours: 140.0, avgHoursPerPiece: 2.0, dailyAvgHours: 5.8 },
  { employeeId: 1008, name: '周敏', department: '成都素材部', group: '其他组', demandCount: 9, materialCount: 36, totalHours: 108.0, avgHoursPerPiece: 3.0, dailyAvgHours: 4.5 },
  // 北京素材部
  { employeeId: 1006, name: '赵琳', department: '北京素材部', demandCount: 11, materialCount: 56, totalHours: 132.0, avgHoursPerPiece: 2.36, dailyAvgHours: 5.5 },
  { employeeId: 1009, name: '吴强', department: '北京素材部', demandCount: 7, materialCount: 28, totalHours: 98.0, avgHoursPerPiece: 3.5, dailyAvgHours: 4.1 },
  { employeeId: 1010, name: '郑佳', department: '北京素材部', demandCount: 6, materialCount: 24, totalHours: 108.0, avgHoursPerPiece: 4.5, dailyAvgHours: 4.5 },
]

const fetchList = async () => {
  loading.value = true
  try {
    await new Promise((r) => setTimeout(r, 300))
    let list = [...seed]
    if (filters.employeeId) list = list.filter((it) => it.employeeId === filters.employeeId)
    if (filters.departmentPath?.length) {
      // 选中顶级部门: 匹配该部门下所有记录(含子组)
      // 选中子组: 仅精确匹配该组
      const [deptCode, groupCode] = filters.departmentPath
      if (groupCode) {
        list = list.filter((it) => mapGroupCode(it) === groupCode)
      } else if (deptCode) {
        const deptName = DEPARTMENT_OPTIONS.find((d) => d.value === deptCode)?.label
        if (deptName) list = list.filter((it) => it.department === deptName)
      }
    }
    tableData.value = list
    pagination.total = list.length
  } finally {
    loading.value = false
  }
}

// 把行数据的 department+group 翻译为 group code, 用于子组过滤匹配
const mapGroupCode = (it: EmployeeHoursRow): string | null => {
  if (it.department === '成都素材部' && it.group === '剪辑组') return 'CHENGDU_CUT'
  if (it.department === '成都素材部' && it.group === '其他组') return 'CHENGDU_OTHER'
  return null
}

const handleRefresh = () => {
  fetchList()
}

const handleExport = () => {
  Message.info('导出功能开发中')
}

const handlePageChange = (page: number) => {
  pagination.current = page
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.employee-work-hours-page {
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
    grid-template-columns: repeat(5, 1fr);
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
      .summary-icon-purple { background: rgba(124, 58, 237, 0.12); color: rgb(124, 58, 237); }
      .summary-icon-cyan { background: rgba(0, 180, 200, 0.12); color: rgb(0, 180, 200); }
      .summary-icon-orange { background: rgba(255, 125, 0, 0.12); color: rgb(255, 125, 0); }
      .summary-icon-green { background: rgba(0, 180, 42, 0.12); color: rgb(0, 180, 42); }

      .summary-body {
        min-width: 0;
        .summary-label {
          font-size: 13px;
          color: var(--color-text-3);
          margin-bottom: 4px;
        }
        .summary-value {
          font-size: 22px;
          font-weight: 600;
          color: var(--color-text-1);
          font-family: Monaco, Consolas, monospace;
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

  .data-section {
    background: #ffffff;
    border-radius: 8px;
    padding: 16px 20px;

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
    }
  }

  .employee-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .employee-avatar {
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: #fff;
      font-weight: 600;
      flex-shrink: 0;
    }

    .employee-info {
      min-width: 0;

      .employee-name {
        font-weight: 500;
        color: var(--color-text-1);
        font-size: 13px;
        line-height: 1.3;
      }

      .employee-id {
        font-size: 11px;
        color: var(--color-text-4);
        font-family: Monaco, Consolas, monospace;
        line-height: 1.3;
      }
    }
  }

  // 部门展示: 顶级 / 子组 走面包屑风格
  .dept-text {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--color-text-2);

    .dept-parent {
      color: var(--color-text-1);
      font-weight: 500;
    }

    .dept-sep {
      color: var(--color-text-4);
      margin: 0 2px;
    }

    .dept-child {
      color: var(--color-primary-6);
    }
  }

  .number-cell {
    font-family: Monaco, Consolas, monospace;
    font-weight: 500;
    color: var(--color-text-1);
  }

  .hours-value {
    font-weight: 600;
    color: var(--color-primary-6);
    font-family: Monaco, Consolas, monospace;
  }

  .hours-unit {
    color: var(--color-text-3);
    font-size: 12px;
    margin-left: 2px;
  }
}

@media (max-width: 1280px) {
  .employee-work-hours-page .summary-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .employee-work-hours-page .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>