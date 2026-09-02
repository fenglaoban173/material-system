<template>
  <div class="push-task-page">
    <div class="page-header"></div>

    <!-- 查询条件区域 -->
    <div class="filter-card">
      <div class="filter-row">
        <span class="filter-label">需求名称</span>
        <a-input v-model="queryForm.demandName" placeholder="请输入" style="width: 160px;" />
        <span class="filter-label">任务时间</span>
        <a-range-picker v-model="queryForm.taskTime" style="width: 220px;" />
        <span class="filter-label">媒体平台</span>
        <a-select v-model="queryForm.mediaPlatform" placeholder="全部" style="width: 120px;">
          <a-option value="">全部</a-option>
          <a-option value="douyin">抖音</a-option>
          <a-option value="toutiao">今日头条</a-option>
          <a-option value="kuaishou">快手</a-option>
          <a-option value="weibo">微博</a-option>
        </a-select>
        <span class="filter-label">状态</span>
        <a-select v-model="queryForm.status" placeholder="全部" style="width: 120px;">
          <a-option value="">全部</a-option>
          <a-option value="PROCESSING">执行中</a-option>
          <a-option value="COMPLETED">已完成</a-option>
        </a-select>
        <div class="filter-actions">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </div>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-card">
      <a-table
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
      >
        <template #columns>
          <a-table-column title="任务ID" data-index="taskId" />
          <a-table-column title="需求名称" data-index="demandName" />
          <a-table-column title="需求ID" data-index="demandId" />
          <a-table-column title="任务时间" data-index="taskTime" />
          <a-table-column title="媒体平台" data-index="mediaPlatform" />
          <a-table-column title="素材量" data-index="materialCount" />
          <a-table-column title="成功数量" data-index="successCount" />
          <a-table-column title="失败数量" data-index="failedCount" />
          <a-table-column title="推送账户" data-index="pushAccount" />
          <a-table-column title="状态" data-index="status">
            <template #cell="{ record }">
              <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作人" data-index="operator" />
          <a-table-column title="操作">
            <template #cell="{ record }">
              <a-button type="text" size="small" @click="handlePushRecord()">推送记录</a-button>
              <a-button type="text" size="small" @click="handleRePush(record)">重新推送</a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 推送记录弹窗 -->
    <a-modal v-model:visible="showPushRecordDialog" title="推送记录" :width="900" :body-style="{ padding: 0 }">
      <template #footer>
        <div></div>
      </template>
      <div class="push-record-dialog">
        <div class="record-filter">
          <div class="filter-fields">
            <span class="filter-label">账户</span>
            <a-input v-model="recordQueryForm.account" placeholder="请输入" style="width: 140px;" />
            <span class="filter-label">素材</span>
            <a-input v-model="recordQueryForm.material" placeholder="请输入素材名称或ID" style="width: 180px;" />
            <span class="filter-label">状态</span>
            <a-select v-model="recordQueryForm.status" placeholder="全部" style="width: 140px;">
              <a-option value="">全部</a-option>
              <a-option value="PUSHING">推送中</a-option>
              <a-option value="SUCCESS">成功</a-option>
              <a-option value="FAILED">失败</a-option>
            </a-select>
          </div>
          <div class="filter-actions">
            <a-button type="primary" size="small" @click="handleRecordSearch">查询</a-button>
            <a-button size="small" @click="handleRecordReset">重置</a-button>
          </div>
        </div>
        <div class="record-table-wrapper">
          <a-table
            :data="recordTableData"
            :loading="recordLoading"
            :pagination="recordPagination"
            row-key="id"
            :scroll="{ y: 300 }"
          >
            <template #columns>
              <a-table-column title="素材信息" data-index="materialInfo">
                <template #cell="{ record }">
                  <div class="material-cell" @click="handlePreviewRecord(record)">
                    <video v-if="record.materialName?.endsWith('.mp4')" :src="record.thumbnail" class="material-thumb" />
                    <img v-else-if="record.thumbnail" :src="record.thumbnail" class="material-thumb" />
                    <div v-else class="material-thumb material-icon">
                      <icon-video-camera />
                    </div>
                    <div class="material-info">
                      <div class="material-account">{{ record.account }}</div>
                      <div class="material-name">{{ record.materialName }}</div>
                    </div>
                  </div>
                </template>
              </a-table-column>
              <a-table-column title="状态" data-index="status">
                <template #cell="{ record }">
                  <a-tag :color="record.status === 'SUCCESS' ? 'green' : record.status === 'PUSHING' ? 'blue' : 'red'">
                    {{ record.status === 'SUCCESS' ? '成功' : record.status === 'PUSHING' ? '推送中' : '失败' }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="说明" data-index="description" />
              <a-table-column title="完成时间" data-index="completeTime" />
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>

    <!-- 素材预览弹窗 -->
    <a-modal v-model:visible="showPreviewDialog" title="素材预览" :width="800">
      <template #footer>
        <div></div>
      </template>
      <video v-if="previewRecord?.materialName?.endsWith('.mp4')" :src="previewRecord.thumbnail" controls autoplay style="width: 100%;" />
      <img v-else :src="previewRecord?.thumbnail" alt="" style="width: 100%;" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconVideoCamera } from '@arco-design/web-vue/es/icon'

