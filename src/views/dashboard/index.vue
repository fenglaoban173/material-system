<template>
  <div class="dashboard-page">
    <!-- ========== 第 1 层:总览指标(4 卡) ========== -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <StatCard
          icon="file"
          theme="primary"
          label="素材总数"
          :value="stats.totalCount"
          unit="个"
          :trend="2.4"
          trend-label="较昨日"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="upload"
          theme="info"
          label="今日新增"
          :value="stats.todayCount"
          unit="个"
          :trend="12.5"
          trend-label="较昨日"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="check-circle"
          theme="success"
          label="有效素材"
          :value="stats.validCount"
          unit="个"
          :subtext="`占比 ${validRatio}%`"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="clock-circle"
          theme="warning"
          label="待处理素材"
          :value="stats.pendingCount"
          unit="个"
          :subtext="`占比 ${pendingRatio}%`"
        />
      </a-col>
    </a-row>

    <!-- ========== 第 2 层:上传趋势 + 状态分布 ========== -->
    <a-row :gutter="16" class="charts-row">
      <a-col :span="16">
        <div class="material-card">
          <div class="card-header">
            <h3>上传趋势</h3>
            <a-radio-group v-model="trendRange" type="button" size="small">
              <a-radio value="7">近 7 天</a-radio>
              <a-radio value="14">近 14 天</a-radio>
              <a-radio value="30">近 30 天</a-radio>
            </a-radio-group>
          </div>
          <div class="card-body">
            <v-chart :option="uploadTrendOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
      <a-col :span="8">
        <div class="material-card">
          <div class="card-header">
            <h3>素材状态分布</h3>
            <a-link @click="$router.push('/material/list')">查看</a-link>
          </div>
          <div class="card-body">
            <v-chart :option="statusOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- ========== 第 3 层:细分指标(8 卡) ========== -->
    <div class="section-title">合规质量 · 资产活跃度 · 团队运营</div>
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <StatCard
          icon="check-circle"
          theme="success"
          label="预审通过率"
          :value="stats.passRate"
          unit="%"
          :trend="1.8"
          trend-label="较上周"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="eye"
          theme="warning"
          label="低效素材数量"
          :value="stats.lowEfficiencyCount"
          unit="个"
          subtext="建议清理"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="exclamation-circle"
          theme="error"
          label="不合规素材"
          :value="stats.rejectCount"
          unit="个"
          subtext="需立即处理"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="fire"
          theme="purple"
          label="活跃素材(7 日)"
          :value="stats.activeCount"
          unit="个"
          :subtext="`占比 ${activeRatio}%`"
        />
      </a-col>
    </a-row>
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <StatCard
          icon="storage"
          theme="cyan"
          label="闲置素材(30 日)"
          :value="stats.idleCount"
          unit="个"
          subtext="建议清理"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="thunderbolt"
          theme="primary"
          label="总消耗"
          :value="stats.totalCost"
          unit="元"
          :trend="8.3"
          trend-label="较上周"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="user-group"
          theme="info"
          label="活跃成员(7 日)"
          :value="stats.activeMembers"
          unit="人"
          subtext="团队运营"
        />
      </a-col>
      <a-col :span="6">
        <StatCard
          icon="history"
          theme="purple"
          label="需求完成平均时长"
          :value="stats.avgRequirementHours"
          unit="小时"
          :trend="-15.2"
          trend-label="较上周"
        />
      </a-col>
    </a-row>

    <!-- ========== 第 4 层:审核漏斗 + 质量分布 + Top10 热门 ========== -->
    <a-row :gutter="16" class="charts-row">
      <a-col :span="8">
        <div class="material-card">
          <div class="card-header">
            <h3>审核转化漏斗</h3>
          </div>
          <div class="card-body">
            <v-chart :option="funnelOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
      <a-col :span="8">
        <div class="material-card">
          <div class="card-header">
            <h3>素材点击率分布</h3>
          </div>
          <div class="card-body">
            <v-chart :option="ctrOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
      <a-col :span="8">
        <div class="material-card">
          <div class="card-header">
            <h3>Top10 热门素材</h3>
            <a-link @click="$router.push('/material/list')">查看全部</a-link>
          </div>
          <div class="card-body">
            <v-chart :option="topOption" class="chart" autoresize />
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- ========== 第 5 层:已隐藏(存储趋势 + 即将到期) ========== -->

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import StatCard from '@/components/StatCard.vue'

