<template>
  <div class="creative-page">
    <div class="page-header">
      <div class="header-left">
        <h2>创意管理</h2>
        <a-tag color="blue">共 {{ creatives.length }} 个创意</a-tag>
      </div>
      <a-button type="primary" @click="showCreateModal = true">
        <template #icon><icon-plus /></template>
        创建创意
      </a-button>
    </div>

    <div class="filter-bar">
      <a-input-search
        v-model="searchKeyword"
        placeholder="搜索创意名称..."
        style="width: 300px"
      />
      <a-select v-model="filterStatus" placeholder="创意状态" style="width: 140px" allow-clear>
        <a-option value="ACTIVE">投放中</a-option>
        <a-option value="PAUSED">已暂停</a-option>
        <a-option value="DELETED">已删除</a-option>
      </a-select>
    </div>

    <div class="creative-list">
      <a-row :gutter="16">
        <a-col :span="8" v-for="creative in creatives" :key="creative.id">
          <div class="creative-card">
            <div class="creative-preview">
              <img :src="creative.thumbnail" :alt="creative.name" />
              <div class="creative-overlay">
                <a-space>
                  <a-button type="primary" size="small" shape="circle">
                    <icon-eye />
                  </a-button>
                  <a-button size="small" shape="circle" @click="editCreative(creative)">
                    <icon-edit />
                  </a-button>
                </a-space>
              </div>
              <div class="creative-status" :class="creative.status.toLowerCase()">
                {{ getStatusLabel(creative.status) }}
              </div>
            </div>
            <div class="creative-info">
              <h4 class="creative-name">{{ creative.name }}</h4>
              <div class="creative-meta">
                <span>计划: {{ creative.adName }}</span>
                <span>素材: {{ creative.materialCount }}个</span>
              </div>
              <div class="creative-stats">
                <div class="stat">
                  <span class="label">曝光</span>
                  <span class="value">{{ formatNumber(creative.impressions) }}</span>
                </div>
                <div class="stat">
                  <span class="label">点击</span>
                  <span class="value">{{ formatNumber(creative.clicks) }}</span>
                </div>
                <div class="stat">
                  <span class="label">CTR</span>
                  <span class="value">{{ creative.ctr }}%</span>
                </div>
              </div>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- Create Modal -->
    <a-modal
      v-model:visible="showCreateModal"
      title="创建创意"
      width="800px"
      @ok="handleCreate"
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="创意名称" field="name" :rules="[{ required: true }]">
          <a-input v-model="createForm.name" placeholder="输入创意名称" />
        </a-form-item>
        <a-form-item label="关联计划" field="adId" :rules="[{ required: true }]">
          <a-select v-model="createForm.adId" placeholder="选择投放计划">
            <a-option v-for="ad in adList" :key="ad.id" :value="ad.id">{{ ad.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="选择素材" field="materials">
          <div class="material-selector">
            <div
              v-for="mat in availableMaterials"
              :key="mat.id"
              class="material-option"
              :class="{ selected: createForm.materials.includes(mat.id) }"
              @click="toggleMaterial(mat.id)"
            >
              <img :src="mat.thumbnail" />
              <div class="check-icon" v-if="createForm.materials.includes(mat.id)">
                <icon-check />
              </div>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconEye, IconEdit, IconCheck } from '@arco-design/web-vue/es/icon'

const searchKeyword = ref('')
const filterStatus = ref('')
const showCreateModal = ref(false)

const creatives = ref([
  { id: 1, name: '春节促销创意-1', thumbnail: 'https://picsum.photos/400/225?random=1', status: 'ACTIVE', adName: '春节大促计划', materialCount: 3, impressions: 125000, clicks: 3200, ctr: 2.56 },
  { id: 2, name: '新品上市-视频', thumbnail: 'https://picsum.photos/400/225?random=2', status: 'PAUSED', adName: '新品推广', materialCount: 5, impressions: 89000, clicks: 2100, ctr: 2.36 },
  { id: 3, name: '品牌宣传-横版', thumbnail: 'https://picsum.photos/400/225?random=3', status: 'ACTIVE', adName: '品牌曝光', materialCount: 2, impressions: 256000, clicks: 6800, ctr: 2.66 },
])

const adList = ref([
  { id: 1, name: '春节大促计划' },
  { id: 2, name: '新品推广' },
  { id: 3, name: '品牌曝光' },
])

const availableMaterials = ref([
  { id: 1, thumbnail: 'https://picsum.photos/120/68?random=1' },
  { id: 2, thumbnail: 'https://picsum.photos/120/68?random=2' },
  { id: 3, thumbnail: 'https://picsum.photos/120/68?random=3' },
  { id: 4, thumbnail: 'https://picsum.photos/120/68?random=4' },
  { id: 5, thumbnail: 'https://picsum.photos/120/68?random=5' },
])

const createForm = reactive({
  name: '',
  adId: undefined as number | undefined,
  materials: [] as number[],
})

const formatNumber = (num: number) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  return num.toLocaleString()
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = { ACTIVE: '投放中', PAUSED: '已暂停', DELETED: '已删除' }
  return labels[status] || status
}

const toggleMaterial = (id: number) => {
  const index = createForm.materials.indexOf(id)
  if (index > -1) {
    createForm.materials.splice(index, 1)
  } else {
    createForm.materials.push(id)
  }
}

const editCreative = (creative: any) => {
  Message.info(`编辑创意: ${creative.name}`)
}

const handleCreate = () => {
  Message.success('创意创建成功')
  showCreateModal.value = false
}
</script>

<style scoped lang="scss">
.creative-page {
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
    margin-bottom: 24px;
  }

  .creative-list {
    .creative-card {
      background: var(--color-neutral-1);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 16px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.3s;

      &:hover {
        box-shadow: var(--shadow-md);

        .creative-overlay {
          opacity: 1;
        }
      }

      .creative-preview {
        position: relative;
        aspect-ratio: 16/9;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .creative-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .creative-status {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;

          &.active {
            background: var(--color-success-6);
            color: white;
          }

          &.paused {
            background: var(--color-warning-6);
            color: white;
          }
        }
      }

      .creative-info {
        padding: 16px;

        .creative-name {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 600;
        }

        .creative-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--color-neutral-7);
          margin-bottom: 12px;
        }

        .creative-stats {
          display: flex;
          gap: 24px;

          .stat {
            display: flex;
            flex-direction: column;

            .label {
              font-size: 12px;
              color: var(--color-neutral-6);
            }

            .value {
              font-weight: 600;
              color: var(--color-neutral-10);
            }
          }
        }
      }
    }
  }

  .material-selector {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;

    .material-option {
      aspect-ratio: 16/9;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      border: 2px solid transparent;
      transition: all 0.3s;

      &:hover,
      &.selected {
        border-color: var(--color-primary-6);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .check-icon {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: var(--color-primary-6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
    }
  }
}
</style>
