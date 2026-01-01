# AI仕訳 | Journal Entry App

智能账目管理与仕訳处理应用，基于 React + TypeScript 构建，支持 AI 智能识别和自动化仕訳。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

## ✨ 功能特点

### 📊 账目管理
- 账目录入、编辑、删除
- 批量操作（批量仕訳、批量删除）
- 多条件搜索筛选（发生日期、更新日期、状态、类型）
- 本地关键词搜索

### 🤖 AI 智能处理
- **AI 智能仕訳**：自动识别借贷科目
- **AI 图片识别**：拍照识别收据，自动填充表单
- 支持 OCR 裁剪优化

### 📈 报表中心
- **月度收支统计**：可视化图表展示月度收入/支出趋势
- **試算表**：汇总所有仕訳科目的借贷合计和余额
- **総勘定元帳**：按科目分类记录所有账目明细
- **仕訳帳**：完整的账本记录，按时间顺序排列

### 🔐 安全认证
- Firebase 邮箱/密码登录
- Google 账号一键登录
- "记住我"功能

### 📱 响应式设计
- 桌面端优化布局
- 移动端友好交互
- 支持 PWA 安装

## 🛠 技术栈

| 类型 | 技术 |
|------|------|
| **前端框架** | React 18 + TypeScript |
| **样式** | Tailwind CSS 4 |
| **路由** | React Router DOM |
| **图表** | Recharts |
| **认证** | Firebase Authentication |
| **后端** | n8n Workflow (Webhook API) |
| **部署** | Docker + Nginx |

## 🚀 快速开始

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/ai-journal-app.git
cd ai-journal-app

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 填入实际配置（见下方环境变量说明）

# 启动开发服务器
npm run dev
```

### Docker 部署

#### 使用预构建镜像（推荐）

```bash
# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/ai-journal-app:latest

# 使用 docker-compose
docker-compose up -d
```

#### 本地构建

```bash
# 构建镜像
docker build -t ai-journal-app .

# 运行容器
docker run -d -p 3000:80 \
  -e VITE_FIREBASE_API_KEY=your_key \
  -e VITE_FIREBASE_AUTH_DOMAIN=your_domain \
  -e VITE_FIREBASE_PROJECT_ID=your_project \
  -e VITE_FIREBASE_STORAGE_BUCKET=your_bucket \
  -e VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id \
  -e VITE_FIREBASE_APP_ID=your_app_id \
  -e VITE_N8N_BASE_URL=http://your-n8n:5678 \
  ai-journal-app
```

## ⚙️ 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | ✅ |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | ✅ |
| `VITE_N8N_BASE_URL` | n8n Webhook API 地址 | ✅ |

## 🌐 部署注意事项

### Firebase 配置

在 Firebase Console 的 **Authentication > Settings > Authorized domains** 中添加你的域名。

### 反向代理

应用监听容器内的 **80 端口**，可使用任何反向代理转发请求：
- Nginx Proxy Manager
- Traefik
- Caddy
- 等

### 自动构建

项目已配置 GitHub Actions，推送到 `main` 分支时自动构建 Docker 镜像并发布到 GHCR：
- 推送到 `main` → 生成 `latest` 和 `main` tag
- 推送版本 tag（如 `v1.0.0`）→ 生成 `1.0.0` 和 `1.0` tag

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件