// ========== 总览数据 ==========
const stats = reactive({
  totalCount: 12847,
  todayCount: 86,
  validCount: 11234,
  pendingCount: 1470,
  passRate: 87.4,
  lowEfficiencyCount: 1247,
  rejectCount: 23,
  activeCount: 3265,
  idleCount: 5821,
  totalCost: 256320,
  activeMembers: 18,
  avgRequirementHours: 1.4,
  storageUsed: 768 * 1024 * 1024 * 1024, // 768 GB
  storageTotal: 1024 * 1024 * 1024 * 1024, // 1 TB
})

const validRatio = computed(() => ((stats.validCount / stats.totalCount) * 100).toFixed(1))
const activeRatio = computed(() => ((stats.activeCount / stats.totalCount) * 100).toFixed(1))
const pendingRatio = computed(() => ((stats.pendingCount / stats.totalCount) * 100).toFixed(1))

// ========== 工具方法 ==========
const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// ========== 上传趋势 ==========
const trendRange = ref<'7' | '14' | '30'>('14')

const generateTrendData = (days: number) => {
  const labels: string[] = []
  const counts: number[] = []
  const volumes: number[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
    // 周末略低
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const base = isWeekend ? 30 : 80
    counts.push(base + Math.floor(Math.random() * 70))
    volumes.push(Math.round((base + Math.random() * 70) * (5 + Math.random() * 12)))
  }
  return { labels, counts, volumes }
}

const trendData = computed(() => generateTrendData(Number(trendRange.value)))

const uploadTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: {
    data: ['上传数量', '存储体积(GB)'],
    bottom: 0,
    icon: 'roundRect',
    itemWidth: 12,
    itemHeight: 8,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '12%',
    top: '8%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: trendData.value.labels,
    axisLine: { lineStyle: { color: '#e5e6eb' } },
    axisLabel: { color: '#86909c', fontSize: 12 },
  },
  yAxis: [
    {
      type: 'value',
      name: '数量',
      nameTextStyle: { color: '#86909c', fontSize: 12 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f1f3', type: 'dashed' } },
      axisLabel: { color: '#86909c', fontSize: 12 },
    },
    {
      type: 'value',
      name: 'GB',
      nameTextStyle: { color: '#86909c', fontSize: 12 },
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#86909c', fontSize: 12 },
    },
  ],
  series: [
    {
      name: '上传数量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: trendData.value.counts,
      lineStyle: { width: 2.5, color: '#1677ff' },
      itemStyle: { color: '#1677ff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(22,119,255,0.25)' },
            { offset: 1, color: 'rgba(22,119,255,0)' },
          ],
        },
      },
    },
    {
      name: '存储体积(GB)',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      symbol: 'circle',
      symbolSize: 6,
      data: trendData.value.volumes,
      lineStyle: { width: 2.5, color: '#722ed1' },
      itemStyle: { color: '#722ed1' },
    },
  ],
}))

// ========== 状态分布(环形) ==========
const statusOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: '4%',
    top: 'center',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: '#4e5969', fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: ['55%', '78%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: {
        show: true,
        position: 'center',
        formatter: () => `{total|${stats.totalCount}}\n{lbl|素材总数}`,
        rich: {
          total: { fontSize: 24, fontWeight: 700, color: '#1d2129', lineHeight: 32 },
          lbl: { fontSize: 12, color: '#86909c', lineHeight: 18 },
        },
      },
      emphasis: { scale: true, scaleSize: 6 },
      data: [
        { value: stats.validCount, name: '有效', itemStyle: { color: '#52c41a' } },
        { value: 1283, name: '待预审', itemStyle: { color: '#faad14' } },
        { value: 187, name: '审核中', itemStyle: { color: '#1677ff' } },
        { value: stats.rejectCount, name: '已拒绝', itemStyle: { color: '#f5222d' } },
        { value: 120, name: '已下架', itemStyle: { color: '#bfbfbf' } },
      ],
    },
  ],
}))

