<template>
  <div class="violation-score-page">
    <div class="page-header">
      <h2 class="page-title">违规积分明细</h2>
      <div class="page-desc">对接巨量引擎开放平台 /open_api/v3.0/security/score_violation_event/get/</div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <span class="filter-label">客户 ID</span>
      <a-input-number v-model="filters.advertiser_id" placeholder="请输入客户ID" :min="0" style="width: 160px;" />

      <span class="filter-label">业务线</span>
      <a-select v-model="filters.business_line" placeholder="请选择" style="width: 140px;">
        <a-option value="">全部</a-option>
        <a-option value="AD">AD 营销</a-option>
        <a-option value="LOCALAD">本地推</a-option>
      </a-select>

      <span class="filter-label">生效状态</span>
      <a-select v-model="filters.status" placeholder="请选择" style="width: 160px;" allow-clear>
        <a-option value="">全部</a-option>
        <a-option value="VALID">生效</a-option>
        <a-option value="ONAPPEAL">申诉中</a-option>
        <a-option value="FAILAPPEAL">申诉失败</a-option>
        <a-option value="APPEAL">已申诉（失效）</a-option>
        <a-option value="TIMEOUT">已超时不可申诉</a-option>
        <a-option value="APPEALDISABLED">不支持申诉</a-option>
      </a-select>

      <span class="filter-label">违规类型</span>
      <a-select v-model="filters.illegal_type" placeholder="请选择" style="width: 200px;" allow-clear>
        <a-option value="">全部</a-option>
        <a-option value="GENERAL">一般违规（AD）</a-option>
        <a-option value="SERIOUS">严重违规（AD）</a-option>
        <a-option value="CRITICAL">严重违规（本地推）</a-option>
        <a-option value="MINOR">一般违规（本地推）</a-option>
        <a-option value="BACKLINKSERIOUS">后链路严重违规（AD）</a-option>
        <a-option value="BACKLINKGENERAL">后链路一般违规（AD）</a-option>
      </a-select>

      <span class="filter-label">违规单 ID</span>
      <a-input-number v-model="filters.event_id" placeholder="请输入违规单ID" :min="0" style="width: 160px;" />

      <span class="filter-label">时间范围</span>
      <a-range-picker v-model="filters.dateRange" style="width: 280px;" show-time format="YYYY-MM-DD HH:mm:ss" />

      <div class="filter-actions">
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button @click="handleReset">重置</a-button>
      </div>
    </div>

    <!-- 数据区 -->
    <div class="data-section">
      <div class="section-toolbar">
        <div class="toolbar-left">
          <span class="section-title">违规积分明细列表</span>
          <a-tag color="arcoblue" size="small">共 {{ pagination.total }} 条</a-tag>
        </div>
        <div class="toolbar-right">
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

      <a-table
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1500 }"
        row-key="event_id"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #columns>
          <a-table-column title="违规单ID" data-index="event_id" :width="120" :fixed="'left'" />
          <a-table-column title="客户ID" data-index="advertiser_id" :width="120" />
          <a-table-column title="计划ID" data-index="ad_id" :width="120" />
          <a-table-column title="素材ID" data-index="material_id" :width="160">
            <template #cell="{ record }">
              <span class="code-text">{{ record.material_id }}</span>
            </template>
          </a-table-column>
          <a-table-column title="业务线" data-index="business_line" :width="100">
            <template #cell="{ record }">
              <a-tag :color="record.business_line === 'AD' ? 'arcoblue' : 'purple'" size="small">
                {{ BUSINESS_LINE_MAP[record.business_line as BusinessLine] || record.business_line }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="违规类型" data-index="illegal_type" :width="200">
            <template #cell="{ record }">
              <a-tag :color="getIllegalTypeColor(record.illegal_type)" size="small">
                {{ ILLEGAL_TYPE_MAP[record.illegal_type as IllegalType] || record.illegal_type }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="扣罚分值" data-index="score" :width="100" align="center">
            <template #cell="{ record }">
              <span class="score-value">-{{ record.score }}</span>
            </template>
          </a-table-column>
          <a-table-column title="生效状态" data-index="status" :width="160">
            <template #cell="{ record }">
              <a-tag :color="VIOLATION_STATUS_MAP[record.status as ViolationStatus]?.color" size="small">
                {{ VIOLATION_STATUS_MAP[record.status as ViolationStatus]?.text || record.status }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="拒绝理由" data-index="reject_reason" :width="280">
            <template #cell="{ record }">
              <a-tooltip :content="record.reject_reason" background-color="#1D2129" :style="{ maxWidth: '400px' }">
                <span class="desc-text">{{ record.reject_reason }}</span>
              </a-tooltip>
            </template>
          </a-table-column>
          <a-table-column title="证据截图" data-index="violation_evidence_img" :width="120" align="center">
            <template #cell="{ record }">
              <a-image
                v-if="record.violation_evidence_img"
                :src="record.violation_evidence_img"
                :width="60"
                :height="40"
                fit="cover"
                :preview-visible="false"
                @click="previewImg = record.violation_evidence_img"
              />
              <span v-else class="muted">-</span>
            </template>
          </a-table-column>
          <a-table-column title="创建时间" data-index="create_time" :width="180" />
          <a-table-column title="操作" :width="100" :fixed="'right'" align="center">
            <template #cell="{ record }">
              <div style="display: flex; gap: 8px; justify-content: center;">
                <a-button type="text" size="small" @click="handleDetail(record)">
                  <span style="color:#165DFF">详情</span>
                </a-button>
              </div>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:visible="showDetailModal"
      title="违规积分明细详情"
      :width="900"
      :footer="false"
      centered
      unmountOnClose
    >
      <div class="detail-modal" v-if="detailRecord">
        <div class="detail-section">
          <div class="section-header">
            <span class="section-icon"><icon-file /></span>
            <span class="section-title">违规单信息</span>
          </div>
          <div class="section-content">
            <div class="info-row">
              <span class="info-label">违规单 ID</span>
              <span class="info-value code">{{ detailRecord.event_id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">客户 ID</span>
              <span class="info-value">{{ detailRecord.advertiser_id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">业务线</span>
              <a-tag :color="detailRecord.business_line === 'AD' ? 'arcoblue' : 'purple'" size="small">
                {{ BUSINESS_LINE_MAP[detailRecord.business_line as BusinessLine] || detailRecord.business_line }}
              </a-tag>
            </div>
            <div class="info-row">
              <span class="info-label">计划 ID</span>
              <span class="info-value code">{{ detailRecord.ad_id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">素材 ID</span>
              <span class="info-value code">{{ detailRecord.material_id }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-header">
            <span class="section-icon"><icon-exclamation-circle /></span>
            <span class="section-title">违规详情</span>
          </div>
          <div class="section-content">
            <div class="info-row">
              <span class="info-label">违规类型</span>
              <a-tag :color="getIllegalTypeColor(detailRecord.illegal_type)" size="small">
                {{ ILLEGAL_TYPE_MAP[detailRecord.illegal_type as IllegalType] || detailRecord.illegal_type }}
              </a-tag>
            </div>
            <div class="info-row">
              <span class="info-label">扣罚分值</span>
              <span class="info-value score-value">-{{ detailRecord.score }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">生效状态</span>
              <a-tag :color="VIOLATION_STATUS_MAP[detailRecord.status as ViolationStatus]?.color" size="small">
                {{ VIOLATION_STATUS_MAP[detailRecord.status as ViolationStatus]?.text || detailRecord.status }}
              </a-tag>
            </div>
            <div class="info-row">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ detailRecord.create_time }}</span>
            </div>
            <div class="info-row column">
              <span class="info-label">拒绝理由</span>
              <div class="reason-box">{{ detailRecord.reject_reason }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="detailRecord.violation_evidence_img">
          <div class="section-header">
            <span class="section-icon"><icon-image /></span>
            <span class="section-title">违规证据截图</span>
          </div>
          <div class="section-content">
            <a-image
              :src="detailRecord.violation_evidence_img"
              :width="280"
              :height="180"
              fit="cover"
              description="点击预览"
            />
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-image-preview v-model:visible="previewVisible" :src="previewImg" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  IconRefresh,
  IconDownload,
  IconFile,
  IconExclamationCircle,
  IconImage,
} from '@arco-design/web-vue/es/icon'
import { Message, Modal } from '@arco-design/web-vue'
import {
  VIOLATION_STATUS_MAP,
  ILLEGAL_TYPE_MAP,
  BUSINESS_LINE_MAP,
  type ViolationScoreEvent,
  type ViolationStatus,
  type IllegalType,
  type BusinessLine,
} from '@/types/report'

// 筛选条件
const filters = reactive({
  advertiser_id: undefined as number | undefined,
  business_line: '' as '' | BusinessLine,
  status: '' as '' | ViolationStatus,
  illegal_type: '' as '' | IllegalType,
  event_id: undefined as number | undefined,
  dateRange: [] as string[],
})

const loading = ref(false)
const showDetailModal = ref(false)
const detailRecord = ref<ViolationScoreEvent | null>(null)
const previewVisible = ref(false)
const previewImg = ref('')

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 20,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100],
})

// 模拟数据（接口联调后替换为真实接口返回）
const tableData = ref<ViolationScoreEvent[]>([
  {
    event_id: 1000234567,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456789,
    material_id: 'mat_2026_05_a8f9d2',
    business_line: 'AD',
    violation_evidence_img: 'https://picsum.photos/seed/v1/320/200',
    score: 12,
    reject_reason: '素材包含绝对化用语「最佳」违反《广告法》第九条',
    create_time: '2026-06-12 10:23:45',
    status: 'VALID',
    illegal_type: 'SERIOUS',
  },
  {
    event_id: 1000234566,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456780,
    material_id: 'mat_2026_05_b7e1c3',
    business_line: 'AD',
    violation_evidence_img: 'https://picsum.photos/seed/v2/320/200',
    score: 4,
    reject_reason: '落地页标题与素材内容不一致',
    create_time: '2026-06-11 16:42:18',
    status: 'ONAPPEAL',
    illegal_type: 'GENERAL',
  },
  {
    event_id: 1000234565,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456771,
    material_id: 'mat_2026_05_c9a4f1',
    business_line: 'AD',
    violation_evidence_img: '',
    score: 6,
    reject_reason: '素材中出现医疗保证性表述',
    create_time: '2026-06-10 09:15:00',
    status: 'FAILAPPEAL',
    illegal_type: 'SERIOUS',
  },
  {
    event_id: 1000234564,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456762,
    material_id: 'mat_2026_05_d2b8e5',
    business_line: 'LOCALAD',
    violation_evidence_img: 'https://picsum.photos/seed/v4/320/200',
    score: 8,
    reject_reason: '本地推门店地址与营业执照不一致',
    create_time: '2026-06-09 14:08:32',
    status: 'VALID',
    illegal_type: 'CRITICAL',
  },
  {
    event_id: 1000234563,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456753,
    material_id: 'mat_2026_05_e5c6a7',
    business_line: 'LOCALAD',
    violation_evidence_img: '',
    score: 2,
    reject_reason: '门店联系电话缺失',
    create_time: '2026-06-08 11:30:00',
    status: 'TIMEOUT',
    illegal_type: 'MINOR',
  },
  {
    event_id: 1000234562,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456744,
    material_id: 'mat_2026_05_f1d3b9',
    business_line: 'AD',
    violation_evidence_img: 'https://picsum.photos/seed/v6/320/200',
    score: 10,
    reject_reason: '素材含有诱导分享话术',
    create_time: '2026-06-07 18:55:21',
    status: 'APPEALDISABLED',
    illegal_type: 'SERIOUS',
  },
  {
    event_id: 1000234561,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456735,
    material_id: 'mat_2026_05_a3b8c2',
    business_line: 'AD',
    violation_evidence_img: '',
    score: 15,
    reject_reason: '后链路落地页涉嫌虚假宣传，违反广告主资质规范',
    create_time: '2026-06-06 21:12:09',
    status: 'VALID',
    illegal_type: 'BACKLINKSERIOUS',
  },
  {
    event_id: 1000234560,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456726,
    material_id: 'mat_2026_05_e7f2d4',
    business_line: 'AD',
    violation_evidence_img: 'https://picsum.photos/seed/v8/320/200',
    score: 3,
    reject_reason: '后链路存在一般性诱导关注行为',
    create_time: '2026-06-05 09:48:36',
    status: 'APPEAL',
    illegal_type: 'BACKLINKGENERAL',
  },
  {
    event_id: 1000234559,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456717,
    material_id: 'mat_2026_05_b4c1f6',
    business_line: 'AD',
    violation_evidence_img: '',
    score: 5,
    reject_reason: '素材中涉及未授权的第三方品牌标识',
    create_time: '2026-06-04 13:25:00',
    status: 'ONAPPEAL',
    illegal_type: 'GENERAL',
  },
  {
    event_id: 1000234558,
    advertiser_id: 1782095027281000,
    ad_id: 7890123456708,
    material_id: 'mat_2026_05_c7d9e3',
    business_line: 'LOCALAD',
    violation_evidence_img: 'https://picsum.photos/seed/v10/320/200',
    score: 7,
    reject_reason: '本地推投放定向与门店实际经营范围不符',
    create_time: '2026-06-03 15:40:12',
    status: 'VALID',
    illegal_type: 'CRITICAL',
  },
])

// 工具方法
const getIllegalTypeColor = (type?: string) => {
  if (!type) return 'gray'
  if (type.includes('SERIOUS') || type.includes('CRITICAL') || type === 'BACKLINKSERIOUS') return 'red'
  if (type.includes('GENERAL') || type === 'MINOR' || type === 'BACKLINKGENERAL') return 'orange'
  return 'gray'
}

// 申诉：仅生效中（VALID）且未申诉、未超时、平台允许申诉的状态可发起
const canAppeal = (status: ViolationStatus) => {
  return status === 'VALID'
}

const handleSearch = () => {
  loading.value = true
  // TODO: 联调后替换为 getViolationScoreList 调用
  console.log('[Search]', JSON.stringify(buildPayload()))
  setTimeout(() => {
    loading.value = false
    Message.success('查询完成')
  }, 500)
}

const handleReset = () => {
  filters.advertiser_id = undefined
  filters.business_line = ''
  filters.status = ''
  filters.illegal_type = ''
  filters.event_id = undefined
  filters.dateRange = []
}

const handleRefresh = () => {
  handleSearch()
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

const handleDetail = (record: ViolationScoreEvent) => {
  detailRecord.value = record
  showDetailModal.value = true
}

const handleAppeal = (record: ViolationScoreEvent) => {
  Modal.confirm({
    title: '提交申诉',
    content: `确定要对违规单「${record.event_id}」发起申诉吗？`,
    okText: '确定申诉',
    cancelText: '取消',
    onOk: () => {
      Message.success(`违规单 ${record.event_id} 申诉已提交`)
      record.status = 'ONAPPEAL'
    },
  })
}

const buildPayload = () => {
  const payload: Record<string, unknown> = {
    advertiser_id: filters.advertiser_id,
    business_line: filters.business_line || undefined,
    page: pagination.current,
    page_size: pagination.pageSize,
  }
  const filtering: Record<string, unknown> = {}
  if (filters.status) filtering.status = filters.status
  if (filters.illegal_type) filtering.illegal_type = filters.illegal_type
  if (filters.event_id !== undefined && filters.event_id !== null) filtering.event_id = filters.event_id
  if (filters.dateRange && filters.dateRange.length === 2) {
    filtering.start_time = filters.dateRange[0]
    filtering.end_time = filters.dateRange[1]
  }
  if (Object.keys(filtering).length > 0) payload.filtering = filtering
  return payload
}
</script>

<style scoped lang="scss">
.violation-score-page {
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
      font-family: Monaco, Consolas, monospace;
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

      .toolbar-right {
        display: flex;
        gap: 12px;
      }
    }
  }

  .code-text {
    font-family: Monaco, Consolas, monospace;
    font-size: 12px;
    color: var(--color-text-2);
  }

  .desc-text {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .score-value {
    color: #f53f3f;
    font-weight: 600;
    font-family: Monaco, Consolas, monospace;
  }

  .muted {
    color: var(--color-text-4);
  }
}

.detail-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;

  .detail-section {
    background: #fafafa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid var(--color-neutral-3);

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-neutral-3);

      .section-icon {
        color: var(--color-primary-6);
        font-size: 16px;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-1);
      }
    }

    .section-content {
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 6px 0;

        &.column {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .info-label {
          font-size: 13px;
          color: var(--color-text-3);
          min-width: 90px;
        }

        .info-value {
          font-size: 13px;
          color: var(--color-text-1);
          font-weight: 500;
          text-align: right;

          &.code {
            font-family: Monaco, Consolas, monospace;
            color: var(--color-text-2);
          }

          &.score-value {
            color: #f53f3f;
            font-weight: 600;
            font-family: Monaco, Consolas, monospace;
          }
        }

        .reason-box {
          background: #ffffff;
          border: 1px solid var(--color-neutral-3);
          border-radius: 4px;
          padding: 12px;
          font-size: 13px;
          color: var(--color-text-2);
          line-height: 1.6;
          width: 100%;
        }
      }
    }
  }
}
</style>
