<template>
  <div class="material-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>素材列表</h2>
        <a-tag color="blue">共 {{ materialStore.total }} 个素材</a-tag>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="goToUpload">
          <template #icon><icon-upload /></template>
          上传素材
        </a-button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <a-input-search
        v-model="searchKeyword"
        placeholder="搜索素材名称、标签..."
        style="width: 300px"
        @search="handleSearch"
      />
      
      <a-select
        v-model="filterType"
        placeholder="素材类型"
        style="width: 140px"
        allow-clear
        @change="handleFilterChange"
      >
        <a-option value="VIDEO">视频</a-option>
        <a-option value="IMAGE">图片</a-option>
        <a-option value="AUDIO">音频</a-option>
      </a-select>
      
      <a-select
        v-model="filterStatus"
        placeholder="素材状态"
        style="width: 140px"
        allow-clear
        @change="handleFilterChange"
      >
        <a-option value="VALID">有效</a-option>
        <a-option value="PENDING">待处理</a-option>
        <a-option value="AUDITING">审核中</a-option>
        <a-option value="REJECTED">已拒绝</a-option>
      </a-select>
      
      <a-range-picker
        v-model="dateRange"
        style="width: 240px"
        @change="handleFilterChange"
      />
      
      <a-button @click="resetFilters">重置</a-button>
    </div>

    <!-- Batch Actions -->
    <div class="batch-actions" v-if="materialStore.hasSelection">
      <span class="selection-info">已选择 {{ materialStore.selectedIds.length }} 项</span>
      <a-space>
        <a-button @click="handleBatchAudit">批量预审</a-button>
        <a-button @click="handleBatchAnalysis">质量分析</a-button>
        <a-button status="danger" @click="handleBatchDelete">批量删除</a-button>
      </a-space>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle">
      <a-radio-group v-model="viewMode" type="button">
        <a-radio value="grid">
          <icon-apps /> 网格
        </a-radio>
        <a-radio value="list">
          <icon-list /> 列表
        </a-radio>
      </a-radio-group>
    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="material-grid">
      <div
        v-for="item in materialStore.list"
        :key="item.id"
        class="material-item"
        :class="{ selected: isSelected(item.id) }"
        @click="toggleSelection(item.id)"
      >
        <div class="material-preview">
          <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.name" />
          <video v-else-if="item.type === 'VIDEO'" :src="item.url" preload="metadata" />
          <div v-else class="material-icon">
            <icon-file-audio v-if="item.type === 'AUDIO'" />
            <icon-file-image v-else />
          </div>
          <div class="material-overlay">
            <a-checkbox :model-value="isSelected(item.id)" @click.stop />
          </div>
          <div class="material-badge" :class="`badge-${item.type.toLowerCase()}`">
            {{ getTypeLabel(item.type) }}
          </div>
        </div>
        <div class="material-info">
          <div class="material-name" :title="item.name">{{ item.name }}</div>
          <div class="material-meta">
            <span>{{ formatSize(item.size) }}</span>
            <span>{{ formatDuration(item.duration) }}</span>
          </div>
          <div class="material-status">
            <span class="status-dot" :class="`status-${item.status.toLowerCase()}`"></span>
            {{ getStatusLabel(item.status) }}
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="material-table">
      <a-table
        :data="materialStore.list"
        :loading="materialStore.loading"
        :pagination="false"
        row-key="id"
        :row-selection="{
          type: 'checkbox',
        }"
        v-model:selectedRowKeys="materialStore.selectedIds"
      >
        <template #columns>
          <a-table-column title="素材预览" :width="120">
            <template #cell="{ record }">
              <div class="table-thumb">
                <img v-if="record.thumbnail" :src="record.thumbnail" />
                <div v-else class="thumb-icon">
                  <icon-file />
                </div>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="需求ID" data-index="demandId" :width="140" ellipsis />
          <a-table-column title="审核结果" data-index="auditStatus" :width="100">
            <template #cell="{ record }">
              <a-tag v-if="record.auditStatus === 'PASS'" color="green">通过</a-tag>
              <a-tag v-else-if="record.auditStatus === 'REJECT'" color="red">拒绝</a-tag>
              <a-tag v-else-if="record.auditStatus === 'WARNING'" color="orange">警告</a-tag>
              <span v-else>-</span>
            </template>
          </a-table-column>
          <a-table-column title="审核建议" data-index="rejectReasons" :width="160" ellipsis>
            <template #cell="{ record }">
              {{ record.rejectReasons?.join('；') || '-' }}
            </template>
          </a-table-column>
          <a-table-column title="消耗" data-index="cost" :width="100">
            <template #cell="{ record }">
              {{ record.cost ? `¥${record.cost.toLocaleString()}` : '-' }}
            </template>
          </a-table-column>
          <a-table-column title="展示数" data-index="impressions" :width="100">
            <template #cell="{ record }">
              {{ record.impressions ? record.impressions.toLocaleString() : '-' }}
            </template>
          </a-table-column>
          <a-table-column title="点击数" data-index="clicks" :width="100">
            <template #cell="{ record }">
              {{ record.clicks ? record.clicks.toLocaleString() : '-' }}
            </template>
          </a-table-column>
          <a-table-column title="转化数" data-index="conversions" :width="100">
            <template #cell="{ record }">
              {{ record.conversions ? record.conversions.toLocaleString() : '-' }}
            </template>
          </a-table-column>
          <a-table-column title="转化成本" data-index="costPerConversion" :width="100">
            <template #cell="{ record }">
              {{ record.costPerConversion ? `¥${record.costPerConversion}` : '-' }}
            </template>
          </a-table-column>
          <a-table-column title="转化率" data-index="conversionRate" :width="100">
            <template #cell="{ record }">
              {{ record.conversionRate ? `${record.conversionRate}%` : '-' }}
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="180" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" size="small" @click="handlePreview(record)">
                  预览
                </a-button>
                <a-button type="text" size="small" @click="handleEdit(record)">
                  编辑
                </a-button>
                <a-dropdown trigger="click">
                  <a-button type="text" size="small">
                    <icon-more />
                  </a-button>
                  <template #content>
                    <a-doption @click="handleAudit(record)">预审</a-doption>
                    <a-doption @click="handleShare(record)">共享</a-doption>
                    <a-doption status="danger" @click="handleDelete(record)">删除</a-doption>
                  </template>
                </a-dropdown>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- Pagination -->
    <div class="pagination-wrapper">
      <a-pagination
        v-model:current="materialStore.currentPage"
        v-model:page-size="materialStore.pageSize"
        :total="materialStore.total"
        show-total
        show-jumper
        show-page-size
        :page-size-options="[10, 20, 50, 100]"
        @change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>

    <!-- Preview Modal -->
    <a-modal
      v-model:visible="previewVisible"
      :title="previewMaterial?.name"
      width="800px"
      :footer="false"
    >
      <div class="preview-content">
        <div class="preview-media">
          <img v-if="previewMaterial?.type === 'IMAGE'" :src="previewMaterial?.url" />
          <video v-else-if="previewMaterial?.type === 'VIDEO'" :src="previewMaterial?.url" controls />
          <div v-else class="preview-audio">
            <audio :src="previewMaterial?.url" controls />
          </div>
        </div>
        <div class="preview-info">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="素材ID">{{ previewMaterial?.id }}</a-descriptions-item>
            <a-descriptions-item label="素材类型">{{ getTypeLabel(previewMaterial?.type) }}</a-descriptions-item>
            <a-descriptions-item label="文件格式">{{ previewMaterial?.format }}</a-descriptions-item>
            <a-descriptions-item label="文件大小">{{ formatSize(previewMaterial?.size || 0) }}</a-descriptions-item>
            <a-descriptions-item label="分辨率" v-if="previewMaterial?.width">
              {{ previewMaterial?.width }}×{{ previewMaterial?.height }}
            </a-descriptions-item>
            <a-descriptions-item label="时长" v-if="previewMaterial?.duration">
              {{ formatDuration(previewMaterial?.duration) }}
            </a-descriptions-item>
            <a-descriptions-item label="MD5">{{ previewMaterial?.signature }}</a-descriptions-item>
            <a-descriptions-item label="上传时间">{{ formatDate(previewMaterial?.createTime || '') }}</a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconUpload,
  IconApps,
  IconList,
  IconFile,
  IconFileAudio,
  IconFileImage,
  IconMore,
} from '@arco-design/web-vue/es/icon'
import { useMaterialStore } from '@/stores/material'
import type { Material, MaterialType, MaterialStatus } from '@/types/material'

