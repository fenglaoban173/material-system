<template>
  <div class="aigc-page">
    <div class="page-header">
      <h2>即创AIGC</h2>
      <p class="subtitle">智能创作，提升素材生产效率</p>
    </div>

    <a-row :gutter="24">
      <!-- Left: Tools -->
      <a-col :span="6">
        <div class="tool-menu">
          <div
            v-for="tool in tools"
            :key="tool.key"
            class="tool-item"
            :class="{ active: activeTool === tool.key }"
            @click="activeTool = tool.key"
          >
            <div class="tool-icon" :style="{ background: tool.color }">
              <component :is="tool.icon" />
            </div>
            <div class="tool-info">
              <h4>{{ tool.name }}</h4>
              <p>{{ tool.desc }}</p>
            </div>
          </div>
        </div>
      </a-col>

      <!-- Right: Workspace -->
      <a-col :span="18">
        <div class="workspace">
          <!-- Video Mixcut -->
          <template v-if="activeTool === 'mixcut'">
            <div class="workspace-header">
              <h3>视频剪辑</h3>
              <a-button type="primary" :loading="processing" @click="startMixcut">
                开始剪辑
              </a-button>
            </div>
            <div class="workspace-body">
              <div class="timeline-editor">
                <div class="timeline-tracks">
                  <div class="track" v-for="(track, index) in tracks" :key="index">
                    <div class="track-label">轨道 {{ index + 1 }}</div>
                    <div class="track-content">
                      <div
                        v-for="clip in track.clips"
                        :key="clip.id"
                        class="clip"
                        :style="{ width: clip.duration * 10 + 'px' }"
                      >
                        <img :src="clip.thumbnail" />
                        <span class="clip-name">{{ clip.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="element-library">
                <h4>原料库</h4>
                <div class="element-grid">
                  <div
                    v-for="element in elements"
                    :key="element.id"
                    class="element-item"
                    draggable
                    @dragstart="handleDragStart($event, element)"
                  >
                    <img :src="element.thumbnail" />
                    <span>{{ element.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Image to Video -->
          <template v-if="activeTool === 'img2video'">
            <div class="workspace-header">
              <h3>图转视频</h3>
              <a-button type="primary" :loading="processing" @click="startImg2Video">
                生成视频
              </a-button>
            </div>
            <div class="workspace-body">
              <a-row :gutter="24">
                <a-col :span="12">
                  <div class="upload-area">
                    <a-upload
                      drag
                      action="/"
                      :auto-upload="false"
                      @change="handleImageUpload"
                    >
                      <template #upload-button>
                        <div class="upload-trigger">
                          <icon-plus style="font-size: 32px; color: var(--color-neutral-5);" />
                          <p>拖拽图片到此处或点击上传</p>
                        </div>
                      </template>
                    </a-upload>
                  </div>
                </a-col>
                <a-col :span="12">
                  <div class="settings-panel">
                    <h4>生成设置</h4>
                    <a-form :model="img2videoSettings" layout="vertical">
                      <a-form-item label="视频时长">
                        <a-slider v-model="img2videoSettings.duration" :min="3" :max="15" :step="1" show-ticks />
                      </a-form-item>
                      <a-form-item label="运动幅度">
                        <a-radio-group v-model="img2videoSettings.motion">
                          <a-radio value="low">轻微</a-radio>
                          <a-radio value="medium">适中</a-radio>
                          <a-radio value="high">强烈</a-radio>
                        </a-radio-group>
                      </a-form-item>
                      <a-form-item label="分辨率">
                        <a-select v-model="img2videoSettings.resolution">
                          <a-option value="720p">720p</a-option>
                          <a-option value="1080p">1080p</a-option>
                        </a-select>
                      </a-form-item>
                    </a-form>
                  </div>
                </a-col>
              </a-row>
            </div>
          </template>

          <!-- Material Push -->
          <template v-if="activeTool === 'push'">
            <div class="workspace-header">
              <h3>素材推送</h3>
              <a-button type="primary" @click="pushMaterials">推送到投放账号</a-button>
            </div>
            <div class="workspace-body">
              <a-transfer
                v-model="selectedMaterials"
                :data="transferData"
                :title="['AIGC素材', '目标账号']"
              />
            </div>
          </template>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconScissor, IconVideoCamera, IconPushpin } from '@arco-design/web-vue/es/icon'

const activeTool = ref('mixcut')
const processing = ref(false)

const tools = [
  { key: 'mixcut', name: '视频剪辑', desc: '智能拼接多个视频片段', icon: IconScissor, color: '#722ed1' },
  { key: 'img2video', name: '图转视频', desc: '静态图片生成动态视频', icon: IconVideoCamera, color: '#13c2c2' },
  { key: 'push', name: '素材推送', desc: '推送到投放账号', icon: IconPushpin, color: '#fa8c16' },
]

const tracks = ref([
  {
    clips: [
      { id: 1, name: '片段1', duration: 5, thumbnail: 'https://picsum.photos/100/60?random=1' },
      { id: 2, name: '片段2', duration: 3, thumbnail: 'https://picsum.photos/100/60?random=2' },
    ],
  },
  { clips: [] },
  { clips: [] },
])

const elements = ref([
  { id: 1, name: '背景1', thumbnail: 'https://picsum.photos/120/68?random=1' },
  { id: 2, name: '产品图', thumbnail: 'https://picsum.photos/120/68?random=2' },
  { id: 3, name: 'Logo', thumbnail: 'https://picsum.photos/120/68?random=3' },
  { id: 4, name: '文字', thumbnail: 'https://picsum.photos/120/68?random=4' },
])

const img2videoSettings = reactive({
  duration: 5,
  motion: 'medium',
  resolution: '1080p',
})

const selectedMaterials = ref([])
const transferData = ref([
  { value: 1, label: 'AI生成素材-1' },
  { value: 2, label: 'AI生成素材-2' },
  { value: 3, label: 'AI生成素材-3' },
])

const handleDragStart = (e: DragEvent, element: any) => {
  e.dataTransfer?.setData('application/json', JSON.stringify(element))
}

const handleImageUpload = () => {
  Message.success('图片上传成功')
}

const startMixcut = async () => {
  processing.value = true
  await new Promise(resolve => setTimeout(resolve, 3000))
  processing.value = false
  Message.success('视频剪辑完成')
}

const startImg2Video = async () => {
  processing.value = true
  await new Promise(resolve => setTimeout(resolve, 5000))
  processing.value = false
  Message.success('视频生成完成')
}

const pushMaterials = () => {
  Message.success(`成功推送 ${selectedMaterials.value.length} 个素材`)
}
</script>

<style scoped lang="scss">
.aigc-page {
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

  .tool-menu {
    background: var(--color-neutral-1);
    border-radius: 12px;
    padding: 16px;

    .tool-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 8px;

      &:hover,
      &.active {
        background: var(--color-primary-1);
      }

      .tool-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
      }

      .tool-info {
        h4 {
          margin: 0 0 4px;
          font-size: 16px;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: var(--color-neutral-6);
        }
      }
    }
  }

  .workspace {
    background: var(--color-neutral-1);
    border-radius: 12px;
    min-height: 600px;

    .workspace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-neutral-3);

      h3 {
        margin: 0;
      }
    }

    .workspace-body {
      padding: 24px;
    }
  }

  .timeline-editor {
    background: var(--color-neutral-2);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;

    .timeline-tracks {
      .track {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .track-label {
          width: 80px;
          font-size: 13px;
          color: var(--color-neutral-7);
        }

        .track-content {
          flex: 1;
          height: 60px;
          background: var(--color-neutral-3);
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 8px;
          gap: 8px;
          overflow-x: auto;

          .clip {
            height: 44px;
            background: var(--color-primary-6);
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 12px;
            color: white;
            white-space: nowrap;

            img {
              width: 32px;
              height: 32px;
              border-radius: 2px;
              object-fit: cover;
            }
          }
        }
      }
    }
  }

  .element-library {
    h4 {
      margin-bottom: 12px;
    }

    .element-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .element-item {
        aspect-ratio: 16/9;
        border-radius: 8px;
        overflow: hidden;
        cursor: grab;
        position: relative;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        span {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          font-size: 12px;
        }
      }
    }
  }

  .upload-area {
    :deep(.arco-upload-wrapper) {
      width: 100%;
    }

    :deep(.arco-upload-drag) {
      height: 300px;
    }

    .upload-trigger {
      text-align: center;
      padding: 60px 0;

      p {
        margin-top: 16px;
        color: var(--color-neutral-6);
      }
    }
  }

  .settings-panel {
    h4 {
      margin-bottom: 16px;
    }
  }
}
</style>
