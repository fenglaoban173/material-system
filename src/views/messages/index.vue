<template>
  <div class="messages-page">
    <div class="page-card">
      <div class="page-header">
        <h2 class="page-title">站内信</h2>
        <div class="page-actions">
          <a-button @click="markAllRead">全部已读</a-button>
        </div>
      </div>

      <a-table
        :data="messageList"
        :pagination="{
          total: messageList.length,
          current: page,
          pageSize: 10,
          showTotal: true,
          showJumper: true,
          showPageSize: true,
          pageSizeOptions: [10, 20, 50],
        }"
        row-key="id"
        :row-class-name="(record: MessageItem) => (record.read ? '' : 'unread-row')"
        @page-change="(p) => (page = p)"
      >
        <template #columns>
          <a-table-column title="标题" data-index="title">
            <template #cell="{ record }">
              <div class="title-cell">
                <span v-if="!record.read" class="unread-dot" />
                <a-link @click="goToTarget(record)">{{ record.title }}</a-link>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="消息类型" :width="160">
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ record.typeLabel }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="发布时间" data-index="time" :width="200" />
        </template>
        <template #empty>
          <a-empty description="暂无消息" />
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'

interface MessageItem {
  id: number
  title: string
  content: string
  time: string
  read: boolean
  type: 'audit' | 'demand' | 'push' | 'system'
  typeLabel: string
  /** 详情跳转目标路由 */
  target: string
  /** 跳转时附加 query / params（可选） */
  query?: Record<string, string>
}

const router = useRouter()
const page = ref(1)

const messageList = ref<MessageItem[]>([
  {
    id: 1,
    title: '您交付的需求存在素材被拒审',
    content: '需求「618大促活动宣传」下有素材被审核不通过',
    time: '2026-07-28 15:19:52',
    read: false,
    type: 'audit',
    typeLabel: '素材审核',
    target: '/material-lib/audit',
  },
  {
    id: 2,
    title: '您交付的需求存在素材被拒审',
    content: '需求「618大促活动宣传」下有素材被审核不通过',
    time: '2026-07-28 15:03:06',
    read: false,
    type: 'audit',
    typeLabel: '素材审核',
    target: '/material-lib/audit',
  },
  {
    id: 3,
    title: '收到新的需求',
    content: '您收到一份新的视频需求：抖音短视频预热',
    time: '2026-07-28 14:41:37',
    read: false,
    type: 'demand',
    typeLabel: '需求管理',
    target: '/material-demand/requirement',
  },
  {
    id: 4,
    title: '收到新的需求',
    content: '您收到一份新的视频需求：双十一预热短视频',
    time: '2026-07-28 14:35:03',
    read: true,
    type: 'demand',
    typeLabel: '需求管理',
    target: '/material-demand/requirement',
  },
  {
    id: 5,
    title: '您上传的 5 个视频素材已处理完成',
    content: '素材上传任务已完成，共 5 个视频素材成功入库',
    time: '2026-07-28 10:30:00',
    read: true,
    type: 'push',
    typeLabel: '素材上传',
    target: '/material/upload',
  },
  {
    id: 6,
    title: '素材清理任务完成',
    content: '素材清理任务已完成，共清理 23 个过期素材',
    time: '2026-07-28 09:30:00',
    read: true,
    type: 'system',
    typeLabel: '系统通知',
    target: '/dashboard',
  },
])

const markAllRead = () => {
  messageList.value.forEach((m) => (m.read = true))
  Message.success('已全部标记为已读')
}

const goToTarget = (record: MessageItem) => {
  record.read = true
  router.push({ path: record.target, query: record.query })
}
</script>

<style scoped lang="scss">
.messages-page {
  padding: 16px;
  min-height: calc(100vh - 64px);
  background: #f7f8fa;
}

.page-card {
  background: #ffffff;
  border-radius: 4px;
  padding: 16px 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #165dff;
  flex-shrink: 0;
}

:deep(.unread-row) {
  background: rgba(22, 93, 255, 0.04);
}
</style>
