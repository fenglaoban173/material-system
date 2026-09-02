<template>
  <div class="upload-page">
    <!-- 主体两栏布局 -->
    <div class="upload-layout">
      <!-- 左侧: 上传配置 -->
      <aside class="upload-config">
        <div class="config-section-header">① 上传配置</div>

        <a-form :model="form" layout="vertical" class="config-form">
          <!-- 上传目录 -->
          <a-form-item>
            <template #label>
              <span class="required-mark">*</span>
              <span>上传目录</span>
            </template>
            <a-tree-select
              v-model="form.directory"
              :data="folderTree"
              :field-names="{ key: 'key', title: 'title', children: 'children' }"
              placeholder="请选择上传目录"
              allow-clear
              style="width: 100%;"
            />
          </a-form-item>

          <!-- 关联需求 -->
          <a-form-item>
            <template #label>
              <span class="required-mark">*</span>
              <span>关联需求</span>
            </template>
            <a-select
              v-model="form.demand"
              placeholder="请选择关联的需求"
              allow-clear
              show-search
              style="width: 100%;"
            >
              <a-option v-for="d in demandOptions" :key="d.value" :value="d.value">
                {{ d.label }}
              </a-option>
            </a-select>
          </a-form-item>

          <!-- 创意人员 -->
          <a-form-item label="创意人员">
            <div class="staff-grid">
              <div v-for="role in roles" :key="role.key" class="staff-row">
                <span class="staff-label">
                  <span v-if="role.required" class="required">*</span>
                  <span v-else class="optional-mark" aria-hidden="true">&nbsp;</span>
                  {{ role.name }}
                </span>
                <a-select
                  v-model="form.staff[role.key]"
                  :placeholder="`请选择${role.name}`"
                  :multiple="role.multiple"
                  style="flex: 1;"
                  allow-clear
                  show-search
                >
                  <a-option v-for="p in staffPool" :key="p" :value="p">{{ p }}</a-option>
                </a-select>
              </div>
            </div>
          </a-form-item>
        </a-form>
      </aside>

      <!-- 右侧: 上传区 + 列表 -->
      <main class="upload-content">
        <!-- 上传区 -->
        <div
          class="upload-zone"
          :class="{ 'drag-over': isDragging }"
          @click="triggerFileInput"
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*,video/*"
            style="display: none"
            @change="handleFileChange"
          />
          <div class="cloud-icon">
            <svg
              viewBox="0 0 1024 1024"
              width="80"
              height="80"
              fill="currentColor"
              aria-hidden="true"
            >
              <!-- 云朵轮廓 -->
              <path
                d="M738.4 380.8h-23.2C699.2 280 612 208 512 208c-86.4 0-160 54.4-188.8 132.8C232 348.8 160 416 160 504c0 92.8 76.8 168.8 172 171.2h406.4c95.2-2.4 172-78.4 172-171.2 0-92.8-76.8-168.8-172-123.2z m0 224H332c-55.2 0-100-44.8-100-100s44.8-100 100-100c8 0 16 0 24 4l40 8 16-40c16-56 64-100 124-100 68.8 0 124 56 124 124v24h40c55.2 0 100 44.8 100 100-2.4 56-48 80-61.6 80z"
              />
              <!-- 上传箭头: 竖杆 + 三角形 -->
              <path d="M488 528v208h48V528h64L512 432 424 528z" />
            </svg>
          </div>
          <div class="zone-tip">
            将文件或文件夹拖到此处,<span class="tip-link">或点击下方模式</span>
          </div>

          <div class="upload-modes">
            <a-button size="large" class="mode-btn" @click="triggerFileInput">
              <template #icon><icon-video-camera /></template>
              上传视频/图片
            </a-button>
          </div>

          <div class="upload-rules">
            <div>1. 仅支持图片和视频文件,上传添加不超过500个</div>
            <div>2. 支持图片格式: png、jpg、jpeg、gif; 支持视频格式: mp4、mpeg、3pg、avi、mov</div>
          </div>
        </div>

        <!-- 选项区已移除（按需求） -->

        <!-- 上传列表 -->
        <div class="upload-list">
          <div class="list-header">
            <div class="header-left">
              <span class="list-title">上传列表</span>
              <span class="list-quota">单次上传上限: {{ uploadedFiles.length }}/500</span>
            </div>
          </div>

          <div class="list-toolbar">
            <span class="selected-count">已选择 {{ selectedIds.length }} 条素材</span>
            <a-button
              type="primary"
              size="small"
              :disabled="!selectedIds.length"
              @click="openBatchEditModal"
            >
              <template #icon><icon-edit /></template>
              批量编辑
            </a-button>
          </div>

          <a-table
            :data="paginatedFiles"
            :pagination="pagination"
            row-key="id"
            :scroll="{ x: 1400 }"
            :row-selection="{
              type: 'checkbox',
              showCheckedAll: true,
              selectedRowKeys: selectedIds,
            }"
            @selection-change="handleSelectChange"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          >
            <template #columns>
              <a-table-column title="素材" :width="180">
                <template #cell="{ record }">
                  <div class="material-cell">
                    <div class="thumb">
                      <img v-if="record.thumb" :src="record.thumb" :alt="record.name" />
                      <icon-image v-else />
                    </div>
                    <div class="material-info">
                      <div class="material-name">{{ record.name }}</div>
                      <div class="material-meta">{{ record.meta }}</div>
                    </div>
                  </div>
                </template>
              </a-table-column>
              <a-table-column title="素材类型" :width="180">
                <template #cell="{ record }">
                  <a-tooltip
                    v-if="record.materialTypePath?.length"
                    :content="formatMaterialTypePath(materialTypeOptions, record.materialTypePath)"
                  >
                    <a-tag color="purple" size="small" effect="plain">
                      {{ formatMaterialTypePath(materialTypeOptions, record.materialTypePath) }}
                    </a-tag>
                  </a-tooltip>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column title="素材版式" data-index="format" :width="120">
                <template #cell="{ record }">
                  <span v-if="record.format" class="staff-text">{{ record.format }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column title="编导" data-index="director" :width="100">
                <template #cell="{ record }">
                  <span v-if="record.director" class="staff-text">{{ record.director }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column title="剪辑" data-index="cutter" :width="100">
                <template #cell="{ record }">
                  <span v-if="record.cutter" class="staff-text">{{ record.cutter }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column title="摄像" data-index="cameraman" :width="100">
                <template #cell="{ record }">
                  <span v-if="record.cameraman" class="staff-text">{{ record.cameraman }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column title="演员" data-index="actor" :width="140">
                <template #cell="{ record }">
                  <span v-if="record.actor && record.actor.length" class="staff-text">{{ record.actor.join('、') }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column title="设计" data-index="producer" :width="100">
                <template #cell="{ record }">
                  <span v-if="record.producer" class="staff-text">{{ record.producer }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column title="产出日期" data-index="produceDate" :width="120">
                <template #cell="{ record }">
                  <span v-if="record.produceDate" class="date-text">{{ record.produceDate }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="140" :fixed="'right'" align="center">
                <template #cell="{ record }">
                  <a-button type="text" size="small" @click="handleEdit(record)">
                    <span style="color:#165DFF">编辑</span>
                  </a-button>
                  <a-button type="text" size="small" status="danger" @click="handleRemove(record)">
                    删除
                  </a-button>
                </template>
              </a-table-column>
            </template>
            <template #empty>
              <div class="empty-state">
                <icon-file />
                <div>暂无素材</div>
              </div>
            </template>
          </a-table>
        </div>
      </main>
    </div>

    <!-- 编辑素材抽屉 -->
    <a-drawer
      v-model:visible="editVisible"
      title="编辑素材"
      :width="520"
      :footer="false"
      unmount-on-close
      @cancel="handleEditCancel"
    >
      <div v-if="editForm" class="edit-drawer">
        <!-- 只读区: 素材信息 -->
        <div class="readonly-section">
          <div class="readonly-thumb">
            <img v-if="editForm.thumb" :src="editForm.thumb" :alt="editForm.name" />
            <icon-image v-else />
          </div>
          <div class="readonly-info">
            <div class="readonly-name">{{ editForm.name }}</div>
            <div class="readonly-meta">{{ editForm.meta }}</div>
          </div>
          <a-tag color="gray" size="small" class="readonly-tag">素材不可编辑</a-tag>
        </div>

        <a-divider class="section-divider" />

        <a-form :model="editForm" layout="vertical" class="edit-form">
          <!-- 素材类型: 级联选择(视频/平面 + 子级) -->
          <a-form-item label="素材类型">
            <a-cascader
              v-model="editForm.materialTypePath"
              :options="materialTypeOptions"
              placeholder="请选择素材类型"
              allow-clear
              style="width: 100%;"
            />
          </a-form-item>

          <!-- 素材版式: 根据素材类型动态加载（视频→横/竖版视频；平面→直播背景/详情页/图片/落地页/开屏/海报） -->
          <a-form-item label="素材版式">
            <a-select
              v-model="editForm.format"
              :options="editFormatOptions"
              :placeholder="editForm.materialTypePath?.length ? '请选择版式' : '请先选择素材类型'"
              :disabled="!editForm.materialTypePath?.length"
              allow-clear
              style="width: 100%;"
            />
          </a-form-item>

          <a-divider class="section-divider" />

          <!-- 创意人员(从左侧表单复制同一份 staffPool) -->
          <div class="staff-edit-grid">
            <a-form-item v-for="role in roles" :key="role.key" :label="role.name">
              <a-select
                v-model="editForm[role.key as keyof UploadedFile] as any"
                :placeholder="`请选择${role.name}`"
                :multiple="role.multiple"
                style="width: 100%;"
                allow-clear
                show-search
              >
                <a-option v-for="p in staffPool" :key="p" :value="p">{{ p }}</a-option>
              </a-select>
            </a-form-item>
          </div>
        </a-form>

        <div class="drawer-footer">
          <a-button @click="handleEditCancel">取消</a-button>
          <a-button type="primary" :loading="editSaving" @click="handleEditSave">保存</a-button>
        </div>
      </div>
    </a-drawer>

    <!-- 批量编辑弹窗 -->
    <a-modal
      v-model:visible="showBatchEditModal"
      title="批量编辑"
      :width="720"
      :body-style="{ padding: '20px 24px' }"
      :ok-text="'确定修改'"
      :cancel-text="'取消'"
      :ok-button-props="{ disabled: !isBatchEditDirty }"
      :on-before-ok="handleBatchEditSubmit"
      unmount-on-close
    >
      <div class="batch-edit-modal">
        <div class="batch-edit-tip">
          <icon-exclamation-circle />
          <span>将对已选中的 <strong>{{ selectedIds.length }}</strong> 条素材应用以下修改，未填写的字段将保持原值不变。</span>
        </div>
        <a-form :model="batchEditForm" layout="vertical">
          <a-form-item label="素材类型">
            <a-cascader
              v-model="batchEditForm.materialTypePath"
              :options="materialTypeOptions"
              placeholder="请选择素材类型"
              allow-clear
              path-mode
              style="width: 100%;"
            />
          </a-form-item>
          <a-form-item label="素材版式">
            <a-select
              v-model="batchEditForm.format"
              :options="batchFormatOptions"
              :placeholder="batchEditForm.materialTypePath?.length ? '请选择版式' : '请先选择素材类型'"
              :disabled="!batchEditForm.materialTypePath?.length"
              allow-clear
              style="width: 100%;"
            />
          </a-form-item>

          <a-divider class="section-divider" />

          <!-- 创意人员（5 个字段，演员支持多选） -->
          <div class="staff-edit-grid">
            <a-form-item v-for="role in roles" :key="role.key" :label="role.name">
              <a-select
                v-model="batchEditForm.staff[role.key]"
                :placeholder="`请选择${role.name}`"
                :multiple="role.multiple"
                style="width: 100%;"
                allow-clear
                show-search
              >
                <a-option v-for="p in staffPool" :key="p" :value="p">{{ p }}</a-option>
              </a-select>
            </a-form-item>
          </div>

          <div
            v-if="batchEditForm.materialTypePath?.length && batchEditForm.format"
            class="batch-type-preview"
          >
            <span class="preview-label">应用预览：</span>
            <a-tag color="purple" size="small" effect="plain">
              {{ formatMaterialTypePath(materialTypeOptions, batchEditForm.materialTypePath) }} / {{ batchEditForm.format }}
            </a-tag>
          </div>
        </a-form>
      </div>
    </a-modal>

    <!-- 底部按钮 -->
    <div class="footer-actions">
      <a-button size="large" @click="handleCancel">取消</a-button>
      <a-button type="primary" size="large" @click="handleSubmit">提交</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconVideoCamera,
  IconImage,
  IconFile,
} from '@arco-design/web-vue/es/icon'
import { folderTree, demandOptions, materialTypeOptions, formatMaterialTypePath, getFormatOptions } from '@/mock/material'

const isDragging = ref(false)

// 创意人员角色
const roles = [
  { key: 'director', name: '编导', required: false, multiple: false },
  { key: 'cutter', name: '剪辑', required: false, multiple: false },
  { key: 'cameraman', name: '摄像', required: false, multiple: false },
  { key: 'actor', name: '演员', required: false, multiple: true },
  { key: 'producer', name: '设计', required: false, multiple: false },
]

const staffPool = ['武文培', '李明', '张伟', '王强', '观众', '陈芳', '刘洋', '赵敏']

const form = reactive({
  directory: undefined as string | undefined,
  staff: {} as Record<string, string | string[]>,
  demand: undefined as string | undefined,
})

interface UploadedFile {
  id: number
  /** 素材名称 */
  name: string
  /** 文件大小 / 格式摘要 */
  meta: string
  /** 素材类型(从 MIME 派生): 视频 / 图片 / 音频 / 文件 */
  materialType?: string
  /** 素材类型级联路径, 例如 ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_YB'] */
  materialTypePath?: string[]
  thumb?: string
  /** 编导 */
  director?: string
  /** 剪辑 */
  cutter?: string
  /** 摄像 */
  cameraman?: string
  /** 演员（支持多选） */
  actor?: string[]
  /** 制作（前端 label 为"设计"） */
  producer?: string
  /** 版式（仅在批量修改素材类型时设置） */
  format?: string
  /** 产出日期(YYYY-MM-DD) */
  produceDate?: string
}

