<template>
  <a-drawer
    :visible="visible"
    title="上传媒体素材消耗数据"
    :width="960"
    :footer="false"
    unmount-on-close
    @update:visible="emit('update:visible', $event)"
    @cancel="emit('update:visible', false)"
  >
    <div class="upload-drawer">
      <!-- ① 选择媒体 -->
      <div class="step-block">
        <div class="step-header">
          <span class="step-index">①</span>
          <span class="step-title">选择媒体平台</span>
        </div>
        <div class="step-body">
          <a-select
            v-model="uploadForm.platform"
            placeholder="请选择媒体平台"
            style="width: 220px;"
            @change="handlePlatformChange"
          >
            <a-option v-for="p in MEDIA_PLATFORM_LIST" :key="p.code" :value="p.code">
              <span class="platform-option">
                <span class="platform-dot" :style="{ background: p.color }"></span>
                {{ p.name }}
              </span>
            </a-option>
          </a-select>
          <span v-if="uploadForm.platform" class="platform-hint">
            {{ platformMeta(uploadForm.platform).exportHint }}
          </span>
        </div>
      </div>

      <!-- ② 上传文件 -->
      <div class="step-block">
        <div class="step-header">
          <span class="step-index">②</span>
          <span class="step-title">上传报表文件</span>
        </div>
        <div class="step-body">
          <div
            class="upload-zone"
            :class="{ 'drag-over': isDragging, 'has-file': !!uploadFile }"
            @click="triggerFileInput"
            @dragenter.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept=".csv,.txt,.xlsx,.xlsm"
              style="display: none;"
              @change="handleFileChange"
            />
            <template v-if="uploadFile">
              <icon-file class="zone-icon" />
              <div class="zone-file">{{ uploadFile.name }}</div>
              <div class="zone-meta">{{ formatSize(uploadFile.size) }}</div>
              <a-button size="small" @click.stop="triggerFileInput">重新选择</a-button>
            </template>
            <template v-else>
              <icon-upload class="zone-icon" />
              <div class="zone-tip">将文件拖到此处,或点击选择文件</div>
              <div class="zone-meta">支持 .csv / .txt / .xlsx(单文件不超过 10MB)</div>
            </template>
          </div>
        </div>
      </div>

      <!-- ③ 字段映射 -->
      <div class="step-block" v-if="grid.headers.length">
        <div class="step-header">
          <span class="step-index">③</span>
          <span class="step-title">字段映射</span>
          <span class="step-sub">已自动匹配,可手工调整</span>
        </div>
        <div class="step-body">
          <div class="mapping-grid">
            <div v-for="field in MEDIA_COST_FIELDS" :key="field.key" class="mapping-item">
              <div class="mapping-label">
                <span v-if="field.required" class="required">*</span>
                {{ field.label }}
                <a-tooltip :content="field.hint" background-color="#1D2129">
                  <icon-question-circle class="hint-icon" />
                </a-tooltip>
              </div>
              <a-select
                v-model="mapping[field.key]"
                placeholder="未映射"
                allow-clear
                show-search
                size="small"
                style="width: 100%;"
              >
                <a-option v-for="h in grid.headers" :key="h" :value="h">{{ h || '(空列)' }}</a-option>
              </a-select>
            </div>
          </div>
        </div>
      </div>

      <!-- ④ 数据预览 -->
      <div class="step-block" v-if="grid.headers.length">
        <div class="step-header">
          <span class="step-index">④</span>
          <span class="step-title">数据预览</span>
          <span class="step-sub">
            有效 {{ parsed.valid.length }} 行
            <template v-if="parsed.invalidCount">
              ,跳过 {{ parsed.invalidCount }} 行(日期或素材 ID 缺失)
            </template>
          </span>
        </div>
        <div class="step-body">
          <a-table
            :data="previewRows"
            :pagination="false"
            :scroll="{ x: 1200 }"
            size="small"
            row-key="__rowKey"
          >
            <template #columns>
              <a-table-column title="日期" data-index="date" :width="110" />
              <a-table-column title="素材 ID" data-index="materialId" :width="150" />
              <a-table-column title="素材名称" data-index="materialName" :width="160" />
              <a-table-column title="投放账号" data-index="accountName" :width="160" />
              <a-table-column title="消耗(元)" data-index="cost" :width="110" align="right" />
              <a-table-column title="曝光量" data-index="impressions" :width="100" align="right" />
              <a-table-column title="点击量" data-index="clicks" :width="100" align="right" />
              <a-table-column title="播放量" data-index="plays" :width="100" align="right" />
              <a-table-column title="互动量" data-index="engagements" :width="100" align="right" />
              <a-table-column title="转化量" data-index="conversions" :width="100" align="right" />
            </template>
          </a-table>
        </div>
      </div>

      <div class="drawer-footer">
        <a-button @click="handleDownloadTemplate">
          <template #icon><icon-download /></template>
          下载导入模板
        </a-button>
        <div class="footer-right">
          <a-button @click="emit('update:visible', false)">取消</a-button>
          <a-button type="primary" :loading="importing" @click="handleImport">
            确认导入
          </a-button>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDownload, IconFile, IconQuestionCircle, IconUpload } from '@arco-design/web-vue/es/icon'
