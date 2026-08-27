# PRD 文档目录

本目录存放**巨量引擎素材库管理系统**的产品需求文档(PRD)及配套图表。

## 文档清单

| 文件 | 说明 |
|---|---|
| [PRD.md](PRD.md) | **主文档**,覆盖产品概述、用户角色、整体架构、核心业务流程、12 个模块详解、权限矩阵、版本规划 |
| [数据指标与计算公式.md](数据指标与计算公式.md) | 配套附录,详细列出"数据概览"页面所有字段的计算公式、数据来源、后端接口契约 |
| [diagrams/](diagrams/) | 流程图与思维导图目录 |

## 图表清单 (diagrams/)

每张图提供 **SVG(矢量主版本)** + **PNG(位图兼容版本)** 两种格式。

| 主题 | SVG(推荐) | PNG |
|---|---|---|
| 整体功能架构(XMind) | [xmind-overview.svg](diagrams/xmind-overview.svg) | [xmind-overview.png](diagrams/xmind-overview.png) |
| 需求发布流程 | [flow-requirement-publish.svg](diagrams/flow-requirement-publish.svg) | [flow-requirement-publish.png](diagrams/flow-requirement-publish.png) |
| 素材上传+前测+重做流程 | [flow-upload-pretest-redo.svg](diagrams/flow-upload-pretest-redo.svg) | [flow-upload-pretest-redo.png](diagrams/flow-upload-pretest-redo.png) |

## 图表设计说明

### 视觉规范
- **配色**:主色 #1677ff(蓝)/ #722ed1(紫)/ #52c41a(绿)/ #fa8c16(橙)/ #f5222d(红)
- **字体**:PingFang SC · Microsoft YaHei · Hiragino Sans GB
- **节点**:圆角矩形(12-16px)+ 渐变填充 + 阴影
- **流程起止**:胶囊形 + 紫色渐变
- **判断节点**:菱形 + 黄/红渐变(关键判断用红色)
- **角色泳道**:左侧虚线框,垂直贯穿流程
- **重做循环**:红色虚线 loop,回到上游节点
- **箭头标记**:svg `<marker>` 元素

### 编号规则
所有节点采用 ①②③... 编号系统,方便在 PRD 文字中引用。

### PRD 主文档中还附带 Mermaid 源码
在每张流程图下方都有 Mermaid 代码块,可在任何 Markdown 编辑器实时渲染。

## 渲染建议

| 环境 | 推荐格式 |
|---|---|
| VS Code / Typora / MarkText | SVG(矢量缩放无损) |
| GitHub / GitLab | SVG 或 PNG 均可 |
| Word / WPS / 邮件 | PNG |
| 在线文档 / Confluence / Notion | PNG |

## 修订记录

| 版本 | 日期 | 内容 |
|---|---|---|
| v1.0 | 2026-06-15 | 初版发布 |
| v1.1 | 2026-06-15 | 用 SVG 重做图表,中文文字清晰;优化 UI(渐变/阴影/泳道/编号) |