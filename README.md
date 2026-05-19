# 泡泡外刊（ppenglish）

泡泡外刊是一个本地优先的英文文章双语阅读器。它适合把网页、PDF 或其他来源中的英文文章粘贴到浏览器里，在本机完成分段、翻译、查词、高亮、生词记录和阅读排版。

当前版本不提供账号系统、云端同步或内置文章库。文章、译文、高亮和生词都保存在当前浏览器的本地数据中，必要时通过 JSON 手动导入导出。

## 功能概览

- 本地文章库：新建、打开、删除文章，按更新时间列出本地文章。
- JSON 备份迁移：导出/导入文章、译文、高亮和生词记录。
- 粘贴与分段：粘贴英文原文，预览段落，支持 PDF 复制文本的换行清洗。
- 整篇翻译：通过同源 `/api/translate` 代理调用 DeepSeek，一次提交整篇文章。
- 双语阅读：支持中英双栏、中英单栏、仅英文三种阅读模式。
- 阅读样式：支持字号、行高、衬线/非衬线字体，以及正常、黑夜、纸墨、护眼主题。
- 查词：悬停英文单词，可打开有道和 Cambridge 词典链接。
- 高亮：荧光笔模式下拖选原文保存高亮，支持撤回和删除。
- 生词本：可手动添加/删除生词，也可在高亮后按 Enter 快速加入生词本。

## 运行方式

本项目有三种运行方式，适合不同场景：

| 方式 | 适合场景 | 是否支持整篇翻译 | 是否需要 Node/npm |
| --- | --- | --- | --- |
| 轻量运行 | 只使用阅读器，不改代码 | 支持 | 不需要 |
| 纯静态浏览 | 只打开页面，不使用翻译 | 不支持 | 不需要 |
| 二次开发 | 修改代码、调试页面、重新生成产物 | 支持 | 需要 |

### 方式一：轻量运行

这是普通使用场景推荐的方式。