const uploadedFiles = ref<UploadedFile[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const MAX_COUNT = 500

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  addFiles(Array.from(input.files))
  input.value = ''
}

const isAcceptFile = (file: File) => {
  const t = (file.type || '').toLowerCase()
  return t.startsWith('image/') || t.startsWith('video/')
}

const addFiles = (files: File[]) => {
  const valid = files.filter(isAcceptFile)
  if (!valid.length) {
    Message.warning('请选择图片或视频文件')
    return
  }
  const remain = MAX_COUNT - uploadedFiles.value.length
  if (remain <= 0) {
    Message.warning(`单次上传上限 ${MAX_COUNT} 个`)
    return
  }
  const accepted = valid.slice(0, remain)
  const newItems: UploadedFile[] = accepted.map((file) => ({
    id: Date.now() + Math.random(),
    name: file.name,
    meta: `${(file.type || '未知类型').replace(/^.*\//, '').toUpperCase()} · ${formatSize(file.size)}`,
    materialType: inferMaterialType(file),
    thumb: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  }))
  uploadedFiles.value = [...uploadedFiles.value, ...newItems]
  Message.success(`已添加 ${accepted.length} 个文件`)
  if (valid.length > remain) {
    Message.warning(`已达单次上限,仅添加前 ${remain} 个`)
  }
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 从文件名提取简短的素材类型标签(扩展名,作为兜底)
const formatType = (name: string): string => {
  if (!name) return '-'
  const idx = name.lastIndexOf('.')
  if (idx < 0) return '文件'
  const ext = name.slice(idx + 1).toLowerCase()
  const map: Record<string, string> = {
    mp4: '视频', mov: '视频', mpeg: '视频', '3pg': '视频', avi: '视频',
    jpg: '图片', jpeg: '图片', png: '图片', gif: '图片', webp: '图片',
    mp3: '音频', wav: '音频', m4a: '音频',
  }
  return map[ext] || ext.toUpperCase()
}

// 从 MIME 类型推断素材类型(优先) → 兜底用扩展名
const inferMaterialType = (file: File): string => {
  const mime = (file.type || '').toLowerCase()
  if (mime.startsWith('video/')) return '视频'
  if (mime.startsWith('image/')) return '图片'
  if (mime.startsWith('audio/')) return '音频'
  return formatType(file.name)
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) addFiles(Array.from(files))
}