import { useMediaCostStore } from '@/stores/media-cost'
import {
  MEDIA_COST_FIELDS,
  MEDIA_PLATFORM_LIST,
  MEDIA_PLATFORM_MAP,
  type MediaCostField,
  type MediaPlatform,
} from '@/types/media-cost'
import { downloadCsv } from '@/utils/csv'
import {
  buildCsvTemplate,
  detectColumnMapping,
  parseDate,
  parseFile,
  parseNumeric,
  type ParsedGrid,
} from '@/utils/file-parser'

const props = defineProps<{
  /** 抽屉是否可见 */
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  /** 导入完成:回传媒体平台与入库行数 */
  (e: 'imported', payload: { platform: MediaPlatform; count: number }): void
}>()

const store = useMediaCostStore()

const uploadForm = reactive({
  platform: undefined as MediaPlatform | undefined,
})
const uploadFile = ref<File | null>(null)
const grid = ref<ParsedGrid>({ headers: [], rows: [] })
const mapping = ref<Partial<Record<MediaCostField, string>>>({})
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importing = ref(false)

/** 每次打开抽屉都重置上传状态 */
watch(
  () => props.visible,
  (visible) => {
    if (visible) resetUpload()
  },
)

function platformMeta(code: MediaPlatform) {
  return MEDIA_PLATFORM_MAP[code]
}

function resetUpload() {
  uploadForm.platform = undefined
  uploadFile.value = null
  grid.value = { headers: [], rows: [] }
  mapping.value = {}
  isDragging.value = false
}

function handlePlatformChange() {
  // 切换媒体后重新匹配一次(不同平台的表头命名差异较大)
  if (grid.value.headers.length) {
    mapping.value = detectColumnMapping(grid.value.headers)
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) handleFile(file)
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

async function handleFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    Message.error('文件大小不能超过 10MB')
    return
  }
  const ext = file.name.toLowerCase()
  if (!/\.(csv|txt|xlsx|xlsm)$/.test(ext)) {
    Message.error('仅支持 .csv / .txt / .xlsx 格式的文件')
    return
  }
  try {
    const parsed = await parseFile(file)
    if (!parsed.headers.length || !parsed.rows.length) {
      Message.error('文件解析成功但没有数据行')
      return
    }
    uploadFile.value = file
    grid.value = parsed
    mapping.value = detectColumnMapping(parsed.headers)
    Message.success(`已解析 ${parsed.rows.length} 行数据`)
  } catch (err) {
    grid.value = { headers: [], rows: [] }
    mapping.value = {}
    uploadFile.value = null
    Message.error(`文件解析失败:${(err as Error).message || '未知错误'}`)
  }
}

/** 字段 → 源列索引 */
const columnIndexMap = computed(() => {
  const map: Partial<Record<MediaCostField, number>> = {}
  for (const key of Object.keys(mapping.value) as MediaCostField[]) {
    const header = mapping.value[key]
    if (!header) continue
    const idx = grid.value.headers.indexOf(header)
    if (idx >= 0) map[key] = idx
  }
  return map
})

