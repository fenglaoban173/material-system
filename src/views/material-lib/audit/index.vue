<template>
  <div class="audit-page">
    <!-- 筛选区 -->
    <div class="filter-card">
      <div class="filter-row">
        <span class="filter-label">状态</span>
        <a-select v-model="filters.status" placeholder="全部" style="width: 140px;" allow-clear>
          <a-option value="">全部</a-option>
          <a-option value="PENDING">待审核</a-option>
          <a-option value="APPROVED">已通过</a-option>
          <a-option value="REJECTED">未通过</a-option>
        </a-select>
        <span class="filter-label">素材名称</span>
        <a-input v-model="filters.materialKeyword" placeholder="请输入" style="width: 180px;" />
        <span class="filter-label">发起人</span>
        <a-select v-model="filters.creator" placeholder="请选择发起人" style="width: 140px;" allow-clear>
          <a-option v-for="opt in creatorOptions" :key="opt" :value="opt">{{ opt }}</a-option>
        </a-select>
        <span class="filter-label">需求名称</span>
        <a-input v-model="filters.demandName" placeholder="请输入" style="width: 180px;" />
        <span class="filter-label">上传时间</span>
        <a-range-picker v-model="filters.createRange" style="width: 240px;" />
        <span class="range-sep">至</span>
        <a-range-picker v-model="filters.createRangeEnd" style="width: 240px;" />
        <div class="filter-actions">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </div>
      </div>
    </div>

    <!-- 批量操作条 -->
    <div class="batch-bar">
      <div class="batch-left">
        <a-button type="primary" :disabled="!selectedIds.length" @click="handleBatchPass">一键通过</a-button>
        <a-button status="danger" :disabled="!selectedIds.length" @click="handleBatchReject">一键不通过</a-button>
      </div>
      <div class="batch-right">
        <a-button @click="handleExport">导出审核记录</a-button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <a-table
        :data="pagedData"
        :pagination="pagination"
        row-key="id"
        :row-selection="{ type: 'checkbox', showCheckedAll: true, selectedRowKeys: selectedIds }"
        @selection-change="(keys: (string | number)[]) => (selectedIds = keys as number[])"
        @page-change="(p: number) => (pagination.current = p)"
        @page-size-change="handlePageSizeChange"
      >
        <template #columns>
          <a-table-column title="素材" :width="220">
            <template #cell="{ record }">
              <div class="material-cell" @click="handleMaterialDetail(record)">
                <div class="thumb">
                  <img v-if="record.thumb" :src="record.thumb" :alt="record.name" />
                  <IconImage v-else />
                </div>
                <div class="material-meta">
                  <div class="material-name" :title="record.name">{{ record.name }}</div>
                  <div class="material-tag">
                    <a-tag size="small" color="arcoblue">{{ record.format || '四流合一' }}</a-tag>
                  </div>
                </div>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="需求名称" data-index="demandName" :width="200" />
          <a-table-column title="状态" :width="100">
            <template #cell="{ record }">
              <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="发起人" :width="140">
            <template #cell="{ record }">
              <div class="creator-cell">
                <span class="creator-name">{{ record.creator }}</span>
                <span class="creator-time">{{ record.createTime }}</span>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="审核意见" data-index="comment" :width="160" />
          <a-table-column title="审核截图" :width="120">
            <template #cell="{ record }">
              <div v-if="record.screenshot" class="screenshot-cell">
                <a-tooltip :content="record.screenshot" background-color="#1D2129">
                  <img :src="record.screenshot" :alt="record.screenshot" class="screenshot-thumb" />
                </a-tooltip>
              </div>
              <span v-else>-</span>
            </template>
          </a-table-column>
          <a-table-column title="审核员" :width="160">
            <template #cell="{ record }">
              <div v-if="record.reviewer" class="creator-cell">
                <span class="creator-name">{{ record.reviewer }}</span>
                <span class="creator-time">{{ record.reviewTime }}</span>
              </div>
              <span v-else>-</span>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="292" fixed="right">
            <template #cell="{ record }">
              <a-button
                type="text"
                size="small"
                :disabled="record.status !== 'PENDING'"
                @click="handleOpenAudit(record)"
              >审核</a-button>
              <a-button type="text" size="small" @click="handleChangeLog(record)">变更记录</a-button>
              <a-button type="text" size="small" @click="handleDetails(record)">素材详情</a-button>
              <a-button
                type="text"
                size="small"
                :disabled="record.status !== 'REJECTED'"
                :style="{ color: record.status === 'REJECTED' ? '#165DFF' : '#C9CDD4' }"
                @click="handleOpenResubmit(record)"
              >重新提交</a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 审核不通过弹窗 -->
    <a-modal
      v-model:visible="showRejectModal"
      title="审核不通过"
      :width="1000"
      :mask-closable="false"
      :ok-text="'确定'"
      :cancel-text="'取消'"
      :on-before-ok="handleRejectSubmit"
      unmount-on-close
    >
      <div class="reject-modal">
        <p class="reject-tip">
          审核不通过的素材无法推送到账户，请确认相关素材是否合规规范。
        </p>

        <div class="reject-section">
          <div class="section-label">审核规则</div>
          <a-radio-group v-model="rejectForm.mode" type="button">
            <a-radio value="SHARED">共用审核意见</a-radio>
            <a-radio value="INDEPENDENT">独立填写审核意见</a-radio>
          </a-radio-group>
        </div>

        <!-- SHARED 模式：共用一份意见 + 截图 -->
        <template v-if="rejectForm.mode === 'SHARED'">
          <div class="reject-section">
            <div class="section-label">
              <span class="required-mark">*</span>
              <span>审核意见</span>
            </div>
            <a-textarea
              v-model="rejectForm.comment"
              placeholder="请输入内容"
              :max-length="128"
              :auto-size="{ minRows: 4, maxRows: 6 }"
              show-word-limit
              allow-clear
            />
          </div>

          <div class="reject-section">
            <div class="section-label-row">
              <span class="section-label">审核截图</span>
              <span class="section-hint">（支持截图后直接粘贴，最多上传9张截图，单张图片大小不超过5M）</span>
            </div>
            <div class="screenshot-list">
              <div
                v-for="(img, idx) in rejectForm.screenshots"
                :key="`shared-${idx}`"
                class="screenshot-item"
              >
                <img :src="img" :alt="`截图${idx + 1}`" />
                <a-button
                  type="text"
                  size="mini"
                  class="screenshot-remove"
                  @click="removeScreenshot(null, idx)"
                >
                  <template #icon><IconClose /></template>
                </a-button>
              </div>
              <div
                v-if="rejectForm.screenshots.length < 9"
                class="screenshot-upload"
                @click="triggerScreenshotUpload()"
              >
                <IconPlus />
              </div>
              <div v-else class="screenshot-limit">已达上限 9 张</div>
            </div>
          </div>
        </template>

        <!-- INDEPENDENT 模式：每条素材独立意见 + 截图 -->
        <template v-else>
          <div class="reject-section">
            <div class="section-label-row">
              <span class="section-hint">（每条素材需独立填写审核意见；单张图片不超过5M，最多上传9张）</span>
            </div>
            <div class="independent-table">
              <div class="independent-header">
                <div class="col col-thumb">素材</div>
                <div class="col col-name">素材名称</div>
                <div class="col col-comment">
                  <span class="required-mark">*</span>
                  <span>素材审核意见</span>
                </div>
                <div class="col col-screenshot">审核截图</div>
              </div>
              <div
                v-for="row in rejectForm.independentRows"
                :key="row.id"
                class="independent-row"
              >
                <div class="col col-thumb">
                  <div class="row-thumb">
                    <img v-if="row.thumb" :src="row.thumb" :alt="row.name" />
                    <IconImage v-else />
                  </div>
                </div>
                <div class="col col-name">
                  <div class="row-name" :title="row.name">{{ row.name }}</div>
                </div>
                <div class="col col-comment">
                  <a-textarea
                    v-model="row.comment"
                    placeholder="请输入审核意见"
                    :max-length="128"
                    :auto-size="{ minRows: 3, maxRows: 5 }"
                    show-word-limit
                    allow-clear
                  />
                </div>
                <div class="col col-screenshot">
                  <div class="row-screenshots">
                    <div
                      v-for="(img, idx) in row.screenshots"
                      :key="`row-${row.id}-${idx}`"
                      class="screenshot-item"
                    >
                      <img :src="img" :alt="`截图${idx + 1}`" />
                      <a-button
                        type="text"
                        size="mini"
                        class="screenshot-remove"
                        @click="removeScreenshot(row.id, idx)"
                      >
                        <template #icon><IconClose /></template>
                      </a-button>
                    </div>
                    <div
                      v-if="row.screenshots.length < 9"
                      class="screenshot-upload screenshot-upload-mini"
                      @click="triggerScreenshotUpload(row.id)"
                    >
                      <IconPlus />
                    </div>
                    <div v-else class="screenshot-limit">已达上限</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 共享隐藏 input：所有截图上传共用 -->
        <input
          ref="screenshotInputRef"
          type="file"
          accept="image/*"
          multiple
          style="display: none;"
          @change="handleScreenshotChange"
        />
      </div>
    </a-modal>

    <!-- 变更记录弹窗 -->
    <a-modal
      v-model:visible="showChangeLogModal"
      title="变更记录"
      :width="960"
      :footer="false"
      :mask-closable="true"
      unmount-on-close
    >
      <div class="change-log-modal">
        <a-table
          :data="changeLogList"
          :pagination="false"
          row-key="id"
        >
          <template #columns>
            <a-table-column title="操作时间" data-index="time" :width="160" />
            <a-table-column title="发起人" data-index="initiator" :width="100" />
            <a-table-column title="操作人" data-index="operator" :width="100" />
            <a-table-column title="操作" data-index="action" :width="120" />
            <a-table-column title="审核意见" data-index="comment" :width="120">
              <template #cell="{ record }">
                <span v-if="record.comment" class="staff-text">{{ record.comment }}</span>
                <span v-else class="muted">-</span>
              </template>
            </a-table-column>
            <a-table-column title="审核截图" :width="100">
              <template #cell="{ record }">
                <span v-if="record.screenshot" class="staff-text">查看</span>
                <span v-else class="muted">-</span>
              </template>
            </a-table-column>
            <a-table-column title="处理前状态" :width="120">
              <template #cell="{ record }">
                <a-tag :color="getStatusColor(record.beforeStatus)">{{ getStatusText(record.beforeStatus) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="处理后状态" :width="120">
              <template #cell="{ record }">
                <a-tag :color="getStatusColor(record.afterStatus)">{{ getStatusText(record.afterStatus) }}</a-tag>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </div>
    </a-modal>

    <!-- 素材审核弹窗 -->
    <a-modal
      v-model:visible="showReviewModal"
      width="min(1180px, calc(100vw - 48px))"
      :footer="false"
      :closable="false"
      :mask-closable="true"
      :body-style="{ padding: 0 }"
      class="review-modal"
      unmount-on-close
    >
      <div v-if="currentMaterialDetail" class="review-modal-inner">
        <div class="rm-header">
          <span class="rm-title">素材审核</span>
          <IconClose class="rm-close" tabindex="0" role="button" aria-label="关闭素材审核弹窗" @click="handleCloseAudit" @keydown.enter="handleCloseAudit" />
        </div>

        <div class="rm-body">
          <!-- 左侧：素材预览 + 基础信息 -->
          <div class="rm-left">
            <div class="rm-preview">
              <video
                v-if="isCurrentMaterialVideo && currentPreviewSource"
                ref="auditVideoRef"
                :src="currentPreviewSource"
                controls
                playsinline
                preload="metadata"
              />
              <img
                v-else-if="currentPreviewSource"
                :src="currentPreviewSource"
                :alt="currentMaterialDetail.name"
              />
              <div v-else class="rm-preview-placeholder">
                <IconImage />
                <span>暂无素材预览</span>
              </div>
            </div>

            <div class="rm-fields">
              <div class="rm-fld">
                <span class="rm-fld-l">素材名称：</span>
                <span class="rm-fld-v" :title="currentMaterialDetail.name">{{ currentMaterialDetail.name || '-' }}</span>
              </div>
              <div class="rm-fld">
                <span class="rm-fld-l">发起人：</span>
                <span class="rm-fld-v">{{ currentMaterialDetail.creator || '-' }}</span>
              </div>
              <div class="rm-fld">
                <span class="rm-fld-l">发起时间：</span>
                <span class="rm-fld-v">{{ currentMaterialDetail.createTime || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧：审核状态 + 审核记录 -->
          <div class="rm-right">
            <div class="rm-right-header">
              <h3>审核信息</h3>
            </div>

            <div class="rm-status-row">
              <span class="rm-status-label">内审状态：</span>
              <div class="rm-status-actions" role="group" aria-label="内审状态">
                <button
                  type="button"
                  class="rm-status-btn"
                  :class="{ 'is-active': auditDecision === 'APPROVED' }"
                  @click="handleAuditPass"
                >
                  通过
                </button>
                <button
                  type="button"
                  class="rm-status-btn"
                  :class="{ 'is-active': auditDecision === 'REJECTED' }"
                  @click="handleAuditReject"
                >
                  不通过
                </button>
              </div>
            </div>

            <div v-if="auditDecision === 'REJECTED'" class="rm-reject-panel" @paste="handleAuditScreenshotPaste">
              <div class="rm-reject-section">
                <label class="rm-reject-label" for="audit-reject-comment">
                  <span class="rm-required">*</span>
                  审批意见
                </label>
                <a-textarea
                  id="audit-reject-comment"
                  v-model="auditRejectForm.comment"
                  placeholder="请输入审批意见"
                  :max-length="128"
                  :auto-size="{ minRows: 4, maxRows: 4 }"
                  show-word-limit
                />
              </div>

              <div class="rm-reject-section">
                <div class="rm-reject-label-row">
                  <span class="rm-reject-label">上传截图</span>
                </div>
                <div class="rm-audit-screenshots">
                  <div
                    v-for="(image, index) in auditRejectForm.screenshots"
                    :key="`${image}-${index}`"
                    class="rm-audit-screenshot"
                  >
                    <img :src="image" :alt="`审核截图${index + 1}`" />
                    <button
                      type="button"
                      class="rm-audit-screenshot-remove"
                      :aria-label="`移除审核截图${index + 1}`"
                      @click="removeAuditScreenshot(index)"
                    >
                      <IconClose />
                    </button>
                  </div>
                  <button
                    v-if="auditRejectForm.screenshots.length < MAX_SCREENSHOT_COUNT"
                    type="button"
                    class="rm-audit-upload"
                    aria-label="上传审核截图"
                    @click="triggerAuditScreenshotUpload"
                  >
                    <IconPlus />
                  </button>
                </div>
                <div class="rm-upload-hint">最多上传 9 张，单张不超过 5M</div>
                <input
                  ref="auditScreenshotInputRef"
                  type="file"
                  accept="image/*"
                  multiple
                  class="rm-file-input"
                  @change="handleAuditScreenshotChange"
                />
              </div>
            </div>

            <div class="rm-audit-actions">
              <a-button @click="handleCloseAudit">取消</a-button>
              <a-button type="primary" @click="handleAuditSubmit">提交</a-button>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
    <!-- 素材详情右抽屉（按图片布局：左侧预览+3字段，右侧详情字段+9字段） -->
    <a-drawer
      v-model:visible="showMaterialDetail"
      placement="right"
      :width="1120"
      :footer="false"
      :header="false"
      :body-style="{ padding: 0, overflow: 'hidden' }"
    >
      <div v-if="currentMaterialDetail" class="detail-v2">
        <div class="dv-close" @click="showMaterialDetail = false">
          <IconClose />
        </div>

        <div class="dv-page">
          <!-- 顶部：预览 + 详情字段 -->
          <div class="dv-top">
            <!-- 上方：详情字段 -->
            <div class="dv-main">
              <div class="dv-header-box">
                <div class="dv-head">
                  <div class="dv-title-wrap">
                    <span class="dv-title" :title="currentMaterialDetail.name">{{ currentMaterialDetail.name }}</span>
                  </div>
                  <div class="dv-head-right">
                    <span class="dv-usage" :class="usageBadgeClass(currentMaterialDetail.status)">
                      {{ getStatusText(currentMaterialDetail.status) }}
                    </span>
                  </div>
                </div>
                <div class="dv-meta">
                  <span>需求：{{ currentMaterialDetail.demandName || '-' }}</span>
                  <span class="sep">|</span>
                  <span>发起人：{{ currentMaterialDetail.creator || '-' }}</span>
                  <span class="sep">|</span>
                  <span>上传：{{ currentMaterialDetail.uploadTime || '-' }}</span>
                  <span class="sep">|</span>
                  <span>审核员：{{ currentMaterialDetail.reviewer || '-' }}</span>
                </div>
              </div>

              <div class="dv-body-wrap">
                <div class="dv-body">
                  <a-tabs v-model:active-key="detailTab" class="dv-tabs">
                    <a-tab-pane key="detail" title="素材详情">
                      <!-- 顶部字段（宽值） -->
                      <div class="dv-flist">
                        <div class="fld2"><span class="fld-l">素材</span><span class="fld-v">{{ currentMaterialDetail.name || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">素材类型</span><span class="fld-v">{{ currentMaterialDetail.materialType || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">素材版式</span><span class="fld-v">{{ currentMaterialDetail.format || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">编导</span><span class="fld-v">{{ currentMaterialDetail.director || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">剪辑</span><span class="fld-v">{{ currentMaterialDetail.editor || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">摄像</span><span class="fld-v">{{ currentMaterialDetail.cameraman || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">演员</span><span class="fld-v">{{ currentMaterialDetail.actor || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">设计</span><span class="fld-v">{{ currentMaterialDetail.producer || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">产出日期</span><span class="fld-v">{{ currentMaterialDetail.produceDate || '-' }}</span></div>
                      </div>
                    </a-tab-pane>
                  </a-tabs>
                </div>
              </div>
            </div>

            <!-- 下方：预览 -->
            <div class="dv-preview">
              <div class="dv-phone">
                <div class="phone-frame">
                  <div class="phone-notch"></div>
                  <div class="phone-screen" ref="phoneScreenRef" @click="handlePreviewMedia">
                    <img v-if="currentMaterialDetail.type === 'IMAGE'" :src="currentMaterialDetail.thumbnail" :alt="currentMaterialDetail.name" />
                    <video v-else-if="currentMaterialDetail.type === 'VIDEO'" ref="videoRef" :src="(currentMaterialDetail.videoUrl || currentMaterialDetail.thumbnail) + (currentMaterialDetail.videoUrl ? '#t=0.1' : '')" :poster="currentMaterialDetail.videoUrl ? undefined : currentMaterialDetail.thumbnail" playsinline preload="metadata" @click.stop="handlePreviewMedia" @play="dyPlaying = true" @pause="dyPlaying = false" @ended="dyPlaying = false" @loadedmetadata="onVideoMeta" @durationchange="onVideoMeta" @timeupdate="onVideoTime" />

                    <!-- 抖音 UI 叠层 -->
                    <div class="dy-ui">
                      <!-- 顶部导航 -->
                      <div class="dy-topnav">
                        <svg class="dy-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h14M3 18h18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
                        <div class="dy-tabs">
                          <span>热点</span>
                          <span>同城</span>
                          <span>朋友</span>
                          <span class="active">推荐</span>
                        </div>
                        <svg class="dy-search" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z"/></svg>
                      </div>

                      <!-- 右侧操作栏 -->
                      <div class="dy-side">
                        <div class="dy-avatar"><img :src="currentMaterialDetail.thumbnail" /><span class="dy-follow">+</span></div>
                        <div class="dy-act">
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          <span>0</span>
                        </div>
                        <div class="dy-act">
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.6 3.4 6L4.5 21l4.2-2.2c1 .2 2.1.4 3.3.4 5.5 0 10-3.6 10-8s-4.5-8-10-8z"/></svg>
                          <span>0</span>
                        </div>
                        <div class="dy-act">
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17.3 5.8 20.8l1.6-6.7L2.2 8.9l6.9-.6L12 2z"/></svg>
                          <span>0</span>
                        </div>
                        <div class="dy-act">
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5l7 7-7 7v-4.1C9 11.8 6 13 3 18c0-6 4-11 11-9z"/></svg>
                          <span>0</span>
                        </div>
                      </div>

                      <!-- 视频控制条 -->
                      <div class="dy-controls">
                        <div class="ctrl-row">
                          <svg class="ctrl-ic clickable" viewBox="0 0 24 24" fill="currentColor" @click.stop="handlePreviewMedia">
                            <path v-if="!dyPlaying" d="M8 5v14l11-7z"/>
                            <path v-else d="M6 5h4v14H6zM14 5h4v14h-4z"/>
                          </svg>
                          <span class="ctrl-time">{{ fmtTime(dyCurrentTime) }} / {{ fmtTime(dyDuration) }}</span>
                          <span class="ctrl-spacer"></span>
                          <span class="ctrl-vol" :class="{ expanded: showVolumePanel }" @click.stop>
                            <a-slider
                              v-if="showVolumePanel"
                              v-model="dyVolume"
                              :show-tooltip="false"
                              class="vol-slider"
                              :style="{ width: '70px' }"
                              @change="applyVolume"
                            />
                            <svg class="ctrl-ic clickable" viewBox="0 0 24 24" fill="currentColor" @click.stop="toggleVolumePanel">
                              <path v-if="dyVolume > 0" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/>
                              <path v-else d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" opacity="0.4"/>
                            </svg>
                          </span>
                          <span class="dy-rate-btn" @click.stop="cycleDyRate">{{ dyRate }}x</span>
                          <svg class="ctrl-ic clickable" viewBox="0 0 24 24" fill="currentColor" @click.stop="handleDyFullscreen"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                          <svg class="ctrl-ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z"/></svg>
                        </div>
                        <div class="ctrl-bar" @click.stop="onSeek"><i :style="{ width: dyProgress + '%' }"></i></div>
                      </div>

                      <!-- 底部导航 -->
                      <div class="dy-tabbar">
                        <span>首页</span>
                        <span>商城</span>
                        <span class="dy-plus">+</span>
                        <span class="dy-msg">消息<i>99</i></span>
                        <span>我</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="dv-actions">
                <a-button type="primary" size="small" @click="handlePushToAccount">推送</a-button>
                <a-button size="small" @click="handleDownload">下载</a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-drawer>


    <!-- 重新提交弹窗（不通过 → 上传单个文件 → 状态变为待审核） -->
    <a-modal
      v-model:visible="showResubmitModal"
      title="重新提交"
      :width="520"
      :ok-text="'确定'"
      :cancel-text="'取消'"
      :on-before-ok="handleConfirmResubmit"
      unmount-on-close
    >
      <div class="resubmit-modal">
        <p class="resubmit-tip">
          重新提交后，素材状态将变为「待审核」，原审核结果将被清空。
        </p>
        <div class="resubmit-field">
          <span class="resubmit-label">上传文件</span>
          <div
            v-if="!resubmitFile"
            class="resubmit-dropzone"
            @click="triggerResubmitInput"
          >
            <IconUpload />
            <span class="resubmit-dropzone-text">点击或拖拽文件至此</span>
            <span class="resubmit-dropzone-hint">仅支持单文件，大小不超过 50M</span>
            <input
              ref="resubmitInputRef"
              type="file"
              style="display: none;"
              @change="handleResubmitFileChange"
            />
          </div>
          <div v-else class="resubmit-file">
            <div class="resubmit-file-thumb">
              <img v-if="resubmitPreview" :src="resubmitPreview" :alt="resubmitFile.name" />
              <IconFile v-else />
            </div>
            <div class="resubmit-file-info">
              <div class="resubmit-file-name" :title="resubmitFile.name">{{ resubmitFile.name }}</div>
              <div class="resubmit-file-size">{{ formatResubmitSize(resubmitFile.size) }}</div>
            </div>
            <IconClose class="resubmit-file-remove" @click="removeResubmitFile" />
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 素材详情右抽屉（完全沿用素材列表的 detail-v2 布局） -->
    <a-drawer
      v-model:visible="showMaterialDetail"
      placement="right"
      :width="1120"
      :footer="false"
      :header="false"
      :body-style="{ padding: 0, overflow: 'hidden' }"
    >
      <div v-if="currentMaterialDetail" class="detail-v2">
        <div class="dv-close" @click="showMaterialDetail = false">
          <IconClose />
        </div>

        <div class="dv-page">
          <!-- 顶部：预览 + 详情字段 -->
          <div class="dv-top">
            <!-- 上方：详情字段 -->
            <div class="dv-main">
              <div class="dv-header-box">
                <div class="dv-head">
                  <div class="dv-title-wrap">
                    <span class="dv-title" :title="currentMaterialDetail.name">{{ currentMaterialDetail.name }}</span>
                  </div>
                  <div class="dv-head-right">
                    <span class="dv-usage" :class="usageBadgeClass(currentMaterialDetail.status)">
                      {{ getStatusText(currentMaterialDetail.status) }}
                    </span>
                  </div>
                </div>
                <div class="dv-meta">
                  <span>需求：{{ currentMaterialDetail.demandName || '-' }}</span>
                  <span class="sep">|</span>
                  <span>发起人：{{ currentMaterialDetail.creator || '-' }}</span>
                  <span class="sep">|</span>
                  <span>上传：{{ currentMaterialDetail.uploadTime || '-' }}</span>
                  <span class="sep">|</span>
                  <span>审核员：{{ currentMaterialDetail.reviewer || '-' }}</span>
                </div>
              </div>

              <div class="dv-body-wrap">
                <div class="dv-body">
                  <a-tabs v-model:active-key="detailTab" class="dv-tabs">
                    <a-tab-pane key="detail" title="素材详情">
                      <!-- 顶部字段（宽值） -->
                      <div class="dv-flist">
                        <div class="fld2"><span class="fld-l">素材类型</span><span class="fld-v">
                          <a-tag v-if="currentMaterialDetail.format" color="arcoblue" size="small" effect="plain">
                            {{ currentMaterialDetail.format }}
                          </a-tag>
                          <span v-else>-</span>
                        </span></div>
                        <div class="fld2"><span class="fld-l">需求名称</span><span class="fld-v">{{ currentMaterialDetail.demandName || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">审核状态</span><span class="fld-v">
                          <a-tag :color="getStatusColor(currentMaterialDetail.status)">{{ getStatusText(currentMaterialDetail.status) }}</a-tag>
                        </span></div>
                        <div class="fld2"><span class="fld-l">发起人</span><span class="fld-v">{{ currentMaterialDetail.creator || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">上传时间</span><span class="fld-v">{{ currentMaterialDetail.uploadTime || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">审核员</span><span class="fld-v">{{ currentMaterialDetail.reviewer || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">审核时间</span><span class="fld-v">{{ currentMaterialDetail.reviewTime || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">审核意见</span><span class="fld-v">{{ currentMaterialDetail.comment || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">审核截图</span><span class="fld-v">
                          <img v-if="currentMaterialDetail.screenshot" :src="currentMaterialDetail.screenshot" class="dv-shot-thumb" />
                          <span v-else>-</span>
                        </span></div>
                      </div>
                    </a-tab-pane>
                  </a-tabs>
                </div>
              </div>
            </div>

            <!-- 下方：预览 -->
            <div class="dv-preview">
              <div class="dv-phone">
                <div class="phone-frame">
                  <div class="phone-notch"></div>
                  <div class="phone-screen" ref="phoneScreenRef" @click="handlePreviewMedia">
                    <img v-if="currentMaterialDetail.type === 'IMAGE'" :src="currentMaterialDetail.thumbnail" :alt="currentMaterialDetail.name" />
                    <video v-else-if="currentMaterialDetail.type === 'VIDEO'" ref="videoRef" :src="(currentMaterialDetail.videoUrl || currentMaterialDetail.thumbnail) + (currentMaterialDetail.videoUrl ? '#t=0.1' : '')" :poster="currentMaterialDetail.videoUrl ? undefined : currentMaterialDetail.thumbnail" playsinline preload="metadata" @click.stop="handlePreviewMedia" @play="dyPlaying = true" @pause="dyPlaying = false" @ended="dyPlaying = false" @loadedmetadata="onVideoMeta" @durationchange="onVideoMeta" @timeupdate="onVideoTime" />

                    <!-- 抖音 UI 叠层 -->
                    <div class="dy-ui">
                      <!-- 顶部导航 -->
                      <div class="dy-topnav">
                        <svg class="dy-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h14M3 18h18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
                        <div class="dy-tabs">
                          <span>热点</span>
                          <span>同城</span>
                          <span>朋友</span>
                          <span class="active">推荐</span>
                        </div>
                        <svg class="dy-search" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z"/></svg>
                      </div>

                      <!-- 右侧操作栏 -->
                      <div class="dy-side">
                        <div class="dy-avatar"><img :src="currentMaterialDetail.thumbnail" /><span class="dy-follow">+</span></div>
                        <div class="dy-act">
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          <span>0</span>
                        </div>
                        <div class="dy-act">
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.6 3.4 6L4.5 21l4.2-2.2c1 .2 2.1.4 3.3.4 5.5 0 10-3.6 10-8s-4.5-8-10-8z"/></svg>
                          <span>0</span>
                        </div>
                        <div class="dy-act">
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17.3 5.8 20.8l1.6-6.7L2.2 8.9l6.9-.6L12 2z"/></svg>
                          <span>0</span>
                        </div>
                        <div class="dy-act">
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5l7 7-7 7v-4.1C9 11.8 6 13 3 18c0-6 4-11 11-9z"/></svg>
                          <span>0</span>
                        </div>
                      </div>

                      <!-- 视频控制条 -->
                      <div class="dy-controls">
                        <div class="ctrl-row">
                          <svg class="ctrl-ic clickable" viewBox="0 0 24 24" fill="currentColor" @click.stop="handlePreviewMedia">
                            <path v-if="!dyPlaying" d="M8 5v14l11-7z"/>
                            <path v-else d="M6 5h4v14H6zM14 5h4v14h-4z"/>
                          </svg>
                          <span class="ctrl-time">{{ fmtTime(dyCurrentTime) }} / {{ fmtTime(dyDuration) }}</span>
                          <span class="ctrl-spacer"></span>
                          <span class="ctrl-vol" :class="{ expanded: showVolumePanel }" @click.stop>
                            <a-slider
                              v-if="showVolumePanel"
                              v-model="dyVolume"
                              :show-tooltip="false"
                              class="vol-slider"
                              :style="{ width: '70px' }"
                              @change="applyVolume"
                            />
                            <svg class="ctrl-ic clickable" viewBox="0 0 24 24" fill="currentColor" @click.stop="toggleVolumePanel">
                              <path v-if="dyVolume > 0" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/>
                              <path v-else d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" opacity="0.4"/>
                            </svg>
                          </span>
                          <span class="dy-rate-btn" @click.stop="cycleDyRate">{{ dyRate }}x</span>
                          <svg class="ctrl-ic clickable" viewBox="0 0 24 24" fill="currentColor" @click.stop="handleDyFullscreen"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                          <svg class="ctrl-ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z"/></svg>
                        </div>
                        <div class="ctrl-bar" @click.stop="onSeek"><i :style="{ width: dyProgress + '%' }"></i></div>
                      </div>

                      <!-- 底部导航 -->
                      <div class="dy-tabbar">
                        <span>首页</span>
                        <span>商城</span>
                        <span class="dy-plus">+</span>
                        <span class="dy-msg">消息<i>99</i></span>
                        <span>我</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconImage, IconPlus, IconClose, IconUpload, IconFile } from '@arco-design/web-vue/es/icon'

// 筛选条件
const filters = reactive({
  status: '' as '' | 'PENDING' | 'APPROVED' | 'REJECTED',
  materialKeyword: '',
  creator: '',
  demandName: '',
  createRange: [] as string[],
  createRangeEnd: [] as string[],
})

const creatorOptions = [
  '王春雷',
  '李经理',
  '张经理',
  '王总监',
  '陈经理',
  '何总监',
  '梁总',
  '孙总',
  '周总',
  '郑总',
  '赵总监',
  '黄经理',
  '吴经理',
]

// 状态映射
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '不通过',
  }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'orange',
    APPROVED: 'green',
    REJECTED: 'red',
  }
  return map[status] || 'default'
}

const CURRENT_REVIEWER = '王春雷'
const getReviewTimeText = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

// Mock 数据
const tableData = ref([
  {
    id: 1,
    name: '封面图-主图1.jpg',
    format: '四流合一',
    demandName: '618大促活动宣传',
    thumb: '',
    status: 'REJECTED',
    creator: '王春雷',
    createTime: '2026-07-28 15:07:35',
    comment: '09',
    screenshot: 'https://picsum.photos/seed/audit1/120/68',
    reviewer: '王春雷',
    reviewTime: '2026-07-28 15:19:50',
  },
  {
    id: 2,
    name: '详情页-卖点图.png',
    format: '四流合一',
    demandName: '618大促活动宣传',
    thumb: '',
    status: 'REJECTED',
    creator: '王春雷',
    createTime: '2026-07-28 15:02:09',
    comment: '测试仪',
    screenshot: 'https://picsum.photos/seed/audit2/120/68',
    reviewer: '王春雷',
    reviewTime: '2026-07-28 15:03:05',
  },
  {
    id: 3,
    name: '618主会场-横版视频.mp4',
    format: '竖版视频',
    demandName: '618主会场预热',
    thumb: '',
    status: 'PENDING',
    creator: '李经理',
    createTime: '2026-07-28 14:30:12',
    comment: '-',
    screenshot: '',
    reviewer: '',
    reviewTime: '',
  },
  {
    id: 4,
    name: '护肤精华-详情页主图.jpg',
    format: '详情页',
    demandName: '新品上市系列海报',
    thumb: '',
    status: 'PENDING',
    creator: '张经理',
    createTime: '2026-07-28 14:21:08',
    comment: '-',
    screenshot: '',
    reviewer: '',
    reviewTime: '',
  },
  {
    id: 5,
    name: '美食探店-探店图集.jpg',
    format: '详情页',
    demandName: '夏季新品发布会预热',
    thumb: '',
    status: 'APPROVED',
    creator: '王总监',
    createTime: '2026-07-28 11:05:33',
    comment: '通过',
    screenshot: '',
    reviewer: '陈经理',
    reviewTime: '2026-07-28 11:30:21',
  },
  {
    id: 6,
    name: '数码评测-讲解视频.mp4',
    format: '横版视频',
    demandName: '双十一活动预热',
    thumb: '',
    status: 'APPROVED',
    creator: '何总监',
    createTime: '2026-07-28 10:42:19',
    comment: '通过',
    screenshot: '',
    reviewer: '梁总',
    reviewTime: '2026-07-28 11:00:08',
  },
  {
    id: 7,
    name: '剧情反转-竖版03.mp4',
    format: '竖版视频',
    demandName: '国际品牌联名限定款',
    thumb: '',
    status: 'PENDING',
    creator: '孙总',
    createTime: '2026-07-28 09:55:44',
    comment: '-',
    screenshot: '',
    reviewer: '',
    reviewTime: '',
  },
])

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100],
})

const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.current = 1
}

// 简单前端筛选
const pagedData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return tableData.value.slice(start, start + pagination.pageSize)
})

// 初始化 total
pagination.total = tableData.value.length

// 多选
const selectedIds = ref<number[]>([])

// ===== 审核不通过弹窗 =====
const showRejectModal = ref(false)
const screenshotInputRef = ref<HTMLInputElement | null>(null)
const MAX_SCREENSHOT_COUNT = 9
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024

interface IndependentRow {
  id: number
  name: string
  thumb: string
  comment: string
  screenshots: string[]
}

const rejectForm = reactive({
  mode: 'SHARED' as 'SHARED' | 'INDEPENDENT',
  // SHARED 模式：共用一份意见 + 截图
  comment: '',
  screenshots: [] as string[],
  // INDEPENDENT 模式：每条素材独立意见 + 截图
  independentRows: [] as IndependentRow[],
})

// 当前被上传截图的行 id（INDEPENDENT 模式下区分是哪条素材的 input）
const uploadingRowId = ref<number | null>(null)

const openRejectModal = () => {
  if (!selectedIds.value.length) {
    Message.warning('请先选择要拒绝的素材')
    return
  }
  rejectForm.mode = 'SHARED'
  rejectForm.comment = ''
  rejectForm.screenshots = []
  // 用当前选中的素材快照构建独立行
  rejectForm.independentRows = tableData.value
    .filter((it) => selectedIds.value.includes(it.id))
    .map((it) => ({
      id: it.id,
      name: it.name,
      thumb: it.thumb || '',
      comment: '',
      screenshots: [],
    }))
  uploadingRowId.value = null
  showRejectModal.value = true
}

const triggerScreenshotUpload = (rowId?: number) => {
  uploadingRowId.value = rowId ?? null
  screenshotInputRef.value?.click()
}

const getRowScreenshots = (rowId: number): string[] => {
  const row = rejectForm.independentRows.find((r) => r.id === rowId)
  return row?.screenshots ?? []
}

const handleScreenshotChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) {
    input.value = ''
    return
  }
  // 决定目标数组：SHARED → 顶层 screenshots；INDEPENDENT → 对应行的 screenshots
  const targetArr =
    rejectForm.mode === 'INDEPENDENT' && uploadingRowId.value !== null
      ? getRowScreenshots(uploadingRowId.value)
      : rejectForm.screenshots
  const remain = MAX_SCREENSHOT_COUNT - targetArr.length
  if (remain <= 0) {
    Message.warning(`最多上传 ${MAX_SCREENSHOT_COUNT} 张截图`)
    input.value = ''
    return
  }
  const valid: File[] = []
  for (const file of files) {
    if (file.size > MAX_SCREENSHOT_SIZE) {
      Message.warning(`图片「${file.name}」超过 5M，已跳过`)
      continue
    }
    valid.push(file)
  }
  const accepted = valid.slice(0, remain)
  accepted.forEach((file) => {
    targetArr.push(URL.createObjectURL(file))
  })
  if (valid.length > remain) {
    Message.warning(`已达上限,仅添加前 ${remain} 张`)
  }
  input.value = ''
}

const removeScreenshot = (rowId: number | null, idx: number) => {
  let removed: string | undefined
  if (rejectForm.mode === 'INDEPENDENT' && rowId !== null) {
    const row = rejectForm.independentRows.find((r) => r.id === rowId)
    if (!row) return
    removed = row.screenshots.splice(idx, 1)[0]
  } else {
    removed = rejectForm.screenshots.splice(idx, 1)[0]
  }
  if (removed?.startsWith('blob:')) {
    URL.revokeObjectURL(removed)
  }
}

const handleRejectSubmit = async () => {
  if (rejectForm.mode === 'SHARED') {
    if (!rejectForm.comment.trim()) {
      Message.warning('请填写审核意见')
      return false
    }
  } else {
    // INDEPENDENT：每行都必须填写意见
    const missing = rejectForm.independentRows.findIndex((r) => !r.comment.trim())
    if (missing >= 0) {
      Message.warning(`第 ${missing + 1} 行素材未填写审核意见`)
      return false
    }
  }
  // 模拟提交并同步列表中的审核结果
  await new Promise((r) => setTimeout(r, 200))
  const rejectedIds = [...selectedIds.value]
  tableData.value.forEach((item) => {
    if (!rejectedIds.includes(item.id)) return
    const independentRow = rejectForm.independentRows.find((row) => row.id === item.id)
    item.status = 'REJECTED'
    item.reviewer = CURRENT_REVIEWER
    item.reviewTime = getReviewTimeText()
    item.comment = rejectForm.mode === 'SHARED'
      ? rejectForm.comment.trim()
      : independentRow?.comment.trim() || ''
    item.screenshot = rejectForm.mode === 'SHARED'
      ? rejectForm.screenshots[0] || ''
      : independentRow?.screenshots[0] || ''
  })
  Message.success(`已拒绝 ${rejectedIds.length} 条`)
  selectedIds.value = []
  return true
}

// 操作
const handleSearch = () => {
  pagination.current = 1
  Message.success('已查询')
}

const handleReset = () => {
  filters.status = ''
  filters.materialKeyword = ''
  filters.creator = ''
  filters.demandName = ''
  filters.createRange = []
  filters.createRangeEnd = []
  pagination.current = 1
  Message.success('已重置')
}

const handleBatchPass = () => {
  Message.success(`已通过 ${selectedIds.value.length} 条`)
  selectedIds.value = []
}

const handleBatchReject = () => {
  openRejectModal()
}

const handleExport = () => {
  Message.success('审核记录已导出')
}

const handleChangeLog = (record: any) => {
  changeLogCurrent.value = record
  showChangeLogModal.value = true
}

// ===== 变更记录弹窗 =====
const showChangeLogModal = ref(false)
const changeLogCurrent = ref<any>(null)

// ===== 重新提交弹窗 =====
const showResubmitModal = ref(false)
const resubmitTarget = ref<any>(null)
const resubmitFile = ref<File | null>(null)
const resubmitPreview = ref<string | null>(null)
const resubmitInputRef = ref<HTMLInputElement | null>(null)
const MAX_RESUBMIT_SIZE = 50 * 1024 * 1024 // 50MB（单文件上限）

const handleOpenResubmit = (record: any) => {
  if (record.status !== 'REJECTED') return
  resubmitTarget.value = record
  resubmitFile.value = null
  resubmitPreview.value = null
  showResubmitModal.value = true
}

const triggerResubmitInput = () => {
  resubmitInputRef.value?.click()
}

const handleResubmitFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    input.value = ''
    return
  }
  if (file.size > MAX_RESUBMIT_SIZE) {
    Message.warning(`文件「${file.name}」超过 50M，已跳过`)
    input.value = ''
    return
  }
  if (resubmitPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(resubmitPreview.value)
  }
  resubmitFile.value = file
  resubmitPreview.value = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
  input.value = ''
}

const removeResubmitFile = () => {
  if (resubmitPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(resubmitPreview.value)
  }
  resubmitFile.value = null
  resubmitPreview.value = null
  if (resubmitInputRef.value) resubmitInputRef.value.value = ''
}

const handleConfirmResubmit = () => {
  if (!resubmitFile.value) {
    Message.warning('请上传文件')
    return
  }
  if (!resubmitTarget.value) return
  // 提交后状态变为「待审核」，清空原审核结果
  resubmitTarget.value.status = 'PENDING'
  resubmitTarget.value.reviewer = ''
  resubmitTarget.value.reviewTime = ''
  resubmitTarget.value.comment = ''
  showResubmitModal.value = false
  Message.success('已重新提交，状态变为待审核')
  removeResubmitFile()
}

const formatResubmitSize = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

interface ChangeLogRow {
  id: number
  time: string
  initiator: string
  operator: string
  action: string
  comment: string
  screenshot: string
  beforeStatus: string
  afterStatus: string
}

const changeLogList = ref<ChangeLogRow[]>([
  {
    id: 1,
    time: '2026-07-28 16:20:33',
    initiator: '王春雷',
    operator: '王春雷',
    action: '变更状态',
    comment: '',
    screenshot: '',
    beforeStatus: 'PENDING',
    afterStatus: 'APPROVED',
  },
  {
    id: 2,
    time: '2026-07-28 15:19:50',
    initiator: '王春雷',
    operator: '王春雷',
    action: '首次审核',
    comment: '09',
    screenshot: '',
    beforeStatus: 'PENDING',
    afterStatus: 'REJECTED',
  },
])

// ===== 素材详情与素材审核 =====
const showMaterialDetail = ref(false)
const showReviewModal = ref(false)
const currentMaterialDetail = ref<any>(null)
const detailTab = ref('detail')
const auditVideoRef = ref<HTMLVideoElement | null>(null)
const auditScreenshotInputRef = ref<HTMLInputElement | null>(null)
const auditDecision = ref<'' | 'APPROVED' | 'REJECTED'>('')
const auditRejectForm = reactive({
  comment: '',
  screenshots: [] as string[],
})

const isCurrentMaterialVideo = computed(() => {
  const material = currentMaterialDetail.value
  if (!material) return false
  return material.type === 'VIDEO' || /\.(mp4|webm|mov)(\?.*)?$/i.test(material.name || '')
})

const currentPreviewSource = computed(() => {
  const material = currentMaterialDetail.value
  if (!material) return ''
  if (isCurrentMaterialVideo.value) {
    return material.videoUrl || `${import.meta.env.BASE_URL}${material.id % 2 === 0 ? '2.mp4' : '1.mp4'}`
  }
  return material.thumbnail
    || material.thumb
    || material.screenshot
    || `https://picsum.photos/seed/audit-material-${material.id}/960/540`
})

const syncAuditReviewState = (material: any) => {
  auditDecision.value = material?.status === 'PENDING' ? 'APPROVED' : material?.status || ''
  auditRejectForm.comment = material?.status === 'REJECTED' && material.comment !== '-'
    ? material.comment || ''
    : ''
  auditRejectForm.screenshots = material?.status === 'REJECTED' && material.screenshot
    ? [material.screenshot]
    : []
}

const appendAuditScreenshots = (files: File[]) => {
  const remaining = MAX_SCREENSHOT_COUNT - auditRejectForm.screenshots.length
  if (remaining <= 0) {
    Message.warning(`最多上传 ${MAX_SCREENSHOT_COUNT} 张截图`)
    return
  }

  const accepted = files
    .filter((file) => {
      if (!file.type.startsWith('image/')) return false
      if (file.size > MAX_SCREENSHOT_SIZE) {
        Message.warning(`图片「${file.name}」超过 5M，已跳过`)
        return false
      }
      return true
    })
    .slice(0, remaining)

  accepted.forEach((file) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string' && auditRejectForm.screenshots.length < MAX_SCREENSHOT_COUNT) {
        auditRejectForm.screenshots.push(reader.result)
      }
    }
    reader.readAsDataURL(file)
  })

  if (files.length > remaining) {
    Message.warning(`最多还能上传 ${remaining} 张截图`)
  }
}

const triggerAuditScreenshotUpload = () => {
  auditScreenshotInputRef.value?.click()
}

const handleAuditScreenshotChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  appendAuditScreenshots(Array.from(input.files || []))
  input.value = ''
}

const handleAuditScreenshotPaste = (event: ClipboardEvent) => {
  const imageFiles = Array.from(event.clipboardData?.files || [])
    .filter((file) => file.type.startsWith('image/'))
  if (!imageFiles.length) return
  event.preventDefault()
  appendAuditScreenshots(imageFiles)
}

const removeAuditScreenshot = (index: number) => {
  auditRejectForm.screenshots.splice(index, 1)
}

const stopAuditPreview = () => {
  auditVideoRef.value?.pause()
}



const handleMaterialDetail = (record: any) => {
  currentMaterialDetail.value = record
  showMaterialDetail.value = true
}

const handleDetails = (record: any) => {
  currentMaterialDetail.value = record
  showMaterialDetail.value = true
}

const handlePushToAccount = () => {
  Message.success('素材已推送')
}

const handleDownload = () => {
  const material = currentMaterialDetail.value
  const source = material?.videoUrl || material?.thumbnail || material?.thumb
  if (!source) {
    Message.warning('当前素材暂无可下载文件')
    return
  }
  const link = document.createElement('a')
  link.href = source
  link.download = material.name || 'material'
  link.click()
}

const handleOpenAudit = (record: any) => {
  if (record.status !== 'PENDING') return
  stopAuditPreview()
  currentMaterialDetail.value = record
  syncAuditReviewState(record)
  showReviewModal.value = true
}

const handleCloseAudit = () => {
  stopAuditPreview()
  showReviewModal.value = false
}

const handleAuditPass = () => {
  if (currentMaterialDetail.value?.status !== 'PENDING') return
  auditDecision.value = 'APPROVED'
}

const handleAuditReject = () => {
  if (currentMaterialDetail.value?.status !== 'PENDING') return
  auditDecision.value = 'REJECTED'
}

const handleAuditSubmit = () => {
  const material = currentMaterialDetail.value
  if (!material || material.status !== 'PENDING') return
  if (auditDecision.value === 'REJECTED' && !auditRejectForm.comment.trim()) {
    Message.warning('请填写审批意见')
    return
  }

  material.status = auditDecision.value
  material.reviewer = CURRENT_REVIEWER
  material.reviewTime = getReviewTimeText()
  material.comment = auditDecision.value === 'APPROVED'
    ? '通过'
    : auditRejectForm.comment.trim()
  material.screenshot = auditDecision.value === 'REJECTED'
    ? auditRejectForm.screenshots[0] || ''
    : ''

  Message.success(auditDecision.value === 'APPROVED' ? '素材审核已通过' : '素材审核已不通过')
  handleCloseAudit()
}


// 视频播放控制
const videoRef = ref<HTMLVideoElement | null>(null)
const phoneScreenRef = ref<HTMLElement | null>(null)
const dyPlaying = ref(false)
const dyCurrentTime = ref(0)
const dyDuration = ref(0)
const dyProgress = computed(() => (dyDuration.value > 0 ? (dyCurrentTime.value / dyDuration.value) * 100 : 0))
const dyRate = ref(1)
const dyVolume = ref(80)
const showVolumePanel = ref(false)

// 视频格式化
const fmtTime = (sec: number) => {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
const onVideoMeta = (e: Event) => {
  dyDuration.value = (e.target as HTMLVideoElement).duration || 0
}
const onVideoTime = (e: Event) => {
  dyCurrentTime.value = (e.target as HTMLVideoElement).currentTime || 0
}
const onSeek = (e: MouseEvent) => {
  const el = videoRef.value
  if (!el || !dyDuration.value) return
  const bar = e.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  el.currentTime = ratio * dyDuration.value
}
const cycleDyRate = () => {
  const speeds = [1, 1.5, 2, 3, 0.5]
  const i = speeds.indexOf(dyRate.value)
  dyRate.value = speeds[(i + 1) % speeds.length]
  if (videoRef.value) videoRef.value.playbackRate = dyRate.value
}
const toggleVolumePanel = () => {
  showVolumePanel.value = !showVolumePanel.value
}
const applyVolume = () => {
  if (videoRef.value) {
    videoRef.value.volume = dyVolume.value / 100
    videoRef.value.muted = dyVolume.value === 0
  }
}
const handleDyFullscreen = () => {
  const el: any = videoRef.value || phoneScreenRef.value
  if (el?.requestFullscreen) el.requestFullscreen()
  else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen()
}
const handlePreviewMedia = () => {
  if (currentMaterialDetail.value?.type === 'VIDEO') {
    const videoEl = (videoRef.value as HTMLVideoElement) || document.querySelector('.phone-screen video') as HTMLVideoElement
    if (videoEl) {
      if (videoEl.paused) videoEl.play()
      else videoEl.pause()
    }
  }
}

// 状态徽标颜色：与列表 status tag 同色
const usageBadgeClass = (status?: string) => {
  switch (status) {
    case 'APPROVED':
      return 'usage-run' // 绿
    case 'REJECTED':
      return 'usage-cold' // 红
    case 'PENDING':
      return 'usage-hot' // 橙
    default:
      return 'usage-none'
  }
}
</script>

<style scoped lang="scss">
.audit-page {
  padding: 16px;
  background: #f7f8fa;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-card {
  background: #ffffff;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .filter-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .filter-label {
    color: #4e5969;
    font-size: 14px;
    white-space: nowrap;
  }

  .range-sep {
    color: #86909c;
    font-size: 13px;
  }

  .filter-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
}

.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border-radius: 4px;
  padding: 12px 16px;

  .batch-left {
    display: flex;
    gap: 8px;
  }
}

.table-card {
  background: #ffffff;
  border-radius: 4px;
  padding: 16px;
}

.material-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .thumb {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    background: #f2f3f5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .material-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .material-name {
    font-size: 13px;
    color: #1d2129;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 140px;
  }
}