const handleEdit = (record: UploadedFile) => {
  editForm.value = { ...record }
  editVisible.value = true
}

const handleEditCancel = () => {
  editVisible.value = false
  editForm.value = null
}

const editVisible = ref(false)
const editSaving = ref(false)
const editForm = ref<UploadedFile | null>(null)

const handleEditSave = async () => {
  if (!editForm.value) return
  editSaving.value = true
  try {
    // 找到原记录并替换
    const idx = uploadedFiles.value.findIndex((it) => it.id === editForm.value!.id)
    if (idx >= 0) {
      uploadedFiles.value[idx] = { ...editForm.value }
    }
    await new Promise((r) => setTimeout(r, 200))
    Message.success('已保存')
    editVisible.value = false
    editForm.value = null
  } finally {
    editSaving.value = false
  }
}

// 批量勾选 + 批量编辑
const selectedIds = ref<number[]>([])
const handleSelectChange = (keys: (string | number)[]) => {
  selectedIds.value = keys.map((k) => Number(k))
}

const showBatchEditModal = ref(false)
const batchEditForm = reactive({
  materialTypePath: [] as string[],
  format: '',
  staff: {} as Record<string, string | string[] | undefined>,
})

// 版式选项根据 typePath 动态变化（与需求创建页一致）
const batchFormatOptions = computed(() => getFormatOptions(batchEditForm.materialTypePath || []))

