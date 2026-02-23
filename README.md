# OpenWords - 开源背单词应用

基于 Next.js + Python 的开源背单词 Web 应用，支持多种考试词库，集成 SM-2 间隔重复记忆算法。

## 特性

- **多词库支持**：高考、四级、六级、考研、托福、雅思、GRE、医学词汇
- **SM-2 算法**：基于 SuperMemo-2 的间隔重复记忆，科学安排复习计划
- **3D 翻转卡片**：Framer Motion 驱动的交互动画
- **浏览器发音**：Web Speech API 原生发音，支持美式/英式口音
- **Local-First**：学习进度存储在浏览器 IndexedDB，无需注册登录
- **学习统计**：每日学习量、连续打卡、分类掌握比例

## 数据源

| 来源                                                         | 说明                             | 词条数 |
| ------------------------------------------------------------ | -------------------------------- | ------ |
| [ECDICT](https://github.com/skywind3000/ECDICT)              | 英汉双解词典（音标、释义、词频） | 76万+  |
| [english-wordlists](https://github.com/mahavivo/english-wordlists) | 四六级/考研/高考/托福词表        | -      |
| [wordlist-medicalterms-en](https://github.com/glutanimate/wordlist-medicalterms-en) | 医学词汇表                       | 9.8万  |

## 技术栈

- **前端**：Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + Framer Motion
- **数据库**：SQLite (better-sqlite3) + Server Actions
- **存储**：IndexedDB (idb) - 客户端学习进度
- **算法**：SM-2 间隔重复
- **发音**：Web Speech API

## 快速开始

### 1. 构建词库数据

```bash
# 安装 Python 依赖（仅需 Python 标准库）
cd data

# 下载数据源
powershell -ExecutionPolicy Bypass -File download_data.ps1

# 构建 SQLite 数据库
python build_db.py
```

### 2. 启动 Web 应用

```bash
cd web

# 安装依赖
npm install

# 确保 vocab.db 在 web/ 目录下
copy ..\data\vocab.db .

# 开发模式
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
OpenWords/
├── data/                       # 数据处理
│   ├── raw/                    # 原始数据文件
│   ├── build_db.py             # 数据清洗脚本
│   ├── download_data.ps1       # 数据下载脚本
│   └── vocab.db                # 输出的词库数据库
├── web/                        # Next.js 应用
│   ├── src/
│   │   ├── app/                # 页面路由
│   │   │   ├── page.tsx        # 首页 - 词库选择
│   │   │   ├── learn/[category]/page.tsx  # 学习页
│   │   │   └── dashboard/page.tsx         # 进度页
│   │   ├── components/         # UI 组件
│   │   │   ├── Flashcard.tsx   # 3D翻转卡片
│   │   │   ├── AudioButton.tsx # 发音按钮
│   │   │   └── ...
│   │   ├── lib/                # 核心逻辑
│   │   │   ├── actions.ts      # Server Actions
│   │   │   ├── sm2.ts          # SM-2 算法
│   │   │   ├── storage.ts      # IndexedDB 封装
│   │   │   └── db.ts           # 数据库连接
│   │   └── types/              # TypeScript 类型
│   └── vocab.db                # 词库数据库（复制自 data/）
└── README.md
```

## 许可证

MIT