.creator-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.4;

  .creator-name {
    font-size: 13px;
    color: #1d2129;
  }

  .creator-time {
    font-size: 12px;
    color: #86909c;
  }
}

.screenshot-cell {
  display: inline-block;

  .screenshot-thumb {
    width: 56px;
    height: 32px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #e5e6eb;
    cursor: pointer;
  }
}

// 素材审核弹窗
.review-modal-inner {
  height: min(600px, calc(100vh - 80px));
  min-height: 540px;
  background: #ffffff;
  border-radius: 4px;
  overflow: hidden;
}

.review-modal-inner .rm-header {
  height: 64px;
  padding: 0 32px;
  border-bottom: 1px solid #e5e6eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-modal-inner .rm-title {
  color: #1d2129;
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
}

.review-modal-inner .rm-close {
  color: #86909c;
  font-size: 22px;
  cursor: pointer;
  outline: none;
  transition: color 0.2s;
}

.review-modal-inner .rm-close:hover,
.review-modal-inner .rm-close:focus-visible {
  color: #1d2129;
}

.review-modal-inner .rm-body {
  height: calc(100% - 64px);
  display: flex;
  min-height: 0;
}

.review-modal-inner .rm-left {
  width: 40%;
  flex-shrink: 0;
  padding: 24px 20px 24px 32px;
  border-right: 1px solid #e5e6eb;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.review-modal-inner .rm-preview {
  width: 100%;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
  background: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909c;
}