// 单条编辑抽屉：版式选项跟随所选素材类型动态加载
const editFormatOptions = computed(() =>
  getFormatOptions(editForm.value?.materialTypePath || []),
)

// 单条编辑抽屉：切换素材类型时清空旧版式（与批量编辑一致）
watch(
  () => editForm.value?.materialTypePath,
  (val, oldVal) => {
    if (JSON.stringify(val || []) !== JSON.stringify(oldVal || [])) {
      if (editForm.value) editForm.value.format = ''
    }
  },
)

// 选素材类型时清空旧版式（与需求创建页的 handleTypePathChange 行为对齐）
watch(() => batchEditForm.materialTypePath, (val, oldVal) => {
  if (JSON.stringify(val) !== JSON.stringify(oldVal || [])) {
    batchEditForm.format = ''
  }
})

// 任一字段已填写即认为有修改（控制「确定修改」按钮是否可点）
const isBatchEditDirty = computed(() => {
  if (batchEditForm.materialTypePath?.length) return true
  if (batchEditForm.format) return true
  return roles.some((r) => {
    const v = batchEditForm.staff[r.key]
    if (Array.isArray(v)) return v.length > 0
    return !!v
  })
})

const openBatchEditModal = () => {
  if (!selectedIds.value.length) {
    Message.warning('请先选择素材')
    return
  }
  batchEditForm.materialTypePath = []
  batchEditForm.format = ''
  roles.forEach((r) => {
    batchEditForm.staff[r.key] = r.multiple ? [] : undefined
  })
  showBatchEditModal.value = true
}

