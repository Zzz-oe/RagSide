# 本地私有知识库 RAG 问答系统

一个第一版可运行的本地 RAG 应用：React 前端上传和管理文件，Express 后端解析 PDF、Word 和文本文件，使用 Ollama 生成 Embedding 与回答，并把向量存到 PostgreSQL + pgvector。

## 功能

- 上传 PDF、Word `.docx`、TXT、Markdown、CSV
- 查看文档处理状态：等待中、处理中、可提问、失败
- 删除文档、重建索引
- 右侧固定聊天框提问
- 基于向量检索返回本地模型回答
- 回答显示文件名、页码和原文片段
- 可在设置中切换本地 Ollama 或 OpenAI-compatible API Key 服务

## 环境要求

- Node.js 20.19+，推荐 Node.js 22+
- Docker Desktop
- Ollama 聊天模型与 Embedding 模型

## 快速开始

1. 复制环境变量文件：

   ```bash
   cp .env.example .env
   ```

2. 启动数据库：

   ```bash
   docker compose up -d postgres
   ```

3. 准备 AI 服务。可以使用本机 Ollama，也可以启动 Compose 里的 Ollama 容器：

   ```bash
   docker compose --profile ollama up -d ollama
   ```

   如果不想安装本地模型，也可以进入页面右上角设置，切换到 `API Key`，填写 OpenAI-compatible 服务的 Base URL、API Key、聊天模型和 Embedding 模型。

4. 拉取本地模型。模型名需要和 `.env` 中保持一致：

   ```bash
   ollama pull nomic-embed-text
   ollama pull qwen3:4b
   ```

5. 安装依赖：

   ```bash
   npm install
   ```

6. 启动前后端：

   ```bash
   npm run dev
   ```

7. 打开前端：`http://localhost:5173`

后端 API 默认在 `http://localhost:4000/api`。

## 数据流

1. 上传文件后，后端保存原文件并创建文档记录。
2. 后台任务解析文本，按页切分，调用 Ollama Embedding。
3. 分块和向量写入 PostgreSQL + pgvector。
4. 提问时先做向量检索，再把命中的原文片段送给 Ollama 聊天模型。

## 当前版本说明

- 右侧聊天框已经可用。
- `/api/chat/stream` 先按普通 JSON 返回，后续可以切成真正的流式输出。
- API Key 保存在后端数据库中，前端只显示是否已保存，不会回显密钥内容。
- 切换 Embedding provider 或模型后，需要对已有文档重建索引。
- 第一版聚焦“先跑通”，没有引入 Redis、BullMQ 或权限体系。
