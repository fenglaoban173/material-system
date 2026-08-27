<template>
  <div class="video-assign-page">
    <div class="filter-section">
      <a-form class="filter-form" :model="{}" layout="inline">
        <a-form-item label="需求ID">
          <a-input v-model="filterDemandId" placeholder="请输入需求ID" style="width: 180px;" />
        </a-form-item>
        <a-form-item label="需求名称">
          <a-input v-model="filterName" placeholder="请输入需求名称" style="width: 180px;" />
        </a-form-item>
        <a-form-item label="集团名称">
          <a-input v-model="filterGroupName" placeholder="请输入集团名称" style="width: 180px;" />
        </a-form-item>
        <a-form-item label="客户名称">
          <a-input v-model="filterCustomer" placeholder="请输入" style="width: 180px;" />
        </a-form-item>
        <a-form-item label="创作者">
          <a-input v-model="filterCreator" placeholder="请输入" style="width: 180px;" />
        </a-form-item>
        <a-form-item label="素材类型">
          <a-cascader
            v-model="filterTypePath"
            :options="typeOptions"
            placeholder="全部"
            allow-clear
            style="width: 180px;"
          />
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker v-model="dateRange" style="width: 240px;" />
        </a-form-item>
        <a-form-item class="filter-actions">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>

      <div class="tab-bar">
        <div class="filter-group">
          <span class="filter-group-label">创建时间:</span>
          <a-tabs v-model:active-key="quickDateFilter" type="text">
            <a-tab-pane key="all">
              <template #title>全部</template>
            </a-tab-pane>
            <a-tab-pane key="today">
              <template #title>今日分配</template>
            </a-tab-pane>
            <a-tab-pane key="yesterday">
              <template #title>昨日分配</template>
            </a-tab-pane>
          </a-tabs>
        </div>
        <div class="filter-divider"></div>
        <div class="filter-group">
          <span class="filter-group-label">需求状态:</span>
          <a-tabs v-model:active-key="activeTab" type="text">
            <a-tab-pane v-for="tab in statusTabs" :key="tab.key">
              <template #title>
                <span>{{ tab.title }}</span>
                <span class="tab-count">({{ getStatusCount(tab.key) }})</span>
              </template>
            </a-tab-pane>
          </a-tabs>
        </div>
      </div>
    </div>

    <div class="data-section">
      <div class="card-grid">
        <div
          v-for="record in pagedCards"
          :key="`${record.id}-${record.editor}`"
          class="demand-card"
        >
          <div class="card-header">
            <h3 class="card-title">{{ record.name }}</h3>
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </div>

          <div class="card-body">
            <div class="card-meta">
              <div class="meta-row">
                <span class="meta-key">需求ID</span>
                <span class="meta-val mono">{{ record.demandId }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-key">所属集团</span>
                <span class="meta-val">{{ record.groupName }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-key">需求创建人</span>
                <span class="meta-val">{{ record.creator }}</span>
              </div>
            </div>

            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-label">素材数量</span>
                <span class="stat-value">{{ calcTotalCount(record.materialItems) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已上传</span>
                <span class="stat-value">{{ record.uploadedCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">创作者</span>
                <span class="stat-value">{{ record.editor }}</span>
              </div>
            </div>

            <div class="card-assign">
              <div class="assign-header">
                <span class="assign-title">视频类型 / 分配数</span>
              </div>
              <div class="assign-list">
                <div
                  v-for="line in record.editorLines"
                  :key="line.typeIdx"
                  class="assign-row"
                >
                  <a-tag :color="line.color" size="small" class="assign-type">{{ line.typeText }}</a-tag>
                  <span class="assign-count">
                    <span class="assign-multiply">×</span>
                    <span class="assign-current">{{ line.count }}</span>
                    <span class="assign-unit">条</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <span class="card-time">创建时间: {{ record.createTime }}</span>
            <div class="card-actions">
              <a-button
                type="text"
                size="mini"
                :disabled="record.status !== 'PENDING'"
                @click="handleAccept(record)"
              >
                <span :style="{ color: record.status === 'PENDING' ? '#00B42A' : '#C9CDD4' }">接单</span>
              </a-button>
              <a-button type="text" size="mini" @click="handleDetails(record)">
                <span style="color:#165DFF">详情</span>
              </a-button>
            </div>
          </div>
        </div>
        <a-empty v-if="!totalCards" description="暂无数据" class="grid-empty" />
      </div>

      <a-pagination
        v-if="totalCards"
        v-model:current="currentPage"
        v-model:page-size="pageSize"
        :total="totalCards"
        :page-size-options="[15, 20, 50, 100]"
        show-page-size
        show-total
        class="pagination-bar"
      />
    </div>

    <!-- 详情弹窗 -->
    <a-modal v-model:visible="showDetailModal" title="需求详情" :width="1500" unmountOnClose :footer="false" :modal-props="{ bodyStyle: { maxHeight: 'calc(100vh - 100px)', overflow: 'hidden' } }">
      <div class="detail-layout">
        <div class="detail-left">
          <div class="info-section progress-section">
            <div class="section-header">
              <span class="section-icon"><icon-schedule /></span>
              <span class="section-title">需求进度</span>
            </div>
            <div class="section-content">
              <a-steps :current="getStatusStepIndex(detailRecord?.status)" size="small">
                <a-step title="待接单" description="初始状态" />
                <a-step title="进行中" description="素材制作中" />
                <a-step title="已完成" description="需求完成" />
              </a-steps>
            </div>
          </div>

          <div class="info-section">
            <div class="section-header">
              <span class="section-icon"><icon-history /></span>
              <span class="section-title">需求进度记录</span>
            </div>
            <div class="section-content">
              <a-timeline>
                <a-timeline-item v-for="(log, index) in statusLogs" :key="index" :color="log.color">
                  <div class="timeline-item">
                    <span class="log-time">{{ log.time }}</span>
                    <div class="log-content">
                      <span class="log-actor">{{ log.actor }}：</span>
                      <span class="log-action">{{ log.action }}</span>
                    </div>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </div>
          </div>

          <div class="info-section">
            <div class="section-header">
              <span class="section-icon"><icon-file /></span>
              <span class="section-title">基本信息</span>
            </div>
            <div class="section-content">
              <div class="info-row">
                <span class="info-label">集团</span>
                <span class="info-value">{{ detailRecord?.groupName || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">客户名称</span>
                <span class="info-value">{{ detailRecord?.customerName || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">平均日耗</span>
                <span class="info-value price">{{ formatCurrency(detailRecord?.dailyCost) }} 元</span>
              </div>
              <div class="info-row">
                <span class="info-label">需求名称</span>
                <span class="info-value primary">{{ detailRecord?.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">需求ID</span>
                <span class="info-value code">{{ detailRecord?.demandId || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">需求类型</span>
                <a-tag :color="getSourceColor(detailRecord?.source)" size="small">{{ detailRecord?.source || '-' }}</a-tag>
              </div>
              <div class="info-row">
                <span class="info-label">需求状态</span>
                <a-tag :color="getStatusColor(detailRecord?.status)">{{ getStatusText(detailRecord?.status) || '-' }}</a-tag>
              </div>
              <div class="info-row">
                <span class="info-label">媒体平台</span>
                <span class="info-value">{{ formatMedia(detailRecord?.media) }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="section-header">
              <span class="section-icon"><icon-video-camera /></span>
              <span class="section-title">素材信息</span>
            </div>
            <div class="section-content">
              <div class="info-row">
                <span class="info-label">素材清单</span>
                <div class="info-value material-items-list">
                  <div
                    v-for="(item, idx) in (detailRecord?.materialItems || [])"
                    :key="idx"
                    class="material-item-row"
                  >
                    <a-tag :color="getTypePathColor(item.typePath)" size="small">
                      {{ getTypePathText(item.typePath) }}
                    </a-tag>
                    <span class="item-format">{{ item.format || '-' }}</span>
                    <span class="item-count">x {{ item.count || 0 }}</span>
                    <span class="item-hours">{{ calcItemHours(item).toFixed(1) }} h</span>
                  </div>
                  <span v-if="!detailRecord?.materialItems || detailRecord.materialItems.length === 0">-</span>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">素材总数</span>
                <span class="info-value highlight">{{ calcTotalCount(detailRecord?.materialItems) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">所需工时</span>
                <span class="info-value highlight">{{ calcTotalHours(detailRecord?.materialItems).toFixed(1) }} 小时</span>
              </div>
              <div class="info-row">
                <span class="info-label">实际上传</span>
                <span class="info-value" :class="{ 'text-success': detailRecord?.uploadedCount === calcTotalCount(detailRecord?.materialItems), 'text-warning': (detailRecord?.uploadedCount || 0) < calcTotalCount(detailRecord?.materialItems) }">
                  {{ detailRecord?.uploadedCount || '0' }} / {{ calcTotalCount(detailRecord?.materialItems) }}
                </span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="section-header">
              <span class="section-icon"><icon-user /></span>
              <span class="section-title">分配信息</span>
            </div>
            <div class="section-content">
              <div class="creators-block">
                <div class="creators-label">创作者</div>
                <div class="creators-list">
                  <div
                    v-for="(creator, idx) in detailRecord?.creators || []"
                    :key="idx"
                    class="creator-line"
                  >
                    <span class="creator-name">{{ creator.name }}</span>
                    <a-tag :color="creator.statusColor || 'green'" size="small">{{ creator.status || '已分配' }}</a-tag>
                    <template v-if="creator.materials && creator.materials.length">
                      <span
                        v-for="(m, mIdx) in creator.materials"
                        :key="mIdx"
                        class="creator-mat"
                      >
                        <a-tag :color="getTypePathColor(m.typePath)" size="small" effect="plain" class="mat-type">
                          {{ getTypePathText(m.typePath) }}
                        </a-tag>
                        <span class="mat-format">{{ m.format || '-' }}</span>
                        <span class="mat-count">x {{ m.count || 0 }}</span>
                      </span>
                    </template>
                    <span v-else class="mat-empty">— 暂未分配 —</span>
                  </div>
                  <span v-if="!detailRecord?.creators || detailRecord?.creators.length === 0">-</span>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">需求创建人</span>
                <span class="info-value">{{ detailRecord?.creator || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="section-header">
              <span class="section-icon"><icon-history /></span>
              <span class="section-title">时间信息</span>
            </div>
            <div class="section-content">
              <div class="info-row">
                <span class="info-label">需求创建时间</span>
                <span class="info-value">{{ detailRecord?.createTime || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">预期完成时间</span>
                <span class="info-value">{{ detailRecord?.expectedFinishTime || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">需求完成时间</span>
                <span class="info-value">{{ detailRecord?.finishTime || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="section-header">
              <span class="section-icon"><icon-file-audio /></span>
              <span class="section-title">需求描述</span>
            </div>
            <div class="section-content description-content">
              <div class="description-text">{{ detailRecord?.description || '暂无描述' }}</div>
            </div>
          </div>
        </div>
        <div class="detail-divider"></div>
        <div class="detail-right">
          <div class="uploaded-materials">
            <div class="materials-header">
              <span class="materials-title">已上传素材</span>
              <span class="materials-count">{{ detailRecord?.uploadedCount || 0 }} 个</span>
            </div>
            <a-empty v-if="!detailRecord?.uploadedCount || detailRecord?.uploadedCount === 0" description="暂无上传素材" />
            <div v-else class="materials-list">
              <div v-for="i in Math.min(detailRecord?.uploadedCount || 0, 6)" :key="i" class="material-card">
                <div class="material-image">
                  <div v-if="i <= 2" class="video-wrapper">
                    <video :id="`video-${i}`" width="400" height="660" preload="metadata" @loadedmetadata="captureThumbnail(i)">
                      <source :src="`/${i}.mp4`" type="video/mp4" />
                    </video>
                    <canvas :id="`canvas-${i}`" width="400" height="660" class="video-thumbnail-canvas" />
                    <div class="video-thumbnail-overlay" @click="openVideoModal(`/${i}.mp4`)">
                      <span class="play-icon">▶</span>
                    </div>
                  </div>
                  <a-image v-else width="400" height="660" :src="`https://picsum.photos/300?random=${i}`" fit="cover" />
                </div>
                <div class="material-info">
                  <div class="material-name" title="素材名称">素材_{{ i }}.jpg</div>
                  <div class="material-meta">
                    <span class="meta-item">ID: M{{ 1000 + i }}</span>
                    <span class="meta-item">创作者: 张设计师</span>
                  </div>
                  <div class="material-meta">
                    <span class="meta-item">上传: 2024-06-{{ 10 + i }}</span>
                    <span class="meta-item">大小: {{ 1024 + i * 512 }}KB</span>
                  </div>
                </div>
                <div class="material-actions">
                  <a-button type="text" size="mini" title="分享">
                    <template #icon><icon-share-alt /></template>
                  </a-button>
                  <a-button type="text" size="mini" title="编辑">
                    <template #icon><icon-edit /></template>
                  </a-button>
                  <a-button type="text" size="mini" title="下载">
                    <template #icon><icon-download /></template>
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 视频播放弹窗 -->
    <a-modal v-model:visible="showVideoModal" title="视频播放" :width="900" :footer="false" centered>
      <div class="video-modal-content">
        <video :src="currentVideoSrc" controls autoplay style="width: 100%; height: 500px;"></video>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import type { MaterialItem } from '@/types/material'

const showDetailModal = ref(false)
const detailRecord = ref<any>(null)
const showVideoModal = ref(false)
const currentVideoSrc = ref('')
const activeTab = ref('ALL')
// 查询条件
const filterName = ref('')
const filterDemandId = ref('')
const filterCustomer = ref('')
const filterGroupName = ref('')
const filterCreator = ref('')
const filterTypePath = ref<string[]>([])
const dateRange = ref<[string, string] | undefined>(undefined)

// 素材类型 cascader 选项(与需求管理页保持一致)
const typeOptions = [
  {
    label: '视频',
    value: 'VIDEO',
    children: [
      {
        label: '混剪',
        value: 'VIDEO_MIXCUT',
        children: [
          { label: '爆款裂变', value: 'VIDEO_MIXCUT_BKN' },
          { label: '加前后贴', value: 'VIDEO_MIXCUT_JTQ' },
          { label: '实拍素材', value: 'VIDEO_MIXCUT_SP' },
          { label: '无脚本混剪', value: 'VIDEO_MIXCUT_WB' },
          { label: '有脚本混剪', value: 'VIDEO_MIXCUT_YB' },
        ],
      },
      { label: '单人口播', value: 'VIDEO_TALK' },
      {
        label: '剧情',
        value: 'VIDEO_STORY',
        children: [
          { label: '单人剧情', value: 'VIDEO_STORY_SOLO' },
          { label: '多人剧情', value: 'VIDEO_STORY_MULTI' },
        ],
      },
    ],
  },
  {
    label: '平面',
    value: 'IMAGE',
  },
]

// 需求进度记录(详情弹窗时间线)
const statusLogs = ref([
  { time: '2024-06-18 09:30', actor: '张经理', action: '发布了视频需求', color: 'green' },
  { time: '2024-06-18 10:15', actor: '张经理', action: '指派给了个人（郭振宇、张三）', color: 'blue' },
  { time: '2024-06-18 14:20', actor: '郭振宇', action: '开始处理需求', color: 'blue' },
  { time: '2024-06-19 16:30', actor: '张三', action: '上传了3个素材', color: 'cyan' },
])

// 末级 typePath 中文映射
const TYPE_PATH_TEXT: Record<string, string> = {
  VIDEO: '视频',
  VIDEO_MIXCUT: '视频-混剪',
  VIDEO_TALK: '视频-单人口播',
  VIDEO_STORY: '视频-剧情',
  VIDEO_MIXCUT_BKN: '视频-混剪-爆款裂变',
  VIDEO_MIXCUT_JTQ: '视频-混剪-加前后贴',
  VIDEO_MIXCUT_SP: '视频-混剪-实拍素材',
  VIDEO_MIXCUT_WB: '视频-混剪-无脚本混剪',
  VIDEO_MIXCUT_YB: '视频-混剪-有脚本混剪',
  VIDEO_STORY_SOLO: '视频-剧情-单人剧情',
  VIDEO_STORY_MULTI: '视频-剧情-多人剧情',
  IMAGE: '平面',
  IMAGE_LIVE_BG: '平面-直播背景',
  IMAGE_DETAIL: '平面-详情页',
  IMAGE_PIC: '平面-图片',
  IMAGE_LANDING: '平面-落地页',
  IMAGE_POSTER: '平面-开屏/海报',
}

// 每类型/版式平均工时(小时/条)
const HOURS_PER_UNIT: Record<string, number> = {
  爆款裂变: 0.5,
  加前后贴: 0.3,
  实拍素材: 1.0,
  无脚本混剪: 0.4,
  有脚本混剪: 0.8,
  单人口播: 1.0,
  单人剧情: 2.0,
  多人剧情: 3.0,
  横版视频: 0.5,
  竖版视频: 0.5,
  直播背景: 0.3,
  详情页: 0.2,
  图片: 0.1,
  落地页: 0.3,
  '开屏/海报': 0.5,
}

// 单条平均工时(根据 typePath 末级优先,fallback 到版式)
const calcHoursPerUnit = (item: MaterialItem): number => {
  if (item.typePath?.length) {
    const last = item.typePath[item.typePath.length - 1]
    if (HOURS_PER_UNIT[last] !== undefined) return HOURS_PER_UNIT[last]
  }
  if (item.format && HOURS_PER_UNIT[item.format] !== undefined) {
    return HOURS_PER_UNIT[item.format]
  }
  return 1
}

// 快捷日期筛选: all | today | yesterday
const quickDateFilter = ref<'all' | 'today' | 'yesterday'>('all')

// 状态映射
const STATUS_TEXT_MAP: Record<string, string> = {
  PENDING: '待接单',
  PROCESSING: '进行中',
  MODIFYING: '修改中',
  COMPLETED: '已完成',
}
const STATUS_COLOR_MAP: Record<string, string> = {
  PENDING: 'orange',
  PROCESSING: 'blue',
  MODIFYING: 'arcoblue',
  COMPLETED: 'green',
}
const getStatusText = (status?: string) => STATUS_TEXT_MAP[status || ''] || '-'
const getStatusColor = (status?: string) => STATUS_COLOR_MAP[status || ''] || 'default'

// Tab 配置
const statusTabs = [
  { key: 'ALL', title: '全部' },
  { key: 'PENDING', title: '待接单' },
  { key: 'PROCESSING', title: '进行中' },
  { key: 'MODIFYING', title: '修改中' },
  { key: 'COMPLETED', title: '已完成' },
]

const tableData = ref([
  {
    id: 1, name: '618大促活动宣传素材', demandId: 'REQ202406180001',
    status: 'PROCESSING', source: '代运营',
    materialItems: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', count: 10 }],
    editorAssignments: { 0: [{ name: '张剪辑师', count: 6, status: 'accepted' }, { name: '李剪辑师', count: 4, status: 'pending' }] },
    uploadedCount: 8,
    createTime: '2024-06-18 09:30', expectedFinishTime: '2024-06-25 18:00', finishTime: '-',
    groupName: '阿里巴巴集团', customerName: '某知名电商客户', dailyCost: 25000,
    media: ['抖音', '快手'], description: '618大促活动宣传视频素材,需要突出优惠力度',
    creator: '张经理', editor: '张剪辑师 / 李剪辑师',
    creators: [
      { name: '李设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', count: 3 }] },
      { name: '王设计师', status: '待分配', statusColor: 'orange' },
      { name: '张设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', count: 4 }] },
      { name: '赵设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', count: 3 }] },
    ],
  },
  {
    id: 2, name: '新品上市海报设计', demandId: 'REQ202406150002',
    status: 'COMPLETED', source: '服务单',
    materialItems: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 5 }],
    editorAssignments: { 0: [{ name: '王剪辑师', count: 5, status: 'accepted' }] },
    uploadedCount: 5,
    createTime: '2024-06-15 10:00', expectedFinishTime: '2024-06-20 18:00', finishTime: '2024-06-19 11:00',
    groupName: '字节跳动集团', customerName: '某美妆品牌', dailyCost: 12000,
    media: ['小红书'], description: '新品上市系列海报,要求时尚简约风格',
    creator: '王总监', editor: '王剪辑师',
    creators: [
      { name: '王设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 2 }] },
      { name: '刘设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
      { name: '陈设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
      { name: '孙设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
    ],
  },
  {
    id: 3, name: '品牌升级宣传片', demandId: 'REQ202406100003',
    status: 'PENDING', source: '代运营',
    materialItems: [{ typePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_YB'], format: '横版视频', count: 8 }],
    editorAssignments: {},
    uploadedCount: 0,
    createTime: '2024-06-10 08:00', expectedFinishTime: '2024-06-30 18:00', finishTime: '-',
    groupName: '腾讯集团', customerName: '某汽车品牌', dailyCost: 18000,
    media: ['今日头条'], description: '品牌全新升级宣传片,体现品牌理念',
    creator: '刘总', editor: '待指派',
    creators: [
      { name: '待指派', status: '待分配', statusColor: 'orange' },
      { name: '周设计师', status: '待分配', statusColor: 'orange' },
      { name: '吴设计师', status: '待分配', statusColor: 'orange' },
      { name: '郑设计师', status: '待分配', statusColor: 'orange' },
    ],
  },
  {
    id: 4, name: '端午节活动素材', demandId: 'REQ202406050004',
    status: 'COMPLETED', source: '采买',
    materialItems: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 15 }],
    editorAssignments: { 0: [{ name: '赵剪辑师', count: 8, status: 'accepted' }, { name: '钱剪辑师', count: 7, status: 'accepted' }] },
    uploadedCount: 12,
    createTime: '2024-06-05 11:00', expectedFinishTime: '2024-06-10 18:00', finishTime: '-',
    groupName: '阿里巴巴集团', customerName: '某餐饮连锁', dailyCost: 8000,
    media: ['微博'], description: '端午节促销活动素材,融入传统文化元素',
    creator: '陈经理', editor: '赵剪辑师 / 钱剪辑师',
    creators: [
      { name: '赵设计师', status: '审核中', statusColor: 'arcoblue', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 3 }] },
      { name: '钱设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 5 }] },
      { name: '孙设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 4 }] },
      { name: '李设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 3 }] },
    ],
  },
  {
    id: 5, name: '夏季新品发布会预告', demandId: 'REQ202406010005',
    status: 'PROCESSING', source: '服务单',
    materialItems: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 3 }],
    editorAssignments: { 0: [{ name: '钱剪辑师', count: 3, status: 'accepted' }] },
    uploadedCount: 3,
    createTime: '2024-06-01 15:00', expectedFinishTime: '2024-06-08 18:00', finishTime: '2024-06-06 14:00',
    groupName: '字节跳动集团', customerName: '某服装品牌', dailyCost: 5000,
    media: ['抖音'], description: '夏季新品发布会预热视频,时长15秒',
    creator: '周总', editor: '钱剪辑师',
    creators: [
      { name: '孙设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 1 }] },
      { name: '李设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 1 }] },
      { name: '王设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 1 }] },
      { name: '张设计师', status: '已完成', statusColor: 'green' },
    ],
  },
  {
    id: 6, name: '双十一预热短视频', demandId: 'REQ202406200006',
    status: 'PENDING', source: '代运营',
    materialItems: [
      { typePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_WB'], format: '竖版视频', count: 5 },
      { typePath: ['VIDEO', 'VIDEO_STORY', 'VIDEO_STORY_SOLO'], format: '横版视频', count: 3 },
      { typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 4 },
    ],
    editorAssignments: {
      0: [{ name: '王剪辑师', count: 5, status: 'accepted' }],
      1: [{ name: '王剪辑师', count: 3, status: 'pending' }, { name: '孙剪辑师', count: 3, status: 'pending' }],
      2: [{ name: '王剪辑师', count: 4, status: 'pending' }],
    },
    uploadedCount: 0,
    createTime: '2024-06-20 09:00', expectedFinishTime: '2024-07-01 18:00', finishTime: '-',
    groupName: '腾讯集团', customerName: '某零食品牌', dailyCost: 30000,
    media: ['抖音', '快手'], description: '双十一活动预热视频,突出促销力度',
    creator: '李经理', editor: '王剪辑师 / 孙剪辑师',
    creators: [
      { name: '待指派', status: '待分配', statusColor: 'orange' },
      { name: '周设计师', status: '待分配', statusColor: 'orange' },
      { name: '吴设计师', status: '待分配', statusColor: 'orange' },
      { name: '郑设计师', status: '待分配', statusColor: 'orange' },
    ],
  },
  {
    id: 7, name: '品牌联名海报设计', demandId: 'REQ202406210007',
    status: 'PROCESSING', source: '服务单',
    materialItems: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 6 }],
    editorAssignments: { 0: [{ name: '孙剪辑师', count: 6, status: 'accepted' }] },
    uploadedCount: 4,
    createTime: '2024-06-21 14:00', expectedFinishTime: '2024-06-28 18:00', finishTime: '-',
    groupName: '阿里巴巴集团', customerName: '某运动品牌', dailyCost: 6500,
    media: ['小红书'], description: '与国际品牌联名限定款宣传海报',
    creator: '赵总监', editor: '孙剪辑师',
    creators: [
      { name: '刘设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 2 }] },
      { name: '陈设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 2 }] },
      { name: '黄设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 2 }] },
      { name: '林设计师', status: '待分配', statusColor: 'orange' },
    ],
  },
  {
    id: 8, name: '产品讲解视频', demandId: 'REQ202406220008',
    status: 'COMPLETED', source: '采买',
    materialItems: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 5 }],
    editorAssignments: { 0: [{ name: '李剪辑师', count: 5, status: 'accepted' }] },
    uploadedCount: 5,
    createTime: '2024-06-22 10:30', expectedFinishTime: '2024-06-27 18:00', finishTime: '-',
    groupName: '字节跳动集团', customerName: '某家电品牌', dailyCost: 15000,
    media: ['今日头条'], description: '新产品功能讲解视频,时长2分钟',
    creator: '孙总', editor: '李剪辑师',
    creators: [
      { name: '陈设计师', status: '审核中', statusColor: 'arcoblue', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 1 }] },
      { name: '徐设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 2 }] },
      { name: '王设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 1 }] },
      { name: '赵设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 1 }] },
    ],
  },
  {
    id: 9, name: '七夕情人节营销素材', demandId: 'REQ202406230009',
    status: 'MODIFYING', source: '采买',
    materialItems: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 8 }],
    editorAssignments: { 0: [{ name: '王剪辑师', count: 5, status: 'accepted' }, { name: '李剪辑师', count: 3, status: 'accepted' }] },
    uploadedCount: 5,
    createTime: '2024-06-23 16:00', expectedFinishTime: '2024-07-05 18:00', finishTime: '-',
    groupName: '腾讯集团', customerName: '某珠宝品牌', dailyCost: 22000,
    media: ['微博', '小红书'], description: '七夕情人节直播背景,浪漫温馨风格',
    creator: '吴经理', editor: '王剪辑师 / 李剪辑师',
    creators: [
      { name: '王剪辑师', status: '修改中', statusColor: 'arcoblue', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 5 }] },
      { name: '李剪辑师', status: '修改中', statusColor: 'arcoblue', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 3 }] },
      { name: '周设计师', status: '待分配', statusColor: 'orange' },
      { name: '吴设计师', status: '待分配', statusColor: 'orange' },
    ],
  },
  {
    id: 10, name: '企业宣传册设计', demandId: 'REQ202406240010',
    status: 'COMPLETED', source: '代运营',
    materialItems: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 20 }],
    editorAssignments: { 0: [{ name: '冯剪辑师', count: 10, status: 'accepted' }, { name: '陈剪辑师', count: 10, status: 'accepted' }] },
    uploadedCount: 20,
    createTime: '2024-06-24 08:30', expectedFinishTime: '2024-06-30 18:00', finishTime: '2024-06-29 17:30',
    groupName: '阿里巴巴集团', customerName: '某科技公司', dailyCost: 4500,
    media: ['官网', '公众号'], description: '企业周年庆宣传册,涵盖公司发展历程',
    creator: '郑总', editor: '冯剪辑师 / 陈剪辑师',
    creators: [
      { name: '周设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 5 }] },
      { name: '吴设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 5 }] },
      { name: '冯设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 5 }] },
      { name: '陈设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 5 }] },
    ],
  },
])

// 状态 Tab 计数
const getStatusCount = (key: string) => {
  if (key === 'ALL') return tableData.value.length
  return tableData.value.filter(r => r.status === key).length
}

// 分页状态
const currentPage = ref(1)
const pageSize = ref(15)

// 过滤后的卡片数据
const filteredRecords = computed(() => {
  let list = tableData.value

  // Tab 状态过滤
  if (activeTab.value !== 'ALL') {
    list = list.filter(r => r.status === activeTab.value)
  }

  // 完整查询条件
  if (filterName.value.trim()) {
    list = list.filter(r => r.name.includes(filterName.value.trim()))
  }
  if (filterDemandId.value.trim()) {
    list = list.filter(r => r.demandId.toLowerCase().includes(filterDemandId.value.trim().toLowerCase()))
  }
  if (filterCustomer.value.trim()) {
    list = list.filter(r => r.customerName.includes(filterCustomer.value.trim()))
  }
  if (filterGroupName.value.trim()) {
    list = list.filter(r => r.groupName.includes(filterGroupName.value.trim()))
  }
  if (filterCreator.value.trim()) {
    list = list.filter((r: any) => {
      const kw = filterCreator.value.trim()
      if (!kw) return true
      if (r.editor && r.editor.includes(kw)) return true
      if (Array.isArray(r.creators) && r.creators.some((c: any) => c.name && c.name.includes(kw))) return true
      return false
    })
  }

  // 创建时间: 快捷筛选 > 自定义范围
  if (quickDateFilter.value !== 'all') {
    const today = new Date()
    const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const todayStr = ymd(today)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = ymd(yesterday)
    list = list.filter(r => {
      const day = r.createTime.slice(0, 10)
      return quickDateFilter.value === 'today' ? day === todayStr : day === yesterdayStr
    })
  } else if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const [start, end] = dateRange.value
    list = list.filter(r => r.createTime >= start && r.createTime <= end + ' 23:59:59')
  }

  return list
})

// 将过滤后的需求拍平: 每个 (需求 × 剪辑师) 生成一张卡
// 1) 该需求未分配或所有 item 都空: 1 张 "待指派" 占位卡
// 2) 该需求被分配给 N 个剪辑师: N 张卡, 每张聚合该剪辑师在所有 typePath 上的 count
type EditorAssign = { name: string; count: number; status: string }
type EditorAssignMap = Record<number, EditorAssign[]>

const flatCardList = computed(() => {
  const cards: Array<any> = []
  for (const record of filteredRecords.value) {
    const assignments = (record.editorAssignments || {}) as EditorAssignMap
    // 按剪辑师聚合: editorName -> [{ typeIdx, typeText, color, format, count, total, status }]
    const editorMap: Record<string, any[]> = {}
    ;(record.materialItems || []).forEach((item: any, idx: number) => {
      const list = assignments[idx] || []
      for (const e of list) {
        if (!editorMap[e.name]) editorMap[e.name] = []
        editorMap[e.name].push({
          typeIdx: idx,
          typeText: getTypePathText(item.typePath),
          color: getTypePathColor(item.typePath),
          format: item.format,
          count: Number(e.count) || 0,
          total: Number(item.count) || 0,
          status: e.status,
        })
      }
    })

    const editorNames = Object.keys(editorMap)
    if (editorNames.length === 0) {
      // 该需求尚未分配给任何剪辑师: 不出卡
      continue
    }
    // 每个被分配的剪辑师一张卡
    for (const name of editorNames) {
      cards.push({
        ...record,
        editor: name,
        editorLines: editorMap[name],
      })
    }
  }
  return cards
})

// 当前页(基于拍平后的卡片)
const pagedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return flatCardList.value.slice(start, start + pageSize.value)
})

// 分页总数同步为拍平后的卡片数
const totalCards = computed(() => flatCardList.value.length)

// 过滤条件变化时自动回到第 1 页,避免页码越界
watch(filteredRecords, () => {
  currentPage.value = 1
})

const handleSearch = () => {
  // 查询条件已通过 computed 实时响应
}

const handleReset = () => {
  filterName.value = ''
  filterDemandId.value = ''
  filterCustomer.value = ''
  filterGroupName.value = ''
  filterCreator.value = ''
  filterTypePath.value = []
  dateRange.value = undefined
  quickDateFilter.value = 'all'
  activeTab.value = 'ALL'
}

const handleDetails = (record: any) => {
  detailRecord.value = record
  showDetailModal.value = true
}

const handleAccept = (record: any) => {
  if (record.status !== 'PENDING') {
    Message.warning('仅待接单状态的需求可接单')
    return
  }
  Modal.confirm({
    title: '接单确认',
    content: `确定要接下需求「${record.name}」吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      record.status = 'PROCESSING'
      Message.success('已接单')
    },
  })
}

const openVideoModal = (src: string) => {
  currentVideoSrc.value = src
  showVideoModal.value = true
}

const captureThumbnail = (index: number) => {
  const video = document.getElementById(`video-${index}`) as HTMLVideoElement
  const canvas = document.getElementById(`canvas-${index}`) as HTMLCanvasElement
  if (video && canvas) {
    video.currentTime = 0.1
    video.addEventListener('seeked', function handler() {
      if (canvas) {
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      video.removeEventListener('seeked', handler)
    })
  }
}

// ========== 详情弹窗辅助函数(与需求管理页保持一致) ==========

// 素材总数量
const calcTotalCount = (items: MaterialItem[] = []) =>
  items.reduce((sum, item) => sum + (Number(item?.count) || 0), 0)

// 单条组合所需工时
const calcItemHours = (item: MaterialItem): number =>
  calcHoursPerUnit(item) * (Number(item.count) || 0)

// 所有组合总工时
const calcTotalHours = (items: MaterialItem[] = []): number =>
  items.reduce((sum, item) => sum + calcItemHours(item), 0)

const getTypePathText = (typePath: string[] = []) => {
  if (!typePath?.length) return '-'
  const last = typePath[typePath.length - 1]
  return TYPE_PATH_TEXT[last] || last
}

const getTypePathColor = (typePath: string[] = []) => {
  const isVideo = typePath[0] === 'VIDEO'
  return isVideo ? 'purple' : 'cyan'
}

// 媒体平台格式化: 支持 string / string[] / undefined 三种入参
const formatMedia = (media?: string | string[]) => {
  if (Array.isArray(media)) return media.length ? media.join(' / ') : '-'
  return media || '-'
}

const getSourceColor = (source?: string) => {
  const colorMap: Record<string, string> = {
    代运营: 'blue',
    服务单: 'cyan',
    采买: 'orange',
  }
  return colorMap[source || ''] || 'gray'
}

// 千分符格式化金额,单位元
const formatCurrency = (value?: number | string): string => {
  if (value === undefined || value === null || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const getStatusStepIndex = (status?: string) => {
  const stepMap: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 1,
    COMPLETED: 2,
  }
  return stepMap[status || 'PENDING'] ?? 0
}

// ========== 卡片分配数据(由 flatCardList 拍平时直接生成, 此处不需额外工具函数) ==========
</script>

<style scoped lang="scss">
.video-assign-page {
  padding: 24px;

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 12px;
    padding: 20px 24px;
    background: #FFFFFF;
    border-radius: 8px;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .filter-form {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      row-gap: 12px;
      column-gap: 16px;

      :deep(.arco-form-item) {
        margin-bottom: 0;
        margin-right: 0;
      }

      :deep(.arco-form-item-label) {
        font-size: 14px;
        color: #4E5969;
        white-space: nowrap;
      }

      .filter-actions {
        margin-left: auto;
        display: flex;
        gap: 8px;
      }
    }

    .tab-bar {
      display: flex;
      align-items: baseline;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px dashed var(--color-neutral-3);
      flex-wrap: wrap;

      .filter-group {
        display: flex;
        align-items: baseline;
        gap: 12px;
        min-width: 0;

        .filter-group-label {
          font-size: 14px;
          color: var(--color-text-2);
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }
      }

      // 视觉分隔
      .filter-divider {
        width: 1px;
        height: 14px;
        background: var(--color-neutral-3);
        flex-shrink: 0;
        align-self: center;
      }

      // Tab hover 反馈: type='text' 默认无视觉反馈,补 4px 浅蓝背景增强可用性
      :deep(.arco-tabs-tab) {
        font-size: 14px;
        line-height: 1;
        padding: 6px 12px;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          background: var(--color-primary-1);
          color: var(--color-primary-6);
        }

        &.arco-tabs-tab-active {
          color: var(--color-primary-6);
          font-weight: 600;
          background: var(--color-primary-1);

          &:hover {
            background: var(--color-primary-1);
          }

          // 去掉 arco 默认的底部装饰线
          &::after {
            display: none;
          }
        }
      }
    }

    .tab-count {
      margin-left: 4px;
      color: #86909C;
      font-size: 12px;
    }
  }

  .data-section {
    background: #FFFFFF;
    border-radius: 8px;
    padding: 16px 20px;

    .card-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;

      @media (max-width: 1400px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      @media (max-width: 1000px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 700px) {
        grid-template-columns: 1fr;
      }
    }

    .grid-empty {
      grid-column: 1 / -1;
    }

    .pagination-bar {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed var(--color-neutral-3);
    }

    .demand-card {
      border: 1px solid var(--color-neutral-3);
      border-radius: 8px;
      padding: 16px;
      background: #fff;
      transition: box-shadow 0.2s, transform 0.2s;
      display: flex;
      flex-direction: column;
      gap: 12px;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;

        .card-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-1);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      // 主体区占满剩余高度,把 footer 顶到卡片底部
      // 解决: typePath 1 行 vs 3 行 卡片高度不一致,footer 基线错位
      .card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .card-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;

        .meta-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .meta-key {
          color: var(--color-text-3);
          flex-shrink: 0;
          min-width: 70px;
        }

        .meta-val {
          color: var(--color-text-1);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          &.mono {
            font-family: Monaco, Consolas, monospace;
            font-size: 12px;
          }
        }
      }

      .card-stats {
        display: flex;
        gap: 8px;
        padding: 8px 0;
        border-top: 1px dashed var(--color-neutral-3);
        border-bottom: 1px dashed var(--color-neutral-3);

        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: center;

          .stat-label {
            font-size: 11px;
            color: var(--color-text-3);
          }

          .stat-value {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-1);
          }
        }
      }

      .card-assign {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 10px;
        background: #fafafa;
        border-radius: 6px;
        border: 1px solid var(--color-neutral-3);

        .assign-header {
          .assign-title {
            font-size: 11px;
            color: var(--color-text-3);
            font-weight: 500;
          }
        }

        .assign-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .assign-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-size: 12px;

          .assign-type {
            flex: 1;
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .assign-count {
            display: inline-flex;
            align-items: baseline;
            gap: 2px;
            font-family: Monaco, Consolas, monospace;
            flex-shrink: 0;
            color: var(--color-text-2);

            .assign-multiply {
              color: var(--color-text-4);
            }
            .assign-current {
              font-weight: 600;
              color: var(--color-primary-6);
              font-size: 13px;
            }
            .assign-unit {
              color: var(--color-text-3);
            }
          }
        }
      }

      .card-footer {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px dashed var(--color-neutral-3);

        .card-time {
          font-size: 12px;
          color: var(--color-text-3);
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
        }
      }
    }
  }
}

.detail-layout {
  display: flex;
  padding: 20px;

  .detail-left {
    flex: 0 0 65%;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    padding-right: 16px;
  }

  .detail-divider {
    width: 3px;
    background: linear-gradient(to bottom, #722ED1, #165DFF, #722ED1);
    border-radius: 2px;
    margin: 0 20px;
    box-shadow: 0 0 8px rgba(114, 46, 209, 0.3);
  }

  .detail-right {
    flex: 0 0 35%;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    padding-left: 16px;
  }

    .uploaded-materials {
      .materials-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .materials-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-1);
        }

        .materials-count {
          font-size: 12px;
          color: var(--color-text-3);
          background: var(--color-fill-2);
          padding: 2px 8px;
          border-radius: 4px;
        }
      }

      .materials-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .material-card {
        background: #fff;
        border: 1px solid var(--color-neutral-3);
        border-radius: 8px;
        overflow: hidden;
        width: 400px;
        transition: box-shadow 0.2s;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .material-image {
          background: var(--color-fill-2);
          height: 660px;
          width: 400px;
          overflow: hidden;
          position: relative;

          .video-wrapper {
            position: relative;
            width: 100%;
            height: 100%;

            video {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              opacity: 0;
              z-index: 1;
            }

            .video-thumbnail-canvas {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 0;
              object-fit: cover;
            }

            .video-thumbnail-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 2;
              cursor: pointer;

              .play-icon {
                width: 40px;
                height: 40px;
                background: rgba(0, 0, 0, 0.6);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 18px;

                &:hover {
                  background: rgba(0, 0, 0, 0.8);
                }
              }
            }
          }
        }

        .material-info {
          padding: 12px;

          .material-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--color-text-1);
            margin-bottom: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .material-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;

            .meta-item {
              font-size: 12px;
              color: var(--color-text-3);
            }
          }
        }

        .material-actions {
          display: flex;
          justify-content: center;
          gap: 4px;
          padding: 8px;
          border-top: 1px solid var(--color-neutral-3);
          background: var(--color-fill-1);
        }
      }
    }
}

.progress-section {
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;

    .progress-status, .progress-rate {
      display: flex;
      align-items: center;

      .status-label, .rate-label {
        font-size: 13px;
        color: var(--color-text-3);
      }

      .rate-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-primary-6);
      }
    }
  }
}

.timeline-item {
  .log-time {
    font-size: 12px;
    color: var(--color-text-3);
    margin-bottom: 4px;
    display: block;
  }

  .log-content {
    .log-actor {
      font-weight: 600;
      color: var(--color-text-1);
    }

    .log-action {
      color: var(--color-text-2);
    }
  }
}

.info-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--color-neutral-3);

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-neutral-3);

    .section-icon {
      color: var(--color-primary-6);
      font-size: 16px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }

  .section-content {
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 6px 0;

      .creators-block {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        padding: 6px 0;
      }

      .info-label {
        font-size: 13px;
        color: var(--color-text-3);
      }

      .info-value {
        font-size: 13px;
        color: var(--color-text-1);
        font-weight: 500;

        &.with-tag {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        &.primary {
          color: var(--color-primary-6);
          font-weight: 600;
        }

        &.code {
          font-family: Monaco, Consolas, monospace;
          color: var(--color-secondary);
        }

        &.highlight {
          color: var(--color-warning);
          font-weight: 600;
        }

        &.price {
          color: var(--color-success);
          font-weight: 600;
        }

        &.text-success {
          color: var(--color-success);
        }

        &.text-warning {
          color: var(--color-warning);
        }
      }

      .creators-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .creator-line {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        font-size: 13px;
        line-height: 1.8;

        .creator-name {
          color: var(--color-text-1);
          font-weight: 500;
          min-width: 70px;
        }
        .creator-mat {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 1px 8px;
          background: var(--color-fill-2);
          border-radius: 4px;
        }
        .mat-format {
          color: var(--color-text-2);
        }
        .mat-count {
          color: var(--color-primary-6);
          font-weight: 600;
          font-size: 12px;
        }
        .mat-empty {
          color: var(--color-text-4);
          font-size: 12px;
          font-style: italic;
        }
      }

      .creators-label {
        font-size: 13px;
        color: var(--color-text-3);
      }
    }

    &.description-content {
      flex-direction: column;
      align-items: flex-start;

      .description-text {
        font-size: 13px;
        color: var(--color-text-2);
        line-height: 1.6;
        background: white;
        padding: 12px;
        border-radius: 4px;
        border: 1px solid var(--color-neutral-3);
        width: 100%;
        min-height: 80px;
      }
    }
  }
}
</style>
