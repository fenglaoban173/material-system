<template>
  <div class="notification-panel">
    <div class="panel-header">
      <span class="title">通知消息</span>
      <a-link @click="markAllRead">全部已读</a-link>
    </div>
    <a-divider style="margin: 0" />
    <div class="panel-body">
      <a-list :bordered="false">
        <a-list-item
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ unread: !item.read }"
        >
          <a-list-item-meta
            :title="item.title"
            :description="item.content + ' · ' + item.time"
          />
          <template #actions>
            <a-link @click="goToTarget(item)">详情</a-link>
          </template>
        </a-list-item>
      </a-list>
    </div>
    <a-divider style="margin: 0" />
    <div class="panel-footer">
      <a-link @click="viewAll">查看全部</a-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface Notification {
  id: number
  title: string
  content: string
  time: string
  read: boolean
  /** 详情跳转目标路由 */
  target: string
}

const router = useRouter()

const notifications = ref<Notification[]>([
  {
    id: 1,
    title: '您交付的需求存在素材被拒审',
    content: '需求「618大促活动宣传」下有素材被审核不通过',
    time: '2026-07-28 15:19:52',
    read: false,
    target: '/material-lib/audit',
  },
  {
    id: 2,
    title: '您交付的需求存在素材被拒审',
    content: '需求「618大促活动宣传」下有素材被审核不通过',
    time: '2026-07-28 15:03:06',
    read: false,
    target: '/material-lib/audit',
  },
  {
    id: 3,
    title: '收到新的需求',
    content: '您收到一份新的视频需求：双十一预热短视频',
    time: '2026-07-28 14:35:03',
    read: false,
    target: '/material-demand/requirement',
  },
])

const markAllRead = () => {
  notifications.value.forEach((item) => (item.read = true))
}

const goToTarget = (item: Notification) => {
  item.read = true
  // 关闭外层 popover（如果有引用）
  ;(window as any).dispatchEvent(new CustomEvent('notification-go', { detail: item }))
  router.push(item.target)
}

const viewAll = () => {
  // 在新窗口打开消息中心列表
  window.open('/messages', '_blank', 'noopener,noreferrer')
}

// 暴露 notifications 给父组件（用于未读数实时同步）
defineExpose({ notifications })
</script>

<style scoped lang="scss">
.notification-panel {
  width: 360px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;

    .title {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .panel-body {
    max-height: 320px;
    overflow-y: auto;

    .notification-item {
      padding: 12px 20px;
      transition: background 0.2s;

      &.unread {
        background: rgba(var(--color-primary-6), 0.05);
      }

      :deep(.arco-list-item-meta-title) {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
    }
  }

  .panel-footer {
    padding: 12px 20px;
    text-align: center;
  }
}
</style>
