<template>
  <div class="personal-center-page">
    <!-- 顶部头部 -->
    <div class="profile-header">
      <div class="profile-header-bg" />
      <div class="profile-header-content">
        <div class="profile-avatar-wrap">
          <a-avatar :size="80" class="profile-avatar">
            <img :src="profileForm.avatar || userStore.avatar" alt="avatar" />
          </a-avatar>
          <span class="avatar-status" />
        </div>

        <div class="profile-info">
          <div class="profile-name">{{ profileForm.realName || profileForm.username }}</div>
          <div class="profile-meta">
            <span class="meta-item">
              <icon-user />
              <span>{{ profileForm.roleText }}</span>
            </span>
            <span class="meta-divider" />
            <span class="meta-item">
              <span class="meta-label">ID:</span>
              <span>{{ profileForm.id }}</span>
            </span>
            <span class="meta-divider" />
            <span class="meta-item">
              <icon-apps />
              <span>{{ profileForm.systemName }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 三栏卡片 -->
    <div class="profile-cards">
      <!-- 基本信息 -->
      <a-card class="info-card" :bordered="false">
        <div class="card-header">
          <span class="card-header-icon card-header-icon-blue">
            <icon-user />
          </span>
          <span class="card-header-title">基本信息</span>
        </div>

        <div class="info-list">
          <div class="info-row">
            <span class="info-label">用户名称</span>
            <span class="info-value">{{ profileForm.username || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">真实姓名</span>
            <span class="info-value">{{ profileForm.realName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">手机号码</span>
            <span class="info-value">{{ profileForm.phone || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">电子邮箱</span>
            <span class="info-value">{{ profileForm.email || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">所属群组</span>
            <span class="info-value">{{ profileForm.group || '-' }}</span>
          </div>
        </div>
      </a-card>

      <!-- 账户信息 -->
      <a-card class="info-card" :bordered="false">
        <div class="card-header">
          <span class="card-header-icon card-header-icon-orange">
            <icon-safe />
          </span>
          <span class="card-header-title">账户信息</span>
        </div>

        <div class="info-list">
          <div class="info-row">
            <span class="info-label">用户 ID</span>
            <span class="info-value code">{{ profileForm.id }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">角色</span>
            <span class="info-value">
              <a-tag color="arcoblue" size="small">{{ profileForm.roleText }}</a-tag>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">所属系统</span>
            <span class="info-value">{{ profileForm.systemName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">登录时间</span>
            <span class="info-value">{{ profileForm.lastLoginTime }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">账户状态</span>
            <span class="info-value">
              <a-tag :color="profileForm.enabled ? 'green' : 'red'" size="small">
                {{ profileForm.enabled ? '正常' : '已停用' }}
              </a-tag>
            </span>
          </div>
        </div>
      </a-card>

      <!-- 安全设置 -->
      <a-card class="info-card" :bordered="false">
        <div class="card-header">
          <span class="card-header-icon card-header-icon-green">
            <icon-lock />
          </span>
          <span class="card-header-title">安全设置</span>
        </div>

        <div class="info-list">
          <div class="info-row">
            <span class="info-label">账户密码</span>
            <span class="info-value masked">●●●●●●●●</span>
          </div>
          <div class="info-row">
            <span class="info-label">最后登录</span>
            <span class="info-value">{{ profileForm.lastLoginTime }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">双重验证</span>
            <span class="info-value">
              <a-tag :color="securitySettings.twoFactor ? 'green' : 'gray'" size="small">
                {{ securitySettings.twoFactor ? '已启用' : '未启用' }}
              </a-tag>
            </span>
          </div>
          <div class="info-row info-row-action">
            <a-link @click="showPasswordModal = true">
              <icon-edit /> 修改密码
            </a-link>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 修改密码弹窗 -->
    <a-modal
      v-model:visible="showPasswordModal"
      title="修改密码"
      :width="460"
      :ok-text="'确认修改'"
      @ok="handleChangePassword"
      @cancel="resetPasswordForm"
      unmount-on-close
    >
      <a-form :model="passwordForm" layout="vertical">
        <a-form-item label="新密码">
          <a-input-password v-model="passwordForm.next" placeholder="请输入新密码(至少 8 位)" />
        </a-form-item>
        <a-form-item label="确认新密码">
          <a-input-password v-model="passwordForm.confirm" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconUser,
  IconApps,
  IconLock,
  IconSafe,
  IconEdit,
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const showPasswordModal = ref(false)

const defaultProfile = () => ({
  avatar: userStore.avatar,
  id: userStore.userInfo?.id ?? 7,
  username: userStore.userInfo?.userName || 'admin',
  realName: '王春雷',
  email: userStore.userInfo?.email || 'wangchunlei@example.com',
  phone: '15711352632',
  roleText: userStore.userInfo?.role === 'admin' ? '管理员' : (userStore.userInfo?.role || '用户'),
  systemName: '央广聚合支付系统',
  group: '素材运营组',
  enabled: true,
  lastLoginTime: '2026/7/14 14:30:57',
})

const profileForm = reactive(defaultProfile())

const securitySettings = reactive({
  twoFactor: false,
})

const passwordForm = reactive({
  next: '',
  confirm: '',
})

const handleChangePassword = async () => {
  if (!passwordForm.next || passwordForm.next.length < 8) {
    Message.warning('新密码至少 8 位')
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    Message.warning('两次输入的新密码不一致')
    return
  }
  await new Promise((r) => setTimeout(r, 400))
  Message.success('密码已修改')
  showPasswordModal.value = false
  resetPasswordForm()
}

const resetPasswordForm = () => {
  passwordForm.next = ''
  passwordForm.confirm = ''
}
</script>

<style scoped lang="scss">
.personal-center-page {
  padding: 16px 24px 24px;

  .profile-header {
    position: relative;
    height: 160px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;

    .profile-header-bg {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, #5b6bf5 0%, #7c3aed 50%, #9333ea 100%),
        radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.18) 0%, transparent 35%),
        radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.12) 0%, transparent 35%);
      background-blend-mode: overlay;
    }

    .profile-header-content {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 32px;
      gap: 20px;
    }

    .profile-avatar-wrap {
      position: relative;
      flex-shrink: 0;

      .profile-avatar {
        border: 4px solid #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        background: #fff;
      }

      .avatar-status {
        position: absolute;
        right: 4px;
        bottom: 4px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00b42a;
        border: 3px solid #fff;
      }
    }

    .profile-info {
      flex: 1;
      min-width: 0;
      color: #fff;

      .profile-name {
        font-size: 22px;
        font-weight: 600;
        line-height: 1.3;
        margin-bottom: 12px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .profile-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.92);

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .meta-label {
          opacity: 0.85;
        }

        .meta-divider {
          width: 1px;
          height: 12px;
          background: rgba(255, 255, 255, 0.4);
        }
      }
    }

    .profile-actions {
      flex-shrink: 0;
      :deep(.arco-btn) {
        background: rgba(255, 255, 255, 0.95);
        border-color: transparent;
      }
    }
  }

  .profile-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .info-card {
    height: 100%;

    :deep(.arco-card-body) {
      padding-top: 4px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 16px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--color-neutral-3);

    .card-header-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      font-size: 15px;
    }

    .card-header-icon-blue {
      background: rgba(22, 93, 255, 0.1);
      color: rgb(22, 93, 255);
    }

    .card-header-icon-orange {
      background: rgba(255, 125, 0, 0.1);
      color: rgb(255, 125, 0);
    }

    .card-header-icon-green {
      background: rgba(0, 180, 42, 0.1);
      color: rgb(0, 180, 42);
    }

    .card-header-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }

  .info-list {
    display: flex;
    flex-direction: column;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px dashed var(--color-neutral-3);

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 13px;
      color: var(--color-text-3);
      flex-shrink: 0;
    }

    .info-value {
      font-size: 13px;
      color: var(--color-text-1);
      font-weight: 500;
      text-align: right;
      max-width: 65%;
      word-break: break-all;

      &.code {
        font-family: Monaco, Consolas, monospace;
      }

      &.masked {
        font-family: Monaco, Consolas, monospace;
        letter-spacing: 2px;
        color: var(--color-text-2);
      }
    }

    &.info-row-action {
      justify-content: flex-start;
      padding-top: 8px;
    }
  }
}

@media (max-width: 1100px) {
  .personal-center-page .profile-cards {
    grid-template-columns: 1fr;
  }
}
</style>