import { pool } from '../db/pool.js';
import { withTransaction } from '../db/pool.js';
import type { ChatResponse, SourceReference } from '../types.js';
import type { ResolvedAiSettings } from './ai-provider.service.js';
import { resolveAiSettings } from './ai-provider.service.js';
import { retrieveSources } from './retrieval.service.js';
import { requestOpenAIChat } from './openai-compatible.service.js';

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
  response?: string;
}

const NO_ANSWER = '知识库中没有找到足够的信息。';

function buildPrompt(question: string, sources: SourceReference[]): string {
  const context = sources
    .map(
      (source, index) =>
        `资料 ${index + 1}\n文件：${source.filename}\n页码：${source.page}\n原文：${source.content}`
    )
    .join('\n\n');

  return `你是一个私有知识库助手。

只能根据提供的资料回答。
如果资料中没有足够信息，请回答：
“${NO_ANSWER}”

不要编造资料，也不要使用资料之外的信息。

资料：
${context}

问题：
${question}`;
}

async function callOllamaChat(
  settings: { baseUrl: string; chatModel: string },
  question: string,
  sources: SourceReference[]
): Promise<string> {
  if (sources.length === 0) {
    return NO_ANSWER;
  }

  const response = await fetch(`${settings.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.chatModel,
      stream: false,
      messages: [
        {
          role: 'user',
          content: buildPrompt(question, sources)
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama chat failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as OllamaChatResponse;
  return (data.message?.content ?? data.response ?? '').trim() || NO_ANSWER;
}

async function callOpenAICompatibleChat(
  settings: ResolvedAiSettings,
  question: string,
  sources: SourceReference[]
): Promise<string> {
  if (sources.length === 0) {
    return NO_ANSWER;
  }

  const prompt = buildPrompt(question, sources);
  const answer = await requestOpenAIChat(settings, prompt);
  return answer || NO_ANSWER;
}

async function ensureConversation(knowledgeBaseId: string, conversationId?: string): Promise<string> {
  if (conversationId) {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM conversations WHERE id = $1 AND knowledge_base_id = $2',
      [conversationId, knowledgeBaseId]
    );

    if (rowCount) {
      return conversationId;
    }
  }

  const { rows } = await pool.query(
    'INSERT INTO conversations (knowledge_base_id, title) VALUES ($1, $2) RETURNING id',
    [knowledgeBaseId, '新对话']
  );
  return rows[0].id;
}

export async function askQuestion(params: {
  knowledgeBaseId: string;
  conversationId?: string;
  question: string;
}): Promise<ChatResponse> {
  const settings = await resolveAiSettings();
  const conversationId = await ensureConversation(params.knowledgeBaseId, params.conversationId);
  const sources = await retrieveSources(params.question, params.knowledgeBaseId, settings);
  const answer =
    settings.provider === 'openai_compatible'
      ? await callOpenAICompatibleChat(settings, params.question, sources)
      : await callOllamaChat(settings, params.question, sources);

  await withTransaction(async (client) => {
    await client.query('INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)', [
      conversationId,
      'user',
      params.question
    ]);
    await client.query('INSERT INTO messages (conversation_id, role, content, sources) VALUES ($1, $2, $3, $4)', [
      conversationId,
      'assistant',
      answer,
      JSON.stringify(sources)
    ]);
  });

  return {
    answer,
    conversationId,
    sources
  };
}

export async function listMessages(conversationId: string) {
  const { rows } = await pool.query(
    `SELECT id, role, content, sources, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    sources: row.sources ?? [],
    createdAt: new Date(row.created_at).toISOString()
  }));
}
