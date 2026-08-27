<template>
  <div class="pretest-page">
    <div class="page-header"></div>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">任务ID</span>
          <a-input v-model="filterTaskId" placeholder="请输入任务ID" style="width: 140px;" />
        </div>
        <div class="filter-item">
          <span class="filter-label">任务名称</span>
          <a-input-search
            v-model="searchKeyword"
            placeholder="请输入任务名称"
            style="width: 160px;"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">任务状态</span>
          <a-select v-model="filterStatus" placeholder="全部" style="width: 100px;">
            <a-option value="">全部</a-option>
            <a-option value="running">执行中</a-option>
            <a-option value="completed">执行成功</a-option>
            <a-option value="failed">执行失败</a-option>
          </a-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">素材ID</span>
          <a-input v-model="filterMaterialId" placeholder="请输入素材ID" style="width: 120px;" />
        </div>
        <div class="filter-item">
          <span class="filter-label">投放平台</span>
          <a-select v-model="filterPlatform" placeholder="全部" style="width: 100px;">
            <a-option value="">全部</a-option>
            <a-option value="AD">AD</a-option>
            <a-option value="QC">千川</a-option>
            <a-option value="LOCAL">本地推</a-option>
          </a-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">创建时间</span>
          <a-range-picker v-model="dateRange" style="width: 240px;" />
        </div>
        <div class="filter-actions">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label">前测标签：</span>
        <a-radio-group v-model="filterPretestTag" type="button" size="small">
          <a-radio value="">全部</a-radio>
          <a-radio value="AD_HIGH">AD优质</a-radio>
          <a-radio value="AD_LOW">AD非优质</a-radio>
          <a-radio value="LOCAL_HIGH">本地推优质</a-radio>
          <a-radio value="LOCAL_LOW">本地推非优质</a-radio>
          <a-radio value="QC_HIGH">千川优质</a-radio>
          <a-radio value="QC_LOW">千川非优质</a-radio>
          <a-radio value="FIRST">首发</a-radio>
          <a-radio value="NOT_FIRST">非首发</a-radio>
          <a-radio value="NONE">无检测结果</a-radio>
        </a-radio-group>
      </div>
    </div>

    <div class="data-section">
      <div class="section-toolbar">
        <a-dropdown trigger="click" @select="handleBatchAction">
          <a-button type="primary" :disabled="selectedRows.length === 0">
            批量操作 <icon-down />
          </a-button>
          <template #content>
            <a-doption value="delete">删除素材</a-doption>
            <a-doption value="retest">重新检测</a-doption>
          </template>
        </a-dropdown>
      </div>
      <a-table
        :columns="columns"
        :data="tableData"
        :pagination="{ total: total, current: currentPage, pageSize: pageSize, showPageSize: true, pageSizeOptions: [10, 20, 50, 100] }"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        @selection-change="handleSelectionChange"
        row-key="id"
      >
        <template #status="{ record }">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template #action="{ record }">
          <div style="display: flex; gap: 8px;">
            <a-button type="text" size="small" @click="handleReTest(record)">重新检测</a-button>
            <a-button type="text" size="small" @click="handleDelete(record)"><span style="color:#F53F3F">删除</span></a-button>
          </div>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'