const handleBatchEditSubmit = async () => {
  if (!isBatchEditDirty.value) {
    Message.warning('请至少修改一项')
    return false
  }
  const ids = new Set(selectedIds.value)

  // 仅把「有值」的字段写入更新对象，其余字段不动
  const updates: Partial<UploadedFile> = {}
  if (batchEditForm.materialTypePath?.length) {
    updates.materialTypePath = [...batchEditForm.materialTypePath]
    updates.materialType = formatMaterialTypePath(
      materialTypeOptions,
      batchEditForm.materialTypePath,
    )
  }
  if (batchEditForm.format) {
    updates.format = batchEditForm.format
  }
  const staff = batchEditForm.staff
  if (staff.director && typeof staff.director === 'string') updates.director = staff.director
  if (staff.cutter && typeof staff.cutter === 'string') updates.cutter = staff.cutter
  if (staff.cameraman && typeof staff.cameraman === 'string') updates.cameraman = staff.cameraman
  if (Array.isArray(staff.actor) && staff.actor.length) {
    updates.actor = [...staff.actor]
  }
  if (staff.producer && typeof staff.producer === 'string') updates.producer = staff.producer

  uploadedFiles.value = uploadedFiles.value.map((it) =>
    ids.has(it.id) ? { ...it, ...updates } : it,
  )

  await new Promise((r) => setTimeout(r, 150))
  Message.success(`已修改 ${selectedIds.value.length} 条素材`)
  showBatchEditModal.value = false
  selectedIds.value = []
  return true
}

