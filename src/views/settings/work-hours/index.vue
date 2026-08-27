<template>
  <div class="work-hours-page">
    <div class="page-header">
      <h2 class="page-title">工时设置</h2>
      <p class="page-desc">为不同素材类型 × 版式配置标准工时，作为排期与产能评估的依据</p>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <span class="filter-label">素材类型</span>
      <a-select
        v-model="filters.materialType"
        placeholder="请选择素材类型"
        style="width: 240px;"
        allow-clear
        show-search
      >
        <a-option
          v-for="opt in FLATTEN_MATERIAL_TYPE_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </a-option>
      </a-select>
    </div>

    <!-- 数据区 -->
    <div class="data-section">
      <div class="section-toolbar">
        <div class="toolbar-left">
          <span class="section-title">工时配置列表</span>
          <a-tag color="arcoblue" size="small">共 {{ tableData.length }} 条</a-tag>
        </div>
        <div class="toolbar-right">
          <a-button @click="handleRefresh">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
          <a-button type="primary" @click="openAddModal">
            <template #icon><icon-plus /></template>
            新增工时
          </a-button>
        </div>
      </div>

      <a-table
        :data="tableData"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #columns>
          <a-table-column title="素材类型" :width="280">
            <template #cell="{ record }">
              <a-tag :color="getTypePathColor(record.typePath)" size="small" effect="plain">
                {{ formatTypePath(record.typePath) }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="素材版式" data-index="format" :width="140">
            <template #cell="{ record }">
              <span class="format-text">{{ record.format }}</span>
            </template>
          </a-table-column>
          <a-table-column title="标准工时" :width="140">
            <template #cell="{ record }">
              <span class="hours-value">{{ record.hours }}</span>
              <span class="hours-unit">小时 / 件</span>
            </template>
          </a-table-column>
          <a-table-column title="备注" data-index="remark">
            <template #cell="{ record }">
              <span v-if="record.remark" class="remark-text">{{ record.remark }}</span>
              <span v-else class="muted">-</span>
            </template>
          </a-table-column>
          <a-table-column title="状态" :width="90" align="center">
            <template #cell="{ record }">
              <a-switch
                :model-value="record.enabled"
                @update:model-value="(val: string | number | boolean) => handleToggleEnabled(record, Boolean(val))"
              />
            </template>
          </a-table-column>
          <a-table-column title="创建人" data-index="creator" :width="100" />
          <a-table-column title="创建时间" data-index="createTime" :width="170" />
          <a-table-column title="操作" :width="140" align="center">
            <template #cell="{ record }">
              <div style="display: flex; gap: 4px; justify-content: center;">
                <a-button
                  type="text"
                  size="small"
                  :disabled="record.enabled"
                  :title="record.enabled ? '启用状态下不可编辑,请先停用' : ''"
                  @click="openEditModal(record)"
                >
                  <span :style="{ color: record.enabled ? '#C9CDD4' : '#165DFF' }">编辑</span>
                </a-button>
                <a-button type="text" size="small" @click="handleDelete(record)">
                  <span style="color:#F53F3F">删除</span>
                </a-button>
              </div>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑工时' : '新增工时'"
      :width="760"
      :ok-text="isEdit ? '保存' : '确定'"
      :ok-button-props="{ disabled: !formValid }"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="submitting"
      unmount-on-close
    >
      <a-form ref="formRef" :model="form" layout="vertical">
        <!-- 素材清单: 与「素材需求-新建需求」中的素材清单版式格式交互保持一致 -->
        <a-form-item label="素材清单">
          <a-table
            :data="materialItems"
            :pagination="false"
            :bordered="{ cell: true }"
            row-key="__idx"
            class="material-items-table"
          >
            <template #columns>
              <a-table-column title="素材类型" :width="220">
                <template #cell="{ rowIndex }">
                  <a-tooltip
                    :content="getFieldError(rowIndex) === 'typePath' ? FIELD_ERROR_MSG.typePath : ''"
                    :disabled="getFieldError(rowIndex) !== 'typePath'"
                  >
                    <a-cascader
                      v-model="materialItems[rowIndex].typePath"
                      :options="MATERIAL_TYPE_OPTIONS"
                      placeholder="请选择"
                      allow-clear
                      path-mode
                      :class="{ 'is-error': getFieldError(rowIndex) === 'typePath' }"
                      @change="handleTypePathChange(rowIndex)"
                    />
                  </a-tooltip>
                </template>
              </a-table-column>
              <a-table-column title="素材版式" :width="150">
                <template #cell="{ rowIndex }">
                  <a-tooltip
                    :content="getFieldError(rowIndex) === 'format' ? FIELD_ERROR_MSG.format : ''"
                    :disabled="getFieldError(rowIndex) !== 'format'"
                  >
                    <a-select
                      v-model="materialItems[rowIndex].format"
                      placeholder="请选择"
                      allow-clear
                      :disabled="!materialItems[rowIndex].typePath?.length"
                      :class="{ 'is-error': getFieldError(rowIndex) === 'format' }"
                    >
                      <a-option
                        v-for="opt in getFormatOptions(materialItems[rowIndex].typePath || [])"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </a-option>
                    </a-select>
                  </a-tooltip>
                </template>
              </a-table-column>
              <a-table-column title="工时(小时/件)" :width="130">
                <template #cell="{ rowIndex }">
                  <a-tooltip
                    :content="getFieldError(rowIndex) === 'hours' ? FIELD_ERROR_MSG.hours : ''"
                    :disabled="getFieldError(rowIndex) !== 'hours'"
                  >
                    <a-input-number
                      v-model="materialItems[rowIndex].hours"
                      :min="0"
                      :step="0.5"
                      :precision="2"
                      placeholder="工时"
                      :class="{ 'is-error': getFieldError(rowIndex) === 'hours' }"
                      style="width: 100%;"
                    />
                  </a-tooltip>
                </template>
              </a-table-column>
              <a-table-column title="备注" :width="160">
                <template #cell="{ rowIndex }">
                  <a-input
                    v-model="materialItems[rowIndex].remark"
                    placeholder="可选"
                    :max-length="100"
                    allow-clear
                  />
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="60">
                <template #cell="{ rowIndex }">
                  <a-button
                    type="text"
                    size="small"
                    :disabled="materialItems.length <= 1"
                    @click="handleRemoveItem(rowIndex)"
                  >
                    <template #icon><icon-delete /></template>
                  </a-button>
                </template>
              </a-table-column>
            </template>
            <template #footer>
              <div class="material-items-footer">
                <a-button type="dashed" size="small" @click="handleAddItem">
                  <template #icon><icon-plus /></template>
                  添加素材组合
                </a-button>
              </div>
            </template>
          </a-table>
        </a-form-item>

        <a-form-item label="启用">
          <a-switch v-model="form.enabled" />
          <span style="margin-left: 12px; color: var(--color-text-3); font-size: 12px;">
            关闭后该工时配置将不参与排期计算
          </span>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconRefresh,
  IconPlus,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import {
  MATERIAL_TYPE_OPTIONS,
  FLATTEN_MATERIAL_TYPE_OPTIONS,
  getFormatOptions,
  formatTypePath,
  getTypePathColor,
  type WorkHoursSetting,
  type WorkHoursFormData,
} from '@/types/settings'
import {
  getWorkHoursList,
  createWorkHours,
  updateWorkHours,
  deleteWorkHours,
  toggleWorkHoursEnabled,
} from '@/api/settings'

// 筛选
const filters = reactive({
  materialType: '',
})

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<WorkHoursSetting[]>([])

const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref()

// 表单级别字段(启用状态共享)
const defaultForm = (): WorkHoursFormData => ({
  typePath: [],
  format: '',
  hours: 1,
  remark: '',
  enabled: true,
})

const form = reactive<WorkHoursFormData>(defaultForm())

// 素材清单条目(行), 与「素材需求-新建需求-素材清单」一致: typePath + format + hours + remark
interface MaterialItem {
  __idx: number
  typePath: string[]
  format: string
  hours?: number
  remark?: string
}

const materialItems = ref<MaterialItem[]>([])

const FIELD_ERROR_MSG = {
  typePath: '请选择素材类型',
  format: '请选择版式',
  hours: '请输入工时',
}

const getFieldError = (rowIndex: number): 'typePath' | 'format' | 'hours' | null => {
  const item = materialItems.value[rowIndex]
  if (!item) return null
  if (!item.typePath || item.typePath.length === 0) return 'typePath'
  if (!item.format) return 'format'
  if (item.hours === undefined || item.hours === null) return 'hours'
  return null
}

const isItemsValid = computed(() => materialItems.value.every((_, idx) => getFieldError(idx) === null))

const formValid = computed(() => isItemsValid.value)

// 增删素材组合
const handleAddItem = () => {
  materialItems.value.push({
    __idx: Date.now() + materialItems.value.length,
    typePath: [],
    format: '',
    hours: 1,
    remark: '',
  })
}

const handleRemoveItem = (rowIndex: number) => {
  if (materialItems.value.length <= 1) return
  materialItems.value.splice(rowIndex, 1)
}

// 级联变化: 清空版式
const handleTypePathChange = (rowIndex: number) => {
  if (materialItems.value[rowIndex]) {
    materialItems.value[rowIndex].format = ''
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getWorkHoursList({
      materialType: filters.materialType || undefined,
    })
    tableData.value = res.data.list
  } finally {
    loading.value = false
  }
}

// 筛选条件变化时自动刷新列表
watch(
  () => filters.materialType,
  () => {
    fetchList()
  }
)

const handleRefresh = () => {
  fetchList()
}

const openAddModal = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, { enabled: true })
  materialItems.value = [{ __idx: Date.now(), typePath: [], format: '', hours: 1, remark: '' }]
  modalVisible.value = true
}