// ========== 审核漏斗(横向圆角进度条) ==========
const funnelOption = computed(() => {
  // 从上到下展示(ECharts 横向 bar 的 yAxis 是从下到上,先定义展示顺序,再 reverse 给 ECharts)
  const steps = [
    { name: '素材总数', value: stats.totalCount, prevValue: stats.totalCount, color: '#1677ff' },
    { name: '提交预审', value: 1283 + 187, prevValue: stats.totalCount, color: '#4096ff' },
    { name: '审核通过', value: stats.validCount, prevValue: 1283 + 187, color: '#52c41a' },
    { name: '已投放使用', value: stats.activeCount, prevValue: stats.validCount, color: '#722ed1' },
  ]
  const display = [...steps].reverse()

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const arr = params as Array<{ dataIndex: number }>
        const step = display[arr[0].dataIndex]
        const ratio = step.prevValue === step.value ? '100' : ((step.value / step.prevValue) * 100).toFixed(1)
        return `<b>${step.name}</b><br/>数量: ${step.value.toLocaleString()}<br/>转化率: ${ratio}%`
      },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      max: stats.totalCount,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: 'category',
      data: display.map((s) => s.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#4e5969', fontSize: 12, fontWeight: 500 },
    },
    series: [
      // 底层灰色"满血"背景条
      {
        type: 'bar',
        barWidth: 16,
        barGap: '-100%',
        silent: true,
        data: display.map(() => stats.totalCount),
        itemStyle: { color: '#f0f1f3', borderRadius: [0, 8, 8, 0] },
        z: 1,
      },
      // 上层彩色"实际"覆盖条
      {
        type: 'bar',
        barWidth: 16,
        data: display.map((s) => ({
          value: s.value,
          itemStyle: { color: s.color, borderRadius: [0, 8, 8, 0] },
        })),
        z: 2,
        label: {
          show: true,
          position: 'right',
          color: '#4e5969',
          fontSize: 11,
          formatter: (p: { dataIndex: number }) => {
            const step = display[p.dataIndex]
            const ratio = step.prevValue === step.value ? '100' : ((step.value / step.prevValue) * 100).toFixed(1)
            return `${step.value.toLocaleString()}  ·  ${ratio}%`
          },
        },
      },
    ],
  }
})

// ========== 素材点击率(CTR)分布 ==========
const ctrOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: unknown) => {
      const arr = params as Array<{ name: string; value: number }>
      return `${arr[0].name}<br/>素材数: ${arr[0].value.toLocaleString()}`
    },
  },
  grid: { left: '3%', right: '4%', bottom: '5%', top: '12%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['0-0.5%', '0.5-1%', '1-2%', '2-5%', '5%+'],
    name: '点击率',
    nameLocation: 'end',
    nameTextStyle: { color: '#86909c', fontSize: 11, padding: [0, 0, 0, -40] },
    nameGap: 5,
    axisLine: { lineStyle: { color: '#e5e6eb' } },
    axisLabel: { color: '#86909c', fontSize: 12 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f0f1f3', type: 'dashed' } },
    axisLabel: { color: '#86909c', fontSize: 12 },
  },
  series: [
    {
      type: 'bar',
      barWidth: '50%',
      itemStyle: { borderRadius: [6, 6, 0, 0] },
      data: [
        { value: 1832, itemStyle: { color: '#bfbfbf' } }, // 0-0.5%  低
        { value: 2954, itemStyle: { color: '#faad14' } }, // 0.5-1%  偏低
        { value: 4521, itemStyle: { color: '#52c41a' } }, // 1-2%    合格
        { value: 2736, itemStyle: { color: '#1677ff' } }, // 2-5%    良好
        { value: 804,  itemStyle: { color: '#722ed1' } }, // 5%+     优秀
      ],
      label: {
        show: true,
        position: 'top',
        color: '#4e5969',
        fontSize: 12,
        formatter: (p: { value: number }) => p.value.toLocaleString(),
      },
    },
  ],
}))

// ========== Top10 热门素材 ==========
const topMaterials = [
  { name: 'summer_promo_v3.mp4', cost: 32150 },
  { name: 'product_demo_1080p.mp4', cost: 28920 },
  { name: 'festival_banner_30s.mp4', cost: 24560 },
  { name: 'brand_story_v2.mp4', cost: 21380 },
  { name: 'new_arrival_teaser.mp4', cost: 18920 },
  { name: 'discount_countdown.mp4', cost: 15670 },
  { name: 'kOL_review_clip.mp4', cost: 13420 },
  { name: 'live_highlight_15s.mp4', cost: 11280 },
  { name: 'spring_campaign.mp4', cost: 9870 },
  { name: 'user_testimonial.mp4', cost: 8230 },
]

const topOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>消耗: ¥{c}' },
  grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
  xAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f0f1f3', type: 'dashed' } },
    axisLabel: { color: '#86909c', fontSize: 11, formatter: (v: number) => `${(v / 1000).toFixed(0)}k` },
  },
  yAxis: {
    type: 'category',
    data: topMaterials.map((m) => m.name).reverse(),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#4e5969', fontSize: 11 },
  },
  series: [
    {
      type: 'bar',
      data: topMaterials.map((m) => m.cost).reverse(),
      barWidth: '60%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#722ed1' },
            { offset: 1, color: '#1677ff' },
          ],
        },
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true,
        position: 'right',
        color: '#4e5969',
        fontSize: 11,
        formatter: (p: { value: number }) => `¥${(p.value / 1000).toFixed(1)}k`,
      },
    },
  ],
}))

// ========== 存储趋势(面积图) ==========
const storageOption = computed(() => {
  const labels: string[] = []
  const used: number[] = []
  const today = new Date()
  let baseUsed = stats.storageUsed - 80 * 1024 * 1024 * 1024
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
    baseUsed += Math.floor(Math.random() * 15 * 1024 * 1024 * 1024)
    used.push(Math.round(baseUsed / (1024 * 1024 * 1024)))
  }
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValueLabel: string; value: number }>
        return `${arr[0].axisValueLabel}<br/>已用: ${arr[0].value} GB`
      },
    },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisLabel: { color: '#86909c', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f1f3', type: 'dashed' } },
      axisLabel: { color: '#86909c', fontSize: 12, formatter: '{value} GB' },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: used,
        lineStyle: { width: 2.5, color: '#13c2c2' },
        itemStyle: { color: '#13c2c2' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(19,194,194,0.35)' },
              { offset: 1, color: 'rgba(19,194,194,0)' },
            ],
          },
        },
        markLine: {
          symbol: 'none',
          lineStyle: { color: '#f5222d', type: 'dashed' },
          label: { formatter: '容量上限 1024 GB', color: '#f5222d', fontSize: 11 },
          data: [{ yAxis: 1024 }],
        },
      },
    ],
  }
})

// ========== 即将到期素材 ==========
const expiringMaterials = ref([
  { id: 1, name: 'spring_festival_teaser.mp4', size: 524288000, days: 3 },
  { id: 2, name: 'valentine_promo_30s.mp4', size: 314572800, days: 5 },
  { id: 3, name: 'q1_summary_v1.mp4', size: 1073741824, days: 7 },
  { id: 4, name: 'flash_sale_banner.mp4', size: 209715200, days: 12 },
  { id: 5, name: 'old_brand_video.mp4', size: 838860800, days: 18 },
  { id: 6, name: 'legacy_demo.mp4', size: 419430400, days: 25 },
])
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.dashboard-page {
  padding: $spacing-6;
  max-width: $content-max-width;
  margin: 0 auto;

  .stats-row {
    margin-bottom: $spacing-4;
  }

  .charts-row {
    margin-bottom: $spacing-4;
  }

  .section-title {
    font-size: $font-size-body;
    font-weight: $font-weight-medium;
    color: $color-neutral-8;
    margin: $spacing-5 0 $spacing-3;
    padding-left: $spacing-2;
    border-left: 3px solid $color-primary-6;
  }

  .chart {
    height: 280px;
    width: 100%;
  }

  .storage-meta {
    font-size: $font-size-caption;
    color: $color-neutral-7;

    strong {
      color: $color-primary-6;
      font-weight: $font-weight-medium;
    }
  }

  .expiring-body {
    padding: $spacing-3 $spacing-4 !important;
  }

  .expiring-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .expiring-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-2 0;
    border-bottom: 1px dashed $color-neutral-4;

    &:last-child {
      border-bottom: none;
    }
  }

  .expiring-info {
    flex: 1;
    min-width: 0;
  }

  .expiring-name {
    font-size: $font-size-body;
    color: $color-neutral-10;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }

  .expiring-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: $font-size-caption;
    color: $color-neutral-7;
    margin-top: 2px;

    .dot {
      color: $color-neutral-5;
    }
  }

  .expiring-days {
    color: $color-warning-6;

    &.urgent {
      color: $color-error-6;
      font-weight: $font-weight-medium;
    }
  }
}
</style>