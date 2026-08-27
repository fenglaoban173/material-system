<template>
  <div class="video-generate-page">
    <div class="page-header">
      <h2>视频生成</h2>
      <a-button type="primary">
        <template #icon><icon-plus /></template>
        新建任务
      </a-button>
    </div>

    <div class="generate-form">
      <a-form :model="form" layout="vertical">
        <a-form-item label="视频主题">
          <a-input v-model="form.topic" placeholder="请输入视频生成主题" />
        </a-form-item>
        <a-form-item label="视频时长">
          <a-select v-model="form.duration" placeholder="请选择视频时长">
            <a-option value="15">15秒</a-option>
            <a-option value="30">30秒</a-option>
            <a-option value="60">60秒</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="视频风格">
          <a-select v-model="form.style" placeholder="请选择视频风格">
            <a-option value="promo">宣传</a-option>
            <a-option value="tutorial">教程</a-option>
            <a-option value="ad">广告</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleGenerate">生成视频</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="result-section">
      <h3>生成结果</h3>
      <div class="result-list">
        <div v-for="item in resultList" :key="item.id" class="result-item">
          <div class="video-thumbnail">
            <img :src="item.thumbnail" :alt="item.name" />
            <span class="video-duration">{{ item.duration }}</span>
          </div>
          <div class="video-info">
            <div class="video-name">{{ item.name }}</div>
            <div class="video-meta">{{ item.createTime }}</div>
          </div>
          <div class="video-actions">
            <a-button size="small">预览</a-button>
            <a-button size="small">下载</a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'

const form = reactive({
  topic: '',
  duration: '',
  style: '',
})

const resultList = ref([
  { id: 1, name: 'product_promo.mp4', duration: '30s', thumbnail: 'https://picsum.photos/200/120?random=10', createTime: '2024-01-15 10:30' },
  { id: 2, name: 'tutorial_video.mp4', duration: '60s', thumbnail: 'https://picsum.photos/200/120?random=11', createTime: '2024-01-14 14:20' },
])

const handleGenerate = () => {
  console.log('Generate video with:', form)
}
</script>

<style scoped lang="scss">
.video-generate-page {
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

    .result-list {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .result-item {
        background: white;
        border-radius: 8px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;

        .video-thumbnail {
          position: relative;
          width: 160px;
          height: 90px;
          border-radius: 8px;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .video-duration {
            position: absolute;
            bottom: 4px;
            right: 4px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 4px;
          }
        }

        .video-info {
          flex: 1;

          .video-name {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
          }

          .video-meta {
            font-size: 12px;
            color: #999;
          }
        }

        .video-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }
}
</style>