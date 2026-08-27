<template>
  <div class="image-generate-page">
    <div class="page-header">
      <h2>图片生成</h2>
      <a-button type="primary">
        <template #icon><icon-plus /></template>
        新建任务
      </a-button>
    </div>

    <div class="generate-form">
      <a-form :model="form" layout="vertical">
        <a-form-item label="图片主题">
          <a-input v-model="form.topic" placeholder="请输入图片生成主题" />
        </a-form-item>
        <a-form-item label="图片风格">
          <a-select v-model="form.style" placeholder="请选择图片风格">
            <a-option value="realistic">写实</a-option>
            <a-option value="cartoon">卡通</a-option>
            <a-option value="abstract">抽象</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="图片尺寸">
          <a-select v-model="form.size" placeholder="请选择图片尺寸">
            <a-option value="1920x1080">1920x1080</a-option>
            <a-option value="1080x1080">1080x1080</a-option>
            <a-option value="720x1280">720x1280</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleGenerate">生成图片</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="result-section">
      <h3>生成结果</h3>
      <div class="result-grid">
        <div v-for="i in 4" :key="i" class="result-card">
          <img :src="'https://picsum.photos/300/200?random=' + i" alt="Generated image" />
          <div class="result-actions">
            <a-button size="small">下载</a-button>
            <a-button size="small">应用到素材库</a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'

const form = reactive({
  topic: '',
  style: '',
  size: '',
})

const handleGenerate = () => {
  console.log('Generate image with:', form)
}
</script>

<style scoped lang="scss">
.image-generate-page {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .generate-form {
    background: white;
    padding: 24px;
    border-radius: 8px;
    margin-bottom: 24px;
    max-width: 600px;
  }

  .result-section {
    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;

      .result-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;

        img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .result-actions {
          padding: 12px;
          display: flex;
          gap: 8px;
        }
      }
    }
  }
}
</style>