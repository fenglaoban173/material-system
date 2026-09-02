<template>
  <div class="cleanup-page">
    <div class="page-header">
      <h2>素材清理</h2>
      <p class="subtitle">批量清理低效或过期素材，优化存储成本</p>
    </div>

    <a-row :gutter="24">
      <a-col :span="8">
        <div class="material-card">
          <div class="card-header">
            <h3>创建清理任务</h3>
          </div>
          <div class="card-body">
            <a-form :model="cleanupForm" layout="vertical">
              <a-form-item label="时间范围">
                <a-range-picker v-model="cleanupForm.dateRange" style="width: 100%" />
              </a-form-item>
              <a-form-item label="视频时长">
                <a-slider
                  v-model="cleanupForm.durationRange"
                  range
                  :min="0"
                  :max="300"
                  :step="10"
                />
                <div class="slider-labels">
                  <span>{{ cleanupForm.durationRange[0] }}s</span>
                  <span>{{ cleanupForm.durationRange[1] }}s</span>
                </div>
              </a-form-item>
              <a-form-item label="文件大小">
                <a-select v-model="cleanupForm.maxSize">
                  <a-option :value="10485760">大于 10MB</a-option>
                  <a-option :value="52428800">大于 50MB</a-option>
                  <a-option :value="104857600">大于 100MB</a-option>
                </a-select>
              </a-form-item>
              <a-form-item label="素材类型">
                <a-checkbox-group v-model="cleanupForm.types">
                  <a-checkbox value="VIDEO">视频</a-checkbox>
                  <a-checkbox value="IMAGE">图片</a-checkbox>
                  <a-checkbox value="AUDIO">音频</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" long :loading="analyzing" @click="analyzeCleanup">
                  分析可清理素材
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </div>

        <div class="material-card" style="margin-top: 24px;">
          <div class="card-header">
            <h3>存储概览</h3>
          </div>
          <div class="card-body">
            <div class="storage-stats">
              <div class="stat-item">
                <span class="dot" style="background: #722ed1;"></span>
                <span>视频: {{ formatSize(storageStats.video) }}</span>
              </div>
              <div class="stat-item">
                <span class="dot" style="background: #13c2c2;"></span>
                <span>图片: {{ formatSize(storageStats.image) }}</span>
              </div>
              <div class="stat-item">
                <span class="dot" style="background: #fa8c16;"></span>
                <span>音频: {{ formatSize(storageStats.audio) }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-col>

      <a-col :span="16">
        <div class="material-card">
          <div class="card-header">
            <h3>可清理素材</h3>
            <a-space v-if="cleanupList.length > 0">
              <span class="count">共 {{ cleanupList.length }} 个素材</span>
              <a-button type="primary" status="danger" @click="confirmCleanup">
                确认清理
              </a-button>
            </a-space>
          </div>
          <div class="card-body">
            <a-table
              :data="cleanupList"
              :pagination="{ pageSize: 10 }"
              row-key="id"
            >
              <template #columns>
                <a-table-column title="素材" data-index="name" />
                <a-table-column title="类型" data-index="type" />
                <a-table-column title="大小" data-index="size">
                  <template #cell="{ record }">
                    {{ formatSize(record.size) }}
                  </template>
                </a-table-column>
                <a-table-column title="最后使用" data-index="lastUsed" />
              </template>
            </a-table>
          </div>
        </div>

        <div class="material-card" style="margin-top: 24px;">
          <div class="card-header">
            <h3>清理历史</h3>
          </div>
          <div class="card-body">
            <a-timeline>
              <a-timeline-item
                v-for="task in cleanupHistory"
                :key="task.id"
                :label="task.createTime"
              >
                <div class="history-item">
                  <div class="history-info">
                    <h4>清理任务 #{{ task.id }}</h4>
                    <p>清理 {{ task.cleanedCount }}/{{ task.totalCount }} 个素材</p>
                  </div>
                  <a-tag :color="getTaskStatusColor(task.status)">
                    {{ getTaskStatusText(task.status) }}
                  </a-tag>
                </div>
              </a-timeline-item>
            </a-timeline>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'

const cleanupForm = reactive({
  dateRange: [] as string[],
  durationRange: [0, 300] as [number, number],
  maxSize: 52428800,
  types: ['VIDEO', 'IMAGE', 'AUDIO'],
})

const analyzing = ref(false)

const storageStats = reactive({
  video: 375809638400,  // 350GB
  image: 268435456000,  // 250GB
  audio: 21474836480,   // 20GB
})

const cleanupList = ref([
  { id: 1, name: 'old_video_001.mp4', type: 'VIDEO', size: 157286400, createTime: '2023-06-01', lastUsed: '90天前' },
  { id: 2, name: 'temp_banner.jpg', type: 'IMAGE', size: 2097152, createTime: '2023-07-15', lastUsed: '60天前' },
  { id: 3, name: 'draft_audio.mp3', type: 'AUDIO', size: 10485760, createTime: '2023-08-20', lastUsed: '45天前' },
])

const cleanupHistory = ref([
  { id: 1001, status: 'COMPLETED', totalCount: 156, cleanedCount: 156, createTime: '2024-01-10 10:00:00' },
  { id: 1002, status: 'COMPLETED', totalCount: 89, cleanedCount: 89, createTime: '2024-01-05 14:00:00' },
])

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const getTaskStatusColor = (status: string) => {
  const colors: Record<string, string> = { COMPLETED: 'green', RUNNING: 'blue', FAILED: 'red' }
  return colors[status] || 'default'
}

const getTaskStatusText = (status: string) => {
  const texts: Record<string, string> = { COMPLETED: '已完成', RUNNING: '进行中', FAILED: '失败' }
  return texts[status] || status
}

const analyzeCleanup = async () => {
  analyzing.value = true
  setTimeout(() => {
    analyzing.value = false
    Message.success('分析完成，找到 ' + cleanupList.value.length + ' 个可清理素材')
  }, 1500)
}

const confirmCleanup = () => {
  Modal.confirm({
    title: '确认清理',
    content: `确定要清理这 ${cleanupList.value.length} 个素材吗？此操作不可恢复。`,
    onOk: () => {
      Message.success('清理任务已创建')
    },
  })
}
</script>

<style scoped lang="scss">
.cleanup-page {
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

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--color-neutral-6);
    margin-top: 4px;
  }

  .storage-stats {
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
    }
  }

  .count {
    color: var(--color-neutral-7);
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .history-info {
      h4 {
        margin: 0 0 4px;
        font-size: 14px;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--color-neutral-6);
      }
    }
  }
}
</style>
