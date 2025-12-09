# ComicPerfect 中英双语切换功能

## 功能说明

ComicPerfect 现已支持中英双语界面切换，用户可以在中文和英文之间自由切换界面语言。

## 使用方法

### 切换语言

1. 在页面左上角找到语言选择器（Language Selector）
2. 点击下拉菜单，选择您想要的语言：
   - **中文** - 简体中文界面
   - **English** - 英文界面

### 语言设置保存

- 您选择的语言偏好会自动保存在浏览器本地存储中
- 下次打开应用时，会自动使用您上次选择的语言

## 技术实现

### 文件结构

```
frontend/js/
├── i18n.js          # 国际化模块，包含所有翻译文本
├── app.js           # 主应用控制器，集成i18n功能
└── ...
```

### 核心功能

1. **i18n.js** - 国际化模块
   - 管理中英文翻译字典
   - 提供语言切换API
   - 自动更新UI文本

2. **HTML data-i18n 属性**
   - 所有需要翻译的元素都添加了 `data-i18n` 属性
   - 语言切换时自动更新这些元素的文本

3. **动态文本更新**
   - 按钮文本
   - 状态消息
   - 提示信息
   - 模态框内容

### 支持的翻译内容

- ✅ 页面标题和主标题
- ✅ 配置面板所有文本
- ✅ AI生成区域所有选项
- ✅ 按钮文本（生成、保存、下载等）
- ✅ 状态消息和错误提示
- ✅ 模态框内容（图片预览、小红书内容等）
- ✅ 页面导航文本

## 开发者指南

### 添加新的翻译文本

1. 在 `frontend/js/i18n.js` 中的 `translations` 对象添加新的键值对：

```javascript
translations: {
    zh: {
        newKey: '中文文本',
        // ...
    },
    en: {
        newKey: 'English Text',
        // ...
    }
}
```

2. 在HTML中使用 `data-i18n` 属性：

```html
<button data-i18n="newKey">默认文本</button>
```

3. 在JavaScript中使用 `window.i18n.t()` 方法：

```javascript
const text = window.i18n.t('newKey');
```

### 带参数的翻译

对于需要动态插入数据的文本：

```javascript
// 在翻译字典中使用占位符
translations: {
    zh: {
        pageInfo: '第 {current}/{total} 页'
    },
    en: {
        pageInfo: 'Page {current}/{total}'
    }
}

// 使用时传入参数
const text = window.i18n.t('pageInfo', { current: 1, total: 5 });
```

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 注意事项

1. 语言设置存储在 `localStorage` 中，清除浏览器数据会重置为默认语言（中文）
2. 某些动态生成的内容（如AI生成的漫画文本）不受界面语言影响
3. 漫画内容的语言由"漫画语言"选项单独控制

## 未来计划

- [ ] 添加更多语言支持（日语、韩语等）
- [ ] 支持自定义翻译
- [ ] 导出/导入语言包

## 反馈

如有问题或建议，请提交 Issue 或 Pull Request。
