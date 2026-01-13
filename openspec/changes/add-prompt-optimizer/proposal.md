# Change: 添加分镜 Prompt 优化功能

## Why
用户在生成漫画分镜时,可能不清楚如何编写有效的提示词,导致生成结果不理想。通过添加 AI 驱动的 prompt 优化功能,可以帮助用户将简单的想法扩展为更详细、更适合漫画分镜生成的提示词,从而提升生成质量和用户体验。

## What Changes
- **前端新增优化按钮**: 在 prompt 输入框旁边添加一个带有魔法棒图标的"优化"按钮
- **后端新增 API 端点**: 添加 `/api/optimize-prompt` 端点,接受用户输入的简单提示词,返回优化后的详细提示词
- **AI 优化逻辑**: 使用 Google Gemini 或 OpenAI API 对用户输入进行扩展和优化
- **国际化支持**: 为优化功能添加中英文翻译
- **用户体验优化**: 
  - 按钮在优化过程中显示加载状态
  - 优化后自动替换输入框内容
  - 支持撤销功能(可选)

## Impact
- **新增 Specs**: `prompt-optimization` - 定义 prompt 优化能力的需求
- **影响的代码文件**:
  - 后端:
    - `backend/controllers/` - 新增 prompt 优化控制器
    - `backend/services/` - 新增 prompt 优化服务
    - `backend/app.py` - 注册新的 Blueprint
  - 前端:
    - `index.html` - 添加优化按钮 UI
    - `frontend/css/style.css` - 添加按钮样式
    - `frontend/js/app.js` - 添加优化按钮事件处理
    - `frontend/js/api.js` - 添加 API 调用方法
    - `frontend/js/i18n.js` - 添加国际化文本
- **用户影响**: 用户将看到一个新的优化按钮,点击后可以自动改进提示词
- **性能影响**: 每次优化需要调用 AI API,预计耗时 2-5 秒
