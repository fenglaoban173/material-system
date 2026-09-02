<template>
  <div class="material-lib-page">
    <!-- 左侧文件目录 -->
    <div class="left-sidebar">
      <div class="sidebar-header">
        <svg class="logo-icon" viewBox="0 0 1024 1024" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M138.667 170.667h226.133c22.634 0 44.267 9.6 59.734 26.4l50.133 54.4c1.6 1.6 3.733 2.666 6.4 2.666h274.133c58.934 0 106.667 47.734 106.667 106.667v320c0 58.933-47.733 106.667-106.667 106.667H138.667C79.733 787.867 32 740.133 32 681.333V277.333c0-58.933 47.733-106.666 106.667-106.666z"/>
          <path fill="currentColor" opacity="0.55" d="M32 384h960v297.333c0 58.933-47.733 106.667-106.667 106.667H138.667C79.733 788 32 740.267 32 681.333V384z"/>
        </svg>
        <span class="logo-text">文件夹</span>
        <IconPlus class="header-plus-icon" @click="showAddFolderDialog = true" />
      </div>
      <div class="folder-tree">
        <div
          v-for="item in folderTree"
          :key="item.key"
          class="folder-item"
        >
          <div
            class="folder-main"
            :class="{ active: selectedFolder === item.key }"
            @click="handleFolderToggle(item)"
          >
            <IconCaretRight v-if="item.children?.length" :class="{ expanded: expandedFolders.includes(item.key) }" />
            <IconFile v-else />
            <span>{{ item.title }}</span>
            <span class="folder-more-wrapper" @click.stop>
              <a-popover trigger="click" placement="right">
                <template #content>
                  <div class="folder-actions">
                    <div class="action-item" @click="handleAddChild(item)">添加子类</div>
                    <div class="action-item" @click="handleEditFolder(item)">编辑</div>
                    <div class="action-item danger" @click="handleDeleteFolder(item)">删除</div>
                  </div>
                </template>
                <IconMore class="folder-more-icon" />
              </a-popover>
            </span>
          </div>
          <div v-if="item.children?.length && expandedFolders.includes(item.key)" class="folder-children">
            <div
              v-for="child in item.children"
              :key="child.key"
              class="folder-child"
              :class="{ active: selectedSubFolder === child.key }"
              @click.stop="selectedSubFolder = child.key"
            >
              <IconFolder />
              <span>{{ child.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增文件夹弹窗 -->
    <a-modal v-model:visible="showAddFolderDialog" title="新增文件夹" :width="480">
      <template #footer>
        <div class="modal-footer">
          <a-button @click="showAddFolderDialog = false">取消</a-button>
          <a-button type="primary" @click="handleAddFolder">确定</a-button>
        </div>
      </template>
      <div class="add-folder-form">
        <div class="form-item">
          <span class="form-label">文件夹级别</span>
          <a-select v-model="newFolderForm.level" placeholder="请选择级别" style="width: 100%;">
            <a-option :value="1">一级文件夹</a-option>
            <a-option :value="2">二级文件夹</a-option>
          </a-select>
        </div>
        <div class="form-item">
          <span class="form-label">文件夹名称</span>
          <a-input v-model="newFolderForm.name" placeholder="请输入名称" style="width: 100%;" />
        </div>
        <div class="form-item">
          <span class="form-label">排序</span>
          <a-input-number v-model="newFolderForm.sort" :min="0" :default-value="0" style="width: 100%;" />
        </div>
      </div>
    </a-modal>

    <!-- 编辑文件夹弹窗 -->
    <a-modal v-model:visible="showEditFolderDialog" title="编辑文件夹" :width="480">
      <template #footer>
        <div class="modal-footer">
          <a-button @click="showEditFolderDialog = false">取消</a-button>
          <a-button type="primary" @click="handleConfirmEdit">确定</a-button>
        </div>
      </template>
      <div class="add-folder-form">
        <div class="form-item">
          <span class="form-label">文件夹级别</span>
          <a-select v-model="editFolderForm.level" placeholder="请选择级别" style="width: 100%;">
            <a-option :value="1">一级文件夹</a-option>
            <a-option :value="2">二级文件夹</a-option>
          </a-select>
        </div>
        <div class="form-item">
          <span class="form-label">文件夹名称</span>
          <a-input v-model="editFolderForm.name" placeholder="请输入名称" style="width: 100%;" />
        </div>
        <div class="form-item">
          <span class="form-label">排序</span>
          <a-input-number v-model="editFolderForm.sort" :min="0" :default-value="0" style="width: 100%;" />
        </div>
      </div>
    </a-modal>

    <!-- 添加子类弹窗 -->
    <a-modal v-model:visible="showAddChildDialog" title="添加子类" :width="480">
      <template #footer>
        <div class="modal-footer">
          <a-button @click="showAddChildDialog = false">取消</a-button>
          <a-button type="primary" @click="handleConfirmAddChild">确定</a-button>
        </div>
      </template>
      <div class="add-folder-form">
        <div class="form-item">
          <span class="form-label">文件夹名称</span>
          <a-input v-model="addChildForm.name" placeholder="请输入名称" style="width: 100%;" />
        </div>
        <div class="form-item">
          <span class="form-label">排序</span>
          <a-input-number v-model="addChildForm.sort" :min="0" :default-value="0" style="width: 100%;" />
        </div>
      </div>
    </a-modal>


    <!-- 获取账户素材弹窗 -->
    <a-modal v-model:visible="showAccountDialog" title="获取账户素材" :width="1100" :footer="false" :body-style="{ padding: 0 }">
      <div class="account-dialog">
        <!-- 顶部：查询条件 -->
        <div class="account-top">
          <div class="query-row" style="justify-content: flex-start;">
            <div class="query-item" style="flex: none;">
              <span class="query-label">媒体</span>
              <a-select v-model="accountQuery.platform" placeholder="请选择" style="width: 160px;">
                <a-option value="douyin">抖音</a-option>
                <a-option value="toutiao">今日头条</a-option>
                <a-option value="kuaishou">快手</a-option>
                <a-option value="weibo">微博</a-option>
              </a-select>
            </div>
            <div class="query-item" style="flex: none;">
              <span class="query-label">账户名称</span>
              <a-select v-model="accountQuery.accountName" placeholder="请选择" allow-search :filter-option="(input, option) => (option.label || '').toLowerCase().includes(input.toLowerCase())" style="width: 160px;">
                <a-option label="账户A（抖音）">账户A（抖音）</a-option>
                <a-option label="账户B（抖音）">账户B（抖音）</a-option>
                <a-option label="账户C（头条）">账户C（头条）</a-option>
                <a-option label="账户D（快手）">账户D（快手）</a-option>
                <a-option label="账户E（微博）">账户E（微博）</a-option>
              </a-select>
            </div>
            <div class="query-item" style="flex: none;">
              <span class="query-label">类型</span>
              <a-select v-model="accountQuery.type" placeholder="请选择" style="width: 160px;">
                <a-option value="">全部</a-option>
                <a-option value="VIDEO">视频</a-option>
                <a-option value="IMAGE">图片</a-option>
              </a-select>
            </div>
            <div class="query-item" style="flex: none;">
              <span class="query-label">素材来源</span>
              <a-select v-model="accountQuery.source" placeholder="请选择" style="width: 160px;">
                <a-option value="">全部</a-option>
                <a-option value="原生">原生</a-option>
                <a-option value="二创">二创</a-option>
                <a-option value="搬运">搬运</a-option>
              </a-select>
            </div>
          </div>
          <div class="query-row" style="justify-content: flex-start;">
            <div class="query-item" style="flex: none;">
              <span class="query-label">素材名称</span>
              <a-input v-model="accountQuery.materialName" placeholder="请输入" style="width: 160px;" />
            </div>
            <div class="query-item" style="flex: none; margin-left: 4px;">
              <span class="query-label">创建时间</span>
              <a-range-picker v-model="accountQuery.dateRange" style="width: 240px;" />
            </div>
          </div>
          <div class="query-actions">
            <a-button type="text" @click="handleAccountReset">重置</a-button>
            <a-button type="primary" @click="handleAccountSearch">查询</a-button>
          </div>
        </div>

        <!-- 中部：数据列表 -->
        <div class="account-middle">
          <a-table
            :columns="accountColumns"
            :data="accountTableData"
            :pagination="{ pageSize: 10, total: accountTableData.length, showTotal: true, showJumper: true }"
            :row-selection="{ type: 'checkbox', showCheckedAll: true }"
            row-key="id"
            :scroll="{ y: 300 }"
          >
            <template #material="{ record }">
              <div class="account-thumb" @click="handlePreviewThumb(record)">
                <img v-if="record.thumbnail" :src="record.thumbnail" alt="" />
                <IconVideoCamera v-else-if="record.type === 'VIDEO'" />
                <IconImage v-else />
              </div>
            </template>
          </a-table>
        </div>

        <!-- 底部：选择信息和操作 -->
        <div class="account-bottom">
          <div class="bottom-left">
            <span class="selected-count">已选 <strong>{{ selectedAccountMaterials.length }}</strong> 个</span>
            <div class="folder-select">
              <span class="query-label">选择文件夹</span>
              <a-select v-model="accountTargetFolder" placeholder="请选择文件夹" style="width: 160px;">
                <a-option value="all">全部素材</a-option>
                <a-option value="video">视频</a-option>
                <a-option value="image">图片</a-option>
                <a-option value="618">618活动</a-option>
                <a-option value="brand">品牌素材</a-option>
              </a-select>
            </div>
          </div>
          <div class="bottom-right">
            <a-button @click="showAccountDialog = false">取消</a-button>
            <a-button type="primary" @click="handleAccountImport">确定</a-button>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-modal
      v-model:visible="showPreviewDialog"
      :width="900"
      :footer="false"
      :closable="false"
      class="preview-modal"
    >
      <div style="position: relative;">
        <IconClose
          style="position: absolute; right: 8px; top: 8px; cursor: pointer; z-index: 10;"
          @click="showPreviewDialog = false"
        />
        <img :src="previewImage" alt="" style="width: 100%; display: block;" />
      </div>
    </a-modal>

    <!-- 推送到账户弹窗 -->
    <a-modal v-model:visible="showPushDialog" title="推送到账户" :width="900" :body-style="{ padding: 0 }">
      <template #footer>
        <div class="modal-footer">
          <a-button @click="showPushDialog = false">取消</a-button>
          <a-button type="primary" @click="handleConfirmPush">确定</a-button>
        </div>
      </template>
      <div class="push-dialog">
        <div class="push-hint">
          已选择 <strong>{{ selectedMaterials.length }}</strong> 个素材，系统将自动推送素材到账户
        </div>
        <div class="push-top">
          <div class="form-item">
            <span class="form-label">媒体</span>
            <a-select v-model="pushForm.media" placeholder="请选择" style="width: 200px;">
              <a-option value="douyin">抖音</a-option>
              <a-option value="toutiao">今日头条</a-option>
              <a-option value="kuaishou">快手</a-option>
            </a-select>
          </div>
          <div class="form-item">
            <span class="form-label">主体名称</span>
            <a-select v-model="pushForm.subject" placeholder="请选择" style="width: 200px;">
              <a-option value="sub1">主体A</a-option>
              <a-option value="sub2">主体B</a-option>
            </a-select>
          </div>
        </div>
        <div class="push-middle">
          <div class="push-left">
            <div class="push-left-header">
              <span>选择推送账户</span>
            </div>
            <div class="search-wrapper">
              <a-input-search v-model="pushSearchKeyword" placeholder="搜索账户名称" style="width: 100%;" />
            </div>
            <div class="select-all-wrapper">
              <a-checkbox
                v-model="pushSelectAll"
                :indeterminate="isPushIndeterminate"
                @change="handlePushSelectAll"
              >全选</a-checkbox>
            </div>
            <div class="account-list">
              <div v-for="acc in filteredPushAccounts" :key="acc.id" class="account-item">
                <a-checkbox v-model="acc.selected" />
                <span class="account-name">{{ acc.name }}</span>
              </div>
            </div>
          </div>
          <div class="push-right">
            <div class="push-right-header">
              <span>已选账户({{ selectedPushAccounts.length }}/50个)</span>
              <a-button type="text" size="small" @click="handleClearPushAccounts">清空</a-button>
            </div>
            <div class="selected-list">
              <div v-for="acc in selectedPushAccounts" :key="acc.id" class="selected-item">
                <span>{{ acc.name }}</span>
                <a-button type="text" size="small" @click="handleRemovePushAccount(acc)">
                  <IconClose />
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 素材移动弹窗 -->
    <a-modal v-model:visible="showMoveDialog" title="素材移动" :width="500" :body-style="{ padding: 0 }">
      <template #footer>
        <div class="modal-footer">
          <a-button @click="showMoveDialog = false">取消</a-button>
          <a-button type="primary" @click="handleConfirmMove">确定</a-button>
        </div>
      </template>
      <div class="move-dialog">
        <div class="move-form">
          <div class="form-item">
            <span class="form-label">素材目录</span>
            <div class="form-control">
              <a-select v-model="moveForm.folder" placeholder="请选择目录" allow-search allow-clear style="width: 100%;">
                <a-option value="all">全部素材</a-option>
                <a-option value="video">视频</a-option>
                <a-option value="image">图片</a-option>
                <a-option value="audio">音频</a-option>
                <a-option value="618">618活动</a-option>
                <a-option value="brand">品牌素材</a-option>
              </a-select>
              <a-button type="text" @click="showAddFolderDialog = true">新建文件夹</a-button>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 素材前测弹窗 -->
    <a-modal v-model:visible="showPreTestDialog" title="素材前测" :width="900" :body-style="{ padding: 0 }">
      <template #footer>
        <div class="modal-footer">
          <a-button @click="showPreTestDialog = false">取消</a-button>
          <a-button type="primary" @click="handleConfirmPreTest">确定</a-button>
        </div>
      </template>
      <div class="pretest-dialog">
        <div class="pretest-middle">
          <div class="pretest-left">
            <div class="pretest-left-header">已选素材 ({{ selectedPreTestMaterials.length }})</div>
            <div class="pretest-material-list">
              <div v-for="(item, idx) in selectedPreTestMaterials" :key="idx" class="pretest-material-item">
                <img v-if="item.thumbnail" :src="item.thumbnail" alt="" class="material-thumb" />
                <IconVideoCamera v-else-if="item.type === 'VIDEO'" class="material-icon" />
                <IconImage v-else class="material-icon" />
                <span class="material-name">{{ item.name }}</span>
              </div>
            </div>
          </div>
          <div class="pretest-right">
            <div class="config-section">
              <div class="config-form">
                <div class="pretest-hint">
                  <icon-info-circle />
                  <span>输入更多的投放设置,提升前测预估准确率，输入信息越多检测准确率越高哦！</span>
                </div>
                <div class="form-item">
                  <span class="form-label"><span class="required-mark">*</span>客户主体名称</span>
                  <a-select v-model="preTestForm.customerSubject" placeholder="请选择" style="width: 100%;">
                    <a-option value="sub1">主体A</a-option>
                    <a-option value="sub2">主体B</a-option>
                    <a-option value="sub3">主体C</a-option>
                  </a-select>
                </div>
                <div class="form-item">
                  <span class="form-label"><span class="required-mark">*</span>广告主账户</span>
                  <a-select v-model="preTestForm.adAccount" placeholder="请选择" style="width: 100%;">
                    <a-option value="ad1">广告主账户A</a-option>
                    <a-option value="ad2">广告主账户B</a-option>
                    <a-option value="ad3">广告主账户C</a-option>
                  </a-select>
                </div>
                <div class="form-item">
                  <span class="form-label">投放设置</span>
                  <a-radio-group v-model="preTestForm.deliverySetting" type="button">
                    <a-radio value="custom">自定义设置</a-radio>
                    <a-radio value="reference">参考广告账户</a-radio>
                  </a-radio-group>
                </div>
                <div v-if="preTestForm.deliverySetting === 'reference'">
                <div class="form-item">
                  <span class="form-label">
                    参考广告账户ID
                    <a-tooltip content="选择参考广告账户ID后，系统将会用该广告账户ID的前测配置参数执行前测任务，选择后会忽略以下所有配置项。">
                      <span class="form-tip-icon">
                        <IconQuestionCircle />
                      </span>
                    </a-tooltip>
                  </span>
                  <a-select v-model="preTestForm.adAccountId" placeholder="请输入搜索" allow-search allow-clear style="width: 100%;">
                    <a-option value="id1">账户ID-001</a-option>
                    <a-option value="id2">账户ID-002</a-option>
                    <a-option value="id3">账户ID-003</a-option>
                  </a-select>
                </div>
                </div>
                <div v-if="!preTestForm.deliverySetting || preTestForm.deliverySetting === 'custom'">
                <div class="form-item">
                  <span class="form-label">投放平台</span>
                  <a-radio-group v-model="preTestForm.targetPlatform" type="button">
                    <a-radio value="AD">巨量广告</a-radio>
                    <a-radio value="QICHUAN">巨量千川</a-radio>
                  </a-radio-group>
                </div>
                <div class="form-item">
                  <span class="form-label">优化目标</span>
                  <a-cascader
                    v-model="preTestForm.conversionGoalPath"
                    :options="conversionGoalOptions"
                    placeholder="请选择"
                    allow-search
                    expand-trigger="click"
                    path-mode
                    style="width: 100%;"
                  />
                </div>
                <div class="form-item">
                  <span class="form-label">受众性别</span>
                  <a-radio-group v-model="preTestForm.audienceGender" type="button">
                    <a-radio value="MALE">男</a-radio>
                    <a-radio value="FEMALE">女</a-radio>
                    <a-radio value="UNLIMITED">不限</a-radio>
                  </a-radio-group>
                </div>
                <div class="form-item">
                  <span class="form-label">受众年龄</span>
                  <a-select v-model="preTestForm.audienceAge" placeholder="请选择" allow-clear multiple style="width: 100%;">
                    <a-option value="UNLIMITED">不限</a-option>
                    <a-option value="18-23">18-23</a-option>
                    <a-option value="24-30">24-30</a-option>
                    <a-option value="31-40">31-40</a-option>
                    <a-option value="41-49">41-49</a-option>
                    <a-option value="50+">50+</a-option>
                  </a-select>
                </div>
                <div class="form-item">
                  <span class="form-label">受众地区</span>
                  <a-select v-model="preTestForm.audienceRegion" placeholder="请输入搜索" allow-search allow-clear multiple style="width: 100%;">
                    <a-option value="beijing">北京</a-option>
                    <a-option value="shanghai">上海</a-option>
                    <a-option value="guangzhou">广州</a-option>
                    <a-option value="shenzhen">深圳</a-option>
                  </a-select>
                </div>
                <div class="form-item">
                  <span class="form-label">网络类型</span>
                  <a-select v-model="preTestForm.audienceNetwork" placeholder="请选择" allow-clear multiple style="width: 100%;">
                    <a-option value="UNLIMITED">不限</a-option>
                    <a-option value="5G">5G</a-option>
                    <a-option value="4G">4G</a-option>
                    <a-option value="3G">3G</a-option>
                    <a-option value="2G">2G</a-option>
                    <a-option value="WIFI">WIFI</a-option>
                  </a-select>
                </div>
                <div class="form-item">
                  <span class="form-label">客户主体名称</span>
                  <a-select v-model="preTestForm.customerSubject" placeholder="请输入搜索" allow-search allow-clear style="width: 100%;">
                    <a-option value="subject1">主体A</a-option>
                    <a-option value="subject2">主体B</a-option>
                    <a-option value="subject3">主体C</a-option>
                  </a-select>
                </div>
                <div class="form-item">
                  <span class="form-label">计费方式</span>
                  <a-radio-group v-model="preTestForm.billingMethod" type="button">
                    <a-radio value="OCPC">OCPC</a-radio>
                    <a-radio value="CPA">CPA</a-radio>
                    <a-radio value="OCPM">OCPM</a-radio>
                  </a-radio-group>
                </div>
                <div v-if="preTestForm.targetPlatform === 'AD'" class="form-item">
                  <span class="form-label">是否最优成本出价</span>
                  <a-radio-group v-model="preTestForm.isOptimalBid" type="button">
                    <a-radio value="YES">是</a-radio>
                    <a-radio value="NO">否</a-radio>
                  </a-radio-group>
                </div>
                <div v-if="preTestForm.targetPlatform === 'AD'" class="form-item">
                  <span class="form-label">是否稳定成本出价</span>
                  <a-radio-group v-model="preTestForm.isStableBid" type="button">
                    <a-radio value="YES">是</a-radio>
                    <a-radio value="NO">否</a-radio>
                  </a-radio-group>
                </div>
                <div v-if="preTestForm.targetPlatform === 'AD'" class="form-item">
                  <span class="form-label">是否最大转化出价</span>
                  <a-radio-group v-model="preTestForm.isMaxConversionBid" type="button">
                    <a-radio value="YES">是</a-radio>
                    <a-radio value="NO">否</a-radio>
                  </a-radio-group>
                </div>
                <div class="form-item">
                  <span class="form-label">目标转化成本</span>
                  <a-input-number v-model="preTestForm.targetConversionCost" placeholder="请输入" :min="1" :max="10000" :precision="2" style="width: 100%;" />
                </div>
                <div class="form-item">
                  <span class="form-label">目标点击成本</span>
                  <a-input-number v-model="preTestForm.targetClickCost" placeholder="请输入" :min="1" :max="10000" :precision="2" style="width: 100%;" />
                </div>
                <div class="form-item">
                  <span class="form-label">预算金额</span>
                  <a-input-number v-model="preTestForm.budgetAmount" placeholder="请输入" :min="1" :max="10000" :precision="2" style="width: 100%;" />
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 素材详情抽屉 -->
    <a-drawer
      v-model:visible="showDetailDialog"
      placement="right"
      :width="1120"
      :footer="false"
      :header="false"
      :body-style="{ padding: 0, overflow: 'hidden' }"
    >
      <div v-if="currentMaterial" class="detail-v2">
        <div class="dv-close" @click="showDetailDialog = false">
          <IconClose />
        </div>

        <div class="dv-page">
          <!-- 顶部：预览 + 详情字段 -->
          <div class="dv-top">
            <!-- 左侧：预览 + 操作 -->
            <div class="dv-preview">
              <div class="dv-platforms">
                <a-select v-model="detailVersion" size="mini" class="dv-version">
                  <a-option value="latest">最新版本</a-option>
                  <a-option value="v2">历史版本 V2</a-option>
                  <a-option value="v1">历史版本 V1</a-option>
                </a-select>
              </div>
              <div class="dv-phone">
                <div class="phone-frame">
                  <div class="phone-notch"></div>
                  <div class="phone-screen" ref="phoneScreenRef" @click="handlePreviewMedia">
                    <img v-if="currentMaterial.type === 'IMAGE'" :src="currentMaterial.thumbnail" :alt="currentMaterial.name" />
                    <video v-else-if="currentMaterial.type === 'VIDEO'" ref="videoRef" :src="(currentMaterial.videoUrl || currentMaterial.thumbnail) + (currentMaterial.videoUrl ? '#t=0.1' : '')" :poster="currentMaterial.videoUrl ? undefined : currentMaterial.thumbnail" playsinline preload="metadata" @click.stop="handlePreviewMedia" @play="dyPlaying = true" @pause="dyPlaying = false" @ended="dyPlaying = false" @loadedmetadata="onVideoMeta" @durationchange="onVideoMeta" @timeupdate="onVideoTime" />

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
                        <div class="dy-avatar"><img :src="currentMaterial.thumbnail" /><span class="dy-follow">+</span></div>
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

            <!-- 右侧：详情字段 -->
            <div class="dv-main">
              <div class="dv-header-box">
                <div class="dv-head">
                  <div class="dv-title-wrap">
                    <template v-if="detailEditMode">
                      <a-input v-model="currentMaterial.name" size="small" class="dv-title-input" @press-enter="detailEditMode = false" />
                      <IconCheck class="title-act ok" @click="detailEditMode = false" />
                      <IconClose class="title-act cancel" @click="detailEditMode = false" />
                    </template>
                    <template v-else>
                      <span class="dv-title" :title="currentMaterial.name">{{ currentMaterial.name }}</span>
                      <IconEdit class="dv-title-edit" @click="detailEditMode = true" />
                    </template>
                  </div>
                  <div class="dv-head-right">
                    <span class="dv-usage" :class="usageBadgeClass(currentMaterial.usage)">{{ currentMaterial.usage || '未使用' }}</span>
                  </div>
                </div>
                <div class="dv-meta">
                  <span><IconEye /> {{ currentMaterial.views ?? 0 }}</span>
                  <span class="sep">|</span>
                  <span>剪辑：{{ currentMaterial.editor || '-' }}</span>
                  <span class="sep">|</span>
                  <span>上传：{{ currentMaterial.uploadTime }}</span>
                </div>
              </div>

              <div class="dv-body-wrap">
                <div class="dv-body">
                  <a-tabs v-model:active-key="detailTab" class="dv-tabs">
                    <a-tab-pane key="detail" title="素材详情">
                      <!-- 顶部字段（宽值） -->
                      <div class="dv-flist">
                        <div class="fld2"><span class="fld-l">目录</span><span class="fld-v">{{ currentFolderName }}</span></div>
                        <div class="fld2">
                          <span class="fld-l">素材类型</span>
                          <span class="fld-v">
                            <a-tag v-if="currentMaterial.materialTypePath?.length" color="purple" size="small" effect="plain">
                              {{ formatMaterialTypePath(materialTypeOptions, currentMaterial.materialTypePath) }}
                            </a-tag>
                            <span v-else>-</span>
                          </span>
                        </div>
                        <div class="fld2">
                          <span class="fld-l">素材版式</span>
                          <span class="fld-v">
                            <a-tag v-if="currentMaterial.format" color="arcoblue" size="small" effect="plain">
                              {{ currentMaterial.format }}
                            </a-tag>
                            <span v-else>-</span>
                          </span>
                        </div>
                        <div class="fld2"><span class="fld-l">需求ID</span><span class="fld-v">{{ currentMaterial.demandId || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">内部素材ID</span><span class="fld-v">{{ currentMaterial.internalMaterialId || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">平台素材ID</span><span class="fld-v">{{ currentMaterial.platformMaterialId || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">投放媒体</span><span class="fld-v">{{ currentMaterial.platform || '-' }}</span></div>
                        <div class="fld2"><span class="fld-l">所属账号ID</span><span class="fld-v">{{ currentMaterial.accountId || '-' }}</span></div>
                        <div class="fld2">
                          <span class="fld-l">备注</span>
                          <template v-if="editingField === 'remark'">
                            <a-input v-model="currentMaterial.remark" size="mini" class="fld-edit-input" placeholder="请输入备注" @press-enter="stopFieldEdit" />
                            <IconCheck class="fld-act ok" @click="stopFieldEdit" />
                            <IconClose class="fld-act cancel" @click="stopFieldEdit" />
                          </template>
                          <template v-else>
                            <span class="fld-v">{{ currentMaterial.remark || '-' }}</span>
                            <IconEdit class="fld-edit" @click="startFieldEdit('remark')" />
                          </template>
                        </div>
                      </div>

                      <div class="dv-divider"></div>

                      <!-- 人员信息（两列，可编辑） -->
                      <div class="dv-fields-2col">
                        <div class="fld" v-for="f in peopleFields" :key="f.key">
                          <span class="fld-l">{{ f.label }}</span>
                          <template v-if="editingField === f.key">
                            <!-- 多选字段：选完不立即关闭，由用户点 IconClose 确认 -->
                            <a-select
                              v-if="f.multiple"
                              v-model="currentMaterial[f.key]"
                              size="mini"
                              multiple
                              allow-search
                              allow-clear
                              placeholder="可多选"
                              class="fld-edit-input"
                            >
                              <a-option v-for="n in personOptions" :key="n" :value="n">{{ n }}</a-option>
                            </a-select>
                            <!-- 单选字段：选完自动结束编辑 -->
                            <a-select
                              v-else
                              v-model="currentMaterial[f.key]"
                              size="mini"
                              allow-search
                              allow-clear
                              placeholder="搜索姓名"
                              class="fld-edit-input"
                              @change="stopFieldEdit"
                            >
                              <a-option v-for="n in personOptions" :key="n" :value="n">{{ n }}</a-option>
                            </a-select>
                            <IconClose class="fld-act cancel" @click="stopFieldEdit" />
                          </template>
                          <template v-else>
                            <span class="fld-v">{{ formatPeopleField(currentMaterial[f.key], f.multiple) }}</span>
                            <IconEdit class="fld-edit" @click="startFieldEdit(f.key)" />
                          </template>
                        </div>
                      </div>

                      <div class="dv-divider"></div>

                      <!-- 上传信息（两列） -->
                      <div class="dv-fields-2col">
                        <div class="fld"><span class="fld-l">上传时间</span><span class="fld-v">{{ currentMaterial.uploadTime }}</span></div>
                        <div class="fld"><span class="fld-l">上传人</span><span class="fld-v">{{ currentMaterial.uploader || '-' }}</span></div>
                        <div class="fld"><span class="fld-l">大小</span><span class="fld-v">{{ currentMaterial.size || '-' }}</span></div>
                        <div class="fld"><span class="fld-l">素材来源</span><span class="fld-v">创量后台上传</span></div>
                        <div class="fld"><span class="fld-l">尺寸</span><span class="fld-v">{{ currentMaterial.resolution || '-' }}</span></div>
                        <div class="fld"><span class="fld-l">时长</span><span class="fld-v">{{ currentMaterial.duration || '-' }}</span></div>
                      </div>
                    </a-tab-pane>

                  </a-tabs>
                </div>
              </div>
            </div>
          </div>

          <!-- 效果数据（全宽） -->
          <div class="dv-block">
            <div class="dv-data-toolbar">
              <div class="toolbar-left">
                <a-select v-model="detailMediaFilter" size="small" style="width: 120px">
                  <a-option value="all">全部媒体</a-option>
                  <a-option value="douyin">抖音</a-option>
                  <a-option value="tencent">腾讯广告</a-option>
                </a-select>
                <a-range-picker v-model="detailDateRange" size="small" style="width: 240px" />
              </div>
            </div>
            <div class="dv-cards">
              <div v-for="card in detailMetricCards" :key="card.key" class="dv-card" :class="'card-' + card.key">
                <div class="card-label">{{ card.label }}</div>
                <div class="card-value">{{ card.value }}<span class="card-unit">{{ card.unit }}</span></div>
              </div>
            </div>
          </div>

          <!-- 最近N天创建的广告（全宽） -->
          <div class="dv-block">
            <div class="dv-block-title">
              <span>最近{{ adsRecentDays }}天创建的广告（创意）</span>
              <a-popover
                v-model:popup-visible="adsDaysDialogVisible"
                trigger="click"
                position="rt"
                :content-style="{ padding: '16px' }"
                @popup-visible-change="onAdsDaysPopup"
              >
                <IconEdit class="dv-title-edit" />
                <template #content>
                  <div class="ads-days-form">
                    <div class="ads-days-title">调整广告创建时间范围</div>
                    <div class="ads-days-label">请设置创建时间范围</div>
                    <a-input-number v-model="adsDaysDraft" :min="1" :max="365" :hide-button="true" placeholder="请输入天数" style="width: 100%">
                      <template #suffix>天</template>
                    </a-input-number>
                    <div class="ads-days-hint">修改后，创建时间在最近 {{ adsDaysDraft || adsRecentDays }} 天的关联广告信息被显示</div>
                    <div class="ads-days-footer">
                      <a-button size="small" @click="adsDaysDialogVisible = false">取消</a-button>
                      <a-button size="small" type="primary" @click="confirmAdsDays">确定</a-button>
                    </div>
                  </div>
                </template>
              </a-popover>
            </div>
            <a-tabs v-model:active-key="adsMediaTab" class="ads-media-tabs">
              <a-tab-pane key="all" :title="`全部媒体 (${relatedAds.length})`" />
              <a-tab-pane key="oceanengine" title="巨量广告 (0)" />
              <a-tab-pane key="tencent" :title="`腾讯广告3.0 (${relatedAds.length})`" />
            </a-tabs>
            <a-table
              :data="relatedAds"
              :pagination="{ pageSize: 5, showTotal: true, showPageSize: true, pageSizeOptions: [5, 10, 20, 50] }"
              size="small"
              row-key="id"
              :scroll="{ x: 1000 }"
            >
              <template #columns>
                <a-table-column title="广告(创意)名称/ID" :width="220" fixed="left">
                  <template #cell="{ record }">
                    <div class="ad-name">{{ record.name }}</div>
                    <div class="ad-id">ID: {{ record.id }}</div>
                  </template>
                </a-table-column>
                <a-table-column title="广告(创意)账户" data-index="account" :width="180" ellipsis tooltip />
                <a-table-column title="创建人" data-index="creator" :width="80" />
                <a-table-column title="消耗" data-index="cost" :width="90" align="right" />
                <a-table-column title="展示数" data-index="impressions" :width="90" align="right" />
                <a-table-column title="点击数" data-index="clicks" :width="80" align="right" />
                <a-table-column title="点击率" data-index="ctr" :width="90" align="right" />
                <a-table-column title="转化成本" data-index="cpa" :width="90" align="right" />
                <a-table-column title="转化率" data-index="cvr" :width="90" align="right" />
              </template>
            </a-table>
          </div>
        </div>
      </div>
    </a-drawer>

    <!-- 自定义指标弹窗 -->
    <a-modal
      v-model:visible="showMetricsDialog"
      title="自定义指标"
      :width="1000"
      :body-style="{ padding: 0 }"
      class="metrics-modal"
    >
      <template #footer>
        <div class="metrics-footer">
          <div class="footer-left">
            <a-checkbox v-model="saveAsCommonMetrics">保存为常用自定义指标</a-checkbox>
            <a-input
              v-if="saveAsCommonMetrics"
              v-model="commonMetricName"
              placeholder="请输入指标名称"
              :max-length="20"
              style="width: 200px; margin-left: 12px;"
            />
          </div>
          <div class="footer-btns">
            <a-button @click="showMetricsDialog = false">取消</a-button>
            <a-button type="primary" @click="applyMetrics">应用</a-button>
          </div>
        </div>
      </template>
      <div class="metrics-dialog">
        <!-- 左侧：选择区 -->
        <div class="metrics-left">
          <div class="metrics-search">
            <a-input-search v-model="metricSearch" placeholder="输入指标名称搜索" allow-clear />
          </div>
          <div class="metrics-body">
            <!-- 分类导航 -->
            <div class="metrics-nav">
              <div
                v-for="g in metricGroups"
                :key="g"
                class="nav-item"
                :class="{ active: !metricSearch && activeMetricGroup === g }"
                @click="handleSelectMetricGroup(g)"
              >
                {{ g }}
              </div>
            </div>
            <!-- 指标勾选 -->
            <div class="metrics-checks">
              <div v-for="grp in filteredMetricGroups" :key="grp.name" class="check-group">
                <div class="check-group-title">{{ grp.name }}</div>
                <div class="check-grid">
                  <a-checkbox
                    v-for="col in grp.items"
                    :key="col.key"
                    :model-value="isMetricChecked(col.key)"
                    @change="() => toggleMetric(col.key)"
                  >
                    {{ col.title }}
                  </a-checkbox>
                </div>
              </div>
              <div v-if="!filteredMetricGroups.length" class="check-empty">未找到匹配的指标</div>
            </div>
          </div>
        </div>
        <!-- 右侧：已选排序 -->
        <div class="metrics-right">
          <div class="right-header">
            <div class="right-title">已选指标（{{ draftMetricKeys.length }}/{{ metricColumns.length }}）</div>
            <div class="right-sub">拖动可自定义指标顺序</div>
          </div>
          <div class="selected-list">
            <div
              v-for="(key, index) in draftMetricKeys"
              :key="key"
              class="selected-item"
              draggable="true"
              :class="{ dragging: dragMetricIndex === index }"
              @dragstart="onMetricDragStart(index)"
              @dragover.prevent
              @drop="onMetricDrop(index)"
              @dragend="dragMetricIndex = -1"
            >
              <span class="drag-handle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z"/></svg>
              </span>
              <span class="item-name">{{ getMetric(key)?.title }}</span>
              <IconClose class="item-remove" @click="removeMetric(key)" />
            </div>
            <div v-if="!draftMetricKeys.length" class="selected-empty">请选择左侧指标</div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 右侧主内容区 -->
    <div class="right-content">
      <!-- 顶部导航栏 -->
      <div class="content-header">
        <div class="breadcrumb">
          <span class="breadcrumb-item">素材库</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item active">{{ currentFolderName }}</span>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="content-body">
        <!-- 查询条件区域 -->
        <div class="filter-card">
          <!-- 第一行 -->
          <div class="filter-row">
            <span class="filter-label">素材名称/ID</span>
            <a-input-search
              v-model="searchKeyword"
              placeholder="请输入"
              style="width: 180px;"
              @search="handleSearch"
            />
            <span class="filter-label">媒体平台</span>
            <a-select
              v-model="filterMedia"
              placeholder="全部媒体"
              style="width: 140px;"
            >
              <a-option value="">全部媒体</a-option>
              <a-option value="toutiao">今日头条</a-option>
              <a-option value="douyin">抖音</a-option>
              <a-option value="xigua">西瓜视频</a-option>
            </a-select>
            <span class="filter-label">素材源</span>
            <a-select
              v-model="filterSource"
              placeholder="全部"
              style="width: 140px;"
            >
              <a-option value="">全部</a-option>
              <a-option value="SELF">与我相关</a-option>
            </a-select>
            <span class="filter-label">员工姓名</span>
            <a-select
              v-model="filterEmployee"
              placeholder="全部员工"
              allow-search
              :filter-option="filterEmployeeOption"
              style="width: 160px;"
            >
              <a-option value="">全部员工</a-option>
              <a-option v-for="name in employeeOptions" :key="name" :value="name">
                {{ name }}
              </a-option>
            </a-select>
            <span class="filter-label">消耗</span>
            <a-input-group class="cost-input-group">
              <a-select v-model="costOp" style="width: 96px">
                <a-option value="gte">&gt;=</a-option>
                <a-option value="eq">=</a-option>
                <a-option value="lte">&lt;=</a-option>
                <a-option value="range">区间</a-option>
              </a-select>
              <template v-if="costOp === 'range'">
                <a-input-number v-model="costMin" placeholder="最小值" :min="0" :hide-button="true" style="width: 110px" />
                <span class="cost-tilde">~</span>
                <a-input-number v-model="costMax" placeholder="最大值" :min="0" :hide-button="true" style="width: 110px" />
              </template>
              <a-input-number
                v-else
                v-model="costValue"
                placeholder="请输入消耗"
                :min="0"
                :precision="2"
                :hide-button="true"
                style="width: 180px"
              />
            </a-input-group>
          </div>
          <!-- 第二行 -->
          <div class="filter-row">
            <span class="filter-label">使用状态：</span>
            <a-radio-group v-model="filterUsage" type="button" size="small">
              <a-radio value="">全部</a-radio>
              <a-radio value="NOT_PUSHED">未推送</a-radio>
              <a-radio value="UNUSED">未使用</a-radio>
              <a-radio value="ZERO_CONSUME">无消耗</a-radio>
              <a-radio value="CONSUMING">有消耗</a-radio>
              <a-radio value="EXPLOSIVE">爆量</a-radio>
            </a-radio-group>
          </div>
          <!-- 第三行 -->
          <div class="filter-row">
            <span class="filter-label">媒体评估：</span>
            <a-radio-group v-model="filterEvaluation" type="button" size="small">
              <a-radio value="">全部</a-radio>
              <a-radio value="LOW_EFF">低效</a-radio>
              <a-radio value="FIRST">首发</a-radio>
              <a-radio value="AD_HIGH">AD优质</a-radio>
              <a-radio value="AD_LOW">AD低质</a-radio>
              <a-radio value="QC_HIGH">千川优质</a-radio>
              <a-radio value="QC_LOW">千川低质</a-radio>
              <a-radio value="SAME_SQUEEZE">同质化挤压</a-radio>
              <a-radio value="SAME_QUEUE">同质化排队</a-radio>
            </a-radio-group>
          </div>
          <!-- 第四行 -->
          <div class="filter-row">
            <span class="filter-label">创建时间：</span>
            <a-range-picker style="width: 240px;" />
            <span class="filter-label" style="margin-left: 16px;">消耗时间：</span>
            <a-range-picker style="width: 240px;" />
            <a-button type="primary" style="margin-left: 16px;">查询</a-button>
            <a-button>重置</a-button>
          </div>
        </div>

        <!-- 素材列表区域 -->
        <div class="material-section">
          <div class="section-header">
            <div class="button-group">
              <a-button type="primary" @click="openUploadWindow">
                <template #icon><IconPlus /></template>
                上传素材
              </a-button>
              <a-button type="primary" @click="showAccountDialog = true">
                获取账户素材
              </a-button>
              <a-dropdown trigger="click" :disabled="!selectedMaterials.length">
                <a-button type="primary" :disabled="!selectedMaterials.length">
                  批量操作
                  <icon-down />
                </a-button>
                <template #content>
                  <a-doption @click="handlePushToAccount">推送到账户</a-doption>
                  <a-doption @click="handleMoveMaterial">素材移动</a-doption>
                  <a-doption @click="handleDeleteMaterial">删除</a-doption>
                </template>
              </a-dropdown>
              <span v-if="selectedMaterials.length" class="selected-info">
                已选 {{ selectedMaterials.length }} 条
                <a-button type="text" size="small" @click="handleClearSelection">清除已选</a-button>
              </span>
            </div>
            <div class="section-actions">
              <a-button type="text" @click="handleSelectCurrentPage">全选本页</a-button>
              <a-button type="text" @click="handleSelectAll">全选</a-button>
              <a-button type="text" @click="handleExport">导出</a-button>
              <a-dropdown
                trigger="hover"
                v-model:popup-visible="metricDropdownVisible"
                :disabled="!savedMetricPresets.length"
              >
                <a-button type="text" @click="openMetricsDialog">
                  <template #icon><IconSettings /></template>
                  自定义指标
                </a-button>
                <template #content>
                  <div class="metric-preset-menu">
                    <div class="preset-header">常用自定义指标</div>
                    <div v-if="savedMetricPresets.length" class="preset-list">
                      <div
                        v-for="(p, idx) in savedMetricPresets"
                        :key="p.name"
                        class="preset-item"
                        :class="{ active: activePresetName === p.name }"
                      >
                        <template v-if="editingPresetIndex === idx">
                          <a-input
                            v-model="editingPresetName"
                            size="mini"
                            class="preset-edit-input"
                            :max-length="20"
                            @click.stop
                            @press-enter="confirmEditPreset(idx)"
                          />
                          <span class="preset-actions editing">
                            <IconCheck class="act-ok" @click.stop="confirmEditPreset(idx)" />
                            <IconClose class="act-cancel" @click.stop="cancelEditPreset" />
                          </span>
                        </template>
                        <template v-else>
                          <span class="preset-name" @click="applyMetricPreset(p)">{{ p.name }}</span>
                          <span class="preset-actions">
                            <IconEdit class="act-edit" @click.stop="startEditPreset(idx)" />
                            <IconDelete class="act-del" @click.stop="deletePreset(idx)" />
                          </span>
                        </template>
                      </div>
                    </div>
                    <div v-else class="preset-empty">暂无常用指标</div>
                    <div class="preset-divider"></div>
                    <div class="preset-item entry" @click="openMetricsDialog">自定义指标</div>
                  </div>
                </template>
              </a-dropdown>
              <div class="view-toggle">
                <div
                  class="toggle-btn"
                  :class="{ active: viewMode === 'grid' }"
                  @click="viewMode = 'grid'"
                >
                  <IconApps />
                </div>
                <div
                  class="toggle-btn"
                  :class="{ active: viewMode === 'list' }"
                  @click="viewMode = 'list'"
                >
                  <IconAlignLeft />
                </div>
              </div>
            </div>
          </div>

          <!-- 大图模式 -->
          <div v-if="viewMode === 'grid'" class="material-grid-wrapper">
            <div class="material-grid">
              <div
                v-for="item in currentPageItems"
                :key="item.id"
                class="material-card"
                :class="{ selected: selectedMaterials.includes(item.id) }"
              >
                <div class="card-thumb" @click="handleOpenDetail(item)">
                  <video v-if="item.type === 'VIDEO' && item.videoUrl" :src="item.videoUrl + '#t=0.1'" muted preload="metadata" playsinline />
                  <img v-else-if="item.thumbnail" :src="item.thumbnail" :alt="item.name" />
                  <div v-else class="thumb-placeholder">
                    <IconVideoCamera v-if="item.type === 'VIDEO'" />
                    <IconImage v-else-if="item.type === 'IMAGE'" />
                  </div>
                  <div class="card-checkbox" @click.stop="handleToggleSelect(item)">
                    <a-checkbox :model-value="selectedMaterials.includes(item.id)" />
                  </div>
                  <span class="card-usage">{{ item.usage || '未使用' }}</span>
                  <div v-if="item.type === 'VIDEO'" class="play-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <span class="card-views">
                    <IconEye />
                    {{ item.views ?? 0 }}
                  </span>
                </div>
                <div class="card-body">
                  <div class="card-meta-row">
                    <span class="meta-resolution">{{ item.resolution || '-' }}</span>
                    <span class="meta-duration">{{ item.duration || '-' }}</span>
                  </div>
                  <div class="card-title" :title="item.name">{{ item.name }}</div>
                  <div class="card-price">¥ {{ item.price ?? 0 }}</div>
                  <div class="card-footer">
                    <span class="footer-user"><IconUser />{{ item.uploader }}</span>
                    <span class="footer-time">{{ item.uploadTime }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="pagination-wrapper">
              <a-pagination
                :total="filteredList.length"
                :current="currentPage"
                :page-size="pageSize"
                :page-size-options="[10, 20, 30, 50, 100]"
                show-total
                show-jumper
                show-page-size
                @change="handlePageChange"
                @page-size-change="handlePageSizeChange"
              />
            </div>
          </div>

          <!-- 列表模式 -->
          <a-table
            v-else
            :data="filteredList"
            :pagination="{
              current: listCurrent,
              pageSize: listPageSize,
              total: filteredList.length,
              showTotal: true,
              showJumper: true,
              showPageSize: true,
              pageSizeOptions: [10, 20, 50, 100],
            }"
            row-key="id"
            class="material-table"
            :scroll="{ x: 'max-content' }"
            :row-selection="{
              type: 'checkbox',
              showCheckedAll: true,
              selectedRowKeys: selectedMaterials,
            }"
            @selection-change="handleSelectionChange"
            @page-change="(p) => (listCurrent = p)"
            @page-size-change="handleListPageSizeChange"
          >
            <template #columns>
              <a-table-column title="素材预览" :width="180" fixed="left">
                <template #cell="{ record }">
                  <div class="table-material-cell" @click="handleOpenDetail(record)">
                    <div class="table-thumb">
                      <img v-if="record.thumbnail" :src="record.thumbnail" />
                      <IconVideoCamera v-else-if="record.type === 'VIDEO'" />
                      <IconImage v-else-if="record.type === 'IMAGE'" />
                    </div>
                    <div class="table-info">
                      <div class="material-name">{{ record.name }}</div>
                      <div class="material-meta">{{ record.uploader }} · {{ record.uploadTime }}</div>
                    </div>
                  </div>
                </template>
              </a-table-column>
              <a-table-column
                v-for="col in visibleMetricColumns"
                :key="col.key"
                :title="col.title"
                :data-index="col.dataIndex"
                :width="col.width"
                :ellipsis="col.ellipsis"
                :tooltip="col.ellipsis"
                :sortable="col.group === '效果指标'
                  ? { sortDirections: ['ascend', 'descend'], sorter: (a, b) => parseMetricNum(a[col.field]) - parseMetricNum(b[col.field]) }
                  : undefined"
              >
                <template #cell="{ record }">
                  <template v-if="col.key === 'auditResult'">
                    <a-tag v-if="record.auditResult === 'PASS'" color="green">通过</a-tag>
                    <a-tag v-else-if="record.auditResult === 'REJECT'" color="red">拒绝</a-tag>
                    <a-tag v-else-if="record.auditResult === 'PENDING'" color="orange">待审</a-tag>
                    <span v-else>-</span>
                  </template>
                  <template v-else>{{ formatMetric(record, col) }}</template>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Modal, Message } from '@arco-design/web-vue'
import {
  IconFile,
  IconFolder,
  IconPlus,
  IconApps,
  IconAlignLeft,
  IconVideoCamera,
  IconImage,
  IconCaretRight,
  IconMore,
  IconDown,
  IconClose,
  IconQuestionCircle,
  IconInfoCircle,
  IconEye,
  IconUser,
  IconSettings,
  IconEdit,
  IconDelete,
  IconCheck,
} from '@arco-design/web-vue/es/icon'
import { materialTypeOptions, formatMaterialTypePath } from '@/mock/material'

const selectedFolder = ref('all')
const selectedSubFolder = ref('')
const expandedFolders = ref<string[]>(['all'])
const searchKeyword = ref('')
const filterMedia = ref('')
const filterAudit = ref('')
const filterSource = ref('')
const filterEmployee = ref('')

// 使用数据（消耗）筛选
const costOp = ref('gte')
const costValue = ref<number | undefined>(undefined)
const costMin = ref<number | undefined>(undefined)
const costMax = ref<number | undefined>(undefined)

// 列表分页（受控）
const listCurrent = ref(1)
const listPageSize = ref(10)
const handleListPageSizeChange = (size: number) => {
  listPageSize.value = size
  listCurrent.value = 1
}
const filterUsage = ref('')
const filterEvaluation = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const selectedMaterials = ref<number[]>([])
const currentPage = ref(1)
const pageSize = ref(12)
const showAddFolderDialog = ref(false)
const showEditFolderDialog = ref(false)
const showAddChildDialog = ref(false)
const showAccountDialog = ref(false)
const showPreviewDialog = ref(false)
const previewImage = ref('')
const accountQuery = ref({
  platform: '',
  accountName: '',
  type: '',
  source: '',
  materialName: '',
  dateRange: [],
})
const accountTargetFolder = ref('')
const selectedAccountMaterials = computed(() => accountTableData.value.filter(item => item.selected))
const showPushDialog = ref(false)
const pushForm = ref({
  media: '',
  subject: '',
})
const pushSearchKeyword = ref('')
const pushSelectAll = ref(false)
const pushAccounts = ref([
  { id: 1, name: '抖音账户A（官方）', selected: false },
  { id: 2, name: '抖音账户B（代理）', selected: false },
  { id: 3, name: '头条账户A', selected: false },
  { id: 4, name: '快手账户A', selected: false },
  { id: 5, name: '微博账户A', selected: false },
  { id: 6, name: '抖音账户C', selected: false },
  { id: 7, name: '头条账户B', selected: false },
  { id: 8, name: '快手账户B', selected: false },
  { id: 9, name: '抖音账户D', selected: false },
  { id: 10, name: '头条账户C', selected: false },
  { id: 11, name: '快手账户C', selected: false },
  { id: 12, name: '抖音账户E', selected: false },
])
const filteredPushAccounts = computed(() => {
  if (!pushSearchKeyword.value) return pushAccounts.value
  return pushAccounts.value.filter(acc => acc.name.toLowerCase().includes(pushSearchKeyword.value.toLowerCase()))
})
const selectedPushAccounts = computed(() => pushAccounts.value.filter(acc => acc.selected))
const isPushIndeterminate = computed(() => {
  const filtered = filteredPushAccounts.value
  const selectedCount = filtered.filter(acc => acc.selected).length
  return selectedCount > 0 && selectedCount < filtered.length
})
const showMoveDialog = ref(false)
const moveForm = ref({
  folder: '',
})
const showPreTestDialog = ref(false)
const preTestForm = ref({
  name: '',
  platform: '',
  adAccount: '',
  config: '',
  deliverySetting: 'custom',
  adAccountId: '',
  targetPlatform: '',
  conversionGoal: '',
  conversionGoalPath: [] as string[],
  audienceGender: '',
  audienceAge: [] as string[],
  audienceRegion: [] as string[],
  audienceNetwork: [] as string[],
  customerSubject: '',
  billingMethod: '',
  isOptimalBid: '',
  isStableBid: '',
  isMaxConversionBid: '',
  targetConversionCost: 0,
  targetClickCost: 0,
  budgetAmount: 0,
})

watch(() => preTestForm.value.audienceAge, (newVal) => {
  if (newVal.includes('UNLIMITED') && newVal.length > 1) {
    preTestForm.value.audienceAge = ['UNLIMITED']
  }
})

watch(() => preTestForm.value.audienceNetwork, (newVal) => {
  if (newVal.includes('UNLIMITED') && newVal.length > 1) {
    preTestForm.value.audienceNetwork = ['UNLIMITED']
  }
})

watch(() => preTestForm.value.targetPlatform, () => {
  preTestForm.value.conversionGoal = ''
  preTestForm.value.conversionGoalPath = []
})

const selectedPreTestMaterials = computed(() => {
  return materialList.value.filter(item => selectedMaterials.value.includes(item.id))
})
const accountColumns = [
  { title: '', dataIndex: 'selection', width: 50, slotName: 'selection' },
  { title: '素材', dataIndex: 'material', width: 80, slotName: 'material' },
  { title: '素材名称', dataIndex: 'name', width: 180 },
  { title: '素材ID', dataIndex: 'id', width: 100 },
  { title: '素材来源', dataIndex: 'source', width: 100 },
  { title: '素材尺寸', dataIndex: 'size', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', width: 160 },
]
const accountTableData = ref([
  { id: 1001, name: '夏季促销视频A.mp4', type: 'VIDEO', size: '1920x1080', source: '原生', createTime: '2024-06-01 10:30', thumbnail: 'https://picsum.photos/60/60?random=10', selected: false },
  { id: 1002, name: '新品上市banner.jpg', type: 'IMAGE', size: '1080x1920', source: '二创', createTime: '2024-05-28 14:20', thumbnail: 'https://picsum.photos/60/60?random=11', selected: false },
  { id: 1003, name: '618活动视频.mp4', type: 'VIDEO', size: '1280x720', source: '搬运', createTime: '2024-05-25 09:15', thumbnail: 'https://picsum.photos/60/60?random=12', selected: false },
  { id: 1004, name: '品牌宣传图.png', type: 'IMAGE', size: '500x500', source: '原生', createTime: '2024-05-20 11:00', thumbnail: 'https://picsum.photos/60/60?random=13', selected: false },
  { id: 1005, name: '618预热视频.mp4', type: 'VIDEO', size: '1920x1080', source: '二创', createTime: '2024-05-18 16:45', thumbnail: 'https://picsum.photos/60/60?random=14', selected: false },
  { id: 1006, name: '端午节素材.jpg', type: 'IMAGE', size: '1080x720', source: '原生', createTime: '2024-05-15 08:30', thumbnail: 'https://picsum.photos/60/60?random=15', selected: false },
  { id: 1007, name: '父亲节活动.mp4', type: 'VIDEO', size: '1280x720', source: '搬运', createTime: '2024-05-12 10:00', thumbnail: 'https://picsum.photos/60/60?random=16', selected: false },
  { id: 1008, name: '年中大促banner.jpg', type: 'IMAGE', size: '1920x1080', source: '二创', createTime: '2024-05-10 15:30', thumbnail: 'https://picsum.photos/60/60?random=17', selected: false },
  { id: 1009, name: '暑假促销视频.mp4', type: 'VIDEO', size: '1920x1080', source: '原生', createTime: '2024-05-08 09:00', thumbnail: 'https://picsum.photos/60/60?random=18', selected: false },
  { id: 1010, name: '新品发布图文.png', type: 'IMAGE', size: '1080x1920', source: '原生', createTime: '2024-05-05 14:00', thumbnail: 'https://picsum.photos/60/60?random=19', selected: false },
  { id: 1011, name: '七夕活动视频.mp4', type: 'VIDEO', size: '1280x720', source: '二创', createTime: '2024-05-02 11:30', thumbnail: 'https://picsum.photos/60/60?random=20', selected: false },
  { id: 1012, name: '开学季banner.jpg', type: 'IMAGE', size: '1080x720', source: '搬运', createTime: '2024-04-28 16:00', thumbnail: 'https://picsum.photos/60/60?random=21', selected: false },
])

// 新窗口打开上传素材页面
const openUploadWindow = () => {
  window.open('/material-demand/upload', '_blank')
}
const newFolderForm = ref({
  level: 1,
  name: '',
  sort: 0,
})
const editFolderForm = ref({
  level: 1,
  name: '',
  sort: 0,
})
const addChildForm = ref({
  name: '',
  sort: 0,
})
const currentEditFolder = ref<any>(null)
const showDetailDialog = ref(false)
const currentMaterial = ref<any>(null)

const folderTree = [
  {
    key: 'all',
    title: '全部素材',
    children: [
      { key: 'video', title: '视频' },
      { key: 'image', title: '图片' },
      { key: 'audio', title: '音频' },
    ],
  },
  {
    key: '618',
    title: '618活动',
    children: [
      { key: '618-video', title: '宣传视频' },
      { key: '618-image', title: '海报素材' },
    ],
  },
  {
    key: 'brand',
    title: '品牌素材',
    children: [
      { key: 'brand-logo', title: 'LOGO' },
      { key: 'brand-product', title: '产品图' },
    ],
  },
]

const currentFolderName = computed(() => {
  const folder = folderTree.find(f => f.key === selectedFolder.value)
  return folder?.title || '素材库'
})

const materialList = ref([
  { id: 1, name: 'product_video_2024.mp4', type: 'VIDEO', materialTypePath: ['VIDEO', 'VIDEO_TALK'], format: '横版视频', size: '150MB', thumbnail: 'https://picsum.photos/id/1015/300/400', videoUrl: `${import.meta.env.BASE_URL}1.mp4`, industry: '电商', platform: '抖音', tags: '热销产品', uploader: '张三', clicks: 1234, exposure: 5678, consumption: '¥1,234', clickRate: 3.42, avgClickPrice: 0.98, avgThousandCost: 33.5, conversion: '2.1%', deepConversion: '0.8%', uploadTime: '2024-01-15 10:30', status: 'PASSED', author: '李明', operator: '王芳', photographer: '张伟', demandId: 'DEMAND_001', internalMaterialId: 'MAT_1001', editor: '孙磊', director: '李明', actor: ['王梅'], accountId: 'ACC_20001', nonGrantCost: 1000, platformMaterialId: 'PLT_780001', deliveryId: 'AD_900001', resolution: '720×1280', duration: '00:03:44', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 2, name: 'banner_spring.jpg', type: 'IMAGE', materialTypePath: ['IMAGE'], format: '开屏/海报', size: '2MB', thumbnail: 'https://picsum.photos/id/28/300/400', industry: '美妆', platform: '小红书', tags: '春季限定', uploader: '李四', clicks: 2345, exposure: 6789, consumption: '¥2,345', clickRate: 4.15, avgClickPrice: 1.05, avgThousandCost: 43.6, conversion: '3.2%', deepConversion: '1.5%', uploadTime: '2024-01-14 14:20', status: 'PASSED', author: '陈静', operator: '刘洋', photographer: '-', demandId: 'DEMAND_002', internalMaterialId: 'MAT_1002', editor: '周涛', director: '陈静', actor: ['刘芳'], accountId: 'ACC_20002', nonGrantCost: 2100, platformMaterialId: 'PLT_780002', deliveryId: 'AD_900002', resolution: '1080×1920', duration: '00:04:03', views: 5, price: 0, usage: '有消耗', auditResult: 'PASS', auditSuggestion: '' },
  { id: 3, name: 'tutorial_video.mp4', type: 'VIDEO', materialTypePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', size: '700MB', thumbnail: 'https://picsum.photos/id/43/300/400', industry: '教育', platform: 'B站', tags: '新手教程', uploader: '王五', clicks: 3456, exposure: 7890, consumption: '¥3,456', clickRate: 5.28, avgClickPrice: 0.87, avgThousandCost: 46.0, conversion: '4.1%', deepConversion: '2.0%', uploadTime: '2024-01-12 16:45', status: 'PASSED', author: '周琳', operator: '吴磊', photographer: '郑军', demandId: 'DEMAND_003', internalMaterialId: 'MAT_1003', editor: '吴强', director: '周琳', actor: ['郑爽'], accountId: 'ACC_20003', nonGrantCost: 3200, platformMaterialId: 'PLT_780003', deliveryId: 'AD_900003', resolution: '720×1280', duration: '00:07:53', views: 128, price: 0, usage: '有消耗', auditResult: 'PASS', auditSuggestion: '' },
  { id: 4, name: 'logo_design.png', type: 'IMAGE', materialTypePath: ['IMAGE'], format: '图片', size: '1MB', thumbnail: 'https://picsum.photos/id/56/300/400', industry: '餐饮', platform: '快手', tags: '品牌标识', uploader: '赵六', clicks: 456, exposure: 1234, consumption: '¥456', clickRate: 2.10, avgClickPrice: 1.20, avgThousandCost: 25.2, conversion: '1.2%', deepConversion: '0.3%', uploadTime: '2024-01-11 11:30', status: 'REJECTED', author: '钱程', operator: '-', photographer: '-', demandId: 'DEMAND_004', internalMaterialId: 'MAT_1004', editor: '钱多', director: '钱程', actor: ['孙俪'], accountId: 'ACC_20004', nonGrantCost: 400, platformMaterialId: 'PLT_780004', deliveryId: '-', resolution: '1080×1080', duration: '-', views: 0, price: 0, usage: '未使用', auditResult: 'REJECT', auditSuggestion: '画面模糊，需重新制作' },
  { id: 5, name: 'promo_video.mp4', type: 'VIDEO', materialTypePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_BKN'], format: '横版视频', size: '200MB', thumbnail: 'https://picsum.photos/id/76/300/400', industry: '旅游', platform: '抖音', tags: '促销活动', uploader: '钱七', clicks: 5678, exposure: 9012, consumption: '¥5,678', clickRate: 6.30, avgClickPrice: 0.95, avgThousandCost: 59.9, conversion: '5.5%', deepConversion: '3.2%', uploadTime: '2024-01-10 08:00', status: 'PASSED', author: '孙颖', operator: '朱勇', photographer: '冯浩', demandId: 'DEMAND_005', internalMaterialId: 'MAT_1005', editor: '冯浩', director: '孙颖', actor: ['陈坤'], accountId: 'ACC_20005', nonGrantCost: 5300, platformMaterialId: 'PLT_780005', deliveryId: 'AD_900005', resolution: '720×1280', duration: '00:05:06', views: 340, price: 0, usage: '爆量', auditResult: 'PASS', auditSuggestion: '' },
  { id: 6, name: 'icon_set.svg', type: 'IMAGE', materialTypePath: ['IMAGE'], format: '图片', size: '500KB', thumbnail: 'https://picsum.photos/id/96/300/400', industry: '科技', platform: '微博', tags: '图标素材', uploader: '孙八', clicks: 789, exposure: 2345, consumption: '¥789', clickRate: 1.85, avgClickPrice: 1.10, avgThousandCost: 20.4, conversion: '1.8%', deepConversion: '0.6%', uploadTime: '2024-01-09 15:30', status: 'PASSED', author: '胡蝶', operator: '-', photographer: '-', demandId: 'DEMAND_006', internalMaterialId: 'MAT_1006', editor: '胡军', director: '胡蝶', actor: ['赵丽'], accountId: 'ACC_20006', nonGrantCost: 700, platformMaterialId: 'PLT_780006', deliveryId: '-', resolution: '800×800', duration: '-', views: 2, price: 0, usage: '无消耗', auditResult: 'PASS', auditSuggestion: '' },
  { id: 7, name: 'summer_banner.jpg', type: 'IMAGE', materialTypePath: ['IMAGE'], format: '开屏/海报', size: '3MB', thumbnail: 'https://picsum.photos/id/106/300/400', industry: '服装', platform: '小红书', tags: '夏日清凉', uploader: '周九', clicks: 890, exposure: 3456, consumption: '¥890', clickRate: 2.45, avgClickPrice: 0.92, avgThousandCost: 22.5, conversion: '2.0%', deepConversion: '0.9%', uploadTime: '2024-01-08 12:00', status: 'PENDING', author: '何冰', operator: '林青', photographer: '-', demandId: 'DEMAND_007', internalMaterialId: 'MAT_1007', editor: '张云', director: '何冰', actor: ['杨幂'], accountId: 'ACC_20007', nonGrantCost: 800, platformMaterialId: 'PLT_780007', deliveryId: '-', resolution: '1080×1920', duration: '-', views: 8, price: 0, usage: '未使用', auditResult: 'PENDING', auditSuggestion: '' },
  { id: 8, name: 'product_show.mp4', type: 'VIDEO', materialTypePath: ['VIDEO', 'VIDEO_TALK'], format: '竖版视频', size: '180MB', thumbnail: 'https://picsum.photos/id/116/300/400', industry: '家居', platform: '抖音', tags: '产品展示', uploader: '吴十', clicks: 9012, exposure: 12345, consumption: '¥9,012', clickRate: 7.12, avgClickPrice: 1.00, avgThousandCost: 71.2, conversion: '6.8%', deepConversion: '4.1%', uploadTime: '2024-01-07 09:30', status: 'PASSED', author: '许晨', operator: '潘婷', photographer: '韩松', demandId: 'DEMAND_008', internalMaterialId: 'MAT_1008', editor: '杜海', director: '许晨', actor: ['刘涛'], accountId: 'ACC_20008', nonGrantCost: 8500, platformMaterialId: 'PLT_780008', deliveryId: 'AD_900008', resolution: '720×1280', duration: '00:08:16', views: 512, price: 0, usage: '爆量', auditResult: 'PASS', auditSuggestion: '' },
  { id: 9, name: '260716-知乎漫剧-岁寒知人心--I混剪-00m-1.mp4', type: 'VIDEO', materialTypePath: ['VIDEO', 'VIDEO_STORY', 'VIDEO_STORY_SOLO'], format: '竖版视频', size: '160MB', thumbnail: 'https://picsum.photos/id/1005/300/400', industry: '短剧', platform: '抖音', tags: '知乎漫剧', uploader: '陈曦', clicks: 1120, exposure: 5400, consumption: '¥1,120', clickRate: 2.07, avgClickPrice: 1.00, avgThousandCost: 20.7, conversion: '1.9%', deepConversion: '0.7%', uploadTime: '2小时前', status: 'PASSED', author: '陈曦', operator: '-', photographer: '-', demandId: 'DEMAND_009', internalMaterialId: 'MAT_1009', editor: '林峰', director: '苏芮', actor: ['邓超'], accountId: 'ACC_20009', nonGrantCost: 1050, platformMaterialId: 'PLT_780009', deliveryId: '-', resolution: '720×1280', duration: '00:04:03', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 10, name: '260716-知乎漫剧-岁寒知人心--I混剪-00m-2.mp4', type: 'VIDEO', size: '175MB', thumbnail: 'https://picsum.photos/id/1011/300/400', industry: '短剧', platform: '抖音', tags: '知乎漫剧', uploader: '刘涛', clicks: 980, exposure: 4800, consumption: '¥980', clickRate: 2.04, avgClickPrice: 1.00, avgThousandCost: 20.4, conversion: '1.6%', deepConversion: '0.5%', uploadTime: '2小时前', status: 'PASSED', author: '刘涛', operator: '-', photographer: '-', demandId: 'DEMAND_010', internalMaterialId: 'MAT_1010', editor: '高翔', director: '范冰', actor: '黄渤', accountId: 'ACC_20010', nonGrantCost: 920, platformMaterialId: 'PLT_780010', deliveryId: '-', resolution: '720×1280', duration: '00:07:53', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 11, name: '260716-知乎漫剧-岁寒知人心--I混剪-00m-3.mp4', type: 'VIDEO', size: '150MB', thumbnail: 'https://picsum.photos/id/1025/300/400', industry: '短剧', platform: '抖音', tags: '知乎漫剧', uploader: '周敏', clicks: 1340, exposure: 6100, consumption: '¥1,340', clickRate: 2.20, avgClickPrice: 1.00, avgThousandCost: 21.9, conversion: '2.2%', deepConversion: '0.9%', uploadTime: '2小时前', status: 'PASSED', author: '周敏', operator: '-', photographer: '-', demandId: 'DEMAND_011', internalMaterialId: 'MAT_1011', editor: '罗刚', director: '田甜', actor: '沈腾', accountId: 'ACC_20011', nonGrantCost: 1280, platformMaterialId: 'PLT_780011', deliveryId: 'AD_900011', resolution: '720×1280', duration: '00:05:06', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 12, name: '260716-知乎漫剧-岁寒知人心--I混剪-00m-4.mp4', type: 'VIDEO', size: '168MB', thumbnail: 'https://picsum.photos/id/1027/300/400', industry: '短剧', platform: '抖音', tags: '知乎漫剧', uploader: '郑凯', clicks: 760, exposure: 4200, consumption: '¥760', clickRate: 1.81, avgClickPrice: 1.00, avgThousandCost: 18.1, conversion: '1.4%', deepConversion: '0.4%', uploadTime: '2小时前', status: 'PASSED', author: '郑凯', operator: '-', photographer: '-', demandId: 'DEMAND_012', internalMaterialId: 'MAT_1012', editor: '袁飞', director: '白鹭', actor: '马丽', accountId: 'ACC_20012', nonGrantCost: 700, platformMaterialId: 'PLT_780012', deliveryId: '-', resolution: '720×1280', duration: '00:08:52', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 13, name: '260716-知乎漫剧-岁寒知人心--I混剪-00m-5.mp4', type: 'VIDEO', size: '172MB', thumbnail: 'https://picsum.photos/id/1035/300/400', industry: '短剧', platform: '抖音', tags: '知乎漫剧', uploader: '黄磊', clicks: 1580, exposure: 6800, consumption: '¥1,580', clickRate: 2.32, avgClickPrice: 1.00, avgThousandCost: 23.2, conversion: '2.5%', deepConversion: '1.1%', uploadTime: '2小时前', status: 'PASSED', author: '黄磊', operator: '-', photographer: '-', demandId: 'DEMAND_013', internalMaterialId: 'MAT_1013', editor: '汤明', director: '曾莉', actor: '雷佳', accountId: 'ACC_20013', nonGrantCost: 1500, platformMaterialId: 'PLT_780013', deliveryId: 'AD_900013', resolution: '720×1280', duration: '00:05:32', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 14, name: '260716-知乎漫剧-岁寒知人心--I混剪-00m-6.mp4', type: 'VIDEO', size: '158MB', thumbnail: 'https://picsum.photos/id/1043/300/400', industry: '短剧', platform: '抖音', tags: '知乎漫剧', uploader: '徐静', clicks: 1210, exposure: 5900, consumption: '¥1,210', clickRate: 2.05, avgClickPrice: 1.00, avgThousandCost: 20.5, conversion: '1.9%', deepConversion: '0.8%', uploadTime: '2小时前', status: 'PASSED', author: '徐静', operator: '-', photographer: '-', demandId: 'DEMAND_014', internalMaterialId: 'MAT_1014', editor: '龚斌', director: '常悦', actor: '王宝', accountId: 'ACC_20014', nonGrantCost: 1150, platformMaterialId: 'PLT_780014', deliveryId: 'AD_900014', resolution: '720×1280', duration: '00:06:05', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 15, name: '260716-知乎漫剧-岁寒知人心--I混剪-00m-7.mp4', type: 'VIDEO', size: '165MB', thumbnail: 'https://picsum.photos/id/1050/300/400', industry: '短剧', platform: '抖音', tags: '知乎漫剧', uploader: '马超', clicks: 890, exposure: 4500, consumption: '¥890', clickRate: 1.98, avgClickPrice: 1.00, avgThousandCost: 19.8, conversion: '1.5%', deepConversion: '0.6%', uploadTime: '2小时前', status: 'PASSED', author: '马超', operator: '-', photographer: '-', demandId: 'DEMAND_015', internalMaterialId: 'MAT_1015', editor: '邵华', director: '贺敏', actor: '徐峥', accountId: 'ACC_20015', nonGrantCost: 850, platformMaterialId: 'PLT_780015', deliveryId: '-', resolution: '720×1280', duration: '00:08:16', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 16, name: '260716-知乎漫剧-岁寒知人心--I混剪-00m-8.mp4', type: 'VIDEO', size: '170MB', thumbnail: 'https://picsum.photos/id/1062/300/400', industry: '短剧', platform: '抖音', tags: '知乎漫剧', uploader: '冯雪', clicks: 1470, exposure: 6400, consumption: '¥1,470', clickRate: 2.30, avgClickPrice: 1.00, avgThousandCost: 22.9, conversion: '2.4%', deepConversion: '1.0%', uploadTime: '2小时前', status: 'PASSED', author: '冯雪', operator: '-', photographer: '-', demandId: 'DEMAND_016', internalMaterialId: 'MAT_1016', editor: '孔亮', director: '严冬', actor: '周迅', accountId: 'ACC_20016', nonGrantCost: 1400, platformMaterialId: 'PLT_780016', deliveryId: 'AD_900016', resolution: '720×1280', duration: '00:07:29', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 17, name: '260716-知乎漫剧-校花网恋--I混剪-00z.mp4', type: 'VIDEO', size: '142MB', thumbnail: 'https://picsum.photos/id/1074/300/400', industry: '短剧', platform: '抖音', tags: '校花网恋', uploader: '董浩', clicks: 640, exposure: 3800, consumption: '¥640', clickRate: 1.68, avgClickPrice: 1.00, avgThousandCost: 16.8, conversion: '1.2%', deepConversion: '0.3%', uploadTime: '2小时前', status: 'PASSED', author: '董浩', operator: '-', photographer: '-', demandId: 'DEMAND_017', internalMaterialId: 'MAT_1017', editor: '钟毅', director: '万青', actor: '易烊', accountId: 'ACC_20017', nonGrantCost: 600, platformMaterialId: 'PLT_780017', deliveryId: '-', resolution: '1280×720', duration: '00:00:27', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 18, name: '260716-知乎漫剧-校花网恋--I混剪-00z-1.mp4', type: 'VIDEO', size: '138MB', thumbnail: 'https://picsum.photos/id/1080/300/400', industry: '短剧', platform: '抖音', tags: '校花网恋', uploader: '蒋雯', clicks: 720, exposure: 4100, consumption: '¥720', clickRate: 1.76, avgClickPrice: 1.00, avgThousandCost: 17.6, conversion: '1.3%', deepConversion: '0.4%', uploadTime: '2小时前', status: 'PASSED', author: '蒋雯', operator: '-', photographer: '-', demandId: 'DEMAND_018', internalMaterialId: 'MAT_1018', editor: '文斌', director: '祁云', actor: '肖战', accountId: 'ACC_20018', nonGrantCost: 680, platformMaterialId: 'PLT_780018', deliveryId: 'AD_900018', resolution: '1280×720', duration: '00:00:31', views: 1, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 19, name: '260716-知乎漫剧-校花网恋--I混剪-00z-2.mp4', type: 'VIDEO', size: '146MB', thumbnail: 'https://picsum.photos/id/1084/300/400', industry: '短剧', platform: '抖音', tags: '校花网恋', uploader: '沈亮', clicks: 560, exposure: 3400, consumption: '¥560', clickRate: 1.65, avgClickPrice: 1.00, avgThousandCost: 16.5, conversion: '1.1%', deepConversion: '0.3%', uploadTime: '2小时前', status: 'PASSED', author: '沈亮', operator: '-', photographer: '-', demandId: 'DEMAND_019', internalMaterialId: 'MAT_1019', editor: '路遥', director: '巩俐', actor: '王一', accountId: 'ACC_20019', nonGrantCost: 520, platformMaterialId: 'PLT_780019', deliveryId: '-', resolution: '1280×720', duration: '00:00:45', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
  { id: 20, name: '260716-知乎漫剧-校花网恋--I混剪-00z-3.mp4', type: 'VIDEO', size: '151MB', thumbnail: 'https://picsum.photos/id/1069/300/400', industry: '短剧', platform: '抖音', tags: '校花网恋', uploader: '韩梅', clicks: 830, exposure: 4600, consumption: '¥830', clickRate: 1.80, avgClickPrice: 1.00, avgThousandCost: 18.0, conversion: '1.4%', deepConversion: '0.5%', uploadTime: '2小时前', status: 'PASSED', author: '韩梅', operator: '-', photographer: '-', demandId: 'DEMAND_020', internalMaterialId: 'MAT_1020', editor: '于洋', director: '章苒', actor: '井柏', accountId: 'ACC_20020', nonGrantCost: 780, platformMaterialId: 'PLT_780020', deliveryId: 'AD_900020', resolution: '1280×720', duration: '00:00:48', views: 0, price: 0, usage: '未使用', auditResult: 'PASS', auditSuggestion: '' },
])

// ==== 自定义指标 ====
const metricColumns = [
  // 素材属性
  { key: 'name', title: '素材名称', dataIndex: undefined, field: 'name', width: 180, ellipsis: true, group: '素材属性', format: 'raw' },
  { key: 'editor', title: '剪辑', dataIndex: undefined, field: 'editor', width: 100, group: '素材属性', format: 'raw' },
  { key: 'photographer', title: '摄影师', dataIndex: undefined, field: 'photographer', width: 100, group: '素材属性', format: 'raw' },
  { key: 'director', title: '编导', dataIndex: undefined, field: 'director', width: 100, group: '素材属性', format: 'raw' },
  { key: 'actor', title: '演员', dataIndex: undefined, field: 'actor', width: 100, group: '素材属性', format: 'raw' },
  { key: 'platform', title: '投放媒体', dataIndex: undefined, field: 'platform', width: 120, group: '素材属性', format: 'raw' },
  { key: 'accountId', title: '所属账号ID', dataIndex: undefined, field: 'accountId', width: 140, ellipsis: true, group: '素材属性', format: 'raw' },
  { key: 'uploadTime', title: '上传日期', dataIndex: undefined, field: 'uploadTime', width: 160, group: '素材属性', format: 'raw' },
  // 基础信息
  { key: 'demandId', title: '需求ID', dataIndex: 'demandId', field: 'demandId', width: 120, ellipsis: true, group: '基础信息', format: 'raw' },
  { key: 'internalMaterialId', title: '内部素材ID', dataIndex: 'internalMaterialId', field: 'internalMaterialId', width: 140, ellipsis: true, group: '基础信息', format: 'raw' },
  { key: 'platformMaterialId', title: '平台素材ID', dataIndex: 'platformMaterialId', field: 'platformMaterialId', width: 140, ellipsis: true, group: '基础信息', format: 'raw' },
  // 效果指标
  { key: 'consumption', title: '消耗', dataIndex: 'consumption', field: 'consumption', width: 110, group: '效果指标', format: 'raw' },
  { key: 'nonGrantCost', title: '非赠款消耗(元)', dataIndex: undefined, field: 'nonGrantCost', width: 150, group: '效果指标', format: 'money' },
  { key: 'exposure', title: '展示数', dataIndex: 'exposure', field: 'exposure', width: 110, group: '效果指标', format: 'number' },
  { key: 'clicks', title: '点击数', dataIndex: 'clicks', field: 'clicks', width: 110, group: '效果指标', format: 'number' },
  { key: 'clickRate', title: '点击率(%)', dataIndex: 'clickRate', field: 'clickRate', width: 130, group: '效果指标', format: 'percent' },
  { key: 'avgClickPrice', title: '平均点击单价(元)', dataIndex: 'avgClickPrice', field: 'avgClickPrice', width: 180, group: '效果指标', format: 'money' },
  { key: 'avgThousandCost', title: '平均千次展现费用(元)', dataIndex: 'avgThousandCost', field: 'avgThousandCost', width: 210, group: '效果指标', format: 'money' },
  { key: 'conversion', title: '转化数', dataIndex: 'conversion', field: 'conversion', width: 110, group: '效果指标', format: 'raw' },
  { key: 'costPerConversion', title: '转化成本', dataIndex: undefined, field: 'consumption', width: 120, group: '效果指标', format: 'raw' },
  { key: 'conversionRate', title: '转化率', dataIndex: undefined, field: 'conversion', width: 120, group: '效果指标', format: 'raw' },
]
const metricGroups = ['素材属性', '基础信息', '效果指标']
const METRIC_STORAGE_KEY = 'materialMetricKeys'
const METRIC_PRESET_KEY = 'materialMetricPresets'

// 默认展示的指标（新增的素材属性/非赠款消耗默认不展示，可由用户自行勾选）
const defaultMetricKeys = [
  'demandId', 'internalMaterialId', 'platformMaterialId',
  'consumption', 'exposure', 'clicks', 'clickRate', 'avgClickPrice', 'avgThousandCost',
  'conversion', 'costPerConversion', 'conversionRate',
]
const selectedMetricKeys = ref<string[]>([...defaultMetricKeys])

// 读取已保存的当前指标
try {
  const saved = localStorage.getItem(METRIC_STORAGE_KEY)
  if (saved) {
    const arr = JSON.parse(saved)
    if (Array.isArray(arr) && arr.length) {
      selectedMetricKeys.value = arr.filter((k: string) => metricColumns.some(c => c.key === k))
    }
  }
} catch (e) {
  // ignore
}

// 常用自定义指标预设
interface MetricPreset { name: string; keys: string[] }
const savedMetricPresets = ref<MetricPreset[]>([])
try {
  const saved = localStorage.getItem(METRIC_PRESET_KEY)
  if (saved) {
    const arr = JSON.parse(saved)
    if (Array.isArray(arr)) savedMetricPresets.value = arr
  }
} catch (e) {
  // ignore
}
const activePresetName = ref('')
const metricDropdownVisible = ref(false)

const showMetricsDialog = ref(false)
const metricSearch = ref('')
const activeMetricGroup = ref(metricGroups[0])
const draftMetricKeys = ref<string[]>([])
const saveAsCommonMetrics = ref(false)
const commonMetricName = ref('')
const dragMetricIndex = ref(-1)

const getMetric = (key: string) => metricColumns.find(c => c.key === key)

const visibleMetricColumns = computed(() =>
  selectedMetricKeys.value.map(k => getMetric(k)).filter(Boolean) as typeof metricColumns
)

const filteredMetricGroups = computed(() => {
  const kw = metricSearch.value.trim().toLowerCase()
  return metricGroups
    .map(g => ({
      name: g,
      items: metricColumns.filter(c => c.group === g && (!kw || c.title.toLowerCase().includes(kw))),
    }))
    .filter(grp => (kw ? grp.items.length > 0 : grp.name === activeMetricGroup.value))
})

const formatMetric = (record: any, col: any) => {
  const v = record[col.field]
  switch (col.format) {
    case 'number':
      return v != null ? Number(v).toLocaleString() : '-'
    case 'percent':
      return v != null ? `${v}%` : '-'
    case 'money':
      return v != null ? `¥${v}` : '-'
    default:
      return v != null && v !== '' ? v : '-'
  }
}

// 从格式化值中解析数字用于排序（去除 ¥、逗号、% 等）
const parseMetricNum = (v: any) => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

const isMetricChecked = (key: string) => draftMetricKeys.value.includes(key)

const toggleMetric = (key: string) => {
  const i = draftMetricKeys.value.indexOf(key)
  if (i > -1) {
    draftMetricKeys.value.splice(i, 1)
  } else {
    draftMetricKeys.value.push(key)
  }
}

const removeMetric = (key: string) => {
  const i = draftMetricKeys.value.indexOf(key)
  if (i > -1) draftMetricKeys.value.splice(i, 1)
}

const handleSelectMetricGroup = (g: string) => {
  metricSearch.value = ''
  activeMetricGroup.value = g
}

const onMetricDragStart = (index: number) => {
  dragMetricIndex.value = index
}

const onMetricDrop = (index: number) => {
  const from = dragMetricIndex.value
  if (from === -1 || from === index) return
  const arr = [...draftMetricKeys.value]
  const [moved] = arr.splice(from, 1)
  arr.splice(index, 0, moved)
  draftMetricKeys.value = arr
  dragMetricIndex.value = -1
}

const openMetricsDialog = () => {
  draftMetricKeys.value = [...selectedMetricKeys.value]
  metricSearch.value = ''
  activeMetricGroup.value = metricGroups[0]
  saveAsCommonMetrics.value = false
  commonMetricName.value = ''
  metricDropdownVisible.value = false
  showMetricsDialog.value = true
}

const applyMetrics = () => {
  if (!draftMetricKeys.value.length) {
    Message.warning('请至少选择一个指标')
    return
  }
  if (saveAsCommonMetrics.value && !commonMetricName.value.trim()) {
    Message.warning('请输入常用指标名称')
    return
  }
  selectedMetricKeys.value = [...draftMetricKeys.value]
  try {
    localStorage.setItem(METRIC_STORAGE_KEY, JSON.stringify(selectedMetricKeys.value))
  } catch (e) {
    // ignore
  }
  if (saveAsCommonMetrics.value) {
    const name = commonMetricName.value.trim()
    const preset: MetricPreset = { name, keys: [...draftMetricKeys.value] }
    const idx = savedMetricPresets.value.findIndex(p => p.name === name)
    if (idx > -1) savedMetricPresets.value[idx] = preset
    else savedMetricPresets.value.push(preset)
    activePresetName.value = name
    try {
      localStorage.setItem(METRIC_PRESET_KEY, JSON.stringify(savedMetricPresets.value))
    } catch (e) {
      // ignore
    }
  }
  showMetricsDialog.value = false
  Message.success('已应用自定义指标')
}

const applyMetricPreset = (preset: MetricPreset) => {
  const keys = preset.keys.filter(k => metricColumns.some(c => c.key === k))
  if (!keys.length) return
  selectedMetricKeys.value = keys
  activePresetName.value = preset.name
  metricDropdownVisible.value = false
  try {
    localStorage.setItem(METRIC_STORAGE_KEY, JSON.stringify(selectedMetricKeys.value))
  } catch (e) {
    // ignore
  }
  Message.success(`已应用「${preset.name}」`)
}

const persistMetricPresets = () => {
  try {
    localStorage.setItem(METRIC_PRESET_KEY, JSON.stringify(savedMetricPresets.value))
  } catch (e) {
    // ignore
  }
}

const editingPresetIndex = ref(-1)
const editingPresetName = ref('')

const startEditPreset = (index: number) => {
  editingPresetIndex.value = index
  editingPresetName.value = savedMetricPresets.value[index]?.name || ''
}

const cancelEditPreset = () => {
  editingPresetIndex.value = -1
  editingPresetName.value = ''
}

const confirmEditPreset = (index: number) => {
  const name = editingPresetName.value.trim()
  if (!name) {
    Message.warning('名称不能为空')
    return
  }
  const dup = savedMetricPresets.value.some((p, i) => i !== index && p.name === name)
  if (dup) {
    Message.warning('已存在同名指标')
    return
  }
  const oldName = savedMetricPresets.value[index].name
  savedMetricPresets.value[index].name = name
  if (activePresetName.value === oldName) activePresetName.value = name
  persistMetricPresets()
  cancelEditPreset()
  Message.success('已重命名')
}

const deletePreset = (index: number) => {
  const removed = savedMetricPresets.value[index]
  if (!removed) return
  Modal.confirm({
    title: '删除常用指标',
    content: `确定删除「${removed.name}」吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      savedMetricPresets.value.splice(index, 1)
      if (activePresetName.value === removed.name) activePresetName.value = ''
      if (editingPresetIndex.value === index) cancelEditPreset()
      persistMetricPresets()
      Message.success('已删除')
    },
  })
}

// ==== 素材详情（V2） ====
const detailEditMode = ref(false)
const detailTab = ref('detail')
const detailVersion = ref('latest')
const detailMediaFilter = ref('all')
const detailDateRange = ref<string[]>(['2026-07-09', '2026-07-15'])
const adsMediaTab = ref('all')

// 播放倍速（点击切换）
const dyRate = ref(1)
const cycleDyRate = () => {
  const speeds = [1, 1.5, 2, 3, 0.5]
  const i = speeds.indexOf(dyRate.value)
  dyRate.value = speeds[(i + 1) % speeds.length]
  if (videoRef.value) videoRef.value.playbackRate = dyRate.value
}

// 音量控制
const phoneScreenRef = ref<HTMLElement | null>(null)
const dyVolume = ref(80)
const showVolumePanel = ref(false)
const toggleVolumePanel = () => {
  showVolumePanel.value = !showVolumePanel.value
}
const applyVolume = () => {
  if (videoRef.value) {
    videoRef.value.volume = dyVolume.value / 100
    videoRef.value.muted = dyVolume.value === 0
  }
}
// 全屏
const handleDyFullscreen = () => {
  const el: any = videoRef.value || phoneScreenRef.value
  if (el?.requestFullscreen) el.requestFullscreen()
  else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen()
}

// 最近 N 天创建的广告（弹窗编辑天数）
const adsRecentDays = ref(7)
const adsDaysDraft = ref(7)
const adsDaysDialogVisible = ref(false)
const onAdsDaysPopup = (visible: boolean) => {
  if (visible) adsDaysDraft.value = adsRecentDays.value
}
const confirmAdsDays = () => {
  if (adsDaysDraft.value && adsDaysDraft.value > 0) {
    adsRecentDays.value = adsDaysDraft.value
    // 实际项目中此处按天数重新拉取广告数据
    Message.info(`已加载最近 ${adsRecentDays.value} 天创建的广告`)
  }
  adsDaysDialogVisible.value = false
}

// 人员信息字段（可逐项编辑）
const peopleFields = [
  { key: 'director', label: '编导', multiple: false },
  { key: 'editor', label: '剪辑', multiple: false },
  { key: 'photographer', label: '摄像', multiple: false },
  { key: 'actor', label: '演员', multiple: true },
  { key: 'production', label: '设计', multiple: false },
]
const editingField = ref('')
// 人员姓名候选（下拉搜索单选）
const personOptions = [
  '文清滨', '钱程', '钱多', '孙俪', '李明', '孙磊', '周涛', '陈静', '刘芳', '吴强',
  '周琳', '郑爽', '冯浩', '孙颖', '陈坤', '胡军', '赵丽', '张云', '杨幂', '杜海',
  '许晨', '刘涛', '林峰', '邓超', '高翔', '黄渤', '罗刚', '沈腾', '马丽', '雷佳',
  '徐峥', '周迅', '肖战', '巩俐', '井柏然',
]
// 查询条件下的员工姓名候选（沿用同一份人名 mock）
const employeeOptions = personOptions
// 员工下拉模糊搜索
const filterEmployeeOption = (input: string, option: { label?: string; value?: string | number }) => {
  const text = (option.label ?? option.value ?? '').toString().toLowerCase()
  return text.includes(input.toLowerCase())
}
const startFieldEdit = (key: string) => {
  editingField.value = key
}
const stopFieldEdit = () => {
  editingField.value = ''
}

// 人员字段展示格式化：多选用 "、" 拼接；空值显示 "-"
const formatPeopleField = (v: unknown, multiple?: boolean): string => {
  if (multiple) {
    if (Array.isArray(v) && v.length) return v.join('、')
    return '-'
  }
  return (v as string) || '-'
}

const usageBadgeClass = (usage?: string) => {
  switch (usage) {
    case '爆量':
      return 'usage-hot'
    case '有消耗':
      return 'usage-run'
    case '无消耗':
      return 'usage-cold'
    case '未推送':
      return 'usage-push'
    default:
      return 'usage-none'
  }
}

// 指标卡（仅数值）
const detailMetricCards = computed(() => {
  const m: any = currentMaterial.value
  if (!m) return []
  const cost = parseFloat(String(m.consumption || '0').replace(/[¥,]/g, '')) || 0
  const ctr = m.clickRate ?? 0
  const cpa = m.avgThousandCost ?? 0
  const cvr = parseFloat(String(m.conversion || '0')) || 0
  return [
    { key: 'cost', label: '消耗', unit: '元', value: cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { key: 'nonGrantCost', label: '非赠款消耗', unit: '元', value: m.nonGrantCost != null ? Number(m.nonGrantCost).toLocaleString() : '-' },
    { key: 'exposure', label: '展示数', unit: '', value: m.exposure != null ? Number(m.exposure).toLocaleString() : '-' },
    { key: 'clicks', label: '点击数', unit: '', value: m.clicks != null ? Number(m.clicks).toLocaleString() : '-' },
    { key: 'ctr', label: '点击率', unit: '%', value: `${ctr}` },
    { key: 'avgClickPrice', label: '平均点击单价', unit: '元', value: m.avgClickPrice != null ? `${m.avgClickPrice}` : '-' },
    { key: 'avgThousandCost', label: '平均千次展现费用', unit: '元', value: m.avgThousandCost != null ? `${m.avgThousandCost}` : '-' },
    { key: 'conv', label: '转化数', unit: '', value: `${m.conversion || '-'}` },
    { key: 'cpa', label: '转化成本', unit: '元', value: `${cpa}` },
    { key: 'cvr', label: '转化率', unit: '%', value: `${cvr}` },
  ]
})

// 关联广告（内嵌下钻）
const relatedAds = ref([
  { id: '10881293009', name: '260701-混剪-副业-直播间-中年女性', account: '账户名：上海纽泰仑教育科技有限 ID: 67787382', creator: '李娜', cost: '234.95', impressions: '6,504', clicks: '41', ctr: '0.63%', cpa: '78.32', cvr: '7.32%' },
  { id: '10881301676', name: '260701-混剪-副业-直播间-中年女性', account: '账户名：上海纽泰仑教育科技有限 ID: 80866414', creator: '王强', cost: '50.72', impressions: '581', clicks: '11', ctr: '1.89%', cpa: '0.00', cvr: '0.00%' },
  { id: '10881401093', name: '260701-混剪-副业-直播间-中年女性', account: '账户名：上海纽泰仑教育科技有限 ID: 67787382', creator: '陈曦', cost: '0.06', impressions: '7', clicks: '0', ctr: '0.00%', cpa: '0.00', cvr: '0.00%' },
  { id: '10881987243', name: '260701-混剪-副业-直播间-中年女性', account: '账户名：上海纽泰仑教育科技有限 ID: 80866424', creator: '刘洋', cost: '73.45', impressions: '795', clicks: '4', ctr: '0.50%', cpa: '0.00', cvr: '0.00%' },
  { id: '10881987251', name: '260701-混剪-副业-直播间-中年女性', account: '账户名：上海纽泰仑教育科技有限 ID: 84370222', creator: '赵敏', cost: '427.58', impressions: '3,896', clicks: '51', ctr: '1.31%', cpa: '142.53', cvr: '5.88%' },
  { id: '10882038154', name: '260701-混剪-副业-直播间-中年女性', account: '账户名：上海纽泰仑教育科技有限 ID: 80866424', creator: '孙磊', cost: '1.27', impressions: '11', clicks: '0', ctr: '0.00%', cpa: '0.00', cvr: '0.00%' },
])

const conversionGoalOptions = computed(() => {
  if (preTestForm.value.targetPlatform === 'AD') {
    return [
      {
        label: '应用',
        value: 'app',
        children: [
          { label: '应用-激活', value: 'app_active' },
          { label: '应用-授信', value: 'app_credit' },
          { label: '应用-预约表单', value: 'app_form' },
          { label: '应用-APP内付费', value: 'app_pay' },
          { label: '应用-点击量', value: 'app_click' },
          { label: '应用-APP内详情页到站UV', value: 'app_uv' },
          { label: '应用-下载完成', value: 'app_download' },
          { label: '应用-安装完成', value: 'app_install' },
          { label: '应用-关键行为', value: 'app_action' },
          { label: '应用-APP内下单', value: 'app_order' },
          { label: '应用-付费', value: 'app_paid' },
          { label: '应用-预授信', value: 'app_pre_credit' },
          { label: '应用-预约下载', value: 'app_pre_download' },
          { label: '应用-首次发单(乘客)', value: 'app_first_order' },
          { label: '应用-注册', value: 'app_register' },
          { label: '应用-展示量', value: 'app_show' },
          { label: '应用-提交认证', value: 'app_cert' },
          { label: '应用-APP内访问', value: 'app_visit' },
        ],
      },
      {
        label: '销售线索收集',
        value: 'lead',
        children: [
          { label: '销售线索收集-授信', value: 'lead_credit' },
          { label: '销售线索收集-按钮跳转', value: 'lead_btn_jump' },
          { label: '销售线索收集-点击量', value: 'lead_click' },
          { label: '销售线索收集-回访-信息确认', value: 'lead_callback_info' },
          { label: '销售线索收集-有效咨询', value: 'lead_consult' },
          { label: '销售线索收集-留资咨询', value: 'lead_leave_info' },
          { label: '销售线索收集-卡券领取', value: 'lead_coupon' },
          { label: '销售线索收集-有效获客', value: 'lead_customer' },
          { label: '销售线索收集-多转化', value: 'lead_multi' },
          { label: '销售线索收集-完件', value: 'lead_complete' },
          { label: '销售线索收集-表单提交', value: 'lead_form_submit' },
          { label: '销售线索收集-回访-加为好友', value: 'lead_callback_friend' },
          { label: '销售线索收集-保险支付', value: 'lead_insurance' },
          { label: '销售线索收集-存在意向', value: 'lead_intent' },
          { label: '销售线索收集-意向表单', value: 'lead_intent_form' },
          { label: '销售线索收集-意向话单', value: 'lead_intent_call' },
          { label: '销售线索收集-私信消息', value: 'lead_message' },
          { label: '销售线索收集-放款', value: 'lead_loan' },
          { label: '销售线索收集-私信留资', value: 'lead_message_info' },
          { label: '销售线索收集-访问目标页面', value: 'lead_page_visit' },
          { label: '销售线索收集-付费', value: 'lead_pay' },
          { label: '销售线索收集-预授信', value: 'lead_pre_credit' },
          { label: '销售线索收集-回访-高潜成交', value: 'lead_callback_high' },
          { label: '销售线索收集-首次发单（乘客）', value: 'lead_first_order' },
          { label: '销售线索收集-注册', value: 'lead_register' },
          { label: '销售线索收集-展示量', value: 'lead_show' },
          { label: '销售线索收集-提交认证', value: 'lead_cert' },
          { label: '销售线索收集-智能电话确认接通', value: 'lead_smart_call' },
          { label: '销售线索收集-电话接通', value: 'lead_call_connect' },
          { label: '销售线索收集-微信-添加企业微信', value: 'lead_wx_add' },
          { label: '销售线索收集-微信复制', value: 'lead_wx_copy' },
          { label: '销售线索收集-微信-用户首次消息', value: 'lead_wx_first_msg' },
        ],
      },
      {
        label: '电商',
        value: 'ec',
        children: [
          { label: '电商-app内下单', value: 'ec_app_order' },
          { label: '电商-app内详情页到站uv', value: 'ec_app_uv' },
          { label: '电商-app内访问', value: 'ec_app_visit' },
          { label: '电商-按钮跳转', value: 'ec_btn_jump' },
          { label: '电商-引流电商种草', value: 'ec_plant' },
          { label: '电商-调起店铺', value: 'ec_shop_open' },
          { label: '电商-店铺停留', value: 'ec_shop_stay' },
        ],
      },
      {
        label: '快应用',
        value: 'quick',
        children: [
          { label: '快应用-激活', value: 'quick_active' },
          { label: '快应用-关键行为', value: 'quick_action' },
          { label: '快应用-付费', value: 'quick_pay' },
          { label: '快应用-注册', value: 'quick_register' },
        ],
      },
      {
        label: '原生互动',
        value: 'native',
        children: [
          { label: '原生互动-激活', value: 'native_active' },
          { label: '原生互动-组件点击', value: 'native_comp_click' },
          { label: '原生互动-粉丝入群', value: 'native_fans_group' },
          { label: '原生互动-帐号关注', value: 'native_follow' },
          { label: '原生互动-互动', value: 'native_interact' },
          { label: '原生互动-预约直播', value: 'native_reserve_live' },
          { label: '原生互动-直播间营销捐赠', value: 'native_live_donate' },
          { label: '原生互动-直播间打赏', value: 'native_live_reward' },
          { label: '原生互动-直播间停留', value: 'native_live_stay' },
          { label: '原生互动-直播间观看', value: 'native_live_watch' },
          { label: '原生互动-付费', value: 'native_pay' },
        ],
      },
      {
        label: '商品',
        value: 'goods',
        children: [
          { label: '商品-激活', value: 'goods_active' },
          { label: '商品-app内下单', value: 'goods_app_order' },
          { label: '商品-app内详情页到站uv', value: 'goods_app_uv' },
          { label: '商品-app内付费', value: 'goods_app_pay' },
          { label: '商品-app内访问', value: 'goods_app_visit' },
          { label: '商品-表单提交', value: 'goods_form_submit' },
          { label: '商品-关键行为', value: 'goods_action' },
          { label: '商品-付费', value: 'goods_pay' },
        ],
      },
    ]
  }
  return [
    {
      label: '小程序',
      value: 'mini',
      children: [
        { label: '小程序-激活', value: 'mini_active' },
        { label: '小程序-关键行为', value: 'mini_action' },
        { label: '小程序-付费', value: 'mini_pay' },
      ],
    },
    {
      label: '直播投放',
      value: 'live',
      children: [
        { label: '直播投放-直播间下单', value: 'live_order' },
        { label: '直播投放-直播间结算', value: 'live_settle' },
        { label: '直播投放-直播间评论', value: 'live_comment' },
        { label: '直播投放-直播间成交', value: 'live_deal' },
        { label: '直播投放-进入直播间', value: 'live_enter' },
        { label: '直播投放-直播间粉丝提升', value: 'live_fans' },
        { label: '直播投放-直播加热', value: 'live_heat' },
        { label: '直播投放-直播间商品点击', value: 'live_product_click' },
        { label: '直播投放-结算roi', value: 'live_settle_roi' },
        { label: '直播投放-支付roi-直播间成交', value: 'live_pay_roi_deal' },
        { label: '直播投放-支付roi-千川直接+间接订单', value: 'live_pay_roi_direct' },
      ],
    },
    {
      label: '商品投放',
      value: 'product',
      children: [
        { label: '商品投放-商品购买', value: 'product_buy' },
        { label: '商品投放-点赞评论', value: 'product_like' },
        { label: '商品投放-粉丝提升', value: 'product_fans' },
        { label: '商品投放-人群种草', value: 'product_plant' },
        { label: '商品投放-千川直接+间接订单', value: 'product_direct' },
        { label: '商品投放-商品支付roi', value: 'product_pay_roi' },
      ],
    },
  ]
})

const filteredList = computed(() => {
  return materialList.value.filter(item => {
    if (searchKeyword.value && !item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())) {
      return false
    }
    if (filterAudit.value && item.status !== filterAudit.value) {
      return false
    }
    return true
  })
})

// 当前页素材列表：按视图模式（grid / list）取对应的分页区间
const currentPageItems = computed(() => {
  const isList = viewMode.value === 'list'
  const current = isList ? listCurrent.value : currentPage.value
  const size = isList ? listPageSize.value : pageSize.value
  const start = (current - 1) * size
  return filteredList.value.slice(start, start + size)
})

const handleFolderToggle = (item: any) => {
  selectedFolder.value = item.key
  if (item.children?.length) {
    const idx = expandedFolders.value.indexOf(item.key)
    if (idx > -1) {
      expandedFolders.value.splice(idx, 1)
    } else {
      expandedFolders.value.push(item.key)
    }
  }
}

const handleAddChild = (item: any) => {
  currentEditFolder.value = item
  addChildForm.value = { name: '', sort: 0 }
  showAddChildDialog.value = true
}

const handleEditFolder = (item: any) => {
  currentEditFolder.value = item
  editFolderForm.value = { level: 1, name: item.title, sort: 0 }
  showEditFolderDialog.value = true
}

const handleDeleteFolder = (item: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除文件夹「${item.title}」吗？删除后无法恢复。`,
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      console.log('删除文件夹', item)
    },
  })
}

const handleConfirmEdit = () => {
  console.log('编辑文件夹', editFolderForm.value, currentEditFolder.value)
  showEditFolderDialog.value = false
}

const handleConfirmAddChild = () => {
  console.log('添加子类', addChildForm.value, currentEditFolder.value)
  addChildForm.value = { name: '', sort: 0 }
  showAddChildDialog.value = false
}


const handleAccountImport = () => {
  const selected = accountTableData.value.filter(item => item.selected)
  console.log('Import account materials:', selected, 'to folder:', accountTargetFolder.value)
  showAccountDialog.value = false
}

const handleAccountReset = () => {
  accountQuery.value = {
    platform: '',
    accountName: '',
    type: '',
    source: '',
    materialName: '',
    dateRange: [],
  }
}

const handleAccountSearch = () => {
  console.log('Search account materials:', accountQuery.value)
}

const handlePreviewThumb = (record: any) => {
  if (record.thumbnail) {
    previewImage.value = record.thumbnail
    showPreviewDialog.value = true
  }
}

const handlePreview = (record: any) => {
  if (record.thumbnail) {
    previewImage.value = record.thumbnail
    showPreviewDialog.value = true
  }
}
void handlePreview


const handlePushToAccount = () => {
  showPushDialog.value = true
}

const handleMoveMaterial = () => {
  showMoveDialog.value = true
}

const handleConfirmPreTest = () => {
  console.log('Create pretest:', preTestForm.value)
  Message.success('提交成功，请您到【素材前测任务】查看任务进度。')
  showPreTestDialog.value = false
}

const handleConfirmMove = () => {
  console.log('Move materials to folder:', moveForm.value.folder)
  Message.success('移动成功')
  showMoveDialog.value = false
}

const handleDeleteMaterial = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedMaterials.value.length} 个素材吗？删除后无法恢复。`,
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      console.log('Delete materials:', selectedMaterials.value)
      Message.success('删除成功')
      selectedMaterials.value = []
    },
  })
}

const handlePushSelectAll = (val: any) => {
  const checked = typeof val === 'boolean' ? val : (val as any).target?.checked ?? false
  filteredPushAccounts.value.forEach(acc => acc.selected = checked)
}

const handleConfirmPush = () => {
  console.log('Push to accounts:', selectedPushAccounts.value)
  Message.success('提交成功，请您到【素材推送任务】查看任务进度。')
  showPushDialog.value = false
}

const handleClearPushAccounts = () => {
  pushAccounts.value.forEach(acc => acc.selected = false)
  pushSelectAll.value = false
}

const handleRemovePushAccount = (acc: any) => {
  acc.selected = false
  if (pushSelectAll.value) {
    pushSelectAll.value = false
  }
}

const handleAddFolder = () => {
  console.log('新增文件夹', newFolderForm.value)
  newFolderForm.value = { level: 1, name: '', sort: 0 }
}

const handleSearch = () => {
  console.log('Search:', searchKeyword.value)
}

const handleSelectAll = () => {
  if (selectedMaterials.value.length === filteredList.value.length) {
    selectedMaterials.value = []
  } else {
    selectedMaterials.value = filteredList.value.map(item => item.id)
  }
}

// 仅勾选当前页：本页全部未选 → 全选；本页已全选 → 取消本页勾选；其他页勾选不受影响
const handleSelectCurrentPage = () => {
  const pageIds = currentPageItems.value.map((item) => item.id)
  if (pageIds.length === 0) return
  const allPageSelected = pageIds.every((id) => selectedMaterials.value.includes(id))
  if (allPageSelected) {
    // 取消当前页的勾选
    selectedMaterials.value = selectedMaterials.value.filter((id) => !pageIds.includes(id))
  } else {
    // 合并：保留其他页勾选，补齐当前页
    const set = new Set([...selectedMaterials.value, ...pageIds])
    selectedMaterials.value = Array.from(set)
  }
}

const handleClearSelection = () => {
  selectedMaterials.value = []
}

const handleExport = () => {
  const exportList = selectedMaterials.value.length
    ? filteredList.value.filter(item => selectedMaterials.value.includes(item.id))
    : filteredList.value
  console.log('Export materials:', exportList)
  Message.success(`已导出 ${exportList.length} 条素材`)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleSelectionChange = (keys: (string | number)[]) => {
  selectedMaterials.value = keys as number[]
}

const handleToggleSelect = (item: any) => {
  const idx = selectedMaterials.value.indexOf(item.id)
  if (idx > -1) {
    selectedMaterials.value.splice(idx, 1)
  } else {
    selectedMaterials.value.push(item.id)
  }
}

const handleOpenDetail = (item: any) => {
  currentMaterial.value = item
  detailEditMode.value = false
  detailTab.value = 'detail'
  editingField.value = ''
  showDetailDialog.value = true
}

const handlePreviewMedia = () => {
  if (currentMaterial.value?.type === 'VIDEO') {
    const videoEl = (videoRef.value as HTMLVideoElement) || document.querySelector('.phone-screen video') as HTMLVideoElement
    if (!videoEl) return
    if (videoEl.paused) videoEl.play()
    else videoEl.pause()
  }
}

const handleDownload = () => {
  if (currentMaterial.value?.thumbnail) {
    const link = document.createElement('a')
    link.href = currentMaterial.value.thumbnail
    link.download = currentMaterial.value.name
    link.click()
  }
}

const videoRef = ref<HTMLVideoElement | null>(null)
const dyPlaying = ref(false)
const dyCurrentTime = ref(0)
const dyDuration = ref(0)
const dyProgress = computed(() => (dyDuration.value > 0 ? (dyCurrentTime.value / dyDuration.value) * 100 : 0))

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

</script>

<style scoped lang="scss">
.material-lib-page {
  display: flex;
  height: 100vh;
  background: #F2F3F5;

  // 左侧目录
  .left-sidebar {
    width: 220px;
    background: #FFFFFF;
    border-right: 1px solid #E5E6EB;
    display: flex;
    flex-direction: column;

    .sidebar-header {
      height: 64px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 20px;
      border-bottom: 1px solid #E5E6EB;

      .logo-icon {
        font-size: 20px;
        color: #165DFF;
      }

      .logo-text {
        font-size: 16px;
        font-weight: 600;
        color: #1D2129;
      }

      .header-plus-icon {
        cursor: pointer;
        color: #86909C;
        font-size: 14px;
        margin-left: auto;

        &:hover {
          color: #165DFF;
        }
      }

      .add-folder-form {
        padding: 16px 0;

        .form-item {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;

          &:last-of-type {
            margin-bottom: 0;
          }
        }

        .form-label {
          font-size: 14px;
          color: #1D2129;
          font-weight: 500;
          margin-bottom: 8px;
        }
      }
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 16px;
    }

    .material-detail {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      gap: 32px;
      padding: 24px;
      height: 880px;

      .detail-info {
        width: 300px;
        flex-shrink: 0;
        overflow: visible;

        .info-section {
          margin-bottom: 20px;

          &:last-child {
            margin-bottom: 0;
          }

          .section-title {
            font-size: 14px;
            font-weight: 500;
            color: #1D2129;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #E5E6EB;
          }

          .info-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .info-item {
              display: flex;
              justify-content: space-between;
              align-items: center;

              .info-label {
                color: #86909C;
                font-size: 13px;
              }

              .info-value {
                color: #1D2129;
                font-size: 13px;

                &.status {
                  display: inline-block;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 12px;

                  &.PASSED {
                    background: #E8F3FF;
                    color: #165DFF;
                  }

                  &.REJECTED {
                    background: #FFF1E8;
                    color: #F53F3F;
                  }

                  &.PENDING {
                    background: #FFF7E8;
                    color: #FF9A2E;
                  }
                }
              }
            }
          }
        }
      }

      .detail-preview {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .preview-container {
          width: 100%;
          flex: 1;
          max-height: 300px;
          background: #F2F3F5;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;

          img, video {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .preview-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;

            svg {
              font-size: 48px;
              color: #86909C;
            }
          }

          .play-icon {
            position: absolute;
            width: 48px;
            height: 48px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;

            svg {
              font-size: 24px;
              color: #fff;
            }
          }

          &:hover .play-icon {
            background: rgba(22, 93, 255, 0.8);
          }
        }

        .preview-actions {
          margin-top: 16px;
        }
      }
    }

    .folder-tree {
      flex: 1;
      overflow-y: auto;
      padding: 12px 8px;

      .folder-item {
        .folder-main {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          color: #4E5969;
          font-size: 14px;
          transition: all 0.2s;
          position: relative;

          &:hover {
            background: #F2F3F5;
          }

          &.active {
            background: #E8F3FF;
            color: #165DFF;

            &::before {
              content: '';
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
              width: 3px;
              height: 16px;
              background: #165DFF;
              border-radius: 0 2px 2px 0;
            }
          }

          svg {
            font-size: 12px;
            color: #86909C;
            transition: transform 0.2s;

            &.expanded {
              transform: rotate(90deg);
            }
          }

          span {
            flex: 1;
          }

          .folder-more-icon {
            opacity: 0;
            font-size: 12px;
            color: #86909C;
            transition: opacity 0.2s;
          }

          &:hover .folder-more-icon {
            opacity: 1;
          }

          .folder-more-wrapper {
            display: flex;
            align-items: center;
          }
        }

        .folder-actions {
          .action-item {
            padding: 6px 12px;
            cursor: pointer;
            font-size: 13px;
            color: #4E5969;
            border-radius: 4px;
            transition: all 0.2s;

            &:hover {
              background: #F2F3F5;
            }

            &.danger {
              color: #F53F3F;
            }
          }
        }
      }

      .folder-children {
        padding-left: 24px;

        .folder-child {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          color: #4E5969;
          font-size: 13px;
          transition: all 0.2s;

          &:hover {
            background: #F2F3F5;
          }

          &.active {
            background: #E8F3FF;
            color: #165DFF;
          }

          svg {
            font-size: 14px;
            color: #86909C;
          }
        }
      }
    }

    .sidebar-menu {
      padding: 8px;
      border-top: 1px solid #E5E6EB;

      .menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        color: #4E5969;
        font-size: 14px;
        transition: all 0.2s;

        &:hover {
          background: #F2F3F5;
        }

        &.active {
          background: #E8F3FF;
          color: #165DFF;
        }

        svg {
          font-size: 14px;
          color: #86909C;
        }
      }
    }
  }
}

// 右侧主内容
  .right-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .content-header {
      height: 64px;
      background: #FFFFFF;
      border-bottom: 1px solid #E5E6EB;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;

        .breadcrumb-item {
          color: #86909C;

          &.active {
            color: #1D2129;
            font-weight: 500;
          }
        }

        .breadcrumb-separator {
          color: #C9CDD4;
        }
      }
    }

    .content-body {
      flex: 1;
      padding: 20px 24px;
      overflow-y: auto;

      .filter-card {
        background: #FFFFFF;
        border-radius: 8px;
        padding: 16px 20px;
        margin-bottom: 16px;

        .filter-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .cost-input-group {
            display: flex;
            align-items: center;
          }

          .cost-tilde {
            padding: 0 6px;
            color: #86909C;
          }
        }
      }

      .material-section {
        background: #FFFFFF;
        border-radius: 8px;
        padding: 16px 20px;

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          .button-group {
            display: flex;
            gap: 3px;
          }

          .section-title {
            display: flex;
            align-items: center;
            gap: 8px;

            .title-text {
              font-size: 16px;
              font-weight: 600;
              color: #1D2129;
            }

            .title-count {
              font-size: 14px;
              color: #86909C;
            }
          }

          .section-actions {
            display: flex;
            gap: 12px;
            align-items: center;

            .view-toggle {
              display: flex;
              background: #F2F3F5;
              border-radius: 6px;
              padding: 4px;

              .toggle-btn {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                cursor: pointer;
                color: #86909C;
                transition: all 0.2s;

                &:hover {
                  background: #E5E6EB;
                }

                &.active {
                  background: #FFFFFF;
                  color: #165DFF;
                }
              }
            }
          }
        }

        .material-grid-wrapper {
          .material-grid {
            display: grid;
            grid-template-columns: repeat(10, minmax(0, 1fr));
            gap: 12px;

            .material-card {
              width: 100%;
              background: #FFFFFF;
              border-radius: 8px;
              overflow: hidden;
              cursor: pointer;
              border: 1px solid #F2F3F5;
              transition: all 0.2s;

              &:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

                .card-checkbox {
                  opacity: 1;
                }
              }

              &.selected {
                border-color: #165DFF;
              }

              .card-thumb {
                position: relative;
                width: 100%;
                aspect-ratio: 3 / 4;
                background: #F2F3F5;
                display: flex;
                align-items: center;
                justify-content: center;

                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                video {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                .thumb-placeholder {
                  color: #C9CDD4;

                  svg {
                    font-size: 28px;
                  }
                }

                .card-checkbox {
                  position: absolute;
                  top: 6px;
                  left: 6px;
                  z-index: 10;
                  opacity: 1;
                  transition: opacity 0.2s;
                  padding: 2px 4px;
                  background: rgba(255, 255, 255, 0.6);
                  border-radius: 4px;
                  backdrop-filter: blur(2px);

                  &:hover {
                    background: rgba(255, 255, 255, 0.85);
                  }
                }

                .card-usage {
                  position: absolute;
                  top: 6px;
                  right: 6px;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  color: #FFFFFF;
                  background: rgba(0, 0, 0, 0.45);
                }

                .play-btn {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  background: rgba(0, 0, 0, 0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #FFFFFF;
                  transition: background 0.2s;
                }

                &:hover .play-btn {
                  background: rgba(22, 93, 255, 0.8);
                }

                .card-views {
                  position: absolute;
                  right: 6px;
                  bottom: 6px;
                  display: flex;
                  align-items: center;
                  gap: 3px;
                  padding: 1px 7px;
                  border-radius: 10px;
                  font-size: 12px;
                  color: #FFFFFF;
                  background: rgba(0, 0, 0, 0.45);

                  svg {
                    font-size: 12px;
                  }
                }
              }

              .card-body {
                padding: 8px 10px 10px;

                .card-meta-row {
                  display: flex;
                  justify-content: space-between;
                  font-size: 12px;
                  color: #86909C;
                  margin-bottom: 4px;
                }

                .card-title {
                  font-size: 13px;
                  font-weight: 500;
                  color: #1D2129;
                  line-height: 1.4;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  min-height: 36px;
                }

                .card-price {
                  margin-top: 6px;
                  font-size: 13px;
                  font-weight: 600;
                  color: #1D2129;
                }

                .card-footer {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-top: 8px;
                  padding-top: 8px;
                  border-top: 1px solid #F2F3F5;
                  font-size: 12px;
                  color: #86909C;

                  .footer-user {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;

                    svg {
                      color: #165DFF;
                      flex-shrink: 0;
                    }
                  }

                  .footer-time {
                    flex-shrink: 0;
                  }
                }
              }
            }
          }

          .pagination-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
        }

        .selected-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 12px;
          font-size: 14px;
          color: #4E5969;
        }

        :deep(.material-table) {
          background: #FFFFFF;
          border-radius: 8px;

          .arco-table-th__title,
          .arco-table-th-title,
          .arco-table-th .arco-table-cell {
            white-space: nowrap;
          }

          .table-item-name {
            display: flex;
            align-items: center;
            gap: 10px;

            .table-thumb {
              width: 48px;
              height: 48px;
              border-radius: 4px;
              object-fit: cover;
              cursor: pointer;
              flex-shrink: 0;

              img {
                width: 48px;
                height: 48px;
                object-fit: cover;
                border-radius: 4px;
              }
            }

            svg {
              color: #86909C;
            }
          }
        }
      }
    }
  }

  .table-thumb {
    width: 48px;
    height: 48px;
    flex-shrink: 0;

    img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
    }
  }

  .table-material-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .table-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;

    .material-name {
      font-size: 14px;
      color: #1D2129;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .material-meta {
      font-size: 12px;
      color: #86909C;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>

<style>

.material-detail {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 24px;
  padding: 32px;
  height: 850px;
  box-sizing: border-box;
  overflow: hidden;
}

.material-detail .detail-info {
  width: 400px;
  flex-shrink: 0;
  overflow: visible;
}

.material-detail .detail-info .info-section {
  margin-bottom: 28px;
}

.material-detail .detail-info .info-section:last-child {
  margin-bottom: 0;
}

.material-detail .detail-info .section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1D2129;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #E5E6EB;
}

.material-detail .detail-info .info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.material-detail .detail-info .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.material-detail .detail-info .info-label {
  color: #86909C;
  font-size: 14px;
}

.material-detail .detail-info .info-value {
  color: #1D2129;
  font-size: 14px;
}

.material-detail .detail-info .info-value.status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.material-detail .detail-info .info-value.status.PASSED {
  background: #E8F3FF;
  color: #165DFF;
}

.material-detail .detail-info .info-value.status.REJECTED {
  background: #FFF1E8;
  color: #F53F3F;
}

.material-detail .detail-info .info-value.status.PENDING {
  background: #FFF7E8;
  color: #FF9A2E;
}

.material-detail .detail-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.material-detail .detail-preview .preview-container {
  width: 380px;
  height: 420px;
  flex: none;
  background: #F2F3F5;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.material-detail .detail-preview .preview-container img,
.material-detail .detail-preview .preview-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-detail .detail-preview .preview-container .video-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-detail .detail-preview .preview-container .video-wrapper video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-detail .detail-preview .preview-container .video-controls {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.material-detail .detail-preview .preview-container:hover .video-controls {
  opacity: 1;
}

.material-detail .detail-preview .preview-container .play-icon {
  position: absolute;
  width: 64px;
  height: 64px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-detail .detail-preview .preview-container .play-icon svg {
  font-size: 32px;
  color: #fff;
}

.material-detail .detail-preview .preview-container:hover .play-icon {
  background: rgba(22, 93, 255, 0.8);
}

.material-detail .detail-preview .preview-actions {
  margin-top: 20px;
}

.account-dialog {
  display: flex;
  flex-direction: column;
  max-height: 80vh;

  .account-top {
    padding: 20px 24px;
    border-bottom: 1px solid #E5E6EB;

    .query-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;

      &:last-of-type {
        margin-bottom: 12px;
      }
    }

    .query-item {
      display: flex;
      align-items: center;
      gap: 8px;

      &.no-flex {
        flex: none;
        min-width: auto;
      }
    }

    .query-label {
      font-size: 14px;
      color: #4E5969;
      white-space: nowrap;
    }

    .query-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  .account-middle {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px;

    .account-thumb {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F2F3F5;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      svg {
        font-size: 24px;
        color: #86909C;
      }
    }
  }

  .account-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid #E5E6EB;
    background: #FAFBFC;

    .bottom-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .selected-count {
        font-size: 14px;
        color: #4E5969;

        strong {
          color: #165DFF;
        }
      }

      .folder-select {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .bottom-right {
      display: flex;
      gap: 8px;
    }
  }
}

.push-dialog {
  display: flex;
  flex-direction: column;
  height: 70vh;

  .push-hint {
    padding: 12px 24px;
    background: #F0F5FF;
    font-size: 14px;
    color: #4E5969;

    strong {
      color: #165DFF;
    }
  }

  .push-top {
    display: flex;
    gap: 24px;
    padding: 20px 24px;
    border-bottom: 1px solid #E5E6EB;

    .form-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-label {
      font-size: 14px;
      color: #4E5969;
      white-space: nowrap;
    }
  }

  .push-middle {
    flex: 1;
    display: flex;
    overflow: hidden;
    border-top: 1px solid #E5E6EB;

    .push-left {
      flex: 1;
      padding: 16px;
      border-right: 1px solid #E5E6EB;
      display: flex;
      flex-direction: column;

      .push-left-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        span {
          font-size: 14px;
          font-weight: 500;
          color: #1D2129;
        }
      }

      .search-wrapper {
        margin-bottom: 12px;
      }

      .select-all-wrapper {
        padding: 8px 0;
        border-bottom: 1px solid #E5E6EB;
      }

      .account-list {
        flex: 1;
        overflow-y: auto;

        .account-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;

          .account-name {
            font-size: 14px;
            color: #4E5969;
          }
        }
      }
    }

    .push-right {
      flex: 1;
      padding: 16px;
      background: #FAFBFC;
      display: flex;
      flex-direction: column;

      .push-right-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        font-weight: 500;
        color: #1D2129;
        margin-bottom: 12px;
      }

      .selected-list {
        flex: 1;
        overflow-y: auto;

        .selected-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          background: #FFFFFF;
          border: 1px solid #E5E6EB;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 13px;
          color: #4E5969;
        }
      }
    }
  }

  .push-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid #E5E6EB;

    .bottom-left {
      display: flex;
      align-items: center;
    }

    .bottom-right {
      display: flex;
      gap: 8px;
    }
  }
}

.move-dialog {
  padding: 24px;

  .move-form {
    .form-item {
      margin-bottom: 20px;
    }

    .form-label {
      font-size: 14px;
      color: #4E5969;
      margin-bottom: 8px;
      display: block;
    }

    .form-control {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .move-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid #E5E6EB;
  }
}

.pretest-dialog {
  display: flex;
  flex-direction: column;
  height: 60vh;

  .pretest-middle {
    flex: 1;
    display: flex;
    overflow: hidden;

    .pretest-left {
      flex: 1;
      padding: 16px;
      border-right: 1px solid #E5E6EB;
      display: flex;
      flex-direction: column;

      .pretest-left-header {
        font-size: 14px;
        font-weight: 500;
        color: #1D2129;
        margin-bottom: 12px;
      }

      .pretest-material-list {
        flex: 1;
        overflow-y: auto;

        .pretest-material-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-bottom: 1px solid #E5E6EB;

          &:last-child {
            border-bottom: none;
          }

          .material-thumb {
            width: 40px;
            height: 40px;
            border-radius: 4px;
            object-fit: cover;
          }

          .material-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #F2F3F5;
            border-radius: 4px;
            color: #86909C;
          }

          .material-name {
            flex: 1;
            font-size: 13px;
            color: #4E5969;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }

    .pretest-right {
      flex: 2;
      padding: 16px;
      background: #FAFBFC;
      overflow-y: auto;
      max-height: 60vh;

      .config-section {
        .config-title {
          font-size: 14px;
          font-weight: 500;
          color: #1D2129;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E5E6EB;
        }

        .config-form {
          .pretest-hint {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 12px;
            background: #E8F3FF;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 13px;

            .arco-icon {
              font-size: 16px;
              color: #165DFF;
            }

            span {
              color: #4E5969;
            }
          }

          .form-item {
            margin-bottom: 16px;

            .form-label {
              font-size: 14px;
              color: #4E5969;
              margin-bottom: 8px;
              display: block;
            }

            .config-param-box {
              background: #F2F3F5;
              border-radius: 6px;
              padding: 8px 12px;

              .config-param-text {
                font-size: 14px;
                color: #4E5969;
              }
            }

            .config-param-title {
              color: #1D2129;
            }

            .required-mark {
              color: #F53F3F;
              margin-right: 4px;
            }

            .form-tip-icon {
              display: inline-flex;
              align-items: center;
              color: #86909C;
              cursor: pointer;
              margin-left: 4px;

              &:hover {
                color: #165DFF;
              }
            }
          }
        }
      }
    }
  }

  .pretest-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 24px;
    border-top: 1px solid #E5E6EB;
  }
}

.preview-modal {
  .arco-modal-close {
    position: absolute;
    right: 16px;
    top: 16px;
    z-index: 10;
  }
}

/* 素材详情 V2 */
.detail-v2 {
  height: 100%;
  position: relative;
}

.detail-v2 .dv-page {
  height: 100%;
  overflow-y: auto;
}

.detail-v2 .dv-top {
  display: flex;
  border-bottom: 8px solid #F2F3F5;
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
  width: 380px;
  flex-shrink: 0;
  border-right: 1px solid #E5E6EB;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background: #FAFBFC;
}

.detail-v2 .dv-platforms {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-v2 .plat-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
}

.detail-v2 .plat-icon.douyin { background: #161823; }
.detail-v2 .plat-icon.kuaishou { background: #FF4906; }
.detail-v2 .plat-icon.shipin { background: #FA9D3B; }
.detail-v2 .dv-version { margin-left: auto; width: 130px; }

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

/* 顶部导航 */
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
.detail-v2 .dy-topnav .dy-menu {
  width: 20px;
  height: 20px;
  color: #fff;
  flex-shrink: 0;
}
.detail-v2 .dy-topnav .dy-search {
  width: 20px;
  height: 20px;
  color: #fff;
  flex-shrink: 0;
}

/* 右侧操作栏 */
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

/* 倍速切换按钮（控制条内，可点击） */
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

/* 视频控制条 */
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
/* 音量滑块：灰轨 + 白条 + 白色圆点 */
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
.detail-v2 .dy-controls .vol-slider .arco-slider-btn:hover::after {
  border-color: #FFFFFF;
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

.detail-v2 .phone-ctrl {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.detail-v2 .dv-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E5E6EB;
}

.detail-v2 .dv-main {
  flex: 1;
  min-width: 0;
  padding: 16px 20px;
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

.detail-v2 .dv-title-edit {
  font-size: 15px;
  color: #86909C;
  cursor: pointer;
  flex-shrink: 0;
}
.detail-v2 .dv-title-edit:hover {
  color: #165DFF;
}

.detail-v2 .dv-title-input {
  max-width: 480px;
}

.detail-v2 .title-act {
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
}
.detail-v2 .title-act.ok { color: #00B42A; }
.detail-v2 .title-act.cancel { color: #F53F3F; }

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
.detail-v2 .dv-usage.usage-push { background: #FFF7E8; color: #FF7D00; }
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

/* 详情字段区 + 右侧锚点 */
.detail-v2 .dv-body-wrap {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.detail-v2 .dv-body {
  flex: 1;
  min-width: 0;
}
.detail-v2 .dv-anchor {
  width: 40px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 44px;
}
.detail-v2 .dv-anchor .anchor-item {
  writing-mode: vertical-lr;
  letter-spacing: 4px;
  padding: 12px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: #4E5969;
  background: #F2F3F5;
  cursor: pointer;
  text-align: center;
}
.detail-v2 .dv-anchor .anchor-item.active {
  color: #165DFF;
  background: #E8F3FF;
}

/* 顶部字段列表（宽值） */
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

/* 两列字段 */
.detail-v2 .dv-fields-2col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 40px;
}

.detail-v2 .fld { display: flex; align-items: center; font-size: 13px; }
.detail-v2 .fld-l { color: #86909C; width: 96px; flex-shrink: 0; }
.detail-v2 .fld-v { color: #1D2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.detail-v2 .fld-input { flex: 1; }

/* 人员字段行内编辑 */
.detail-v2 .dv-fields-2col .fld .fld-v { flex: 1; }
.detail-v2 .fld-edit {
  font-size: 15px;
  color: #86909C;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
}
.detail-v2 .fld-edit:hover { color: #165DFF; }
.detail-v2 .fld-edit-input { flex: 1; }
.detail-v2 .fld-act {
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 6px;
}
.detail-v2 .fld-act.ok { color: #00B42A; }
.detail-v2 .fld-act.cancel { color: #F53F3F; }

/* 全宽区块 */
.detail-v2 .dv-block {
  padding: 16px 20px;
  border-bottom: 8px solid #F2F3F5;
}
.detail-v2 .dv-block:last-child {
  border-bottom: none;
}
.detail-v2 .dv-block-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 12px;
}
.detail-v2 .dv-data-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.detail-v2 .toolbar-left { display: flex; align-items: center; gap: 8px; }
.detail-v2 .toolbar-right { display: flex; align-items: center; gap: 8px; }

/* 指标卡 */
.detail-v2 .dv-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 4px;
}
.detail-v2 .dv-card {
  padding: 14px 16px;
  border-radius: 8px;
  background: #F7F8FA;
}
.detail-v2 .card-label { font-size: 13px; color: #4E5969; }
.detail-v2 .card-value { font-size: 24px; font-weight: 700; color: #1D2129; margin-top: 8px; line-height: 1.2; }
.detail-v2 .card-unit { font-size: 12px; font-weight: 400; color: #86909C; margin-left: 2px; }
.detail-v2 .dv-card.card-cost { background: #EAF2FF; }
.detail-v2 .dv-card.card-ctr { background: #E6FFFB; }
.detail-v2 .dv-card.card-cpa { background: #E8FFEA; }
.detail-v2 .dv-card.card-cvr { background: #FFF7E8; }
.detail-v2 .dv-card.card-play3s { background: #FFECE8; }
.detail-v2 .dv-card.card-nonGrantCost { background: #F3EEFF; }
.detail-v2 .dv-card.card-exposure { background: #E9F5FF; }
.detail-v2 .dv-card.card-clicks { background: #FFF4E6; }
.detail-v2 .dv-card.card-avgClickPrice { background: #FCEDF2; }
.detail-v2 .dv-card.card-avgThousandCost { background: #EEF1FF; }
.detail-v2 .dv-card.card-conv { background: #F0FAE6; }

/* 趋势图 */
.detail-v2 .dv-chart {
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  padding: 12px;
}
.detail-v2 .chart-chips { display: flex; gap: 8px; margin-bottom: 8px; }
.detail-v2 .chart-chips .chip {
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 12px;
  color: #4E5969;
  background: #F2F3F5;
  cursor: pointer;
  transition: all 0.2s;
}
.detail-v2 .chart-chips .chip.active { background: #165DFF; color: #fff; }
.detail-v2 .chart-canvas { width: 100%; height: 280px; }

.detail-v2 .ad-name { font-size: 13px; color: #1D2129; }
.detail-v2 .ad-id { font-size: 12px; color: #86909C; }

/* 素材审核 */
.detail-v2 .dv-audit .audit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.detail-v2 .dv-audit .audit-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}
.detail-v2 .dv-audit .audit-media-tabs {
  margin-bottom: 8px;
}

/* 调整广告创建时间范围弹层 */
.ads-days-form {
  width: 300px;
}
.ads-days-form .ads-days-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 14px;
}
.ads-days-form .ads-days-label {
  font-size: 14px;
  color: #1D2129;
  margin-bottom: 10px;
}
.ads-days-form .ads-days-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #86909C;
}
.ads-days-form .ads-days-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* 自定义指标弹窗 */
.metrics-dialog {
  display: flex;
  height: 520px;
}

.metrics-dialog .metrics-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid #E5E6EB;
}

.metrics-dialog .metrics-search {
  padding: 16px 20px;
}

.metrics-dialog .metrics-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.metrics-dialog .metrics-nav {
  width: 140px;
  flex-shrink: 0;
  padding: 4px 0;
  border-right: 1px solid #F2F3F5;
  overflow-y: auto;
}

.metrics-dialog .metrics-nav .nav-item {
  padding: 10px 20px;
  font-size: 14px;
  color: #4E5969;
  cursor: pointer;
  transition: all 0.2s;
}

.metrics-dialog .metrics-nav .nav-item:hover {
  background: #F7F8FA;
}

.metrics-dialog .metrics-nav .nav-item.active {
  color: #165DFF;
  background: #E8F3FF;
  font-weight: 500;
}

.metrics-dialog .metrics-checks {
  flex: 1;
  padding: 8px 24px 16px;
  overflow-y: auto;
}

.metrics-dialog .check-group {
  margin-bottom: 20px;
}

.metrics-dialog .check-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #1D2129;
  margin: 12px 0;
}

.metrics-dialog .check-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 12px;
}

.metrics-dialog .check-empty,
.metrics-dialog .selected-empty {
  color: #86909C;
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}

.metrics-dialog .metrics-right {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #FAFBFC;
}

.metrics-dialog .right-header {
  padding: 16px 20px 8px;
}

.metrics-dialog .right-title {
  font-size: 14px;
  font-weight: 600;
  color: #1D2129;
}

.metrics-dialog .right-sub {
  font-size: 12px;
  color: #86909C;
  margin-top: 4px;
}

.metrics-dialog .selected-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 16px;
}

.metrics-dialog .selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 6px;
  font-size: 13px;
  color: #1D2129;
  cursor: grab;
  transition: all 0.15s;
}

.metrics-dialog .selected-item:hover {
  border-color: #C9CDD4;
}

.metrics-dialog .selected-item.dragging {
  opacity: 0.5;
  border-color: #165DFF;
}

.metrics-dialog .selected-item .drag-handle {
  display: flex;
  align-items: center;
  color: #C9CDD4;
}

.metrics-dialog .selected-item .item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metrics-dialog .selected-item .item-remove {
  color: #C9CDD4;
  cursor: pointer;
  flex-shrink: 0;
}

.metrics-dialog .selected-item .item-remove:hover {
  color: #F53F3F;
}

.metrics-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metrics-footer .footer-left {
  display: flex;
  align-items: center;
}

.metrics-footer .footer-btns {
  display: flex;
  gap: 8px;
}

/* 常用自定义指标下拉 */
.metric-preset-menu {
  min-width: 180px;
  padding: 4px 0;
}

.metric-preset-menu .preset-header {
  padding: 8px 16px 6px;
  font-size: 13px;
  color: #86909C;
}

.metric-preset-menu .preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: #1D2129;
  transition: all 0.2s;
}

.metric-preset-menu .preset-item:hover {
  background: #F2F3F5;
}

.metric-preset-menu .preset-item .preset-name {
  flex: 1;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-preset-menu .preset-item.active .preset-name {
  color: #165DFF;
  font-weight: 500;
}

.metric-preset-menu .preset-item.entry {
  cursor: pointer;
}

.metric-preset-menu .preset-actions {
  display: none;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.metric-preset-menu .preset-item:hover .preset-actions,
.metric-preset-menu .preset-actions.editing {
  display: flex;
}

.metric-preset-menu .preset-actions svg {
  font-size: 14px;
  color: #86909C;
  cursor: pointer;
}

.metric-preset-menu .preset-actions .act-edit:hover,
.metric-preset-menu .preset-actions .act-ok:hover {
  color: #165DFF;
}

.metric-preset-menu .preset-actions .act-del:hover,
.metric-preset-menu .preset-actions .act-cancel:hover {
  color: #F53F3F;
}

.metric-preset-menu .preset-edit-input {
  flex: 1;
}

.metric-preset-menu .preset-empty {
  padding: 8px 16px;
  font-size: 13px;
  color: #C9CDD4;
}

.metric-preset-menu .preset-divider {
  height: 1px;
  background: #E5E6EB;
  margin: 4px 0;
}
</style>