.review-modal-inner .rm-preview img,
.review-modal-inner .rm-preview video {
  width: 100%;
  height: 100%;
  display: block;
}

.review-modal-inner .rm-preview img {
  object-fit: cover;
}

.review-modal-inner .rm-preview video {
  object-fit: contain;
  background: #000000;
}

.review-modal-inner .rm-preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #c9cdd4;
  font-size: 14px;
}

.review-modal-inner .rm-preview-placeholder .arco-icon {
  font-size: 46px;
}

.review-modal-inner .rm-fields {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-modal-inner .rm-fld {
  min-width: 0;
  display: flex;
  align-items: baseline;
  font-size: 16px;
  line-height: 1.5;
}

.review-modal-inner .rm-fld-l {
  flex-shrink: 0;
  color: #4e5969;
}

.review-modal-inner .rm-fld-v {
  min-width: 0;
  color: #4e5969;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-modal-inner .rm-right {
  min-width: 0;
  flex: 1;
  padding: 24px 32px 16px 28px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.review-modal-inner .rm-right-header {
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-modal-inner .rm-right-header h3 {
  margin: 0;
  color: #4e5969;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
}

.review-modal-inner .rm-status-row {
  margin-top: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f2f3f5;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.review-modal-inner .rm-status-label {
  flex-shrink: 0;
  color: #4e5969;
  font-size: 16px;
}

.review-modal-inner .rm-status-actions {
  display: flex;
}

.review-modal-inner .rm-status-btn {
  width: 108px;
  height: 42px;
  padding: 0 18px;
  border: 1px solid #e5e6eb;
  background: #ffffff;
  color: #4e5969;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background-color 0.2s;
}

.review-modal-inner .rm-status-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.review-modal-inner .rm-status-btn:last-child {
  margin-left: -1px;
  border-radius: 0 4px 4px 0;
}

.review-modal-inner .rm-status-btn:not(:disabled):hover,
.review-modal-inner .rm-status-btn:not(:disabled):focus-visible,
.review-modal-inner .rm-status-btn.is-active {
  position: relative;
  z-index: 1;
  border-color: #165dff;
  background: #e8f3ff;
  color: #165dff;
  outline: none;
}

.review-modal-inner .rm-status-btn:disabled {
  border-color: #e5e6eb;
  background: #fafbfc;
  color: #c9cdd4;
  cursor: not-allowed;
}

.review-modal-inner .rm-status-btn.is-active:disabled {
  border-color: #165dff;
  background: #e8f3ff;
  color: #165dff;
  opacity: 1;
}

.review-modal-inner .rm-reject-panel {
  min-height: 0;
  flex: 1;
  margin-top: 20px;
  padding: 0 4px 54px 0;
  overflow: visible;
}

.review-modal-inner .rm-reject-section + .rm-reject-section {
  margin-top: 18px;
}

.review-modal-inner .rm-reject-label,
.review-modal-inner .rm-reject-label-row {
  color: #1d2129;
  font-size: 15px;
  font-weight: 500;
}

.review-modal-inner .rm-reject-label {
  display: inline-block;
  margin-bottom: 10px;
}

.review-modal-inner .rm-required {
  margin-right: 6px;
  color: #f53f3f;
}

.review-modal-inner .rm-reject-label-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.review-modal-inner .rm-reject-label-row .rm-reject-label {
  margin-bottom: 0;
}

.review-modal-inner .rm-reject-panel :deep(.arco-textarea-wrapper) {
  min-height: 96px;
  border-color: transparent;
  background: #f2f3f5;
}

.review-modal-inner .rm-reject-panel :deep(.arco-textarea) {
  font-size: 15px;
  line-height: 1.6;
}

.review-modal-inner .rm-audit-screenshots {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 80px;
}

.review-modal-inner .rm-audit-screenshot,
.review-modal-inner .rm-audit-upload {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border-radius: 4px;
}

.review-modal-inner .rm-audit-screenshot {
  overflow: hidden;
  border: 1px solid #e5e6eb;
}

.review-modal-inner .rm-audit-screenshot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-modal-inner .rm-audit-screenshot-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
}

.review-modal-inner .rm-audit-upload {
  border: 1px dashed #c9cdd4;
  background: #ffffff;
  color: #86909c;
  font-size: 28px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background-color 0.2s;
}

.review-modal-inner .rm-audit-upload:hover,
.review-modal-inner .rm-audit-upload:focus-visible {
  border-color: #165dff;
  background: #f7faff;
  color: #165dff;
  outline: none;
}

.review-modal-inner .rm-upload-hint {
  margin-top: 8px;
  color: #86909c;
  font-size: 13px;
}

.review-modal-inner .rm-file-input {
  display: none;
}

.review-modal-inner .rm-audit-actions {
  position: absolute;
  right: 32px;
  bottom: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 960px) {
  .review-modal-inner {
    height: calc(100vh - 32px);
    min-height: 0;
    overflow-y: auto;
  }

  .review-modal-inner .rm-header {
    position: sticky;
    top: 0;
    z-index: 5;
    height: 64px;
    padding: 0 20px;
    background: #ffffff;
  }

  .review-modal-inner .rm-title {
    font-size: 22px;
  }

  .review-modal-inner .rm-body {
    height: auto;
    min-height: calc(100% - 64px);
    flex-direction: column;
  }

  .review-modal-inner .rm-left {
    width: 100%;
    padding: 20px;
    border-right: 0;
    border-bottom: 1px solid #e5e6eb;
    overflow: visible;
  }

  .review-modal-inner .rm-right {
    min-height: 560px;
    padding: 24px 20px;
    overflow: visible;
  }

  .review-modal-inner .rm-fld,
  .review-modal-inner .rm-status-label {
    font-size: 15px;
  }
}

// 重新提交弹窗
.resubmit-modal {
  padding: 4px 0 0;
}
.resubmit-modal .resubmit-tip {
  font-size: 13px;
  color: #4E5969;
  line-height: 1.6;
  margin: 0 0 16px;
  padding: 8px 12px;
  background: #FFF7E8;
  border-left: 3px solid #FF7D00;
  border-radius: 2px;
}
.resubmit-modal .resubmit-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.resubmit-modal .resubmit-label {
  font-size: 13px;
  color: #1D2129;
  font-weight: 500;
}
.resubmit-modal .resubmit-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 140px;
  border: 1px dashed #C9CDD4;
  border-radius: 4px;
  color: #86909C;
  cursor: pointer;
  transition: all 0.2s;
  background: #FAFBFC;
}
.resubmit-modal .resubmit-dropzone:hover {
  border-color: #165DFF;
  color: #165DFF;
}
.resubmit-modal .resubmit-dropzone .arco-icon {
  font-size: 28px;
}
.resubmit-modal .resubmit-dropzone-text {
  font-size: 14px;
  color: #1D2129;
}
.resubmit-modal .resubmit-dropzone-hint {
  font-size: 12px;
  color: #86909C;
}
.resubmit-modal .resubmit-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #E5E6EB;
  border-radius: 4px;
  background: #FAFBFC;
}
.resubmit-modal .resubmit-file-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  background: #F2F3F5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909C;
  flex-shrink: 0;
}
.resubmit-modal .resubmit-file-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.resubmit-modal .resubmit-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.resubmit-modal .resubmit-file-name {
  font-size: 13px;
  color: #1D2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.resubmit-modal .resubmit-file-size {
  font-size: 12px;
  color: #86909C;
}
.resubmit-modal .resubmit-file-remove {
  font-size: 16px;
  color: #86909C;
  cursor: pointer;
  flex-shrink: 0;
}
.resubmit-modal .resubmit-file-remove:hover {
  color: #F53F3F;
}