const searchKeyword = ref('')
const filterStatus = ref('')
const filterTaskId = ref('')
const filterMaterialId = ref('')
const filterPlatform = ref('')
const filterPretestTag = ref('')
const dateRange = ref<[string, string] | undefined>(undefined)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const columns = [
  { title: '任务ID', dataIndex: 'id', width: 100 },
  { title: '任务名称', dataIndex: 'name', width: 180 },
  { title: '需求ID', dataIndex: 'demandId', width: 120 },
  { title: '素材ID', dataIndex: 'materialId', width: 100 },
  { title: '投放平台', dataIndex: 'platform', width: 100 },
  { title: '前测标签', dataIndex: 'pretestTag', width: 120 },
  { title: '任务状态', dataIndex: 'status', width: 100, slotName: 'status' },
  { title: '非AD优质素材原因', dataIndex: 'adRejectReason', width: 160, ellipsis: true },
  { title: '非千川优质素材原因', dataIndex: 'qcRejectReason', width: 160, ellipsis: true },
  { title: '任务创建人', dataIndex: 'creator', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', dataIndex: 'action', width: 120, slotName: 'action' },
]

const tableData = ref([
  { id: 1001, name: '618大促素材测试', demandId: 'DEMAND_001', materialId: 2001, platform: '抖音', pretestTag: 'AD优质', status: 'running', adRejectReason: '', qcRejectReason: '', creator: '张三', createTime: '2024-06-01 10:00' },
  { id: 1002, name: '夏季新品素材测试', demandId: 'DEMAND_002', materialId: 2002, platform: '小红书', pretestTag: '千川优质', status: 'completed', adRejectReason: '', qcRejectReason: '', creator: '李四', createTime: '2024-05-28 14:30' },
  { id: 1003, name: '品牌升级素材测试', demandId: 'DEMAND_003', materialId: 2003, platform: '快手', pretestTag: 'AD非优质', status: 'running', adRejectReason: '画面模糊', qcRejectReason: '音频质量差', creator: '王五', createTime: '2024-05-25 09:15' },
  { id: 1004, name: '新品发布素材测试', demandId: 'DEMAND_004', materialId: 2004, platform: '微博', pretestTag: '首发', status: 'running', adRejectReason: '', qcRejectReason: '', creator: '赵六', createTime: '2024-05-20 11:00' },
  { id: 1005, name: '端午节活动测试', demandId: 'DEMAND_005', materialId: 2005, platform: '抖音', pretestTag: '千川非优质', status: 'failed', adRejectReason: '涉及敏感词', qcRejectReason: '涉及敏感词', creator: '孙七', createTime: '2024-05-18 16:45' },
])

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    running: 'blue',
    completed: 'green',
    failed: 'red',
  }
  return colors[status] || 'gray'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    running: '执行中',
    completed: '执行成功',
    failed: '执行失败',
  }
  return texts[status] || status
}

const handleSearch = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
}

const handleReset = () => {
  filterTaskId.value = ''
  searchKeyword.value = ''
  filterStatus.value = ''
  filterMaterialId.value = ''
  filterPlatform.value = ''
  filterPretestTag.value = ''
  dateRange.value = undefined
}

const handleReTest = (record: any) => {
  console.log('Re-test task:', record)
}

const handleDelete = (record: any) => {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除任务「${record.taskName}」吗？`,
    okText: '删除',
    cancelText: '取消',
    onOk: () => {
      Message.success('删除成功')
    },
  })
}

const selectedRows = ref<any[]>([])

const handleSelectionChange = (rowKeys: (string | number)[]) => {
  selectedRows.value = tableData.value.filter(item => rowKeys.includes(item.id))
}

const handleBatchAction = (value: any) => {
  const actionValue = String(value)
  if (selectedRows.value.length === 0) {
    Message.warning('请先勾选要操作的素材')
    return
  }
  if (actionValue === 'delete') {
    Modal.warning({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRows.value.length} 条素材吗？`,
      okText: '删除',
      cancelText: '取消',
      onOk: () => {
        Message.success('删除成功')
      },
    })
  } else if (actionValue === 'retest') {
    Modal.confirm({
      title: '确认重新检测',
      content: `确定要重新检测选中的 ${selectedRows.value.length} 条素材吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        Message.success('已开始重新检测')
      },
    })
  }
}
</script>

<style scoped lang="scss">
.pretest-page {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .header-title {
      h2 {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1D2129;
      }

      .header-desc {
        font-size: 14px;
        color: #86909C;
      }
    }
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
    padding: 16px 20px;
    background: #FFFFFF;
    border-radius: 8px;

    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .filter-label {
        font-size: 14px;
        color: #4E5969;
        white-space: nowrap;
      }
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }
  }

  .data-section {
    background: #FFFFFF;
    border-radius: 8px;
    padding: 16px 20px;
    margin-top: 16px;

    .section-toolbar {
      margin-bottom: 12px;
    }
  }
}
</style>