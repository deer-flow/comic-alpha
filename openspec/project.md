# Project Context

## Purpose
Comic Panel Generator 是一个基于 AI 的漫画分镜脚本生成工具,支持多页漫画生成和图像导出。该项目旨在帮助创作者快速生成专业的漫画分镜脚本,并通过 AI 图像生成将脚本转换为完整的漫画作品。

核心功能:
- AI 驱动的漫画脚本生成(支持多种风格:哆啦A梦、美式、水彩、迪士尼、吉卜力、皮克斯、少年漫画)
- 多页漫画管理与导航
- 实时脚本编辑与预览
- 高质量图像生成(基于 Google Gemini API)
- 参考图像系统(确保角色一致性)
- 社交媒体内容生成(小红书/Twitter)
- 封面生成功能
- 会话管理(支持多个创作会话)

## Tech Stack

### Backend
- **Python 3.12+**: 主要编程语言
- **Flask 3.0.0**: Web 框架
- **Flask-CORS 4.0.0**: 跨域资源共享
- **Google GenAI 1.54.0**: Google Gemini API 集成(核心图像生成)
- **LangChain-OpenAI 1.1.6+**: OpenAI API 集成(可选,用于脚本生成)
- **Pydantic**: 数据验证和结构化输出
- **Pillow 12.0.0**: 图像处理
- **python-dotenv 1.0.0**: 环境变量管理
- **httpx 0.28.1** & **requests 2.31.0**: HTTP 客户端

### Frontend
- **Vanilla JavaScript (ES6+)**: 模块化设计,无框架依赖
- **HTML5 + CSS3**: 响应式界面
- **html2canvas**: 图像导出功能
- **LocalStorage**: 客户端数据持久化

### 开发工具
- **uv**: 快速 Python 依赖管理工具
- **pyproject.toml**: Python 项目配置

## Project Conventions

### Code Style

#### Backend (Python)
- 遵循 PEP 8 风格指南
- 使用 4 空格缩进
- 命名规范:
  - 模块和文件名: `snake_case` (例如: `comic_service.py`)
  - 类名: `PascalCase` (例如: `ComicService`)
  - 函数和变量: `snake_case` (例如: `generate_comic_script`)
  - 常量: `UPPER_SNAKE_CASE` (例如: `MODEL_ID`)
- Docstring 格式: Google 风格
- 类型提示: 使用 Python 3.10+ 的类型注解 (例如: `Optional[str]`, `List[Dict]`)

#### Frontend (JavaScript)
- 使用 ES6+ 特性
- 命名规范:
  - 类名: `PascalCase` (例如: `UIController`, `PageManager`)
  - 函数和变量: `camelCase` (例如: `generateWithAI`, `currentPageIndex`)
  - 常量: `UPPER_SNAKE_CASE` (例如: `MODEL_ID`)
  - CSS 类名: `kebab-case` (例如: `comic-page`, `download-btn`)
- 文档注释: JSDoc 风格
- 模块化: 每个功能模块一个独立文件

### Architecture Patterns

#### 整体架构
- **前后端分离**: 前端为静态 HTML/JS/CSS,后端为 RESTful API 服务
- **MVC 模式** (后端):
  - `controllers/`: 处理 HTTP 请求和响应
  - `services/`: 业务逻辑层
  - Flask Blueprint: 模块化路由管理

#### 后端架构
- **Controller-Service 分层**:
  - Controllers (`controllers/`): 处理请求验证、参数提取、响应格式化
  - Services (`services/`): 核心业务逻辑、AI API 调用、数据处理
- **Blueprint 路由组织**:
  - `comic_bp`: 漫画脚本生成相关 API
  - `image_bp`: 图像生成相关 API
  - `social_bp`: 社交媒体内容生成 API
- **统一错误处理**: JSON 格式错误响应
- **CORS 支持**: 允许前端跨域请求

#### 前端架构
- **模块化设计**: 每个功能模块独立封装
  - `config.js`: 配置管理 (API Key, Base URL, Model)
  - `api.js`: API 调用封装
  - `renderer.js`: 漫画渲染引擎
  - `pageManager.js`: 多页管理
  - `sessionManager.js`: 会话管理
  - `exporter.js`: 图像导出
  - `i18n.js`: 国际化 (中文/英文/日文)
  - `theme.js`: 主题管理 (明暗模式)
  - `app.js`: 主控制器,协调所有模块
