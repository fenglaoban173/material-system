<template>
  <div class="quality-page">
    <div class="page-header">
      <h2>质量分析</h2>
      <p class="subtitle">AI智能分析素材质量，提供优化建议</p>
    </div>

    <div class="analysis-workspace">
      <div class="upload-area">
        <a-upload
          drag
          action="/"
          :auto-upload="false"
          :limit="1"
          @change="handleUpload"
        >
          <template #upload-button>
            <div class="upload-trigger">
              <icon-cloud-upload style="font-size: 48px; color: var(--color-primary-6);" />
              <h3>拖拽素材到此处或点击上传</h3>
              <p>支持视频、图片格式，单个文件最大 100MB</p>
            </div>
          </template>
        </a-upload>
      </div>

      <div v-if="analysisResult" class="analysis-result">
        <a-row :gutter="24">
          <a-col :span="8">
            <div class="preview-panel">
              <img :src="analysisResult.thumbnail" class="preview-image" />
              <div class="file-info">
                <h4>{{ analysisResult.name }}</h4>
                <p>{{ analysisResult.format }} · {{ formatSize(analysisResult.size) }}</p>
              </div>
            </div>
          </a-col>
          <a-col :span="16">
            <div class="quality-panel">
              <div class="quality-score">
                <div class="score-circle" :style="{ '--score-color': getScoreColor(analysisResult.score) }">
                  <span class="score-value">{{ analysisResult.score }}</span>
                  <span class="score-label">综合评分</span>
                </div>
              </div>

              <div class="quality-details">
                <h4>质量维度</h4>
                <div class="dimension-list">
                  <div class="dimension-item" v-for="dim in analysisResult.dimensions" :key="dim.name">
                    <div class="dimension-header">
                      <span class="name">{{ dim.name }}</span>
                      <span class="score" :style="{ color: getScoreColor(dim.score) }">{{ dim.score }}分</span>
                    </div>
                    <a-progress :percent="dim.score" :color="getScoreColor(dim.score)" :show-text="false" />
                    <p class="suggestion" v-if="dim.suggestion">{{ dim.suggestion }}</p>
                  </div>
                </div>
              </div>

              <div class="quality-tags">
                <h4>智能标签</h4>
                <div class="tag-list">
                  <a-tag v-for="tag in analysisResult.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCloudUpload } from '@arco-design/web-vue/es/icon'

const analysisResult = ref<any>(null)

const formatSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#faad14'
  return '#f5222d'
}

const handleUpload = () => {
  // Mock analysis result
  setTimeout(() => {
    analysisResult.value = {
      name: 'product_demo.mp4',
      format: 'MP4',
      size: 52428800,
      thumbnail: 'https://picsum.photos/400/225?random=1',
      score: 85,
      dimensions: [
        { name: '清晰度', score: 90, suggestion: null },
        { name: '亮度', score: 75, suggestion: '建议稍微提高亮度' },
        { name: '对比度', score: 85, suggestion: null },
        { name: '构图', score: 88, suggestion: null },
      ],
      tags: ['产品展示', '科技感', '蓝色调', '动态', '专业'],
    }
    Message.success('分析完成')
  }, 2000)
}
</script>

<style scoped lang="scss">
.quality-page {
  .page-header {
    margin-bottom: 24px;

    h2 {
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--color-neutral-7);
      margin: 0;
    }
  }

  .analysis-workspace {
    .upload-area {
      margin-bottom: 24px;

      :deep(.arco-upload-wrapper) {
        width: 100%;
      }

      :deep(.arco-upload-drag) {
        height: 300px;
        background: var(--color-neutral-1);
        border: 2px dashed var(--color-neutral-4);
        border-radius: 12px;
      }

      .upload-trigger {
        text-align: center;
        padding: 60px 0;

        h3 {
          margin: 16px 0 8px;
          font-weight: 500;
        }

        p {
          color: var(--color-neutral-6);
        }
      }
    }

    .analysis-result {
      background: var(--color-neutral-1);
      border-radius: 12px;
      padding: 24px;

      .preview-panel {
        .preview-image {
          width: 100%;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .file-info {
          h4 {
            margin: 0 0 4px;
          }

          p {
            margin: 0;
            color: var(--color-neutral-6);
            font-size: 13px;
          }
        }
      }

      .quality-panel {
        .quality-score {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;

          .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 8px solid var(--score-color);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            .score-value {
              font-size: 36px;
              font-weight: 700;
              color: var(--score-color);
            }

            .score-label {
              font-size: 14px;
              color: var(--color-neutral-6);
            }
          }
        }

        .quality-details {
          margin-bottom: 32px;

          h4 {
            margin-bottom: 16px;
          }

          .dimension-list {
            .dimension-item {
              margin-bottom: 16px;

              .dimension-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;

                .name {
                  font-weight: 500;
                }

                .score {
                  font-weight: 600;
                }
              }

              .suggestion {
                margin: 8px 0 0;
                font-size: 13px;
                color: var(--color-neutral-6);
              }
            }
          }
        }

        .quality-tags {
          h4 {
            margin-bottom: 12px;
          }

          .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
        }
      }
    }
  }
}
</style>