const router = useRouter()
const materialStore = useMaterialStore()

// State
const viewMode = ref<'grid' | 'list'>('grid')
const searchKeyword = ref('')
const filterType = ref<MaterialType | undefined>()
const filterStatus = ref<MaterialStatus | undefined>()
const dateRange = ref<string[]>([])
const previewVisible = ref(false)
const previewMaterial = ref<Material | null>(null)

// Helper Functions
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getTypeLabel = (type?: MaterialType) => {
  const labels: Record<string, string> = {
    VIDEO: '视频',
    IMAGE: '图片',
    AUDIO: '音频',
  }
  return labels[type || 'VIDEO']
}

const getStatusLabel = (status: MaterialStatus) => {
  const labels: Record<string, string> = {
    VALID: '有效',
    PENDING: '待处理',
    AUDITING: '审核中',
    REJECTED: '已拒绝',
    DELETED: '已删除',
  }
  return labels[status] || status
}

// Selection
const isSelected = (id: number) => materialStore.selectedIds.includes(id)
const toggleSelection = (id: number) => materialStore.toggleSelection(id)

// Actions
const goToUpload = () => router.push('/material/upload')

const handleSearch = () => {
  materialStore.setFilters({ keyword: searchKeyword.value })
  materialStore.fetchMaterials()
}