// 审核不通过弹窗
.reject-modal {
  .required-mark {
    color: #f53f3f;
    margin-right: 4px;
    font-weight: 600;
    line-height: 1;
  }

  .reject-tip {
    font-size: 14px;
    color: #4e5969;
    line-height: 1.6;
    margin: 0 0 20px;
  }

  .reject-section {
    margin-bottom: 20px;

    .section-label,
    .section-label-row {
      font-size: 14px;
      color: #1d2129;
      font-weight: 500;
      margin-bottom: 10px;
    }

    .section-label-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .section-hint {
      font-size: 12px;
      color: #86909c;
      font-weight: 400;
    }
  }

  .screenshot-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .screenshot-item {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #e5e6eb;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .screenshot-remove {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      padding: 0;
      min-width: 20px;
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      border-radius: 50%;

      &:hover {
        background: rgba(0, 0, 0, 0.7);
      }
    }
  }

  .screenshot-upload {
    width: 80px;
    height: 80px;
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #86909c;
    cursor: pointer;
    transition: color 0.2s;
    font-size: 20px;

    &:hover {
      color: #165dff;
    }
  }

  .screenshot-limit {
    width: 80px;
    height: 80px;
    border: 1px dashed #c9cdd4;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #86909c;
    font-size: 12px;
  }

  // 独立填写审核意见 - 表格视图
  .independent-table {
    border: 1px solid #e5e6eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .independent-header,
  .independent-row {
    display: grid;
    grid-template-columns: 80px 160px 1fr 280px;
    align-items: start;

    .col {
      padding: 10px 12px;
      font-size: 13px;
      color: #1d2129;
      word-break: break-all;
    }

    // 审核意见列：去掉右侧 padding，让边框与截图列紧贴无空隙
    .col-comment {
      padding-right: 0;
    }

    // 审核截图列：去掉外框，cell 内 padding 交给内部 row-screenshots
    .col-screenshot {
      padding: 0;
    }
  }

  .independent-header {
    background: #f7f8fa;
    font-weight: 500;
    color: #4e5969;
    border-bottom: 1px solid #e5e6eb;
  }

  .independent-row {
    border-bottom: 1px solid #e5e6eb;

    &:last-child {
      border-bottom: none;
    }
  }

  .row-thumb {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    background: #f2f3f5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: #86909c;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .row-name {
    line-height: 1.5;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .row-screenshots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 0;
    // 「+」号靠右，与 280px 列右边缘对齐
    justify-content: flex-end;
  }

  .screenshot-upload-mini {
    width: 56px;
    height: 56px;
    font-size: 16px;
  }
}

