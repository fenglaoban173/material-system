<template>
  <div class="requirement-page">
    <div class="page-header"></div>

    <div class="filter-bar">
      <div class="filter-row">
        <span class="filter-label">需求名称</span>
        <a-input-search v-model="filters.keyword" placeholder="搜索需求名称" style="width: 200px;" @search="handleSearch" />
        <span class="filter-label">状态</span>
        <a-select v-model="filters.status" placeholder="请选择" style="width: 120px;">
          <a-option value="">全部</a-option>
          <a-option value="PENDING">待接单</a-option>
          <a-option value="PROCESSING">进行中</a-option>
          <a-option value="COMPLETED">已完成</a-option>
          <a-option value="REVOKED">已撤销</a-option>
        </a-select>
        <span class="filter-label">媒体</span>
        <a-select v-model="filters.media" placeholder="请选择" multiple allow-clear style="width: 200px;">
          <a-option v-for="opt in mediaOptions" :key="opt" :value="opt">{{ opt }}</a-option>
        </a-select>
        <span class="filter-label">素材类型</span>
        <a-cascader
          v-model="filters.typePath"
          :options="typeOptions"
          placeholder="请选择"
          style="width: 160px;"
        />
        <span class="filter-label">需求创建人</span>
        <a-input v-model="filters.creator" placeholder="请输入" style="width: 120px;" />
      </div>
      <div class="filter-row">
        <span class="filter-label">集团</span>
        <a-select
          v-model="filters.groupId"
          placeholder="请选择"
          allow-clear
          filterable
          style="width: 160px;"
        >
          <a-option v-for="opt in groupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-option>
        </a-select>
        <span class="filter-label">客户名称</span>
        <a-input v-model="filters.customerName" placeholder="请输入" style="width: 120px;" />
        <span class="filter-label">需求创建时间</span>
        <a-range-picker v-model="filters.dateRange" style="width: 240px;" />
        <div class="filter-actions">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </div>
      </div>
    </div>

    <div class="data-section">
      <div class="section-toolbar">
        <a-button type="primary" @click="handleCreate">
          <template #icon><IconPlus /></template>
          新建需求
        </a-button>
      </div>

      <a-table
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 1600 }"
      row-key="id"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #columns>
        <a-table-column title="集团" data-index="groupName" :width="120" :fixed="'left'" />
        <a-table-column title="客户名称" data-index="customerName" :width="140" :fixed="'left'" />
        <a-table-column title="需求状态" data-index="status" :width="120" :fixed="'left'">
          <template #cell="{ record }">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="需求ID" data-index="demandId" :width="180" />
        <a-table-column title="需求名称" data-index="name" :width="180" />
        <a-table-column title="需求类型" data-index="source" :width="100">
          <template #cell="{ record }">
            <a-tag :color="getSourceColor(record.source)">{{ record.source }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="素材类型" :width="250">
          <template #cell="{ record }">
            <div class="cell-materials">
              <div
                v-for="(item, idx) in (record.materialItems || [])"
                :key="idx"
                class="cell-material-row"
              >
                <a-tag :color="getTypePathColor(item.typePath)" size="small">
                  {{ getTypePathText(item.typePath) }}
                </a-tag>
                <span class="item-format">{{ item.format }}</span>
              </div>
              <span v-if="!record.materialItems || record.materialItems.length === 0">-</span>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="素材总数" :width="90">
          <template #cell="{ record }">
            <span class="highlight">{{ calcTotalCount(record.materialItems) }}</span>
          </template>
        </a-table-column>
        <a-table-column title="所需工时(H)" :width="130">
          <template #cell="{ record }">
            <span class="highlight">{{ calcTotalHours(record.materialItems).toFixed(1) }}</span>
          </template>
        </a-table-column>
        <a-table-column title="实际上传数量" data-index="uploadedCount" :width="120" />
        <a-table-column title="需求创建时间" data-index="createTime" :width="180" />
        <a-table-column title="预期完成时间" data-index="expectedFinishTime" :width="180" />
        <a-table-column title="需求完成时间" data-index="finishTime" :width="180" />
        <a-table-column title="媒体" data-index="media" :width="140">
          <template #cell="{ record }">
            <span>{{ formatMedia(record.media) }}</span>
          </template>
        </a-table-column>
        <a-table-column title="需求描述" data-index="description" :width="200">
          <template #cell="{ record }">
            <a-tooltip :content="record.description" background-color="#1D2129" :style="{ maxWidth: '400px' }">
              <span class="desc-text">{{ record.description }}</span>
            </a-tooltip>
          </template>
        </a-table-column>
        <a-table-column title="需求创建人" data-index="creator" :width="120" />
        <a-table-column title="操作" :width="480" :fixed="'right'" align="center">
          <template #cell="{ record }">
            <div style="display: flex; gap: 8px;">
              <a-button type="text" size="small" @click="handleDetail(record)"><span style="color:#165DFF">详情</span></a-button>
              <a-button type="text" size="small" @click="handleCopy(record)"><span style="color:#722ED1">复制</span></a-button>
              <a-button type="text" size="small" @click="handleVideoAssignInRow(record)"><span style="color:#165DFF">视频分配</span></a-button>
              <a-button type="text" size="small" :disabled="record.status !== 'PROCESSING'" @click="handleConfirmComplete(record)"><span :style="{ color: record.status === 'PROCESSING' ? '#165DFF' : '#C9CDD4' }">确认完成</span></a-button>
              <a-button type="text" size="small" :disabled="record.status !== 'PENDING'" @click="handleRevoke(record)"><span :style="{ color: record.status === 'PENDING' ? '#F53F3F' : '#C9CDD4' }">撤销</span></a-button>
            </div>
          </template>
        </a-table-column>
      </template>
    </a-table>
    </div>

    <!-- 新建需求抽屉 -->
    <a-drawer v-model:visible="showCreateDrawer" title="新建需求" :width="960" unmountOnClose>
      <div class="drawer-form">
        <a-form ref="createFormRef" :model="createForm" :rules="createFormRules" layout="vertical">
          <a-form-item label="集团" field="groupId">
            <a-select
              v-model="createForm.groupId"
              placeholder="请选择集团"
              allow-clear
              filterable
              style="width: 100%;"
            >
              <a-option v-for="opt in groupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="客户名称" field="customerName">
            <a-input v-model="createForm.customerName" placeholder="请输入客户名称（选填）" />
          </a-form-item>
          <a-form-item label="需求名称" field="name">
            <a-input v-model="createForm.name" placeholder="请输入需求名称" :max-length="100" show-word-limit />
          </a-form-item>
          <a-form-item label="需求类型" field="source">
            <a-radio-group v-model="createForm.source">
              <a-radio value="代运营">代运营</a-radio>
              <a-radio value="服务单">服务单</a-radio>
              <a-radio value="采买">采买</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="素材清单" field="materialCategory">
            <a-radio-group v-model="createForm.materialCategory">
              <a-radio value="VIDEO">视频</a-radio>
              <a-radio value="IMAGE">平面</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="createForm.materialCategory" label="素材组合" field="materialItems">
            <a-table
              :data="createForm.materialItems"
              :pagination="false"
              :bordered="{ cell: true }"
              row-key="__idx"
              class="material-items-table"
              :row-class="(record, idx) => isDuplicateRow(createForm.materialItems, idx) ? 'row-duplicate' : ''"
            >
              <template #columns>
                <a-table-column :width="200">
                  <template #title>
                    <span class="required-mark">*</span>
                    <span>素材类型</span>
                  </template>
                  <template #cell="{ record, rowIndex }">
                    <a-tooltip
                      :content="isDuplicateRow(createForm.materialItems, rowIndex) ? '该组合与前面行重复' : (getFieldError(record) === 'typePath' ? FIELD_ERROR_MSG.typePath : '')"
                      :disabled="!isDuplicateRow(createForm.materialItems, rowIndex) && getFieldError(record) !== 'typePath'"
                    >
                      <a-cascader
                        v-model="createForm.materialItems[rowIndex].typePath"
                        :options="createTypeOptions"
                        placeholder="请选择"
                        allow-clear
                        path-mode
                        :class="{ 'is-error': isDuplicateRow(createForm.materialItems, rowIndex) || getFieldError(record) === 'typePath' }"
                        @change="handleTypePathChange('create', rowIndex)"
                      />
                    </a-tooltip>
                  </template>
                </a-table-column>
                <a-table-column :width="150">
                  <template #title>
                    <span class="required-mark">*</span>
                    <span>素材版式</span>
                  </template>
                  <template #cell="{ record, rowIndex }">
                    <a-tooltip
                      :content="getFieldError(record) === 'format' ? FIELD_ERROR_MSG.format : ''"
                      :disabled="getFieldError(record) !== 'format'"
                    >
                      <a-select
                        v-model="createForm.materialItems[rowIndex].format"
                        placeholder="请选择"
                        allow-clear
                        :disabled="!record.typePath?.length"
                        :class="{ 'is-error': getFieldError(record) === 'format' }"
                      >
                        <a-option v-for="opt in getFormatOptions(record.typePath || [])" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </a-option>
                      </a-select>
                    </a-tooltip>
                  </template>
                </a-table-column>
                <a-table-column :width="90">
                  <template #title>
                    <span class="required-mark">*</span>
                    <span>数量</span>
                  </template>
                  <template #cell="{ record, rowIndex }">
                    <a-tooltip
                      :content="getFieldError(record) === 'count' ? FIELD_ERROR_MSG.count : ''"
                      :disabled="getFieldError(record) !== 'count'"
                    >
                      <a-input-number
                        v-model="createForm.materialItems[rowIndex].count"
                        :min="1"
                        :precision="0"
                        :class="{ 'is-error': getFieldError(record) === 'count' }"
                        style="width: 80px"
                      />
                    </a-tooltip>
                  </template>
                </a-table-column>
                <a-table-column title="平均工时" :width="100">
                  <template #cell="{ record }">
                    <span class="hours-text">{{ calcHoursPerUnit(record) }} h/条</span>
                  </template>
                </a-table-column>
                <a-table-column title="所需工时" :width="100">
                  <template #cell="{ record }">
                    <span class="hours-text hours-total">{{ calcItemHours(record).toFixed(1) }} h</span>
                  </template>
                </a-table-column>
                <a-table-column title="操作" :width="60">
                  <template #cell="{ rowIndex }">
                    <a-button
                      type="text"
                      size="small"
                      :disabled="createForm.materialItems.length <= 1"
                      @click="handleRemoveItem('create', rowIndex)"
                    >
                      <template #icon><icon-delete /></template>
                    </a-button>
                  </template>
                </a-table-column>
              </template>
              <template #footer>
                <div class="material-items-footer">
                  <a-button type="dashed" size="small" @click="handleAddItem('create')">
                    <template #icon><icon-plus /></template>
                    添加素材组合
                  </a-button>
                  <div class="footer-totals">
                    <span class="total-count">共计条数：{{ calcTotalCount(createForm.materialItems) }} 条</span>
                    <span class="total-hours">共计工时：{{ calcTotalHours(createForm.materialItems).toFixed(1) }} 小时</span>
                  </div>
                </div>
              </template>
            </a-table>
          </a-form-item>
          <a-form-item label="预期完成时间" field="expectedFinishTime">
            <a-date-picker v-model="createForm.expectedFinishTime" style="width: 100%;" />
          </a-form-item>
          <a-form-item label="媒体平台" field="media">
            <a-select v-model="createForm.media" placeholder="请选择媒体平台" multiple allow-clear>
              <a-option v-for="opt in mediaOptions" :key="opt" :value="opt">{{ opt }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="产品行业" field="industry">
            <a-select v-model="createForm.industry" placeholder="请选择产品行业" allow-clear>
              <a-option value="电商">电商</a-option>
              <a-option value="美妆">美妆</a-option>
              <a-option value="食品">食品</a-option>
              <a-option value="服装">服装</a-option>
              <a-option value="汽车">汽车</a-option>
              <a-option value="教育">教育</a-option>
              <a-option value="金融">金融</a-option>
              <a-option value="医疗">医疗</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="指派团队" field="team">
            <a-select
              v-model="createForm.team"
              placeholder="请选择指派团队"
              allow-clear
            >
              <a-option value="成都团队">成都团队</a-option>
              <a-option value="北京团队">北京团队</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="需求描述" field="description">
            <a-textarea v-model="createForm.description" placeholder="请输入需求描述" :max-length="500" show-word-limit :rows="4" />
          </a-form-item>
        </a-form>
      </div>
    </a-drawer>

    <!-- 复制需求抽屉 -->
    <a-drawer v-model:visible="showCopyDrawer" title="复制需求" :width="960" unmountOnClose>
      <div class="drawer-form">
        <a-form ref="copyFormRef" :model="copyForm" :rules="copyFormRules" layout="vertical">
          <a-form-item label="集团" field="groupId">
            <a-select
              v-model="copyForm.groupId"
              placeholder="请选择集团"
              allow-clear
              filterable
              style="width: 100%;"
            >
              <a-option v-for="opt in groupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="客户名称" field="customerName">
            <a-input v-model="copyForm.customerName" placeholder="请输入客户名称（选填）" />
          </a-form-item>
          <a-form-item label="需求名称" field="name">
            <a-input v-model="copyForm.name" placeholder="请输入需求名称" :max-length="100" show-word-limit />
          </a-form-item>
          <a-form-item label="需求类型" field="source">
            <a-radio-group v-model="copyForm.source">
              <a-radio value="代运营">代运营</a-radio>
              <a-radio value="服务单">服务单</a-radio>
              <a-radio value="采买">采买</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="素材清单" field="materialCategory">
            <a-radio-group v-model="copyForm.materialCategory">
              <a-radio value="VIDEO">视频</a-radio>
              <a-radio value="IMAGE">平面</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="copyForm.materialCategory" label="素材组合" field="materialItems">
            <a-table
              :data="copyForm.materialItems"
              :pagination="false"
              :bordered="{ cell: true }"
              row-key="__idx"
              class="material-items-table"
              :row-class="(record, idx) => isDuplicateRow(copyForm.materialItems, idx) ? 'row-duplicate' : ''"
            >
              <template #columns>
                <a-table-column :width="200">
                  <template #title>
                    <span class="required-mark">*</span>
                    <span>素材类型</span>
                  </template>
                  <template #cell="{ record, rowIndex }">
                    <a-tooltip
                      :content="isDuplicateRow(copyForm.materialItems, rowIndex) ? '该组合与前面行重复' : (getFieldError(record) === 'typePath' ? FIELD_ERROR_MSG.typePath : '')"
                      :disabled="!isDuplicateRow(copyForm.materialItems, rowIndex) && getFieldError(record) !== 'typePath'"
                    >
                      <a-cascader
                        v-model="copyForm.materialItems[rowIndex].typePath"
                        :options="copyTypeOptions"
                        placeholder="请选择"
                        allow-clear
                        path-mode
                        :class="{ 'is-error': isDuplicateRow(copyForm.materialItems, rowIndex) || getFieldError(record) === 'typePath' }"
                        @change="handleTypePathChange('copy', rowIndex)"
                      />
                    </a-tooltip>
                  </template>
                </a-table-column>
                <a-table-column :width="150">
                  <template #title>
                    <span class="required-mark">*</span>
                    <span>素材版式</span>
                  </template>
                  <template #cell="{ record, rowIndex }">
                    <a-tooltip
                      :content="getFieldError(record) === 'format' ? FIELD_ERROR_MSG.format : ''"
                      :disabled="getFieldError(record) !== 'format'"
                    >
                      <a-select
                        v-model="copyForm.materialItems[rowIndex].format"
                        placeholder="请选择"
                        allow-clear
                        :disabled="!record.typePath?.length"
                        :class="{ 'is-error': getFieldError(record) === 'format' }"
                      >
                        <a-option v-for="opt in getFormatOptions(record.typePath || [])" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </a-option>
                      </a-select>
                    </a-tooltip>
                  </template>
                </a-table-column>
                <a-table-column :width="90">
                  <template #title>
                    <span class="required-mark">*</span>
                    <span>数量</span>
                  </template>
                  <template #cell="{ record, rowIndex }">
                    <a-tooltip
                      :content="getFieldError(record) === 'count' ? FIELD_ERROR_MSG.count : ''"
                      :disabled="getFieldError(record) !== 'count'"
                    >
                      <a-input-number
                        v-model="copyForm.materialItems[rowIndex].count"
                        :min="1"
                        :precision="0"
                        :class="{ 'is-error': getFieldError(record) === 'count' }"
                        style="width: 80px"
                      />
                    </a-tooltip>
                  </template>
                </a-table-column>
                <a-table-column title="平均工时" :width="100">
                  <template #cell="{ record }">
                    <span class="hours-text">{{ calcHoursPerUnit(record) }} h/条</span>
                  </template>
                </a-table-column>
                <a-table-column title="所需工时" :width="100">
                  <template #cell="{ record }">
                    <span class="hours-text hours-total">{{ calcItemHours(record).toFixed(1) }} h</span>
                  </template>
                </a-table-column>
                <a-table-column title="操作" :width="60">
                  <template #cell="{ rowIndex }">
                    <a-button
                      type="text"
                      size="small"
                      :disabled="copyForm.materialItems.length <= 1"
                      @click="handleRemoveItem('copy', rowIndex)"
                    >
                      <template #icon><icon-delete /></template>
                    </a-button>
                  </template>
                </a-table-column>
              </template>
              <template #footer>
                <div class="material-items-footer">
                  <a-button type="dashed" size="small" @click="handleAddItem('copy')">
                    <template #icon><icon-plus /></template>
                    添加素材组合
                  </a-button>
                  <div class="footer-totals">
                    <span class="total-count">共计条数：{{ calcTotalCount(copyForm.materialItems) }} 条</span>
                    <span class="total-hours">共计工时：{{ calcTotalHours(copyForm.materialItems).toFixed(1) }} 小时</span>
                  </div>
                </div>
              </template>
            </a-table>
          </a-form-item>
          <a-form-item label="预期完成时间" field="expectedFinishTime">
            <a-date-picker v-model="copyForm.expectedFinishTime" style="width: 100%;" />
          </a-form-item>
          <a-form-item label="媒体平台" field="media">
            <a-select v-model="copyForm.media" placeholder="请选择媒体平台" multiple allow-clear>
              <a-option v-for="opt in mediaOptions" :key="opt" :value="opt">{{ opt }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="产品行业" field="industry">
            <a-select v-model="copyForm.industry" placeholder="请选择产品行业" allow-clear>
              <a-option value="电商">电商</a-option>
              <a-option value="美妆">美妆</a-option>
              <a-option value="食品">食品</a-option>
              <a-option value="服装">服装</a-option>
              <a-option value="汽车">汽车</a-option>
              <a-option value="教育">教育</a-option>
              <a-option value="金融">金融</a-option>
              <a-option value="医疗">医疗</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="指派团队" field="team">
            <a-select
              v-model="copyForm.team"
              placeholder="请选择指派团队"
              allow-clear
            >
              <a-option value="成都团队">成都团队</a-option>
              <a-option value="北京团队">北京团队</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="需求描述" field="description">
            <a-textarea v-model="copyForm.description" placeholder="请输入需求描述" :max-length="500" show-word-limit :rows="4" />
          </a-form-item>
        </a-form>
      </div>
    </a-drawer>

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

    <!-- 视频分配弹窗 -->
    <a-modal v-model:visible="showVideoAssignModal" title="视频分配" :width="900" :footer="false" centered>
      <div class="video-assign-modal">
        <div class="assign-left">
          <div class="info-row">
            <span class="info-label">需求名称</span>
            <span class="info-value">{{ videoAssignData.name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">需求ID</span>
            <span class="info-value">{{ videoAssignData.demandId || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">集团</span>
            <span class="info-value">{{ videoAssignData.groupName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">客户名称</span>
            <span class="info-value">{{ videoAssignData.customerName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">需求类型</span>
            <span class="info-value">{{ videoAssignData.source || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">指派团队</span>
            <span class="info-value">{{ videoAssignData.assignTeam || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">产品行业</span>
            <span class="info-value">{{ videoAssignData.industry || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">媒体平台</span>
            <span class="info-value">{{ formatMedia(videoAssignData.media) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">素材清单</span>
            <div class="info-value material-items-list">
              <div
                v-for="(item, idx) in videoAssignData.materialItems"
                :key="idx"
                class="material-item-row"
              >
                <a-tag :color="getTypePathColor(item.typePath)" size="small">
                  {{ getTypePathText(item.typePath) }}
                </a-tag>
                <span class="item-format">{{ item.format || '-' }}</span>
                <span class="item-count">x {{ item.count || 0 }}</span>
              </div>
              <span v-if="!videoAssignData.materialItems || videoAssignData.materialItems.length === 0">-</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">素材总数</span>
            <span class="info-value highlight">{{ calcTotalCount(videoAssignData.materialItems) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">需求创建人</span>
            <span class="info-value">{{ videoAssignData.creator || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">需求描述</span>
            <span class="info-value">{{ videoAssignData.description || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">预期完成时间</span>
            <span class="info-value">{{ videoAssignData.expectedFinishTime || '-' }}</span>
          </div>
        </div>
        <div class="assign-divider"></div>
        <div class="assign-right">
          <div v-for="(item, idx) in videoAssignData.materialItems" :key="idx" class="item-assign-block">
            <div class="item-assign-header">
              <a-tag :color="getTypePathColor(item.typePath)" size="small">
                {{ getTypePathText(item.typePath) }}
              </a-tag>
              <span class="item-assign-format">{{ item.format }}</span>
              <span class="item-assign-total">x {{ item.count }}</span>
              <span class="item-assign-hours">{{ calcItemHours(item).toFixed(1) }} h</span>
              <span
                class="item-assign-progress"
                :class="{ 'is-done': calcItemAssigned(idx) === item.count, 'is-partial': calcItemAssigned(idx) > 0 && calcItemAssigned(idx) < item.count }"
              >
                {{ calcItemAssigned(idx) }} / {{ item.count }}
              </span>
            </div>
            <div class="form-item-row">
              <div class="form-item flex1">
                <a-select
                  v-model="newEditorName"
                  placeholder="搜索人员"
                  filterable
                  style="width: 100%;"
                >
                  <a-option value="张剪辑师">张剪辑师</a-option>
                  <a-option value="李剪辑师">李剪辑师</a-option>
                  <a-option value="王剪辑师">王剪辑师</a-option>
                  <a-option value="赵剪辑师">赵剪辑师</a-option>
                  <a-option value="刘剪辑师">刘剪辑师</a-option>
                </a-select>
              </div>
              <div class="form-item" style="width: 100px;">
                <span class="form-label">分配数量</span>
                <a-input-number v-model="newAssignCount" :min="1" placeholder="数量" style="width: 100%;" />
              </div>
              <a-button
                type="primary"
                style="margin-top: 22px;"
                :disabled="calcItemAssigned(idx) >= item.count"
                @click="addEditor(idx)"
              >添加</a-button>
            </div>
            <div class="editor-list">
              <div
                v-for="(editor, eIdx) in (itemEditorList[idx] || [])"
                :key="eIdx"
                class="editor-item"
                :class="{ 'is-accepted': editor.status === 'accepted' }"
              >
                <span class="editor-name">{{ editor.name }}</span>
                <a-tag
                  :color="editor.status === 'accepted' ? 'green' : 'orange'"
                  size="small"
                >
                  {{ editor.status === 'accepted' ? '已接单' : '待接单' }}
                </a-tag>
                <span class="editor-count">x {{ editor.count }}</span>
                <a-tooltip
                  :content="editor.status === 'accepted' ? '剪辑师已接单,不可调整' : '删除此分配,可重新指派'"
                >
                  <a-button
                    type="text"
                    size="small"
                    :disabled="editor.status === 'accepted'"
                    @click="removeEditor(idx, eIdx)"
                  >
                    <icon-close />
                  </a-button>
                </a-tooltip>
              </div>
              <div v-if="!(itemEditorList[idx] || []).length" class="editor-empty">— 暂未分配 —</div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <a-button @click="showVideoAssignModal = false">取消</a-button>
        <a-button type="primary" @click="handleVideoAssignConfirm">确定</a-button>
      </div>
    </a-modal>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  IconPlus,
  IconFile,
  IconVideoCamera,
  IconUser,
  IconHistory,
  IconFileAudio,
  IconShareAlt,
  IconEdit,
  IconDownload,
  IconSchedule,
  IconClose,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import type { MaterialItem } from '@/types/material'
import { Message, Modal } from '@arco-design/web-vue'

const loading = ref(false)
const showCreateDrawer = ref(false)
const showCopyDrawer = ref(false)
const showDetailModal = ref(false)
const detailRecord = ref<any>(null)
const playingVideos = reactive<Record<number, boolean>>({})
const showVideoModal = ref(false)
const currentVideoSrc = ref('')
const showVideoAssignModal = ref(false)
const videoAssignData = reactive({
  name: '',
  demandId: '',
  groupId: '',
  groupName: '',
  customerName: '',
  source: '',
  assignTeam: '',
  industry: '',
  media: [] as string[],
  materialItems: [] as MaterialItem[],
  creator: '',
  description: '',
  expectedFinishTime: '',
  editorName: '',
  assignCount: 1,
})
// 视频分配:每个素材组合独立维护编辑人员列表
// itemEditorList[itemIdx] = { name, count, status }[]
// status: 'pending' = 已分配未接单(可删可改) | 'accepted' = 已接单(锁定)
type EditorStatus = 'pending' | 'accepted'
const itemEditorList = ref<Record<number, { name: string; count: number; status: EditorStatus }[]>>({})
const newEditorName = ref('')
const newAssignCount = ref(1)
const activeAssignItemIdx = ref<number>(0)  // 当前正在为哪个组合分配

// 为指定素材组合添加编辑人员
const addEditor = (itemIdx: number) => {
  const name = newEditorName.value
  if (!name) return
  if (!itemEditorList.value[itemIdx]) {
    itemEditorList.value[itemIdx] = []
  }
  // 同一组合内同名人只累加数量,避免重复
  const existing = itemEditorList.value[itemIdx].find(e => e.name === name)
  if (existing) {
    if (existing.status === 'accepted') {
      Message.warning(`${name} 已接单,不能再调整分配`)
      return
    }
    existing.count += newAssignCount.value
  } else {
    itemEditorList.value[itemIdx].push({ name, count: newAssignCount.value, status: 'pending' })
  }
  newEditorName.value = ''
  newAssignCount.value = 1
}

const removeEditor = (itemIdx: number, editorIdx: number) => {
  itemEditorList.value[itemIdx]?.splice(editorIdx, 1)
}

// 计算某组合已分配数
const calcItemAssigned = (itemIdx: number) =>
  (itemEditorList.value[itemIdx] || []).reduce((sum, e) => sum + e.count, 0)

// 计算所有组合已分配总数
const calcTotalAssigned = () =>
  Object.values(itemEditorList.value).reduce(
    (sum, list) => sum + list.reduce((s, e) => s + e.count, 0),
    0,
  )

// 清空分配(弹窗关闭时调用)
const resetItemEditorList = () => {
  itemEditorList.value = {}
  newEditorName.value = ''
  newAssignCount.value = 1
  activeAssignItemIdx.value = 0
}

const statusLogs = ref([
  { time: '2024-06-18 09:30', actor: '张经理', action: '发布了视频需求', color: 'green' },
  { time: '2024-06-18 10:15', actor: '张经理', action: '指派给了个人（郭振宇、张三）', color: 'blue' },
  { time: '2024-06-18 14:20', actor: '郭振宇', action: '开始处理需求', color: 'blue' },
  { time: '2024-06-19 16:30', actor: '张三', action: '上传了3个素材', color: 'cyan' },
])
const createFormRef = ref()
const copyFormRef = ref()
const copyForm = reactive({
  name: '',
  source: '',
  team: '' as '' | '成都团队' | '北京团队',
  materialCategory: '' as '' | 'VIDEO' | 'IMAGE',
  materialItems: [
    { typePath: [] as string[], format: '', count: 1 },
  ] as MaterialItem[],
  media: [] as string[],
  groupId: '',
  customerName: '',
  description: '',
  expectedFinishTime: '',
  creatorName: '',
  industry: '',
})

const createForm = reactive({
  name: '',
  source: '',
  team: '' as '' | '成都团队' | '北京团队',
  materialCategory: '' as '' | 'VIDEO' | 'IMAGE',
  materialItems: [
    { typePath: [] as string[], format: '', count: 1 },
  ] as MaterialItem[],
  media: [] as string[],
  groupId: '',
  customerName: '',
  description: '',
  expectedFinishTime: '',
  creatorName: '',
  industry: '',
})

const createFormRules = {
  groupId: [{ required: true, message: '请选择集团' }],
  name: [{ required: true, message: '请输入需求名称' }],
  source: [{ required: true, message: '请选择需求类型' }],
  team: [{ required: true, message: '请选择指派团队' }],
  materialCategory: [{ required: true, message: '请选择素材类型' }],
  materialItems: [{
    required: true,
    validator: (value: MaterialItem[], callback: (error: string | undefined) => void) => {
      if (!value || value.length === 0) {
        callback('请至少添加一个素材组合')
        return
      }
      const invalid = value.findIndex(v =>
        !v.typePath || v.typePath.length === 0 ||
        !v.format ||
        !(typeof v.count === 'number' && v.count >= 1)
      )
      if (invalid >= 0) {
        callback(`第 ${invalid + 1} 行: 请补全类型/版式/数量`)
        return
      }
      const dup = findDuplicateIndex(value)
      if (dup >= 0) {
        callback(`第 ${dup + 1} 行与前面行重复`)
        return
      }
      callback(undefined)
    },
  }],
  expectedFinishTime: [{
    required: true,
    message: '请选择预期完成时间'
  }, {
    validator: (value: string, callback: (error: string | undefined) => void) => {
      if (!value) return callback(undefined)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(value)
      if (selectedDate < today) {
        callback('预期完成时间不能是历史日期')
      } else {
        callback(undefined)
      }
    }
  }],
  media: [{
    required: true,
    validator: (value: string[], callback: (error: string | undefined) => void) => {
      if (!value || value.length === 0) {
        callback('请至少选择一个媒体平台')
      } else {
        callback(undefined)
      }
    },
  }],
  description: [{ required: true, message: '请输入需求描述' }],
}

const copyFormRules = {
  groupId: [{ required: true, message: '请选择集团' }],
  name: [{ required: true, message: '请输入需求名称' }],
  source: [{ required: true, message: '请选择需求类型' }],
  team: [{ required: true, message: '请选择指派团队' }],
  materialCategory: [{ required: true, message: '请选择素材类型' }],
  materialItems: [{
    required: true,
    validator: (value: MaterialItem[], callback: (error: string | undefined) => void) => {
      if (!value || value.length === 0) {
        callback('请至少添加一个素材组合')
        return
      }
      const invalid = value.findIndex(v =>
        !v.typePath || v.typePath.length === 0 ||
        !v.format ||
        !(typeof v.count === 'number' && v.count >= 1)
      )
      if (invalid >= 0) {
        callback(`第 ${invalid + 1} 行: 请补全类型/版式/数量`)
        return
      }
      const dup = findDuplicateIndex(value)
      if (dup >= 0) {
        callback(`第 ${dup + 1} 行与前面行重复`)
        return
      }
      callback(undefined)
    },
  }],
  expectedFinishTime: [{
    required: true,
    message: '请选择预期完成时间'
  }, {
    validator: (value: string, callback: (error: string | undefined) => void) => {
      if (!value) return callback(undefined)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(value)
      if (selectedDate < today) {
        callback('预期完成时间不能是历史日期')
      } else {
        callback(undefined)
      }
    }
  }],
  assignTeam: [{ required: true, message: '请选择指派团队' }],
  media: [{
    required: true,
    validator: (value: string[], callback: (error: string | undefined) => void) => {
      if (!value || value.length === 0) {
        callback('请至少选择一个媒体平台')
      } else {
        callback(undefined)
      }
    },
  }],
  description: [{ required: true, message: '请输入需求描述' }],
}

// 根据 typePath 动态返回版式选项(替换原全局 materialFormatOptions)
const getFormatOptions = (typePath: string[]) => {
  const isVideo = typePath[0] === 'VIDEO'
  return isVideo
    ? [
        { label: '横版视频', value: '横版视频' },
        { label: '竖版视频', value: '竖版视频' },
      ]
    : [
        { label: '直播背景', value: '直播背景' },
        { label: '详情页', value: '详情页' },
        { label: '图片', value: '图片' },
        { label: '落地页', value: '落地页' },
        { label: '开屏/海报', value: '开屏/海报' },
      ]
}

// 计算素材总数量(累加所有组合)
const calcTotalCount = (items: MaterialItem[] = []) =>
  items.reduce((sum, item) => sum + (Number(item?.count) || 0), 0)

// 行级校验: 某行与前面的行重复
const isDuplicateRow = (items: MaterialItem[], rowIndex: number) => {
  const item = items[rowIndex]
  if (!item?.typePath?.length || !item.format) return false
  const key = item.typePath.join('/') + '|' + item.format
  for (let i = 0; i < rowIndex; i++) {
    const other = items[i]
    if (other?.typePath?.join('/') + '|' + other.format === key) return true
  }
  return false
}

// 行级校验: 该行字段级错误(typePath/format/count 任一缺失)
type FieldError = 'typePath' | 'format' | 'count' | null
const getFieldError = (item: MaterialItem | undefined): FieldError => {
  if (!item) return null
  if (!item.typePath || item.typePath.length === 0) return 'typePath'
  if (!item.format) return 'format'
  if (!item.count || item.count < 1) return 'count'
  return null
}

const FIELD_ERROR_MSG: Record<NonNullable<FieldError>, string> = {
  typePath: '请选择素材类型',
  format: '请选择版式',
  count: '请输入数量(≥1)',
}

// 表格行: typePath 变化时清空 format(版式可能不再适用)
const handleTypePathChange = (form: 'create' | 'copy', rowIndex: number) => {
  const target = form === 'create' ? createForm : copyForm
  if (target.materialItems[rowIndex]) {
    target.materialItems[rowIndex].format = ''
  }
}

// 添加素材组合
const handleAddItem = (form: 'create' | 'copy') => {
  const target = form === 'create' ? createForm : copyForm
  target.materialItems.push({
    typePath: [],
    format: '',
    count: 1,
  })
}

// 删除素材组合(至少保留 1 行)
const handleRemoveItem = (form: 'create' | 'copy', rowIndex: number) => {
  const target = form === 'create' ? createForm : copyForm
  if (target.materialItems.length <= 1) return
  target.materialItems.splice(rowIndex, 1)
}

// 校验: 检测同一需求内是否有重复 (typePath + format) 组合
const findDuplicateIndex = (items: MaterialItem[]) => {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (
        items[i].typePath.join('/') === items[j].typePath.join('/') &&
        items[i].format === items[j].format
      ) {
        return j
      }
    }
  }
  return -1
}

// typePath 转中文显示文案: ['IMAGE', 'IMAGE_DETAIL'] → '平面-详情页'
const TYPE_PATH_TEXT: Record<string, string> = {
  VIDEO: '视频',
  VIDEO_MIXCUT: '视频-混剪',
  VIDEO_TALK: '视频-单人口播',
  VIDEO_STORY: '视频-剧情',
  // 混剪孙子级
  VIDEO_MIXCUT_BKN: '视频-混剪-爆款裂变',
  VIDEO_MIXCUT_JTQ: '视频-混剪-加前后贴',
  VIDEO_MIXCUT_SP: '视频-混剪-实拍素材',
  VIDEO_MIXCUT_WB: '视频-混剪-无脚本混剪',
  VIDEO_MIXCUT_YB: '视频-混剪-有脚本混剪',
  // 剧情孙子级
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
  // 混剪孙子级
  '爆款裂变': 0.5,
  '加前后贴': 0.3,
  '实拍素材': 1.0,
  '无脚本混剪': 0.4,
  '有脚本混剪': 0.8,
  // 单人口播
  '单人口播': 1.0,
  // 剧情孙子级
  '单人剧情': 2.0,
  '多人剧情': 3.0,
  // 视频版式(fallback)
  '横版视频': 0.5,
  '竖版视频': 0.5,
  // 平面版式
  '直播背景': 0.3,
  '详情页': 0.2,
  '图片': 0.1,
  '落地页': 0.3,
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

const filters = reactive({
  keyword: '',
  status: '',
  media: [] as string[],
  type: '',
  typePath: [] as string[],
  creator: '',
  groupId: '',
  customerName: '',
  dateRange: [] as string[],
})
const tableData = ref([
  { id: 1, name: '618大促活动宣传素材', demandId: 'REQ202406180001', editorAssignments: { 0: [{ name: '张剪辑师', count: 5, status: 'pending' }, { name: '李剪辑师', count: 3, status: 'accepted' }] }, status: 'PROCESSING', source: '代运营', materialItems: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', count: 10 }], uploadedCount: 8, createTime: '2024-06-18 09:30', expectedFinishTime: '2024-06-25 18:00', uploadTime: '2024-06-19 14:20', finishTime: '-', groupId: 1, groupName: '阿里巴巴集团', customerName: '某知名电商客户', dailyCost: 25000, assignTeam: '创意团队A', media: ['抖音', '快手'], description: '618大促活动宣传视频素材，需要突出优惠力度', creator: '张经理', creatorName: '李设计师', creators: [
    { name: '李设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', count: 3 }] },
    { name: '王设计师', status: '待分配', statusColor: 'orange' },
    { name: '张设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', count: 4 }] },
    { name: '赵设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', count: 3 }] },
  ] },
  { id: 2, name: '新品上市海报设计', demandId: 'REQ202406150002', status: 'COMPLETED', source: '服务单', materialItems: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 5 }], uploadedCount: 5, createTime: '2024-06-15 10:00', expectedFinishTime: '2024-06-20 18:00', uploadTime: '2024-06-16 16:30', finishTime: '2024-06-19 11:00', groupId: 2, groupName: '字节跳动集团', customerName: '某美妆品牌', dailyCost: 12000, assignTeam: '设计团队B', media: ['小红书'], description: '新品上市系列海报，要求时尚简约风格', creator: '王总监', creatorName: '王设计师', creators: [
    { name: '王设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 2 }] },
    { name: '刘设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
    { name: '陈设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
    { name: '孙设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
  ] },
  { id: 3, name: '品牌升级宣传片', demandId: 'REQ202406100003', status: 'PENDING', source: '代运营', materialItems: [{ typePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_YB'], format: '横版视频', count: 8 }], uploadedCount: 0, createTime: '2024-06-10 08:00', expectedFinishTime: '2024-06-30 18:00', uploadTime: '-', finishTime: '-', groupId: 3, groupName: '腾讯集团', customerName: '某汽车品牌', dailyCost: 18000, assignTeam: '视频团队C', media: ['今日头条'], description: '品牌全新升级宣传片，体现品牌理念', creator: '刘总', creatorName: '待指派', creators: [
    { name: '待指派', status: '待分配', statusColor: 'orange' },
    { name: '周设计师', status: '待分配', statusColor: 'orange' },
    { name: '吴设计师', status: '待分配', statusColor: 'orange' },
    { name: '郑设计师', status: '待分配', statusColor: 'orange' },
  ] },
  { id: 4, name: '端午节活动素材', demandId: 'REQ202406050004', editorAssignments: { 0: [{ name: '赵剪辑师', count: 15, status: 'accepted' }] }, status: 'COMPLETED', source: '采买', materialItems: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 15 }], uploadedCount: 12, createTime: '2024-06-05 11:00', expectedFinishTime: '2024-06-10 18:00', uploadTime: '2024-06-07 09:15', finishTime: '-', groupId: 1, groupName: '阿里巴巴集团', customerName: '某餐饮连锁', dailyCost: 8000, assignTeam: '设计团队A', media: ['微博'], description: '端午节促销活动素材，融入传统文化元素', creator: '陈经理', creatorName: '赵设计师', creators: [
    { name: '赵设计师', status: '审核中', statusColor: 'arcoblue', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 3 }] },
    { name: '钱设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 5 }] },
    { name: '孙设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 4 }] },
    { name: '李设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 3 }] },
  ] },
  { id: 5, name: '夏季新品发布会预告', demandId: 'REQ202406010005', status: 'PROCESSING', source: '服务单', materialItems: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 3 }], uploadedCount: 3, createTime: '2024-06-01 15:00', expectedFinishTime: '2024-06-08 18:00', uploadTime: '2024-06-03 10:30', finishTime: '2024-06-06 14:00', groupId: 2, groupName: '字节跳动集团', customerName: '某服装品牌', dailyCost: 5000, assignTeam: '创意团队B', media: ['抖音'], description: '夏季新品发布会预热视频，时长15秒', creator: '周总', creatorName: '孙设计师', creators: [
    { name: '孙设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 1 }] },
    { name: '李设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 1 }] },
    { name: '王设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 1 }] },
    { name: '张设计师', status: '已完成', statusColor: 'green' },
  ] },
  { id: 6, name: '双十一预热短视频', demandId: 'REQ202406200006', editorAssignments: { 0: [{ name: '王剪辑师', count: 5, status: 'accepted' }], 1: [{ name: '孙剪辑师', count: 3, status: 'pending' }], 2: [] }, status: 'PENDING', source: '代运营', materialItems: [
    { typePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_WB'], format: '竖版视频', count: 5 },
    { typePath: ['VIDEO', 'VIDEO_STORY', 'VIDEO_STORY_SOLO'], format: '横版视频', count: 3 },
    { typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 4 },
  ], uploadedCount: 0, createTime: '2024-06-20 09:00', expectedFinishTime: '2024-07-01 18:00', uploadTime: '-', finishTime: '-', groupId: 3, groupName: '腾讯集团', customerName: '某零食品牌', dailyCost: 30000, assignTeam: '视频团队A', media: ['抖音', '快手'], description: '双十一活动预热视频，突出促销力度', creator: '李经理', creatorName: '待指派', creators: [
    { name: '待指派', status: '待分配', statusColor: 'orange' },
    { name: '周设计师', status: '待分配', statusColor: 'orange' },
    { name: '吴设计师', status: '待分配', statusColor: 'orange' },
    { name: '郑设计师', status: '待分配', statusColor: 'orange' },
  ] },
  { id: 7, name: '品牌联名海报设计', demandId: 'REQ202406210007', status: 'PROCESSING', source: '服务单', materialItems: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 6 }], uploadedCount: 4, createTime: '2024-06-21 14:00', expectedFinishTime: '2024-06-28 18:00', uploadTime: '2024-06-23 11:20', finishTime: '-', groupId: 1, groupName: '阿里巴巴集团', customerName: '某运动品牌', dailyCost: 6500, assignTeam: '设计团队C', media: ['小红书'], description: '与国际品牌联名限定款宣传海报', creator: '赵总监', creatorName: '刘设计师', creators: [
    { name: '刘设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 2 }] },
    { name: '陈设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 2 }] },
    { name: '黄设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 2 }] },
    { name: '林设计师', status: '待分配', statusColor: 'orange' },
  ] },
  { id: 8, name: '产品讲解视频', demandId: 'REQ202406220008', status: 'COMPLETED', source: '采买', materialItems: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 5 }], uploadedCount: 5, createTime: '2024-06-22 10:30', expectedFinishTime: '2024-06-27 18:00', uploadTime: '2024-06-24 15:00', finishTime: '-', groupId: 2, groupName: '字节跳动集团', customerName: '某家电品牌', dailyCost: 15000, assignTeam: '视频团队B', media: ['今日头条'], description: '新产品功能讲解视频，时长2分钟', creator: '孙总', creatorName: '陈设计师', creators: [
    { name: '陈设计师', status: '审核中', statusColor: 'arcoblue', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 1 }] },
    { name: '徐设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 2 }] },
    { name: '王设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 1 }] },
    { name: '赵设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 1 }] },
  ] },
  { id: 9, name: '七夕情人节营销素材', demandId: 'REQ202406230009', status: 'PENDING', source: '采买', materialItems: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 8 }], uploadedCount: 0, createTime: '2024-06-23 16:00', expectedFinishTime: '2024-07-05 18:00', uploadTime: '-', finishTime: '-', groupId: 3, groupName: '腾讯集团', customerName: '某珠宝品牌', dailyCost: 22000, assignTeam: '创意团队A', media: ['微博', '小红书'], description: '七夕情人节直播背景，浪漫温馨风格', creator: '吴经理', creatorName: '待指派', creators: [
    { name: '待指派', status: '待分配', statusColor: 'orange' },
    { name: '周设计师', status: '待分配', statusColor: 'orange' },
    { name: '吴设计师', status: '待分配', statusColor: 'orange' },
    { name: '郑设计师', status: '待分配', statusColor: 'orange' },
  ] },
  { id: 10, name: '企业宣传册设计', demandId: 'REQ202406240010', editorAssignments: { 0: [{ name: '冯剪辑师', count: 10, status: 'accepted' }, { name: '陈剪辑师', count: 10, status: 'accepted' }] }, status: 'COMPLETED', source: '代运营', materialItems: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 20 }], uploadedCount: 20, createTime: '2024-06-24 08:30', expectedFinishTime: '2024-06-30 18:00', uploadTime: '2024-06-26 09:00', finishTime: '2024-06-29 17:30', groupId: 1, groupName: '阿里巴巴集团', customerName: '某科技公司', dailyCost: 4500, assignTeam: '设计团队A', media: ['官网', '公众号'], description: '企业周年庆宣传册，涵盖公司发展历程', creator: '郑总', creatorName: '周设计师', creators: [
    { name: '周设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 5 }] },
    { name: '吴设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 5 }] },
    { name: '冯设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 5 }] },
    { name: '陈设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_POSTER'], format: '开屏/海报', count: 5 }] },
  ] },
  { id: 11, name: '中秋节活动海报', demandId: 'REQ202406250011', status: 'PROCESSING', source: '服务单', materialItems: [
    { typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 6 },
    { typePath: ['IMAGE', 'IMAGE_LANDING'], format: '落地页', count: 4 },
  ], uploadedCount: 6, createTime: '2024-06-25 11:00', expectedFinishTime: '2024-07-10 18:00', uploadTime: '2024-06-27 14:30', finishTime: '-', groupId: 2, groupName: '字节跳动集团', customerName: '某月饼品牌', dailyCost: 9500, assignTeam: '设计团队B', media: ['抖音', '微博'], description: '中秋节促销活动海报，融合传统文化', creator: '黄经理', creatorName: '林设计师', creators: [
    { name: '林设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 3 }, { typePath: ['IMAGE', 'IMAGE_LANDING'], format: '落地页', count: 2 }] },
    { name: '何设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 2 }, { typePath: ['IMAGE', 'IMAGE_LANDING'], format: '落地页', count: 1 }] },
    { name: '梁设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 1 }, { typePath: ['IMAGE', 'IMAGE_LANDING'], format: '落地页', count: 1 }] },
    { name: '张设计师', status: '待分配', statusColor: 'orange' },
  ] },
  { id: 12, name: '电商直播背景素材', demandId: 'REQ202406260012', status: 'COMPLETED', source: '采买', materialItems: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 4 }], uploadedCount: 4, createTime: '2024-06-26 15:30', expectedFinishTime: '2024-07-02 18:00', uploadTime: '2024-06-28 10:00', finishTime: '-', groupId: 3, groupName: '腾讯集团', customerName: '某服装电商', dailyCost: 3500, assignTeam: '创意团队C', media: ['淘宝直播'], description: '直播间背景素材，简约时尚风格', creator: '何总监', creatorName: '徐设计师', creators: [
    { name: '徐设计师', status: '审核中', statusColor: 'arcoblue', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
    { name: '郑设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
    { name: '朱设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
    { name: '王设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['IMAGE', 'IMAGE_LIVE_BG'], format: '直播背景', count: 1 }] },
  ] },
  { id: 13, name: '产品3D展示视频', demandId: 'REQ202406270013', status: 'PROCESSING', source: '代运营', materialItems: [
    { typePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_YB'], format: '横版视频', count: 4 },
    { typePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_WB'], format: '竖版视频', count: 2 },
  ], uploadedCount: 2, createTime: '2024-06-27 09:00', expectedFinishTime: '2024-07-08 18:00', uploadTime: '2024-06-28 16:00', finishTime: '-', groupId: 1, groupName: '阿里巴巴集团', customerName: '某家具品牌', dailyCost: 11000, assignTeam: '视频团队A', media: ['抖音', '小红书'], description: '产品3D建模展示视频，360度旋转效果', creator: '梁总', creatorName: '王设计师', creators: [
    { name: '王设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['VIDEO', 'VIDEO_MIXCUT'], format: '横版视频', count: 2 }, { typePath: ['VIDEO', 'VIDEO_MIXCUT'], format: '竖版视频', count: 1 }] },
    { name: '周设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_MIXCUT'], format: '横版视频', count: 1 }, { typePath: ['VIDEO', 'VIDEO_MIXCUT'], format: '竖版视频', count: 1 }] },
    { name: '刘设计师', status: '制作中', statusColor: 'blue', materials: [{ typePath: ['VIDEO', 'VIDEO_MIXCUT'], format: '横版视频', count: 1 }] },
    { name: '吴设计师', status: '待分配', statusColor: 'orange' },
  ] },
  { id: 14, name: '品牌故事图文', demandId: 'REQ202406280014', status: 'PENDING', source: '服务单', materialItems: [{ typePath: ['IMAGE', 'IMAGE_DETAIL'], format: '详情页', count: 9 }], uploadedCount: 0, createTime: '2024-06-28 14:00', expectedFinishTime: '2024-07-15 18:00', uploadTime: '-', finishTime: '-', groupId: 2, groupName: '字节跳动集团', customerName: '某护肤品牌', dailyCost: 7500, assignTeam: '设计团队C', media: ['小红书', '微博'], description: '品牌创始人故事图文，真实感人风格', creator: '冯经理', creatorName: '待指派', creators: [{ name: '待指派', status: '待分配', statusColor: 'orange' }, { name: '黄设计师', status: '待分配', statusColor: 'orange' }, { name: '林设计师', status: '待分配', statusColor: 'orange' }, { name: '何设计师', status: '待分配', statusColor: 'orange' }] },
  { id: 15, name: '年度盛典宣传片', demandId: 'REQ202406290015', status: 'COMPLETED', source: '采买', materialItems: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 2 }], uploadedCount: 2, createTime: '2024-06-29 10:00', expectedFinishTime: '2024-07-05 18:00', uploadTime: '2024-07-01 11:00', finishTime: '2024-07-04 15:00', groupId: 3, groupName: '腾讯集团', customerName: '某互联网公司', dailyCost: 35000, assignTeam: '视频团队B', media: ['官网', '视频号'], description: '公司年度盛典开场宣传片，气势磅礴', creator: '朱总', creatorName: '赵设计师', creators: [
    { name: '赵设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 1 }] },
    { name: '钱设计师', status: '已完成', statusColor: 'green', materials: [{ typePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', count: 1 }] },
    { name: '孙设计师', status: '已完成', statusColor: 'green' },
    { name: '李设计师', status: '已完成', statusColor: 'green' },
  ] },
])

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

// 按顶部单选结果过滤 cascader 可选项：选"视频"只看视频分支，选"平面"只看平面分支
const filterTypeOptions = (category: '' | 'VIDEO' | 'IMAGE') => {
  if (!category) return typeOptions
  return typeOptions.filter((opt) => opt.value === category)
}
const createTypeOptions = computed(() => filterTypeOptions(createForm.materialCategory))
const copyTypeOptions = computed(() => filterTypeOptions(copyForm.materialCategory))

// 重置素材清单为初始 1 行空数据
const resetMaterialItems = (target: typeof createForm | typeof copyForm) => {
  target.materialItems = [{ typePath: [], format: '', count: 1 }] as MaterialItem[]
}

// 单选切换素材类型：弹确认 Modal，确认后清空 materialItems，取消则回滚
const confirmCategoryChange = (
  form: 'create' | 'copy',
  newVal: '' | 'VIDEO' | 'IMAGE',
  oldVal: '' | 'VIDEO' | 'IMAGE',
) => {
  if (oldVal === newVal) return
  // 只处理"从一种类型切到另一种类型"的情况；空 ↔ 非空 不弹窗
  if (oldVal && newVal && oldVal !== newVal) {
    const target = form === 'create' ? createForm : copyForm
    const hasData = target.materialItems.some(
      (item) => item.typePath && item.typePath.length > 0,
    )
    if (hasData) {
      Modal.confirm({
        title: '切换素材类型',
        content: '切换素材类型会清空当前已填的素材组合，确定继续吗？',
        okText: '确定清空',
        cancelText: '取消',
        okButtonProps: { status: 'danger' },
        onOk: () => resetMaterialItems(target),
        onCancel: () => { target.materialCategory = oldVal },
      })
    } else {
      // 没填数据，直接重置为空行（不弹窗）
      resetMaterialItems(target)
    }
  }
}
watch(() => createForm.materialCategory, (newVal, oldVal) => confirmCategoryChange('create', newVal, oldVal))
watch(() => copyForm.materialCategory, (newVal, oldVal) => confirmCategoryChange('copy', newVal, oldVal))

// 集团选项(下拉搜索)
const groupOptions = [
  { value: 1, label: '阿里巴巴集团' },
  { value: 2, label: '字节跳动集团' },
  { value: 3, label: '腾讯集团' },
  { value: 4, label: '美团集团' },
  { value: 5, label: '京东集团' },
  { value: 6, label: '百度集团' },
  { value: 7, label: '拼多多集团' },
  { value: 8, label: '快手集团' },
  { value: 9, label: '小米集团' },
  { value: 10, label: '华为集团' },
  { value: 11, label: '网易集团' },
  { value: 12, label: '三只松鼠集团' },
  { value: 13, label: '完美日记集团' },
  { value: 14, label: '海底捞集团' },
  { value: 15, label: '农夫山泉集团' },
  { value: 16, label: '理想汽车集团' },
  { value: 17, label: '比亚迪集团' },
  { value: 18, label: '宁德时代集团' },
  { value: 19, label: '招商银行集团' },
  { value: 20, label: '中国平安集团' },
]

// 媒体平台选项(多选)
const mediaOptions = [
  '抖音',
  '今日头条',
  '快手',
  '微博',
  '小红书',
  '淘宝直播',
  '官网',
  '公众号',
  '视频号',
]

// 媒体平台格式化: 支持 string / string[] / undefined 三种入参
const formatMedia = (media?: string | string[]) => {
  if (Array.isArray(media)) return media.length ? media.join(' / ') : '-'
  return media || '-'
}

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 15,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100],
})

const handleSearch = () => {
  console.log('Search:', filters)
}

const handleReset = () => {
  filters.status = ''
  filters.media = []
  filters.type = ''
  filters.creator = ''
  filters.groupId = ''
  filters.customerName = ''
  filters.dateRange = []
}

const handlePageChange = (page: number) => {
  pagination.current = page
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
}

const handleCreate = () => {
  showCreateDrawer.value = true
}

const handleVideoAssignInRow = (record: any) => {
  videoAssignData.name = record.name
  videoAssignData.demandId = record.demandId
  videoAssignData.groupId = record.groupId || ''
  videoAssignData.groupName = record.groupName || ''
  videoAssignData.customerName = record.customerName || ''
  videoAssignData.source = record.source || ''
  videoAssignData.assignTeam = record.assignTeam || ''
  videoAssignData.industry = record.industry || ''
  videoAssignData.media = Array.isArray(record.media) ? [...record.media] : []
  videoAssignData.materialItems = (record.materialItems || []).map((m: MaterialItem) => ({
    typePath: Array.isArray(m.typePath) ? [...m.typePath] : [],
    format: m.format || '',
    count: Number(m.count) || 1,
  }))
  videoAssignData.creator = record.creator
  videoAssignData.description = record.description
  videoAssignData.expectedFinishTime = record.expectedFinishTime
  videoAssignData.editorName = ''
  videoAssignData.assignCount = 1
  // 加载已有分配(record.editorAssignments[itemIdx] = [{name,count,status}])
  // 深拷贝避免污染源数据
  const existing = record.editorAssignments || {}
  const loaded: Record<number, { name: string; count: number; status: EditorStatus }[]> = {}
  videoAssignData.materialItems.forEach((_, idx) => {
    if (Array.isArray(existing[idx])) {
      loaded[idx] = existing[idx].map((e: any) => ({
        name: e.name,
        count: Number(e.count) || 1,
        status: e.status === 'accepted' ? 'accepted' : 'pending',
      }))
    } else {
      loaded[idx] = []
    }
  })
  itemEditorList.value = loaded
  showVideoAssignModal.value = true
}

const handleVideoAssignConfirm = () => {
  const totalAssigned = calcTotalAssigned()
  const materialCount = calcTotalCount(videoAssignData.materialItems)
  // 同时检查每个组合是否分配完成
  const unfinishedItems = videoAssignData.materialItems
    .map((item, idx) => ({ idx, item, assigned: calcItemAssigned(idx) }))
    .filter(x => x.assigned !== x.item.count)
  const unfinishedDesc = unfinishedItems.length
    ? `未完成分配的组合: ${unfinishedItems.map(x => `${getTypePathText(x.item.typePath)}(${x.assigned}/${x.item.count})`).join('、')}`
    : ''
  if (totalAssigned !== materialCount || unfinishedItems.length) {
    Modal.confirm({
      title: '确认提交',
      content: `需求素材数量${materialCount}个，已分配${totalAssigned}个${unfinishedDesc ? '；' + unfinishedDesc : ''}。是否提交？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        showVideoAssignModal.value = false
        resetItemEditorList()
        Message.success('分配成功')
      },
    })
  } else {
    showVideoAssignModal.value = false
    resetItemEditorList()
    Message.success('分配成功')
  }
}

const handleVideoAssign = (record: any) => {
  Message.info('视频分配功能开发中')
}

const handleDetail = (record: any) => {
  detailRecord.value = record
  showDetailModal.value = true
}

const handleCopy = (record: any) => {
  copyForm.name = record.name
  copyForm.groupId = record.groupId
  // 校验 source 是否在新枚举内,避免复制后下拉无匹配项
  const validSources = ['代运营', '服务单', '采买']
  copyForm.source = validSources.includes(record.source) ? record.source : ''
  // 深拷贝素材清单,避免引用
  copyForm.materialItems = (record.materialItems || []).map((m: MaterialItem) => ({
    typePath: Array.isArray(m.typePath) ? [...m.typePath] : [],
    format: m.format || '',
    count: Number(m.count) || 1,
  }))
  copyForm.media = Array.isArray(record.media) ? [...record.media] : []
  copyForm.customerName = record.customerName || ''
  copyForm.description = record.description || ''
  copyForm.expectedFinishTime = record.expectedFinishTime || ''
  copyForm.creatorName = record.creatorName || ''
  copyForm.team = record.team || ''
  copyForm.industry = record.industry || ''
  copyForm.industry = ''
  showCopyDrawer.value = true
}

const handleRevoke = (record: any) => {
  if (record.status !== 'PENDING') {
    Message.warning('仅待接单状态的需求可撤销')
    return
  }
  Modal.warning({
    title: '撤销确认',
    content: `确定要撤销需求「${record.name}」吗？撤销后将变为已撤销状态。`,
    modalClass: 'revoke-modal',
    okText: '撤销',
    cancelText: '取消',
    onOk: () => {
      Message.success('撤销成功')
    },
  })
}

const handleConfirmComplete = (record: any) => {
  if (record.status !== 'PROCESSING') {
    Message.warning('仅进行中状态的需求可确认完成')
    return
  }
  Modal.confirm({
    title: '确认完成',
    content: `确定需求「${record.name}」已完成素材制作，可标记为已完成？`,
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      record.status = 'COMPLETED'
      Message.success('已标记为已完成')
    },
  })
}

const getSourceColor = (source?: string) => {
  const colorMap: Record<string, string> = {
    '代运营': 'blue',
    '服务单': 'cyan',
    '采买': 'orange',
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

const getPriorityColor = (priority: string) => {
  return priority === '高' ? 'red' : priority === '中' ? 'orange' : 'green'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'PENDING': 'orange',
    'PROCESSING': 'blue',
    'COMPLETED': 'green',
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PENDING': '待接单',
    'PROCESSING': '进行中',
    'COMPLETED': '已完成',
  }
  return texts[status] || status
}

const getStatusStepIndex = (status?: string) => {
  const stepMap: Record<string, number> = {
    'PENDING': 0,
    'PROCESSING': 1,
    'COMPLETED': 2,
  }
  return stepMap[status || 'PENDING'] ?? 0
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

const toggleVideo = (index: number) => {
  const video = document.getElementById(`video-${index}`) as HTMLVideoElement
  if (video) {
    if (playingVideos[index]) {
      video.pause()
      playingVideos[index] = false
    } else {
      video.play()
      playingVideos[index] = true
    }
  }
}
</script>

<style scoped lang="scss">
.requirement-page {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
    background: #FFFFFF;
    border-radius: 8px;
    margin-bottom: 12px;

    .filter-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .filter-label {
      font-size: 14px;
      color: #4E5969;
      white-space: nowrap;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: 8px;
    }
  }

  .data-section {
    background: #FFFFFF;
    border-radius: 8px;
    padding: 16px 20px;

    .section-toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
  }

  .desc-text {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .drawer-form {
    .drawer-footer {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--color-neutral-3);
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

.video-assign-modal {
  display: flex;
  gap: 16px;
  min-height: 400px;

  .assign-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .info-row {
      display: flex;
      align-items: center;

      .info-label {
        width: 100px;
        color: #86909C;
        font-size: 14px;
      }

      .info-value {
        flex: 1;
        color: #1D2129;
        font-size: 14px;
      }
    }
  }

  .assign-divider {
    width: 1px;
    background: #E5E6E8;
  }

  .assign-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .form-item-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;

      .flex1 {
        flex: 1;
      }
    }

    .form-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .form-label {
        font-size: 14px;
        color: #1D2129;
        font-weight: 500;
      }
    }

    .editor-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;

      .editor-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #F7F8FA;
        border-radius: 4px;

        .editor-name {
          flex: 1;
          font-size: 14px;
          color: #1D2129;
        }

        .editor-count {
          font-size: 14px;
          color: #86909C;
        }
      }
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #E5E6E8;
}

// 素材清单(多组合)样式
.cell-materials {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-material-row,
.material-item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.item-format {
  color: var(--color-text-1);
}

.item-count {
  color: var(--color-primary-6);
  font-weight: 600;
  font-size: 12px;
}

.material-items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.material-items-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  flex-wrap: wrap;
  gap: 8px;
}

// 表头必填星标(用于 a-table-column 的 #title 插槽)
.required-mark {
  color: #F53F3F;
  margin-right: 4px;
  font-weight: 600;
  line-height: 1;
}

.footer-totals {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.total-count,
.total-hours {
  font-size: 13px;
  color: var(--color-primary-6);
  font-weight: 600;
}

// 工时文字
.hours-text {
  font-size: 12px;
  color: var(--color-text-2);
}
.hours-total {
  color: var(--color-warning);
  font-weight: 600;
}

.item-hours,
.item-assign-hours {
  font-size: 12px;
  color: var(--color-warning);
  font-weight: 600;
  margin-left: 4px;
}

.material-items-table {
  width: 100%;
  // 重复行高亮(红色背景 + 边框)
  :deep(tr.row-duplicate) {
    background-color: rgba(245, 34, 45, 0.04);
    td {
      border-color: rgba(245, 34, 45, 0.4) !important;
    }
  }
  // 单元格级错误样式
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

// 视频分配 - 每组合独立分配
.item-assign-block {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--color-neutral-3);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
}

.item-assign-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;

  .item-assign-format {
    color: var(--color-text-1);
    font-weight: 500;
  }
  .item-assign-total {
    color: var(--color-text-2);
  }
  .item-assign-progress {
    margin-left: auto;
    font-size: 12px;
    color: var(--color-text-3);

    &.is-partial {
      color: #faad14;
      font-weight: 600;
    }
    &.is-done {
      color: #52c41a;
      font-weight: 600;
    }
  }
}

.editor-empty {
  font-size: 12px;
  color: var(--color-text-4);
  text-align: center;
  padding: 8px 0;
}

// 视频分配 - 剪辑师已接单的条目加锁样式
.editor-item.is-accepted {
  background: rgba(82, 196, 26, 0.04);
  border-left: 2px solid #52c41a;
}
</style>