- **数据持久化**: LocalStorage 存储用户配置、会话数据、生成的图像
- **状态管理**: 集中在 UIController 中管理应用状态

### Testing Strategy
- **当前状态**: 项目尚未包含自动化测试
- **推荐测试方法**:
  - Backend: pytest + Flask test client
  - API 端到端测试: 测试所有 API 端点的请求/响应
  - 服务层单元测试: 测试业务逻辑和数据验证
  - Frontend: 手动测试 + 可考虑添加 Jest/Vitest

### Git Workflow
- **分支策略**: 基于功能分支的工作流
- **主分支**: `main` (保持稳定可部署状态)
- **提交规范**: 
  - 清晰的提交信息,描述变更内容
  - 建议使用常规提交格式 (Conventional Commits)
  - 例如: `feat: add cover generation feature`, `fix: resolve image export issue`

## Domain Context

### 漫画生成领域知识
- **分镜脚本结构**:
  - Page (页): 包含标题和多行分镜
  - Row (行): 包含高度和多个分镜格
  - Panel (分镜格): 包含描述文字和背景颜色
- **漫画风格**: 
  - 支持多种艺术风格(哆啦A梦、美式、迪士尼、吉卜力、皮克斯、水彩、少年漫画)
  - 每种风格有特定的视觉特征和叙事方式
- **参考图像系统**:
  - 用户上传的参考图像用于保持角色一致性
  - 之前生成的页面自动作为后续页面的参考
  - 封面生成使用所有故事页面作为参考
- **社交媒体内容生成**:
  - 根据语言自动选择平台(中文→小红书,英文→Twitter)
  - 生成标题、正文内容和标签

### AI 模型集成
- **Google Gemini API**:
  - 主要用于图像生成 (`gemini-3-pro-image-preview`)
  - 支持结构化输出和 JSON Schema
  - 支持思维链推理 (ThinkingConfig)
- **OpenAI API** (可选):
  - 用于脚本生成
  - 支持自定义 Base URL 和模型

## Important Constraints

### 技术限制
- **图像生成**:
  - 依赖 Google API Key (必需)
  - 生成超时时间: 180 秒
  - 图片尺寸: 2K,宽高比 9:16
  - 支持最多 3 次重试
- **脚本生成**:
  - 页数限制: 1-10 页
  - 每页行数: 1-5 行(推荐 4 行)
  - 每行分镜数: 1-2 个
- **浏览器兼容性**:
  - 需要支持 ES6+ 的现代浏览器
  - LocalStorage 必须可用
- **CORS 配置**:
  - 前端和后端必须配置正确的 CORS 策略
  - 默认端口: 后端 5003,前端 8000

### 业务规则
- **API Key 管理**:
  - Google API Key 是必需的(核心功能)
  - OpenAI API Key 是可选的(增强脚本生成)
  - 敏感信息不应提交到版本控制系统
- **会话管理**:
  - 所有会话数据存储在客户端 LocalStorage
  - 无服务器端会话持久化
- **图像存储**:
  - 生成的图像存储在 `backend/static/images/`
  - 使用 UUID 作为文件名
  - 静态文件通过 Flask 提供服务

## External Dependencies

### 必需的外部 API
1. **Google Gemini API** (核心依赖)
   - 用途: AI 图像生成,脚本生成(备选)
   - 模型: `gemini-3-pro-image-preview`, `gemini-3-flash-preview`
   - 配置: `GOOGLE_API_KEY` 环境变量或前端配置
   - 文档: https://ai.google.dev/

2. **OpenAI API** (可选)
   - 用途: AI 脚本生成(增强功能)
   - 模型: `gpt-4o-mini` 或自定义模型
   - 配置: `OPENAI_API_KEY` 环境变量或前端配置
   - 支持自定义 Base URL (兼容其他 OpenAI 兼容 API)

### 第三方库和工具
- **html2canvas**: 前端图像导出功能
- **LangChain**: OpenAI API 集成和结构化输出
- **Pydantic**: 数据验证和 JSON Schema 生成
- **uv**: Python 依赖管理工具

### 服务端口配置
- Backend: `http://localhost:5003` (可通过 `PORT` 环境变量配置)
- Frontend: `http://localhost:8000` (或任何静态文件服务器)