const loading = ref(false)
const queryForm = reactive({
  demandName: '',
  taskTime: [],
  mediaPlatform: '',
  status: '',
})
const tableData = ref([
  { id: 1, taskId: 'TASK001', demandName: '618活动素材需求', demandId: 'REQ618', taskTime: '2024-01-15 10:30', mediaPlatform: '抖音', materialCount: 50, successCount: 48, failedCount: 2, pushAccount: '账户A（抖音）', status: 'COMPLETED', operator: '张三' },
  { id: 2, taskId: 'TASK002', demandName: '新品上架需求', demandId: 'REQ001', taskTime: '2024-01-14 14:20', mediaPlatform: '今日头条', materialCount: 20, successCount: 20, failedCount: 0, pushAccount: '账户B（头条）', status: 'PROCESSING', operator: '李四' },
  { id: 3, taskId: 'TASK003', demandName: '端午节活动素材', demandId: 'REQDWG', taskTime: '2024-01-13 09:00', mediaPlatform: '快手', materialCount: 35, successCount: 35, failedCount: 0, pushAccount: '账户C（快手）', status: 'COMPLETED', operator: '王五' },
  { id: 4, taskId: 'TASK004', demandName: '品牌升级素材', demandId: 'REQBRAND', taskTime: '2024-01-12 16:45', mediaPlatform: '微博', materialCount: 15, successCount: 15, failedCount: 0, pushAccount: '账户D（微博）', status: 'PROCESSING', operator: '赵六' },
])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 4,
})

const handleSearch = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  const filtered = tableData.value.filter(item => {
    if (queryForm.demandName && !item.demandName.includes(queryForm.demandName)) return false
    if (queryForm.mediaPlatform && item.mediaPlatform !== queryForm.mediaPlatform) return false
    if (queryForm.status && item.status !== queryForm.status) return false
    return true
  })
  tableData.value = filtered
  pagination.total = filtered.length
  loading.value = false
}

const handleReset = () => {
  queryForm.demandName = ''
  queryForm.taskTime = []
  queryForm.mediaPlatform = ''
  queryForm.status = ''
}

const handlePushRecord = () => {
  showPushRecordDialog.value = true
}

const handleRePush = (record: any) => {
  console.log('Re push:', record)
  Message.success('重新推送任务已执行,请在推送记录中查看具体结果')
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'PROCESSING': 'blue',
    'COMPLETED': 'green',
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PROCESSING': '执行中',
    'COMPLETED': '已完成',
  }
  return texts[status] || status
}

