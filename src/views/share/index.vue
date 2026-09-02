<template>
  <div class="share-page">
    <div class="page-header">
      <h2>素材共享</h2>
      <p class="subtitle">跨账户素材共享，实现组织内协同复用</p>
    </div>

    <a-row :gutter="24">
      <a-col :span="8">
        <div class="material-card">
          <div class="card-header">
            <h3>创建共享</h3>
          </div>
          <div class="card-body">
            <a-form :model="shareForm" layout="vertical">
              <a-form-item label="选择素材" field="materials" :rules="[{ required: true }]">
                <a-select
                  v-model="shareForm.materials"
                  multiple
                  placeholder="选择要共享的素材"
                  :max-tag-count="3"
                >
                  <a-option v-for="m in availableMaterials" :key="m.id" :value="m.id">
                    {{ m.name }}
                  </a-option>
                </a-select>
              </a-form-item>
              <a-form-item label="目标账号" field="targets" :rules="[{ required: true }]">
                <a-select
                  v-model="shareForm.targets"
                  multiple
                  placeholder="选择目标账号"
                >
                  <a-option v-for="acc in targetAccounts" :key="acc.id" :value="acc.id">
                    {{ acc.name }}
                  </a-option>
                </a-select>
              </a-form-item>
              <a-form-item label="共享权限">
                <a-radio-group v-model="shareForm.permission">
                  <a-radio value="READ">只读</a-radio>
                  <a-radio value="WRITE">读写</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item label="有效期">
                <a-select v-model="shareForm.expiry">
                  <a-option :value="7">7天</a-option>
                  <a-option :value="30">30天</a-option>
                  <a-option :value="90">90天</a-option>
                  <a-option :value="0">永久</a-option>
                </a-select>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" long @click="createShare">创建共享</a-button>
              </a-form-item>
            </a-form>
          </div>
        </div>
      </a-col>

      <a-col :span="16">
        <div class="material-card">
          <div class="card-header">
            <h3>共享列表</h3>
            <a-input-search
              v-model="searchKeyword"
              placeholder="搜索共享..."
              style="width: 240px"
            />
          </div>
          <div class="card-body">
            <a-table :data="shareList" :pagination="{ pageSize: 10 }">
              <template #columns>
                <a-table-column title="共享素材" data-index="materials">
                  <template #cell="{ record }">
                    <div class="share-materials">
                      <a-avatar-group :size="32" :max-count="3">
                        <a-avatar v-for="m in record.materials.slice(0, 3)" :key="m.id">
                          <img :src="m.thumbnail" />
                        </a-avatar>
                      </a-avatar-group>
                      <span class="material-count">共 {{ record.materials.length }} 个素材</span>
                    </div>
                  </template>
                </a-table-column>
                <a-table-column title="目标账号" data-index="targets">
                  <template #cell="{ record }">
                    <div class="target-accounts">
                      <a-tag v-for="t in record.targets.slice(0, 2)" :key="t.id" size="small">
                        {{ t.name }}
                      </a-tag>
                      <span v-if="record.targets.length > 2">+{{ record.targets.length - 2 }}</span>
                    </div>
                  </template>
                </a-table-column>
                <a-table-column title="权限" data-index="permission" :width="100">
                  <template #cell="{ record }">
                    <a-tag :color="record.permission === 'WRITE' ? 'blue' : 'green'">
                      {{ record.permission === 'WRITE' ? '读写' : '只读' }}
                    </a-tag>
                  </template>
                </a-table-column>
                <a-table-column title="有效期至" data-index="expiry" :width="180" />
                <a-table-column title="操作" :width="150" fixed="right">
                  <template #cell="{ record }">
                    <a-space>
                      <a-button type="text" size="small" @click="editShare(record)">编辑</a-button>
                      <a-button type="text" size="small" status="danger" @click="cancelShare()">取消</a-button>
                    </a-space>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'

const searchKeyword = ref('')

const shareForm = reactive({
  materials: [] as number[],
  targets: [] as number[],
  permission: 'READ',
  expiry: 30,
})

const availableMaterials = ref([
  { id: 1, name: '产品宣传片.mp4', thumbnail: 'https://picsum.photos/40/40?random=1' },
  { id: 2, name: 'banner_01.jpg', thumbnail: 'https://picsum.photos/40/40?random=2' },
  { id: 3, name: 'intro_video.mp4', thumbnail: 'https://picsum.photos/40/40?random=3' },
])

const targetAccounts = ref([
  { id: 101, name: '子账号A' },
  { id: 102, name: '子账号B' },
  { id: 103, name: '代理商账号' },
])

const shareList = ref([
  {
    id: 1,
    materials: [
      { id: 1, name: '产品宣传片.mp4', thumbnail: 'https://picsum.photos/40/40?random=1' },
      { id: 2, name: 'banner_01.jpg', thumbnail: 'https://picsum.photos/40/40?random=2' },
    ],
    targets: [{ id: 101, name: '子账号A' }, { id: 102, name: '子账号B' }],
    permission: 'READ',
    expiry: '2024-03-15 23:59:59',
  },
  {
    id: 2,
    materials: [{ id: 3, name: 'intro_video.mp4', thumbnail: 'https://picsum.photos/40/40?random=3' }],
    targets: [{ id: 103, name: '代理商账号' }],
    permission: 'WRITE',
    expiry: '2024-02-28 23:59:59',
  },
])

const createShare = () => {
  if (shareForm.materials.length === 0 || shareForm.targets.length === 0) {
    Message.warning('请选择素材和目标账号')
    return
  }
  Message.success('共享创建成功')
  shareForm.materials = []
  shareForm.targets = []
}

const editShare = (record: any) => {
  Message.info('编辑共享: ' + record.id)
}

const cancelShare = () => {
  Modal.confirm({
    title: '确认取消共享',
    content: '取消后目标账号将无法访问这些素材',
    onOk: () => {
      Message.success('共享已取消')
    },
  })
}
</script>

<style scoped lang="scss">
.share-page {
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

  .share-materials {
    display: flex;
    align-items: center;
    gap: 12px;

    .material-count {
      font-size: 13px;
      color: var(--color-neutral-6);
    }
  }

  .target-accounts {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