const handleRemove = (record: UploadedFile) => {
  Modal.confirm({
    title: '删除素材',
    content: `确定要从上传列表中移除「${record.name}」吗?`,
    okText: '确定删除',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      uploadedFiles.value = uploadedFiles.value.filter((it) => it.id !== record.id)
      // 删除后若当前页空了,回到上一页
      if (
        pagination.current > 1 &&
        paginatedFiles.value.length === 1 &&
        pagination.current === Math.ceil(uploadedFiles.value.length / pagination.pageSize) + 1
      ) {
        pagination.current = Math.max(1, pagination.current - 1)
      }
      Message.success('已删除')
    },
  })
}

// 跳回素材列表
const goBackToList = () => {
  window.close()
  // window.close 在用户主动打开的窗口才生效;以防无效,降级跳回列表
  // hash 模式下路径在 location.hash,需要判空避免循环
  setTimeout(() => {
    if (window.location.hash !== '#/material-lib/list') {
      window.location.href = '/#/material-lib/list'
    }
  }, 100)
}

const handleSubmit = () => {
  Message.success(`已提交 ${uploadedFiles.value.length} 条素材`)
  goBackToList()
}

const handleCancel = () => {
  Modal.confirm({
    title: '取消上传',
    content: '当前所有配置将不会被保存,确定要离开吗?',
    okText: '确定离开',
    cancelText: '继续编辑',
    okButtonProps: { status: 'danger' },
    onOk: () => goBackToList(),
  })
}

// 翻页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  showPageSize: true,
  showTotal: true,
  pageSizeOptions: [10, 20, 50, 100],
})

const paginatedFiles = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return uploadedFiles.value.slice(start, start + pagination.pageSize)
})

const handlePageChange = (page: number) => {
  pagination.current = page
}

const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.current = 1
}
</script>

