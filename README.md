# OpenWords

开源背单词应用，基于间隔重复记忆（SM-2）算法，覆盖高考 / 四六级 / 考研 / 雅思 / 托福 / GRE / 医学词汇。

## 功能特性

- **多词库支持** — 内置高考、CET-4、CET-6、考研、托福、雅思、GRE、医学等 8 大词库
- **SM-2 间隔重复** — 根据记忆反馈自动调度复习时间，高效对抗遗忘曲线
- **翻转闪卡** — 前面显示单词与音标，点击翻转查看释义，支持"不认识 / 模糊 / 认识"三级评分
- **单词发音** — 内置 TTS 朗读，支持美式 / 英式口音切换
- **自定义词库** — 上传 TXT / CSV / DOCX / PDF 文件，自动解析生成个人词库
- **学习仪表盘** — 查看每日新学 / 复习数量、连续学习天数、各阶段词汇分布
- **离线进度存储** — 学习进度存储于浏览器 IndexedDB，无需注册账号
- **暗色模式** — 自动跟随系统配色
- **响应式布局** — 适配桌面与移动端

## 技术栈

- **框架**: [Next.js](https://nextjs.org/) 16 (App Router) + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **动画**: Framer Motion
- **词库数据库**: SQLite（通过 better-sqlite3 在服务端只读访问 `vocab.db`）
- **客户端存储**: IndexedDB（通过 [idb](https://github.com/jakearchibald/idb) 存储学习进度与设置）
- **文件解析**: mammoth（DOCX）、pdfjs-dist（PDF）

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx            # 首页（词库选择）
│   ├── layout.tsx          # 全局布局与导航
│   ├── learn/[category]/   # 学习相关页面（列表、分组、复习）
│   ├── custom/             # 自定义词库（上传、详情）
│   └── dashboard/          # 学习仪表盘（进度、统计）
├── components/             # React 组件
│   ├── Flashcard.tsx       # 翻转闪卡
│   ├── LearnSession.tsx    # 学习会话
│   ├── ReviewSession.tsx   # 复习会话
│   ├── RecitationMode.tsx  # 背诵模式
│   ├── DashboardContent.tsx# 仪表盘内容
│   ├── CustomModuleUpload.tsx # 自定义词库上传
│   └── ...
├── lib/
│   ├── actions.ts          # Server Actions（词库查询）
│   ├── db.ts               # SQLite 数据库连接
│   ├── sm2.ts              # SM-2 算法实现
│   └── storage.ts          # IndexedDB 存储操作
└── types/
    └── index.ts            # TypeScript 类型定义
```

## 快速开始

### 前置要求

- Node.js >= 18
- npm（或 yarn / pnpm）

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-username/OpenWords.git
cd OpenWords/web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

> **注意**: 项目根目录下的 `vocab.db` 是 SQLite 词库数据库文件，包含所有内置词汇数据，运行时需要该文件。

### 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 自定义词库

支持通过上传文件创建个人词库，接受以下格式：

- **TXT / CSV** — 每行一个单词，支持 `单词\t释义`、`单词,释义` 或 `单词  释义`（双空格分隔）
- **DOCX** — 自动提取纯文本后按行解析
- **PDF** — 自动提取文本内容后按行解析

上传后可自定义词库名称、图标、颜色以及每组 / 每列表单词数量。

## 学习流程

1. **选择词库** → 在首页选择内置词库或自定义词库
2. **选择列表** → 每个词库按固定大小（默认 80 词）划分为多个列表
3. **分组学习** → 每个列表分为若干小组（默认 20 词），逐组学习
4. **闪卡记忆** → 查看单词，翻转查看释义，自评掌握程度
5. **间隔复习** → SM-2 算法根据评分自动安排下次复习时间
6. **仪表盘** → 查看学习进度与统计数据

## License

MIT
