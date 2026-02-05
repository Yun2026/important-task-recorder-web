# 📋 重要事务记录本 Web

基于 Vue 3 + TypeScript + Vite 的现代化任务管理 Web 应用，支持任务管理、专注模式、番茄钟、数据统计等功能。

## 🌐 在线访问

- **前端地址**: http://106.52.126.158:8080/

## ✨ 功能特性

- ✅ **任务管理** - 创建、编辑、删除任务，支持优先级设置和分类
- 🍅 **专注模式** - 番茄钟计时器，帮助提高工作效率
- 📊 **数据统计** - 任务完成统计、时间分布分析
- 🔐 **用户系统** - 登录/注册功能，本地存储用户数据
- 💾 **数据持久化** - 本地存储 + CloudBase 云存储
- 📱 **响应式设计** - 适配桌面和移动端

## 🛠️ 技术栈

### 前端

| 技术 | 说明 |
|------|------|
| **Vue 3** | 渐进式 JavaScript 框架 |
| **TypeScript** | 类型安全的 JavaScript |
| **Vite** | 极速构建工具 |
| **Tailwind CSS** | 实用优先的 CSS 框架 |
| **TDesign Vue Next** | 腾讯开源 UI 组件库 |
| **Vue Router** | 前端路由管理 |

### 后端 & 部署

| 技术 | 说明 |
|------|------|
| **CloudBase** | 腾讯云开发后端服务 |
| **Docker** | 容器化部署 |
| **Nginx** | 前端静态文件服务 |
| **Lighthouse** | 腾讯云轻量应用服务器 |

## 📁 项目结构

```
📁 重要事务记录本Web/
├── 📁 src/                    # 源代码
│   ├── 📁 components/         # Vue 组件
│   │   ├── AuthModal.vue     # 登录/注册弹窗
│   │   ├── TaskModal.vue     # 任务编辑弹窗
│   │   ├── TaskView.vue      # 任务列表视图
│   │   ├── FocusMode.vue     # 专注模式/番茄钟
│   │   └── HelpModal.vue     # 帮助弹窗
│   ├── 📁 utils/             # 工具函数
│   │   ├── api.ts           # API 接口
│   │   └── cloudStorage.ts  # 云存储操作
│   ├── 📄 App.vue           # 主应用组件
│   └── 📄 main.ts           # 入口文件
├── 📁 dist/                  # 构建输出
├── 📁 cloudfunctions/        # 云函数
├── 📄 docker-compose.yml     # Docker 编排配置
├── 📄 Dockerfile            # 前端容器配置
└── 📄 package.json          # 项目依赖
```

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 停止服务
docker-compose down
```

## 📦 部署配置

### 端口映射

| 服务 | 容器端口 | 主机端口 |
|------|---------|---------|
| 前端 (Nginx) | 80 | 8080 |
| 后端 (Node.js) | 3001 | 3001 |

### 环境变量

可在 `docker-compose.yml` 中配置环境变量。

## 📊 数据存储

- **本地存储**: 使用 localStorage 存储用户数据和任务
- **云存储**: 支持 CloudBase 云存储备份（可选）

## 🔧 开发工具

- **VS Code** - 推荐编辑器
- **Vue DevTools** - Vue 调试工具
- **TypeScript** - 类型检查

## 📄 许可证

MIT License

## 🙏 致谢

本项目基于 [CloudBase AI ToolKit](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit) 开发，感谢腾讯云开发团队提供的支持。
