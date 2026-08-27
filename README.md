# 巨量引擎素材库管理系统

基于 **Arco Pro + Vue 3 + TypeScript** 的巨量引擎素材库管理前端实现，遵循 SaaS 通用设计模式。

## 项目特性

### 技术栈
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Arco Design Vue** - 字节跳动出品的企业级 UI 组件库
- **Pinia** - Vue 官方推荐的状态管理方案
- **Vue Router 4** - 官方路由管理器
- **ECharts** - 数据可视化图表库
- **Vite** - 下一代前端构建工具

### 功能模块

| 模块 | 功能描述 |
|------|----------|
| **数据概览** | 素材统计、上传趋势、存储概览、快捷操作 |
| **素材管理** | 素材列表(网格/列表视图)、批量操作、详情预览 |
| **素材上传** | 拖拽上传、URL上传、批量上传、进度追踪 |
| **创意管理** | 创意创建、素材关联、效果数据展示 |
| **素材预审** | 批量预审、结果展示、合规性检测 |
| **质量分析** | AI质量评分、维度分析、智能标签 |
| **即创AIGC** | 视频剪辑、图转视频、素材推送 |
| **素材清理** | 条件筛选、批量清理、存储优化 |
| **素材共享** | 跨账户共享、权限管理、有效期设置 |
| **系统设置** | 个人资料、API配置、通知设置 |

### 设计特点

#### SaaS 通用设计模式
- **侧边栏导航** - 可折叠的层级菜单结构
- **面包屑导航** - 清晰的页面层级路径
- **数据表格** - 支持排序、筛选、分页、批量操作
- **卡片式布局** - 信息模块化展示
- **响应式设计** - 适配多种屏幕尺寸

#### 视觉设计
- **深海蓝主题** - 专业、稳重的配色方案
- **圆角设计** - 现代感的界面元素
- **阴影层次** - 清晰的空间层级关系
- **微交互动效** - 流畅的用户体验

## 项目结构

```
arco-material-system/
├── src/
│   ├── api/              # API 接口定义
│   │   └── material.ts   # 素材相关接口
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── layouts/          # 布局组件
│   │   ├── MainLayout.vue           # 主布局
│   │   └── components/              # 布局子组件
│   │       ├── BreadcrumbNav.vue
│   │       └── NotificationPanel.vue
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── stores/           # Pinia 状态管理
│   │   ├── user.ts       # 用户状态
│   │   └── material.ts   # 素材状态
│   ├── styles/           # 样式文件
│   │   ├── variables.scss # SCSS 变量
│   │   └── global.scss   # 全局样式
│   ├── types/            # TypeScript 类型
│   │   └── material.ts   # 素材类型定义
│   ├── utils/            # 工具函数
│   │   └── request.ts    # HTTP 请求封装
│   ├── views/            # 页面视图
│   │   ├── login/        # 登录页
│   │   ├── dashboard/    # 数据概览
│   │   ├── material/     # 素材管理
│   │   │   ├── list/     # 素材列表
│   │   │   └── upload/   # 素材上传
│   │   ├── creative/     # 创意管理
│   │   ├── audit/        # 素材分析
│   │   │   ├── preaudit/ # 素材预审
│   │   │   └── quality/  # 质量分析
│   │   ├── aigc/         # 即创AIGC
│   │   ├── cleanup/      # 素材清理
│   │   ├── share/        # 素材共享
│   │   ├── settings/     # 系统设置
│   │   └── error/        # 错误页面
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 快速开始

### 安装依赖
```bash
cd arco-material-system
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## API 接口

项目基于巨量引擎开放平台 API 设计，主要接口包括：

### 素材上传
- `POST /open_api/2/file/video/ad/` - 上传视频
- `POST /open_api/2/file/image/ad/` - 上传图片
- `POST /open_api/2/file/audio/ad/` - 上传音频

### 素材管理
- `GET /open_api/2/file/material/list/` - 获取素材列表
- `GET /open_api/2/file/material/detail/` - 获取素材详情
- `POST /open_api/2/file/video/ad/delete/` - 删除视频
- `POST /open_api/2/file/image/ad/delete/` - 删除图片

### 素材分析
- `POST /open_api/2/file/preaudit/submit/` - 提交预审
- `GET /open_api/2/file/preaudit/get/` - 获取预审结果
- `POST /open_api/2/file/quality/submit/` - 提交质量分析

### 即创AIGC
- `POST /open_api/v3.0/aic/element/upload/` - 上传原料
- `POST /open_api/v3.0/aic/video_mixcut/create/` - 视频剪辑
- `POST /open_api/v3.0/aic/material/push/` - 推送素材

## 核心功能实现

### 1. 批量上传
- 支持拖拽上传和点击选择
- 文件类型自动识别
- 上传进度实时显示
- 断点续传支持

### 2. 素材管理
- 网格/列表双视图切换
- 批量选择和操作
- 高级筛选和搜索
- 素材预览和详情

### 3. 智能预审
- 批量提交预审任务
- 异步轮询结果
- 拒绝原因展示
- 优化建议提示

### 4. 即创AIGC
- 可视化视频剪辑
- 图转视频生成
- 素材跨账号推送
- 原料库管理

## 设计规范

### 颜色系统
```scss
// 主色调
$color-primary-6: #1677ff;

// 功能色
$color-success-6: #52c41a;
$color-warning-6: #faad14;
$color-error-6: #f5222d;

// 素材类型色
$color-video: #722ed1;
$color-image: #13c2c2;
$color-audio: #fa8c16;
$color-aigc: #eb2f96;
```

### 间距系统
```scss
$spacing-1: 4px;
$spacing-2: 8px;
$spacing-3: 12px;
$spacing-4: 16px;
$spacing-5: 20px;
$spacing-6: 24px;
```

### 圆角系统
```scss
$border-radius-sm: 4px;
$border-radius-md: 8px;
$border-radius-lg: 12px;
$border-radius-xl: 16px;
```

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

MIT