<style scoped lang="scss">
.upload-page {
  background: var(--color-fill-1);
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;

  // 两栏布局
  .upload-layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 16px;
    padding: 8px 24px 96px;
    align-items: stretch;
    flex: 1;
  }

  // 左侧 - 上传配置
  .upload-config {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .config-section-header {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-1);
      padding-bottom: 12px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--color-neutral-3);
    }

    .config-form {
      flex: 1;
      min-height: 0;
      overflow-y: auto;

      :deep(.arco-form-item-label) {
        font-size: 13px;
        color: var(--color-text-2);
        padding-bottom: 4px;
      }
    }

    .dir-row {
      display: flex;
      align-items: center;
      gap: 4px;

      .new-folder-btn {
        flex-shrink: 0;
        font-size: 12px;
      }
    }

    .staff-grid {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .staff-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .staff-label {
          font-size: 13px;
          color: var(--color-text-2);
          width: 56px;
          flex-shrink: 0;

          .required {
            color: #f53f3f;
            margin-right: 1px;
          }
        }

        .add-person-btn {
          flex-shrink: 0;
          font-size: 12px;
        }
      }
    }

    .collapse-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 6px;
    }

    .audit-help-link {
      font-size: 13px;
    }

    .segment-row {
      display: flex;
      align-items: center;
      gap: 8px;

      .inline-link {
        flex-shrink: 0;
        font-size: 12px;
      }
    }

    .inline-link {
      font-size: 12px;
    }

    .hint-text {
      display: flex;
      gap: 6px;
      margin-top: 8px;
      padding: 8px 10px;
      background: #fff7e6;
      border: 1px solid #ffd591;
      border-radius: 4px;
      font-size: 12px;
      color: #ad6800;
      line-height: 1.5;
    }
  }

  // 右侧 - 上传区 + 列表
  .upload-content {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;

    // 上传区
    .upload-zone {
      border: 2px dashed var(--color-neutral-4);
      border-radius: 12px;
      padding: 36px 20px 20px;
      text-align: center;
      background: var(--color-fill-1);
      transition: all 0.2s;
      position: relative;
      flex-shrink: 0;
      cursor: pointer;

      &:hover,
      &.drag-over {
        border-color: var(--color-primary-6);
        background: var(--color-primary-1);
      }

      .cloud-icon {
        font-size: 80px;
        color: #8c9bab;
        margin-bottom: 12px;
      }

      .zone-tip {
        font-size: 14px;
        color: var(--color-text-2);
        margin-bottom: 20px;

        .tip-link {
          color: var(--color-primary-6);
          cursor: pointer;
        }
      }

      .upload-modes {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 20px;

        .mode-btn {
          min-width: 160px;
          position: relative;
        }

        .mode-btn-highlight {
          border-color: #ff7d00;
          color: #ff7d00;
          position: relative;

          &:hover {
            background: #fff7e6;
          }

          .new-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff7d00;
            color: #fff;
            font-size: 10px;
            padding: 1px 6px;
            border-radius: 8px;
            line-height: 1.4;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        }
      }

      .upload-rules {
        text-align: left;
        max-width: 720px;
        margin: 0 auto;
        font-size: 12px;
        color: var(--color-text-3);
        line-height: 1.8;

        div {
          padding-left: 16px;
          position: relative;

          &::before {
            content: '';
            position: absolute;
            left: 4px;
            top: 10px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--color-text-4);
          }
        }
      }
    }

    // 选项
    .upload-options {
      display: flex;
      gap: 24px;
      padding: 14px 0;
      border-bottom: 1px solid var(--color-neutral-3);
    }

    // 选项
    .upload-options {
      display: flex;
      gap: 24px;
      padding: 14px 0;
      border-bottom: 1px solid var(--color-neutral-3);
    }

    // 列表
    .upload-list {
      padding-top: 12px;

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .list-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--color-text-1);
          }

          .list-quota {
            font-size: 12px;
            color: var(--color-text-3);
          }
        }
      }

      .list-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;

        .selected-count {
          font-size: 13px;
          color: var(--color-primary-6);
          font-weight: 500;
        }
      }

      /* 批量编辑弹窗 */
      .batch-edit-modal {
        .batch-edit-tip {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px;
          margin-bottom: 20px;
          background: var(--color-primary-light-1);
          border: 1px solid var(--color-primary-light-3);
          border-radius: 6px;
          color: var(--color-neutral-7);
          font-size: 13px;
          line-height: 1.6;

          svg {
            flex-shrink: 0;
            margin-top: 2px;
            color: var(--color-primary-6);
          }

          strong {
            color: var(--color-primary-6);
            font-weight: 600;
            margin: 0 2px;
          }
        }

        .batch-type-preview {
          margin-top: 4px;
          padding: 10px 14px;
          background: var(--color-fill-2);
          border-radius: 6px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;

          .preview-label {
            color: var(--color-neutral-7);
          }
        }
      }

      // 创意人员两栏网格（编辑抽屉与批量编辑弹窗共用）
      .staff-edit-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 16px;
      }

      .material-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0 12px;
        background: var(--color-fill-2);
        border-radius: 6px;
        font-size: 12px;
        color: var(--color-text-2);
        line-height: 40px;
        height: 40px;

        .arco-icon {
          font-size: 14px;
        }
      }

      .material-cell {
        display: flex;
        align-items: center;
        gap: 10px;

        .thumb {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          background: var(--color-fill-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-3);
          font-size: 18px;
          flex-shrink: 0;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .material-info {
          min-width: 0;

          .material-name {
            font-size: 13px;
            color: var(--color-text-1);
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .material-meta {
            font-size: 11px;
            color: var(--color-text-3);
            margin-top: 2px;
          }
        }
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

      .muted {
        color: var(--color-text-4);
      }
    }
  }

  // 编辑抽屉
  .edit-drawer {
    padding: 0 4px 16px;

    .readonly-section {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;

      .readonly-thumb {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        background: var(--color-fill-2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-3);
        font-size: 20px;
        flex-shrink: 0;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .readonly-info {
        flex: 1;
        min-width: 0;

        .readonly-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .readonly-meta {
          font-size: 12px;
          color: var(--color-text-3);
          margin-top: 2px;
        }
      }
    }

    .section-divider {
      margin: 16px 0 12px;
    }

    .drawer-footer {
      position: sticky;
      bottom: 0;
      padding: 16px 0 0;
      margin-top: 16px;
      background: #fff;
      border-top: 1px solid var(--color-neutral-3);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  // 底部完成按钮
  .footer-actions {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    gap: 12px;
  }
}

// 表头必填星标(与反馈页风格一致)
.required-mark {
  color: #f53f3f;
  margin-right: 4px;
  font-weight: 600;
  line-height: 1;
}

@media (max-width: 1100px) {
  .upload-page .upload-layout {
    grid-template-columns: 1fr;
  }
}
</style>