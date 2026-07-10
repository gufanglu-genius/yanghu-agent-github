# 🏯 阳湖智能体 — 武进非遗文旅 AI 数字向导

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)
[![DeepSeek](https://img.shields.io/badge/API-DeepSeek-536DFE.svg)](https://platform.deepseek.com)

> 让非遗从"被观看的遗产"变为"可体验的生活"，让文脉从"书斋里的学问"变为"可消费的场景"。

**阳湖智能体**是一个面向江苏武进非遗文旅场景的 AI 聊天应用。它承载清代阳湖文派五位文人的精神与智慧，通过 DeepSeek 大模型，为游客提供沉浸式的文化导览体验。

---

## ✨ 功能特性

| 特性 | 说明 |
|------|------|
| 🎭 **五位文人人格** | 南田先生（美学）、瓯北先生（历史）、子居先生（礼仪）、皋文先生（诗词）、伯元先生（美食）|
| 💬 **流式打字机效果** | AI 回复逐字呈现，带闪烁光标，可随时中止生成 |
| 🔑 **可视化 API 配置** | 首次打开自动弹出配置界面，Key 仅存本地浏览器 |
| 💾 **对话本地保存** | 所有对话自动保存到 localStorage，刷新不丢失 |
| 📱 **响应式设计** | 适配桌面端与移动端，中式简约美学 |
| 🎨 **Markdown 渲染** | AI 回复支持粗体、斜体、列表等富文本格式 |
| 🛑 **随时中止** | 生成中可点击停止按钮，已生成内容保留 |
| 🔄 **自动降级** | 流式请求失败时自动切换非流式 fallback |

## 🎬 界面预览

```
┌──────────────────────────────────────────────────┐
│  ┌──────────┐  ┌────────────────────────────────┐ │
│  │ 🏯 阳湖  │  │                                │ │
│  │ 智能体   │  │     ◉ 文 ◉                     │ │
│  │          │  │   阳 湖 文 枢                   │ │
│  │ 新对话   │  │                                │ │
│  │          │  │  南田·瓯北·子居·皋文·伯元      │ │
│  │ 对话1    │  │                                │ │
│  │ 对话2    │  │  "什么是乱针绣？"              │ │
│  │          │  │  "推荐一日游路线"              │ │
│  │ ⚙ 设置  │  │                                │ │
│  │          │  │  ┌─────────────────────────┐   │ │
│  └──────────┘  │  │ 向五位先生请教……    ■ ▶  │   │ │
│                │  └─────────────────────────┘   │ │
│                └────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 18
- **DeepSeek API Key** → [获取地址](https://platform.deepseek.com/api_keys)

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/your-username/yanghu-agent.git
cd yanghu-agent

# 2. 安装依赖
npm install

# 3. 启动服务
npm start

# 4. 打开浏览器
# http://localhost:3000
```

首次打开会自动弹出 API 配置界面，输入 DeepSeek Key 后即可开始对话。

### 环境变量（可选）

也可以创建 `.env` 文件配置 Key（优先级低于界面配置）：

```bash
cp .env.example .env
# 编辑 .env 填入 DEEPSEEK_API_KEY
```

## 📁 项目结构

```
yanghu-agent/
├── README.md
├── .gitignore
├── .env.example          # 环境变量模板
├── package.json
├── server.js             # Express 后端，SSE 流式代理
└── public/
    ├── index.html        # 主页面
    ├── style.css         # 样式（中式简约美学）
    └── app.js            # 前端逻辑（对话/存储/流式）
```

## 🧠 系统提示词

智能体内置完整的阳湖文派知识体系：

- **五位文人**：恽南田（没骨画）、赵翼（史学）、恽敬（阳湖文派）、张惠言（词学）、李伯元（《官场现形记》）
- **武进非遗**：乱针绣、常州梳篦、留青竹刻、金坛刻纸、常州吟诵、大麻糕等 80 余项
- **体验产品**："阳湖十二时辰"深度版 1888 元/三日、精选版 588 元/一日、碎片版 388 元/半日
- **六系产品**：破、真、融、寄、新、达
- **空间布局**：一轴三区多点

## 🔌 API 设计

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/chat/stream` | POST | 流式聊天（SSE），逐字推送 |
| `/api/chat` | POST | 非流式聊天（降级 fallback） |
| `/api/verify-key` | POST | 验证 DeepSeek API Key |
| `/api/health` | GET | 健康检查 |

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 运行时 | Node.js |
| 后端框架 | Express |
| AI 模型 | DeepSeek Chat API |
| 前端 | 原生 HTML/CSS/JS（零框架依赖） |
| 存储 | localStorage |
| 流式传输 | Server-Sent Events (SSE) |

## 📄 License

MIT © 2025

---

<p align="center">
  <i>破 · 真 · 融 · 寄 · 新 · 达</i>
  <br>
  <sub>AI 生成，仅供参考</sub>
</p>
