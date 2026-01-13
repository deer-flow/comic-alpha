# Spec: Prompt Optimization

## ADDED Requirements

### Requirement: Prompt Optimization API
系统 SHALL 提供一个 API 端点,接受用户输入的简单提示词,并返回优化后的详细分镜描述。

#### Scenario: 成功优化简单提示词
- **WHEN** 用户发送包含简单提示词的 POST 请求到 `/api/optimize-prompt`
- **AND** 请求包含有效的 `google_api_key` 或 `api_key`
- **AND** 请求包含 `prompt` 字段(用户输入的简单提示词)
- **THEN** 系统返回 HTTP 200 状态码
- **AND** 响应包含 `success: true`
- **AND** 响应包含 `optimized_prompt` 字段,内容为优化后的详细提示词

#### Scenario: 缺少必需参数
- **WHEN** 用户发送 POST 请求到 `/api/optimize-prompt`
- **AND** 请求缺少 `prompt` 字段
- **THEN** 系统返回 HTTP 400 状态码
- **AND** 响应包含错误信息 "Prompt is required"

#### Scenario: 缺少 API Key
- **WHEN** 用户发送 POST 请求到 `/api/optimize-prompt`
- **AND** 请求既没有 `google_api_key` 也没有 `api_key`
- **THEN** 系统返回 HTTP 400 状态码
- **AND** 响应包含错误信息 "Either OpenAI API key or Google API key is required"

#### Scenario: AI 优化失败
- **WHEN** 用户发送有效的优化请求
- **AND** AI API 调用失败(网络错误、API 错误等)
- **THEN** 系统返回 HTTP 500 状态码
- **AND** 响应包含错误信息描述失败原因

### Requirement: 优化逻辑
系统 SHALL 使用 AI 模型对用户输入的简单提示词进行扩展和优化,生成适合漫画分镜生成的详细描述。

#### Scenario: 使用 Google Gemini API 优化
- **WHEN** 优化服务接收到包含 `google_api_key` 的请求
- **THEN** 系统优先使用 Google Gemini API 进行优化
- **AND** 使用 `gemini-3-flash-preview` 模型
- **AND** 传入优化专用的 system prompt

#### Scenario: 使用 OpenAI API 优化
- **WHEN** 优化服务接收到包含 `api_key` 但没有 `google_api_key` 的请求
- **THEN** 系统使用 OpenAI API 进行优化
- **AND** 使用配置的模型(默认 `gpt-4o-mini`)
- **AND** 传入优化专用的 system prompt

#### Scenario: 根据语言和风格优化
- **WHEN** 优化请求包含 `language` 参数(如 'zh', 'en', 'ja')
- **AND** 请求包含 `comic_style` 参数(如 'doraemon', 'american', 'disney')
- **THEN** 优化后的提示词应符合指定的语言
- **AND** 优化建议应考虑指定的漫画风格特征

### Requirement: 前端优化按钮
系统 SHALL 在 prompt 输入框旁边提供一个优化按钮,允许用户一键优化提示词。

#### Scenario: 显示优化按钮
- **WHEN** 用户打开漫画生成界面
- **THEN** 系统在 prompt 输入框右侧显示一个带有魔法棒图标的按钮
- **AND** 按钮的 tooltip 显示本地化的提示文本(中文: "优化提示词", 英文: "Optimize Prompt")

#### Scenario: 点击优化按钮
- **WHEN** 用户在 prompt 输入框中输入内容
- **AND** 用户点击优化按钮
- **THEN** 按钮显示加载状态(禁用按钮,显示加载动画)
- **AND** 系统调用 `/api/optimize-prompt` API
- **AND** 等待 API 响应

#### Scenario: 优化成功
- **WHEN** API 返回优化成功的响应
- **THEN** 系统将 `optimized_prompt` 内容替换 prompt 输入框的原有内容
- **AND** 按钮恢复正常状态
- **AND** 显示成功提示消息(可选)

#### Scenario: 优化失败
- **WHEN** API 返回错误响应或网络请求失败
- **THEN** 按钮恢复正常状态
- **AND** 系统显示错误提示消息
- **AND** 保留输入框中的原始内容

#### Scenario: 空输入优化
- **WHEN** 用户在 prompt 输入框为空时点击优化按钮
- **THEN** 系统显示提示消息 "请先输入内容"
- **AND** 不发送 API 请求

### Requirement: 国际化支持
系统 SHALL 为优化功能提供中英文国际化支持。

#### Scenario: 中文界面
- **WHEN** 用户界面语言设置为中文
- **THEN** 优化按钮的 tooltip 显示 "优化提示词"
- **AND** 成功提示显示 "提示词已优化"
- **AND** 错误提示显示 "优化失败: [错误信息]"
- **AND** 空输入提示显示 "请先输入内容"

#### Scenario: 英文界面
- **WHEN** 用户界面语言设置为英文
- **THEN** 优化按钮的 tooltip 显示 "Optimize Prompt"
- **AND** 成功提示显示 "Prompt optimized"
- **AND** 错误提示显示 "Optimization failed: [error message]"
- **AND** 空输入提示显示 "Please enter content first"

### Requirement: 优化性能
系统 SHALL 在合理时间内完成 prompt 优化,确保良好的用户体验。

#### Scenario: 优化响应时间
- **WHEN** 用户发送优化请求
- **THEN** 系统应在 5 秒内返回优化结果
- **AND** 如果超时,系统应返回超时错误信息

#### Scenario: 加载状态反馈
- **WHEN** 用户点击优化按钮后
- **THEN** 按钮立即显示加载状态(在 100ms 内)
- **AND** 用户可以清楚地看到系统正在处理请求