const openEditModal = (record: WorkHoursSetting) => {
  isEdit.value = true
  editingId.value = record.id
  Object.assign(form, { enabled: record.enabled })
  materialItems.value = [
    {
      __idx: Date.now(),
      typePath: [...record.typePath],
      format: record.format,
      hours: record.hours,
      remark: record.remark || '',
    },
  ]
  modalVisible.value = true
}

const handleCancel = () => {
  modalVisible.value = false
}

const handleSubmit = async () => {
  // 校验每行素材清单(包含 hours)
  const firstErrorIdx = materialItems.value.findIndex((_, idx) => getFieldError(idx) !== null)
  if (firstErrorIdx >= 0) {
    const field = getFieldError(firstErrorIdx)
    const msg = field ? FIELD_ERROR_MSG[field] : '请补全必填项'
    Message.warning(`第 ${firstErrorIdx + 1} 行: ${msg}`)
    return
  }

  submitting.value = true
  try {
    if (isEdit.value && editingId.value !== null) {
      // 编辑模式: 仅取第一行, 更新到原 id
      const row = materialItems.value[0]
      await updateWorkHours({
        id: editingId.value,
        typePath: [...row.typePath],
        format: row.format,
        hours: row.hours ?? 0,
        remark: row.remark || '',
        enabled: form.enabled,
      })
      Message.success('工时已更新')
    } else {
      // 新增模式: 每行创建一条记录
      for (const row of materialItems.value) {
        await createWorkHours({
          typePath: [...row.typePath],
          format: row.format,
          hours: row.hours ?? 0,
          remark: row.remark || '',
          enabled: form.enabled,
        })
      }
      Message.success(
        materialItems.value.length > 1
          ? `已新增 ${materialItems.value.length} 条工时配置`
          : '工时已新增'
      )
    }
    modalVisible.value = false
    fetchList()
  } catch (err) {
    Message.error((err as Error).message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = (record: WorkHoursSetting) => {
  Modal.confirm({
    title: '删除工时',
    content: `确定删除「${formatTypePath(record.typePath)} · ${record.format}」工时配置吗？`,
    okText: '确定删除',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      try {
        await deleteWorkHours(record.id)
        Message.success('已删除')
        fetchList()
      } catch (err) {
        Message.error((err as Error).message || '删除失败')
      }
    },
  })
}

const handleToggleEnabled = async (record: WorkHoursSetting, val: boolean) => {
  // 乐观更新: 立即翻转本地状态, 让开关响应迅速
  const prev = record.enabled
  record.enabled = val
  try {
    await toggleWorkHoursEnabled(record.id, val)
    Message.success(val ? '已启用' : '已停用')
  } catch (err) {
    // 失败回滚
    record.enabled = prev
    Message.error((err as Error).message || '操作失败')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.work-hours-page {
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
      font-size: 13px;
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
        gap: 8px;
      }
    }
  }

  .format-text {
    color: var(--color-text-1);
    font-weight: 500;
  }

  .hours-value {
    font-weight: 600;
    color: var(--color-primary-6);
    font-family: Monaco, Consolas, monospace;
    margin-right: 4px;
  }

  .hours-unit {
    color: var(--color-text-3);
    font-size: 12px;
  }

  .remark-text {
    color: var(--color-text-2);
    font-size: 13px;
  }

  .muted {
    color: var(--color-text-4);
  }
}

// 素材清单表格样式: 与「素材需求-新建需求-素材清单」保持一致
.material-items-table {
  width: 100%;

  // 单元格级错误样式(红框)
  :deep(.is-error) {
    .arco-input,
    .arco-input-wrapper,
    .arco-select-view,
    .arco-cascader {
      border-color: #f5222d !important;
      box-shadow: 0 0 0 1px #f5222d inset;
    }
  }
}

.material-items-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  flex-wrap: wrap;
  gap: 8px;
}
</style>