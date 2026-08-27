<template>
  <div class="preaudit-page">
    <div class="page-header">
      <h2>素材预审</h2>
      <p class="subtitle">提前检测素材合规性，降低投放风险</p>
    </div>

    <a-row :gutter="24">
      <a-col :span="16">
        <div class="material-card">
          <div class="card-header">
            <h3>待预审素材</h3>
            <a-space>
              <a-button type="primary" @click="submitAudit" :loading="submitting">
                提交预审
              </a-button>
            </a-space>
          </div>
          <div class="card-body">
            <a-table
              :data="pendingMaterials"
              :pagination="false"
              row-key="id"
              :row-selection="{
                type: 'checkbox',
                selectedRowKeys: selectedIds,
                onChange: handleSelectionChange,
              }"
            >
              <template #columns>
                <a-table-column title="素材" data-index="name">
                  <template #cell="{ record }">
                    <div class="material-cell">
                      <img :src="record.thumbnail" class="thumb" v-if="record.thumbnail" />
                      <div class="info">
                        <div class="name">{{ record.name }}</div>
                        <div class="meta">{{ record.format }} · {{ formatSize(record.size) }}</div>
                      </div>
                    </div>
                  </template>
                </a-table-column>
                <a-table-column title="类型" data-index="type" width="100">
                  <template #cell="{ record }">
                    <a-tag :color="getTypeColor(record.type)">{{ record.type }}</a-tag>
                  </template>
                </a-table-column>
                <a-table-column title="上传时间" data-index="createTime" width="180" />
              </template>
            </a-table>
          </div>
        </div>
      </a-col>

      <a-col :span="8">
        <div class="material-card">
          <div class="card-header">
            <h3>预审结果</h3>
          </div>
          <div class="card-body">
            <div v-if="auditResults.length === 0" class="empty-state">
              <icon-safe style="font-size: 48px; color: var(--color-neutral-5);" />
              <p>暂无预审结果</p>
              <p class="hint">选择素材并提交预审</p>
            </div>
            <div v-else class="audit-results">
              <div
                v-for="result in auditResults"
                :key="result.materialId"
                class="result-item"
                :class="result.status.toLowerCase()"
              >
                <div class="result-header">
                  <span class="status-badge" :class="result.status.toLowerCase()">
                    {{ result.status === 'PASS' ? '通过' : result.status === 'REJECT' ? '拒绝' : '警告' }}
                  </span>
                  <span class="material-name">素材 #{{ result.materialId }}</span>
                </div>
                <div v-if="result.rejectReasons?.length" class="result-reasons">
                  <div v-for="reason in result.rejectReasons" :key="reason" class="reason">
                    <icon-close-circle style="color: var(--color-error-6);" />
                    {{ reason }}
                  </div>
                </div>
                <div v-if="result.suggestions?.length" class="result-suggestions">
                  <div v-for="suggestion in result.suggestions" :key="suggestion" class="suggestion">
                    <icon-info-circle style="color: var(--color-primary-6);" />
                    {{ suggestion }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="material-card" style="margin-top: 24px;">
          <div class="card-header">
            <h3>预审统计</h3>
          </div>
          <div class="card-body">
            <div class="stat-list">
              <div class="stat-item">
                <span class="label">今日预审</span>
                <span class="value">{{ stats.todayCount }}</span>
              </div>
              <div class="stat-item">
                <span class="label">通过率</span>
                <span class="value success">{{ stats.passRate }}%</span>
              </div>
              <div class="stat-item">
                <span class="label">平均耗时</span>
                <span class="value">{{ stats.avgTime }}s</span>
              </div>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconSafe, IconCloseCircle, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import type { Material, PreAuditResult } from '@/types/material'

const selectedIds = ref<number[]>([])
const submitting = ref(false)
const auditResults = ref<PreAuditResult[]>([])

const pendingMaterials = ref<Partial<Material>[]>([
  { id: 1, name: 'product_ad.mp4', type: 'VIDEO', format: 'MP4', size: 52428800, thumbnail: 'https://picsum.photos/100/60?random=1', createTime: '2024-01-15 10:00:00' },
  { id: 2, name: 'banner_new.jpg', type: 'IMAGE', format: 'JPG', size: 1048576, thumbnail: 'https://picsum.photos/100/60?random=2', createTime: '2024-01-15 10:30:00' },
  { id: 3, name: 'promo_video.mp4', type: 'VIDEO', format: 'MP4', size: 31457280, thumbnail: 'https://picsum.photos/100/60?random=3', createTime: '2024-01-15 11:00:00' },
])

const stats = reactive({
  todayCount: 156,
  passRate: 87,
  avgTime: 3.2,
})

const formatSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const getTypeColor = (type?: string) => {
  const colors: Record<string, string> = { VIDEO: 'purple', IMAGE: 'cyan', AUDIO: 'orange' }
  return colors[type || 'VIDEO']
}

const handleSelectionChange = (keys: number[]) => {
  selectedIds.value = keys
}

const submitAudit = async () => {
  if (selectedIds.value.length === 0) {
    Message.warning('请选择要预审的素材')
    return
  }
  
  submitting.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock results
  auditResults.value = selectedIds.value.map(id => ({
    materialId: id,
    status: Math.random() > 0.3 ? 'PASS' : Math.random() > 0.5 ? 'WARNING' : 'REJECT',
    rejectReasons: Math.random() > 0.7 ? ['包含敏感词汇', '画质不清晰'] : undefined,
    suggestions: Math.random() > 0.6 ? ['建议使用更高分辨率', '调整亮度对比度'] : undefined,
  }))
  
  submitting.value = false
  Message.success('预审完成')
}
</script>

<style scoped lang="scss">
.preaudit-page {
  .page-header {
    margin-bottom: 24px;

    h2 {
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--color-neutral-7);
      margin: 0;
    }
  }

  .material-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .thumb {
      width: 60px;
      height: 36px;
      border-radius: 4px;
      object-fit: cover;
    }

    .info {
      .name {
        font-weight: 500;
      }

      .meta {
        font-size: 12px;
        color: var(--color-neutral-6);
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 48px 0;
    color: var(--color-neutral-6);

    .hint {
      font-size: 12px;
    }
  }

  .audit-results {
    .result-item {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
      background: var(--color-neutral-2);

      &.pass {
        border-left: 4px solid var(--color-success-6);
      }

      &.warning {
        border-left: 4px solid var(--color-warning-6);
      }

      &.reject {
        border-left: 4px solid var(--color-error-6);
      }

      .result-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;

          &.pass {
            background: var(--color-success-1);
            color: var(--color-success-7);
          }

          &.warning {
            background: var(--color-warning-1);
            color: var(--color-warning-7);
          }

          &.reject {
            background: var(--color-error-1);
            color: var(--color-error-7);
          }
        }

        .material-name {
          font-weight: 500;
        }
      }

      .result-reasons,
      .result-suggestions {
        margin-top: 8px;

        .reason,
        .suggestion {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 13px;
          color: var(--color-neutral-8);
        }
      }
    }
  }

  .stat-list {
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--color-neutral-3);

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: var(--color-neutral-7);
      }

      .value {
        font-weight: 600;

        &.success {
          color: var(--color-success-6);
        }
      }
    }
  }
}
</style>