/** 按映射归一化后的记录 */
const parsed = computed(() => {
  const idx = columnIndexMap.value
  const valid: Array<{
    date: string
    materialId: string
    materialName: string
    accountName: string
    cost: number
    impressions: number
    clicks: number
    plays: number
    engagements: number
    conversions: number
  }> = []
  let invalidCount = 0

  for (const row of grid.value.rows) {
    const date = idx.date !== undefined ? parseDate(row[idx.date]) : ''
    const materialId = idx.materialId !== undefined ? String(row[idx.materialId] ?? '').trim() : ''
    if (!date || !materialId) {
      invalidCount++
      continue
    }
    valid.push({
      date,
      materialId,
      materialName:
        idx.materialName !== undefined ? String(row[idx.materialName] ?? '').trim() : materialId,
      accountName: idx.accountName !== undefined ? String(row[idx.accountName] ?? '').trim() : '',
      cost: idx.cost !== undefined ? parseNumeric(row[idx.cost]) : 0,
      impressions: idx.impressions !== undefined ? parseNumeric(row[idx.impressions]) : 0,
      clicks: idx.clicks !== undefined ? parseNumeric(row[idx.clicks]) : 0,
      plays: idx.plays !== undefined ? parseNumeric(row[idx.plays]) : 0,
      engagements: idx.engagements !== undefined ? parseNumeric(row[idx.engagements]) : 0,
      conversions: idx.conversions !== undefined ? parseNumeric(row[idx.conversions]) : 0,
    })
  }
  return { valid, invalidCount }
})

/** 预览前 5 行 */
const previewRows = computed(() =>
  parsed.value.valid.slice(0, 5).map((r, i) => ({ ...r, __rowKey: `preview-${i}` })),
)

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function handleDownloadTemplate() {
  downloadCsv('媒体消耗报表-导入模板.csv', buildCsvTemplate())
}

async function handleImport() {
  const platform = uploadForm.platform
  if (!platform) {
    Message.warning('请先选择媒体平台')
    return
  }
  const file = uploadFile.value
  if (!file) {
    Message.warning('请先选择要导入的文件')
    return
  }
  const missing = MEDIA_COST_FIELDS.filter((f) => f.required && !mapping.value[f.key])
  if (missing.length) {
    Message.warning(`请为「${missing.map((f) => f.label).join('、')}」指定来源列`)
    return
  }
  if (!parsed.value.valid.length) {
    Message.warning('没有可导入的有效数据行')
    return
  }

  importing.value = true
  try {
    // TODO: 联调后替换为 api/media-cost.ts 的 importMediaCost
    await new Promise((r) => setTimeout(r, 400))
    store.importRecords(
      {
        platform,
        fileName: file.name,
        fileSize: file.size,
        records: parsed.value.valid,
      },
      file,
    )
    Message.success(`成功导入 ${parsed.value.valid.length} 条${platformMeta(platform).name}消耗数据`)
    emit('update:visible', false)
    resetUpload()
    emit('imported', { platform, count: parsed.value.valid.length })
  } finally {
    importing.value = false
  }
}
</script>

<style scoped lang="scss">
.upload-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .step-block {
    .step-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .step-index {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-primary-6);
        color: #fff;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .step-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-1);
      }

      .step-sub {
        font-size: 12px;
        color: var(--color-text-4);
      }
    }

    .step-body {
      padding-left: 28px;
    }
  }

  .platform-option {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .platform-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .platform-hint {
    margin-left: 12px;
    font-size: 12px;
    color: var(--color-text-3);
  }

  .upload-zone {
    border: 2px dashed var(--color-neutral-4);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    background: var(--color-fill-1);
    transition: all 0.2s;
    cursor: pointer;

    &:hover,
    &.drag-over {
      border-color: var(--color-primary-6);
      background: var(--color-primary-1);
    }

    &.has-file {
      cursor: default;
    }

    .zone-icon {
      font-size: 36px;
      color: #8c9bab;
      margin-bottom: 8px;
    }

    .zone-tip {
      font-size: 14px;
      color: var(--color-text-2);
      margin-bottom: 4px;
    }

    .zone-meta {
      font-size: 12px;
      color: var(--color-text-4);
      margin-bottom: 10px;
    }

    .zone-file {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
      word-break: break-all;
      margin-bottom: 4px;
    }
  }

  .mapping-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px 16px;

    .mapping-item {
      .mapping-label {
        font-size: 13px;
        color: var(--color-text-2);
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 4px;

        .required {
          color: #f53f3f;
          font-weight: 600;
        }

        .hint-icon {
          font-size: 13px;
          color: var(--color-text-4);
          cursor: help;
        }
      }
    }
  }

  .drawer-footer {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0 0;
    border-top: 1px solid var(--color-neutral-3);
    background: #fff;

    .footer-right {
      display: flex;
      gap: 8px;
    }
  }
}

@media (max-width: 900px) {
  .upload-drawer .mapping-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