// 素材详情右抽屉（沿用素材列表的 detail-v2 布局）
.detail-v2 {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;

  .dv-close {
    position: absolute;
    top: 12px;
    right: 16px;
    z-index: 10;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ffffff;
    color: #4e5969;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.2s;

    &:hover {
      background: #f2f3f5;
      color: #1d2129;
    }
  }

  .dv-page {
    flex: 1;
    overflow: auto;
    padding: 24px 32px;
  }

  .dv-top {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dv-header-box {
    background: #ffffff;
    border-radius: 8px;
    padding: 20px 24px;
  }

  .dv-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dv-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .dv-title {
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dv-head-right {
    flex-shrink: 0;
  }

  .dv-usage {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;

    &.usage-hot {
      background: #fff7e8;
      color: #ff7d00;
    }
    &.usage-run {
      background: #e8f5e9;
      color: #00b42a;
    }
    &.usage-cold {
      background: #ffece8;
      color: #f53f3f;
    }
    &.usage-none {
      background: #f2f3f5;
      color: #86909c;
    }
  }

  .dv-meta {
    margin-top: 8px;
    font-size: 13px;
    color: #86909c;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;

    .sep {
      color: #c9cdd4;
    }
  }

  .dv-body-wrap {
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
  }

  .dv-body {
    padding: 16px 24px 24px;
  }

  .dv-tabs {
    :deep(.arco-tabs-nav) {
      padding: 0 0 12px;
    }
  }

  .dv-flist {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 32px;
  }

  .fld2 {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 28px;

    .fld-l {
      width: 80px;
      flex-shrink: 0;
      color: #86909c;
      font-size: 13px;
    }

    .fld-v {
      color: #1d2129;
      font-size: 13px;
      flex: 1;
      min-width: 0;
      word-break: break-all;
    }
  }

  .dv-shot-thumb {
    width: 80px;
    height: 45px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #e5e6eb;
    cursor: pointer;
  }
}

// 素材详情右抽屉（沿用素材列表 detail-v2 完整样式）
.detail-v2 {
  height: 100%;
  position: relative;
  background: #f7f8fa;
}

.detail-v2 .dv-page {
  height: 100%;
  overflow-y: auto;
}

.detail-v2 .dv-top {
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.detail-v2 .dv-close {
  position: fixed;
  top: 16px;
  right: 1120px;
  width: 40px;
  height: 40px;
  background: #165DFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  z-index: 1001;
  font-size: 18px;
  transition: background 0.2s;
}
.detail-v2 .dv-close:hover {
  background: #4080FF;
}

.detail-v2 .dv-preview {
  width: 100%;
  border-top: 8px solid #F2F3F5;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #FAFBFC;
}

.detail-v2 .dv-phone {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.detail-v2 .phone-frame {
  position: relative;
  width: 320px;
  padding: 10px;
  border-radius: 40px;
  background: #1D2129;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.detail-v2 .phone-notch {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 24px;
  background: #1D2129;
  border-radius: 0 0 14px 14px;
  z-index: 5;
}

.detail-v2 .phone-screen {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 18.5;
  border-radius: 30px;
  overflow: hidden;
  background: #000;
  cursor: pointer;
}

.detail-v2 .phone-screen img,
.detail-v2 .phone-screen video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 抖音 UI 叠层 */
.detail-v2 .dy-ui {
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: #fff;
}

.detail-v2 .dy-topnav {
  position: absolute;
  top: 30px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.detail-v2 .dy-topnav .dy-tabs {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.detail-v2 .dy-topnav .active {
  color: #fff;
  font-weight: 600;
  border-bottom: 2px solid #fff;
  padding-bottom: 2px;
}
.detail-v2 .dy-topnav .dy-menu,
.detail-v2 .dy-topnav .dy-search {
  width: 20px;
  height: 20px;
  color: #fff;
  flex-shrink: 0;
}

.detail-v2 .dy-side {
  position: absolute;
  right: 8px;
  top: 30%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.detail-v2 .dy-avatar {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #fff;
  overflow: visible;
}
.detail-v2 .dy-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.detail-v2 .dy-avatar .dy-follow {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #FE2C55;
  color: #fff;
  font-size: 13px;
  line-height: 18px;
  text-align: center;
}
.detail-v2 .dy-act {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.detail-v2 .dy-act svg {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 0 1.5px rgba(0, 0, 0, 0.45));
}
.detail-v2 .dy-act span {
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.detail-v2 .dy-rate-btn {
  pointer-events: auto;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  white-space: nowrap;
}
.detail-v2 .dy-rate-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.detail-v2 .dy-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 44px;
  padding: 0 12px 10px;
}
.detail-v2 .dy-controls .ctrl-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
}
.detail-v2 .dy-controls .ctrl-ic {
  width: 22px;
  height: 22px;
  color: #fff;
}
.detail-v2 .dy-controls .ctrl-ic.clickable {
  pointer-events: auto;
  cursor: pointer;
}
.detail-v2 .dy-controls .ctrl-vol {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
}
.detail-v2 .dy-controls .ctrl-vol.expanded {
  padding: 4px 12px;
  border-radius: 999px;
  background: #2B2B2B;
}
.detail-v2 .dy-controls .vol-slider {
  pointer-events: auto;
  margin: 0;
}
.detail-v2 .dy-controls .vol-slider .arco-slider-track {
  background: rgba(255, 255, 255, 0.3);
}
.detail-v2 .dy-controls .vol-slider .arco-slider-bar {
  background: #FFFFFF;
}
.detail-v2 .dy-controls .vol-slider .arco-slider-btn::after {
  background: #FFFFFF;
  border-color: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.detail-v2 .dy-controls .ctrl-time {
  font-size: 13px;
}
.detail-v2 .dy-controls .ctrl-spacer {
  flex: 1;
}
.detail-v2 .dy-controls .ctrl-bar {
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  position: relative;
  pointer-events: auto;
  cursor: pointer;
}
.detail-v2 .dy-controls .ctrl-bar i {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2%;
  background: #fff;
  border-radius: 2px;
}

.detail-v2 .dy-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 44px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: space-around;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}
.detail-v2 .dy-tabbar .dy-plus {
  width: 38px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(90deg, #25F4EE, #FE2C55);
  color: #fff;
  font-size: 18px;
  line-height: 24px;
  text-align: center;
}
.detail-v2 .dy-tabbar .dy-msg { position: relative; }
.detail-v2 .dy-tabbar .dy-msg i {
  position: absolute;
  top: -6px;
  right: -12px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background: #FE2C55;
  color: #fff;
  font-size: 9px;
  line-height: 14px;
  font-style: normal;
}

.detail-v2 .dv-main {
  flex: none;
  min-width: 0;
  padding: 16px 20px;
  width: 100%;
}

.detail-v2 .dv-header-box {
  position: relative;
  padding: 12px 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, #EAF2FF 0%, #F5F9FF 60%, #FFFFFF 100%);
  border: 1px solid #E3ECFF;
  overflow: hidden;
}
.detail-v2 .dv-header-box::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #165DFF;
}

.detail-v2 .dv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-v2 .dv-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.detail-v2 .dv-title {
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-v2 .dv-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.detail-v2 .dv-usage {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.detail-v2 .dv-usage.usage-hot { background: #FFECE8; color: #F53F3F; }
.detail-v2 .dv-usage.usage-run { background: #E8F7EC; color: #00B42A; }
.detail-v2 .dv-usage.usage-cold { background: #F2F3F5; color: #86909C; }
.detail-v2 .dv-usage.usage-none { background: #F2F3F5; color: #86909C; }

.detail-v2 .dv-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: #86909C;
}
.detail-v2 .dv-meta .sep { color: #E5E6EB; }

.detail-v2 .dv-tabs {
  margin-top: 8px;
}

.detail-v2 .dv-body-wrap {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.detail-v2 .dv-body {
  flex: 1;
  min-width: 0;
}

.detail-v2 .dv-flist {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail-v2 .fld2 {
  display: flex;
  align-items: center;
  font-size: 13px;
}
.detail-v2 .fld2 .fld-l {
  color: #86909C;
  width: 96px;
  flex-shrink: 0;
}
.detail-v2 .fld2 .fld-v {
  color: #1D2129;
}

.detail-v2 .dv-divider {
  height: 1px;
  background: #F2F3F5;
  margin: 16px 0;
}
</style>
