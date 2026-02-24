# OpenWords

开源英语学习应用 —— 背单词 + 每日外刊精读，部署于 Vercel。

## 功能特性

### 背单词
- **8 大词库** — 高考 / CET-4 / CET-6 / 考研 / 托福 / 雅思 / GRE / 医学
- **SM-2 间隔重复** — 根据掌握程度自动安排复习，对抗遗忘曲线
- **翻转闪卡** — 单词 → 翻转 → 释义，支持"不认识 / 模糊 / 认识"三级评分
- **单词发音** — Web Speech API 朗读，支持美式 / 英式口音
- **自定义词库** — 上传 TXT / CSV / DOCX / PDF，自动解析生成个人词库
- **学习仪表盘** — 每日新学 / 复习统计、连续学习天数、各阶段词汇分布

### 每日外刊精读
- **多源抓取** — Guardian · BBC · VOA · The Conversation
- **中英双语** — 逐段 / 逐句翻译，支持双语 / 纯英 / 纯中三种阅读模式
- **选词即译** — 选中单词查词典，选中句子即时翻译
- **长难句解析** — 蓝色高亮标记复杂句，点击可 AI 解析语法结构（DeepSeek）
- **日期筛选** — 按月 / 按日浏览，支持来源和难度筛选

### 通用
- **离线进度** — 学习数据存储于浏览器 IndexedDB，无需注册
- **暗色模式** — 自动跟随系统配色
- **响应式** — 适配桌面与移动端

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS 4 + Framer Motion
- **词库数据**: SQLite (better-sqlite3，本地开发) / Vercel 上自动降级
- **外刊数据**: Python 爬虫 → SQLite → 导出为静态 JSON
- **客户端存储**: IndexedDB (idb)
- **翻译**: DeepSeek API（可选）/ Google Translate（免费回退）
- **部署**: Vercel

## 项目结构

```
web/                                # 仓库根目录
├── article-data/                   # 外刊 JSON 数据（提交到 Git）
│   ├── index.json                  # 文章元数据索引
│   └── detail/{id}.json            # 各篇文章完整内容
├── data/                           # 爬虫脚本 + 导出工具
│   ├── crawler/                    # 外刊爬虫
│   │   ├── sources/                # 各来源适配（guardian/bbc/voa/conversation）
│   │   ├── analyzer.py             # 句子拆分与复杂句检测
│   │   ├── translator.py           # 翻译服务（DeepSeek / Google）
│   │   └── config.py               # 爬虫配置
│   ├── export_web_json.py          # articles.db → article-data/ 导出
│   └── run_crawler.py              # 爬虫入口
├── src/
│   ├── app/
│   │   ├── page.tsx                # 首页（词库选择）
│   │   ├── learn/                  # 背单词（列表 / 分组 / 复习）
│   │   ├── reading/                # 外刊精读（列表 / 详情）
│   │   ├── custom/                 # 自定义词库
│   │   ├── dashboard/              # 学习仪表盘
│   │   └── api/                    # 翻译 & 长难句解析 API
│   ├── components/                 # React 组件
│   ├── lib/
│   │   ├── actions.ts              # Server Actions（词库查询）
│   │   ├── article-actions.ts      # Server Actions（外刊，读 JSON）
│   │   ├── db.ts                   # vocab.db 连接（动态加载）
│   │   ├── sm2.ts                  # SM-2 算法
│   │   └── storage.ts              # IndexedDB 封装
│   └── types/                      # TypeScript 类型定义
├── 更新外刊流程.txt                  # 日常更新步骤
└── package.json
```

## 快速开始

### 前置要求

- Node.js >= 18
- Python >= 3.10（仅爬虫 / 数据构建需要）

### 安装与运行

```bash
git clone https://github.com/Xlichard/OpenWords.git
cd OpenWords
npm install
npm run dev
```

打开 http://localhost:3000

### 构建词库（可选，本地背单词功能）

```bash
cd data

# 下载数据源（ECDICT + 各考试词表）
powershell -ExecutionPolicy Bypass -File download_data.ps1

# 生成 vocab.db
python build_db.py

# 复制到 web 目录
copy vocab.db ..\web\
```

### 爬取外刊

```bash
cd data

# 安装 Python 依赖
pip install -r requirements.txt

# 运行爬虫
python run_crawler.py
```

### 部署到 Vercel

推送后 Vercel 自动部署，外刊数据以静态 JSON 形式随部署包分发，无需数据库。

## 每日更新外刊

详见项目根目录 `更新外刊流程.txt`，简要步骤：

1. `python run_crawler.py` — 爬取新文章
2. `copy articles.db web\articles.db` — 复制数据库
3. `python web\data\export_web_json.py` — 导出 JSON
4. `git add / commit / push` — 推送触发部署

## 环境变量（可选）

在 `.env.local` 中配置：

```
# DeepSeek API Key（启用高质量翻译 + 长难句解析）
DEEPSEEK_API_KEY=sk-xxx
```

不配置时自动使用 Google Translate 免费接口。

## 自定义词库

支持上传文件创建个人词库：

- **TXT / CSV** — 每行一个单词，支持 `单词\t释义`、`单词,释义` 格式
- **DOCX** — 自动提取纯文本后按行解析
- **PDF** — 自动提取文本后按行解析

## 数据源

- [ECDICT](https://github.com/skywind3000/ECDICT) — 英汉双解词典（76 万+ 词条）
- [english-wordlists](https://github.com/mahavivo/english-wordlists) — 四六级 / 考研 / 高考 / 托福词表
- [wordlist-medical-terms-en](https://github.com/glutanimate/wordlist-medical-terms-en) — 医学词汇（9.8 万）

## License

MIT