const handleFilterChange = () => {
  materialStore.setFilters({
    type: filterType.value,
    status: filterStatus.value,
  })
  materialStore.fetchMaterials()
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterType.value = undefined
  filterStatus.value = undefined
  dateRange.value = []
  materialStore.setFilters({})
  materialStore.fetchMaterials()
}

const handlePageChange = (page: number) => {
  materialStore.setPage(page)
  materialStore.fetchMaterials()
}

const handlePageSizeChange = (size: number) => {
  materialStore.setPageSize(size)
  materialStore.fetchMaterials()
}

const handlePreview = (record: Material) => {
  previewMaterial.value = record
  previewVisible.value = true
}

const handleEdit = (record: Material) => {
  Message.info(`编辑素材: ${record.name}`)
}

const handleAudit = (record: Material) => {
  router.push({
    path: '/audit/preaudit',
    query: { materialId: record.id.toString() },
  })
}

const handleShare = (record: Material) => {
  Message.info(`共享素材: ${record.name}`)
}

const handleDelete = (record: Material) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除素材 "${record.name}" 吗？此操作不可恢复。`,
    onOk: () => {
      materialStore.removeMaterials([record.id])
      Message.success('删除成功')
    },
  })
}

const handleBatchAudit = () => {
  Message.info(`批量预审 ${materialStore.selectedIds.length} 个素材`)
}

const handleBatchAnalysis = () => {
  Message.info(`质量分析 ${materialStore.selectedIds.length} 个素材`)
}

const handleBatchDelete = () => {
  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${materialStore.selectedIds.length} 个素材吗？此操作不可恢复。`,
    onOk: () => {
      materialStore.removeMaterials(materialStore.selectedIds)
      Message.success('批量删除成功')
    },
  })
}

// Lifecycle
onMounted(() => {
  materialStore.fetchMaterials()
})
</script>

<style scoped lang="scss">
.material-list-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        margin: 0;
      }
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .batch-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: var(--color-primary-1);
    border-radius: 8px;
    margin-bottom: 16px;

    .selection-info {
      font-weight: 500;
      color: var(--color-primary-7);
    }
  }

  .view-toggle {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .material-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .material-table {
    margin-bottom: 24px;

    .table-material {
      display: flex;
      align-items: center;
      gap: 12px;

      .table-thumb {
        width: 60px;
        height: 36px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--color-neutral-3);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumb-icon {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-neutral-6);
        }
      }

      .table-info {
        .name {
          font-weight: 500;
          color: var(--color-neutral-10);
        }

        .meta {
          font-size: 12px;
          color: var(--color-neutral-7);
          margin-top: 4px;
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
  }

  .preview-content {
    .preview-media {
      margin-bottom: 24px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--color-neutral-3);

      img,
      video {
        width: 100%;
        max-height: 400px;
        object-fit: contain;
      }

      .preview-audio {
        padding: 40px;
        display: flex;
        justify-content: center;

        audio {
          width: 100%;
        }
      }
    }
  }
}
</style>
