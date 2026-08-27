<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>
      <div class="error-actions">
        <a-button type="primary" size="large" @click="goBack">
          <template #icon><icon-arrow-left /></template>
          返回上一页
        </a-button>
        <a-button size="large" @click="goHome">
          返回首页
        </a-button>
      </div>
    </div>
    <div class="error-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IconArrowLeft } from '@arco-design/web-vue/es/icon'

const router = useRouter()

const goBack = () => router.back()
const goHome = () => router.push('/')
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
}

.error-content {
  text-align: center;
  z-index: 1;
  padding: 40px;
}

.error-code {
  font-size: 160px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary-6), var(--color-primary-8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 24px;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-neutral-10);
  margin-bottom: 12px;
}

.error-desc {
  font-size: 16px;
  color: var(--color-neutral-7);
  margin-bottom: 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.error-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .bg-shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.4;
  }

  .shape-1 {
    width: 500px;
    height: 500px;
    background: var(--color-primary-4);
    top: -200px;
    right: -100px;
  }

  .shape-2 {
    width: 400px;
    height: 400px;
    background: var(--color-success-6);
    bottom: -150px;
    left: -100px;
  }
}
</style>