// 推送记录弹窗相关
const showPushRecordDialog = ref(false)
const recordLoading = ref(false)
const recordQueryForm = reactive({
  account: '',
  material: '',
  status: '',
})
const recordTableData = ref([
  { id: 1, account: '账户A（抖音）', materialName: '夏季促销视频A.mp4', thumbnail: 'https://picsum.photos/40/40?random=1', status: 'SUCCESS', description: '推送成功', completeTime: '2024-01-15 10:35' },
  { id: 2, account: '账户A（抖音）', materialName: '新品上市banner.jpg', thumbnail: 'https://picsum.photos/40/40?random=2', status: 'PUSHING', description: '推送中', completeTime: '2024-01-15 10:35' },
  { id: 3, account: '账户B（头条）', materialName: '618活动视频.mp4', thumbnail: 'https://picsum.photos/40/40?random=3', status: 'FAILED', description: '账户已达素材上限', completeTime: '2024-01-15 10:36' },
  { id: 4, account: '账户B（头条）', materialName: '品牌宣传图.png', thumbnail: 'https://picsum.photos/40/40?random=4', status: 'SUCCESS', description: '推送成功', completeTime: '2024-01-15 10:36' },
  { id: 5, account: '账户C（快手）', materialName: '618预热视频.mp4', thumbnail: 'https://picsum.photos/40/40?random=5', status: 'PUSHING', description: '推送中', completeTime: '2024-01-15 10:37' },
  { id: 6, account: '账户C（快手）', materialName: '端午节素材.jpg', thumbnail: 'https://picsum.photos/40/40?random=6', status: 'FAILED', description: '素材格式不支持', completeTime: '2024-01-15 10:37' },
  { id: 7, account: '账户D（微博）', materialName: '父亲节活动.mp4', thumbnail: 'https://picsum.photos/40/40?random=7', status: 'SUCCESS', description: '推送成功', completeTime: '2024-01-15 10:38' },
  { id: 8, account: '账户D（微博）', materialName: '年中大促banner.jpg', thumbnail: 'https://picsum.photos/40/40?random=8', status: 'SUCCESS', description: '推送成功', completeTime: '2024-01-15 10:38' },
])
const recordPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 8,
})

const handleRecordSearch = async () => {
  recordLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  const filtered = recordTableData.value.filter(item => {
    if (recordQueryForm.account && !item.materialName.includes(recordQueryForm.account)) return false
    if (recordQueryForm.material && !item.materialName.includes(recordQueryForm.material)) return false
    if (recordQueryForm.status && item.status !== recordQueryForm.status) return false
    return true
  })
  recordTableData.value = filtered
  recordPagination.total = filtered.length
  recordLoading.value = false
}

const handleRecordReset = () => {
  recordQueryForm.account = ''
  recordQueryForm.material = ''
  recordQueryForm.status = ''
}

// 素材预览弹窗相关
const showPreviewDialog = ref(false)
const previewRecord = ref<any>(null)

const handlePreviewRecord = (record: any) => {
  previewRecord.value = record
  showPreviewDialog.value = true
}
</script>

<style scoped lang="scss">
.push-task-page {
  padding: 0 24px 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .filter-card {
    background: #FFFFFF;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 12px;

    .filter-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    .filter-label {
      font-size: 14px;
      color: #4E5969;
    }
  }

  .table-card {
    background: #FFFFFF;
    border-radius: 8px;
    padding: 16px 20px;
  }
}

.push-record-dialog {
  .record-filter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #E5E6EB;

    .filter-fields {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
    }

    .filter-label {
      font-size: 14px;
      color: #4E5969;
    }
  }

  .record-table-wrapper {
    max-height: 400px;
    overflow-y: auto;
  }

  .material-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .material-thumb {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      object-fit: cover;
    }

    .material-info {
      .material-account {
        font-size: 13px;
        color: #4E5969;
      }
      .material-name {
        font-size: 12px;
        color: #86909C;
      }
    }
  }
}
</style>