当前仓库 [mikelian1/ppenglish](https://github.com/mikelian1/ppenglish) 是项目源码仓库。如果只想轻量运行，可以移步 [mikelian1/ppenglishmini](https://github.com/mikelian1/ppenglishmini) 下载已经生成好的 `dist/`、`serve.py` 和 `run.bat`。

如果需要自己从源码生成轻量运行文件，先在开发电脑生成静态产物：

```bash
npm run generate
```

然后把下面三个项目复制到同一个目录：

```text
dist/
serve.py
run.bat
```

在 Windows 上双击：

```text
run.bat
```

服务启动后访问：

```text
http://localhost:8000
```

`serve.py` 会同时完成两件事：

1. 提供 `dist/` 中的静态页面和资源；
2. 接收浏览器的 `/api/translate` 请求，并在本机转发到 DeepSeek。

`serve.py` 默认监听 `127.0.0.1:8000`，只面向本机浏览器，不主动开放给局域网或公网。

### 方式二：纯静态浏览

如果只想打开页面，不需要整篇翻译，可以在生成 `dist/` 后进入 `dist/` 目录运行：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

这种方式只提供静态页面，不提供同源 `/api/translate`，所以不能使用“整篇翻译”。

### 方式三：二次开发

如果要修改代码、调试页面或重新生成产物，先安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

然后访问终端显示的地址，通常是：

```text
http://localhost:3000/
```

开发环境中，`/api/translate` 由 Nuxt server middleware 提供，对应文件是：

```text
server/api/translate.js
```

修改完成后重新生成静态产物：

```bash
npm run generate
```

产物会输出到：

```text
dist/
```

## 翻译配置

整篇翻译依赖 DeepSeek API Key。API Key 只能放在服务端侧，不要写进前端代码。

不同运行方式的 API Key 输入/读取方式如下：

- 轻量运行：首次双击 `run.bat` 时会提示输入 DeepSeek API Key。Key 会保存到 Windows Credential Manager 的通用凭据中，不会写入 `run.bat`、`serve.py` 或 README。
- 轻量运行也支持环境变量：如果已经设置 `DEEPSEEK_API_KEY`，`serve.py` 会优先读取环境变量，不再要求输入。
- 二次开发推荐本地配置文件：创建 `server/localTranslateConfig.js`，由开发服务读取。
- 二次开发也支持环境变量：如果没有本地配置文件，可以通过 `DEEPSEEK_API_KEY` 等环境变量配置。
- 纯静态浏览不需要 API Key，因为它不提供翻译接口。

Windows Credential Manager 的凭据名称：

```text
PPEnglish.DeepSeek.ApiKey
```

更换轻量运行的 API Key 时，可以打开 Windows“凭据管理器”，进入“Windows 凭据”，删除通用凭据 `PPEnglish.DeepSeek.ApiKey`，再重新运行 `run.bat`。

开发环境本地配置文件示例：

```js
module.exports = {
  deepseekApiKey: "你的 DeepSeek API Key",
  deepseekModel: "deepseek-v4-flash",
};
```

该文件路径为：

```text
server/localTranslateConfig.js
```

这个文件已被 `.gitignore` 忽略，不应提交到仓库。

可用环境变量：

```bash
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
TRANSLATE_MAX_SOURCE_LENGTH=20000
TRANSLATE_MAX_BODY_BYTES=65536
DEEPSEEK_TIMEOUT=60
```

配置项说明：

| 名称 | 默认值 | 作用 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 无 | DeepSeek API Key |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | 翻译模型 |
| `TRANSLATE_MAX_SOURCE_LENGTH` | `20000` | 单次翻译原文最大字符数 |
| `TRANSLATE_MAX_BODY_BYTES` | `65536` | 请求体最大字节数 |
| `DEEPSEEK_TIMEOUT` | `60` | 轻量运行时的 DeepSeek 请求超时秒数 |

`DEEPSEEK_TIMEOUT` 只用于 `serve.py`；开发环境的 `server/api/translate.js` 当前使用固定 60 秒超时。

## 使用流程

1. 打开首页“本地文章库”。
2. 点击“新建文章”。
3. 粘贴英文原文，必要时点击“清洗换行”。
4. 检查“分段预览”。
5. 点击“保存并阅读”。
6. 在阅读页点击“整篇翻译”。
7. 对不满意的段落使用“Google 重译”或“粘贴译文”手动修订。
8. 阅读时按需使用查词、高亮、生词本、主题、字号、行高和阅读模式。

## 阅读操作

右侧浮动工具栏包含三个按钮：

| 按钮 | 作用 |
| --- | --- |
| 鼠标/荧光笔按钮 | 在查词模式和荧光笔模式之间切换 |
| `Aa` | 打开阅读样式面板 |
| `Wd` | 打开生词本 |

快捷键：

| 快捷键 | 作用 |
| --- | --- |
| `H` | 切换查词模式和荧光笔模式 |
| `W` | 打开生词本 |
| `Enter` | 在荧光笔模式下，把刚高亮的单词加入生词本 |
| `Ctrl + Z` / `Cmd + Z` | 撤回上一步高亮操作 |

查词模式下，鼠标悬停英文单词会显示有道和 Cambridge 链接。点击词典链接后，该单词会以查词颜色记录为高亮。

荧光笔模式下，拖选英文原文会保存高亮；点击已有高亮可以删除该高亮。

## 本地数据与备份

本项目使用浏览器 IndexedDB 保存数据：

| 数据 | 存储位置 |
| --- | --- |
| 文章、译文、高亮 | `ppdb` 数据库的 `articles` store |
| 生词 | `ppdb` 数据库的 `vocabulary` store |
| 阅读样式 | `localStorage` 的 `styles` |

注意事项：

- 本地数据绑定当前浏览器和当前站点来源。
- 清理站点数据、换浏览器、换端口或换域名，都可能导致看不到原文章。
- 首页“导出 JSON”会导出文章和生词，适合备份或迁移到另一台电脑。
- 导入 JSON 时，如果遇到同 ID 文章或同名生词，会跳过重复项，不覆盖本地已有数据。

## 翻译接口

前端会向同源接口发送请求：

```http
POST /api/translate
Content-Type: application/json
```

请求体示例：

```json
{
  "source": "英文原文",
  "sourceLang": "en",
  "targetLang": "zh-CN",
  "title": "文章标题",
  "paragraphCount": 12
}
```

成功响应示例：

```json
{
  "provider": "deepseek-v4-flash",
  "translation": "中文译文",
  "usage": {}
}
```

翻译提示词要求模型保留原文段落数量、段落顺序和段落结构。前端收到译文后会按空行拆分译文段落；只有译文段落数与原文段落数完全一致时，才会写入文章，避免中英文段落错位。

常见错误含义：

| 状态码 | 含义 |
| --- | --- |
| `400` | 请求 JSON 不正确、缺少原文，或轻量运行时认为文本过长 |
| `405` | 请求方法不正确，例如用 GET 访问 `/api/translate` |
| `413` | 开发环境中请求内容超过限制 |
| `500` | 本地配置错误，例如缺少 API Key |
| `502` | DeepSeek 请求失败、超时、返回格式异常或没有返回有效译文 |

## 技术栈

- Nuxt 2 / Vue 2
- IndexedDB：保存文章和生词
- localStorage：保存阅读样式
- DeepSeek Chat Completions API：整篇翻译
- Nuxt server middleware：开发环境的翻译代理
- Python 标准库 HTTP 服务：轻量运行时的静态服务和本地代理

项目配置为 `ssr: false` 和 `target: 'static'`。页面主体是静态前端；翻译功能依赖同源 `/api/translate` 代理，不能只靠普通静态文件服务完成。

## 目录速览

| 路径 | 作用 |
| --- | --- |
| `pages/index.vue` | 根布局，承载阅读工具栏和子页面样式 |
| `pages/index/index.vue` | 首页，本地文章库 |
| `pages/index/new.vue` | 新建本地文章页 |
| `pages/index/reader.vue` | 阅读页，负责读取、翻译、保存和删除文章 |
| `components/Aa.vue` | 浮动阅读工具栏和生词本面板 |
| `components/Nav.vue` | 顶部品牌标识 |
| `components/BilingualReader.vue` | 阅读器兼容入口 |
| `components/reader/BilingualReader.vue` | 本地文章双语阅读器主组件 |
| `components/reader/ReaderHeader.vue` | 阅读页标题、状态和模式切换 |
| `components/reader/SegmentRow.vue` | 单个双语段落行 |
| `components/reader/TranslationPane.vue` | 译文展示、Google 重译和手动粘贴译文 |
| `components/reader/WordLookup.vue` | 单词切分和悬停查词链接 |
| `components/reader/HighlightChunk.vue` | 高亮文本片段渲染 |
| `util/articleStorage.js` | IndexedDB 文章和生词存储 |
| `util/textSegmenter.js` | 粘贴文本清洗和分段 |
| `util/highlightUtils.js` | 高亮 ID、规范化、合并和切片 |
| `util/readerThemes.js` | 阅读主题和按钮颜色变量 |
| `util/readingModes.js` | 阅读模式和布局列配置 |
| `server/api/translate.js` | 开发环境 DeepSeek 翻译接口 |
| `serve.py` | 轻量运行时的静态文件服务和 DeepSeek 本地代理 |
| `run.bat` | Windows 双击启动脚本 |
| `assets/style.css` | 全局样式 |
| `dist/` | `npm run generate` 生成的静态产物，默认不提交 |

## 常见问题

### 为什么直接打开 `dist/` 后不能翻译？

`dist/` 只是静态产物，不包含服务端接口。整篇翻译需要 `/api/translate`，所以要用 `serve.py` 或 Nuxt 开发服务。

### 为什么译文没有写入？

前端会校验译文段落数。如果模型返回的译文段落数和原文段落数不同，系统会拒绝写入，避免中英文错位。可以重试翻译，或手动粘贴修订后的译文。

### 为什么换一台电脑后看不到本地文章？

本地文章保存在当前浏览器的 IndexedDB 中，不会自动同步到另一台电脑。可以在旧设备首页点击“导出 JSON”，再到新设备首页点击“导入 JSON”完成迁移。

### 双击 `run.bat` 提示 Python 不存在怎么办？

说明当前 Windows 环境找不到 `python` 命令。安装 Python，并确认它已加入 PATH 后再运行。

### 轻量运行和 `npm run dev` 有什么区别？

轻量运行使用 `dist/`、`serve.py` 和 `run.bat`，适合日常阅读，不需要 Node/npm。`npm run dev` 是 Nuxt 开发服务，适合改代码和调试页面。

### `npm run generate` 是不是启动服务？

不是。`npm run generate` 只生成 `dist/` 静态产物。生成后仍需要用 `serve.py`、`run.bat` 或其他静态服务器来打开页面。

## 安全提醒

不要把真实 DeepSeek API Key 写进：

- `README.md`
- `run.bat`
- `serve.py`
- `server/api/translate.js`
- 前端组件
- 截图
- 聊天记录
- Git 提交记录

开发环境推荐使用被忽略的 `server/localTranslateConfig.js` 或环境变量；轻量运行推荐使用 Windows Credential Manager。

## 当前边界

- 本项目是本地优先阅读工具，不是多端同步产品。
- 当前没有内置文章库、外刊全文、账号系统或云同步功能。
- Nuxt 2 和 Vue 2 属于较老的技术栈；本项目当前以可用、轻量和本地运行为优先。
- 轻量运行方案主要面向 Windows 本机使用，因为 API Key 默认保存到 Windows Credential Manager。

## 致谢

本项目最初受到以下项目启发，并基于该项目演化而来：

https://github.com/wushanglang/ppenglish

当前仓库已经围绕本地优先双语阅读、AI 整篇翻译、高亮、生词本和离线/轻量运行流程做了较大幅度的改造。
